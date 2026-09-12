"""
Matching Engine.
Implements:
1. Normalized BM25 lexical matching via rank-bm25 (BM25Okapi)
2. Local semantic similarity using all-MiniLM-L6-v2 via sentence-transformers
3. Categorized skill coverage (Required, Preferred, Bonus, Overall)
4. Contextual experience tenure & relevance matching
5. Verifiable evidence snippet extraction (matched, partial, missing)
6. Dynamic hybrid matching weight calculator
"""

import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import re
import math
from typing import Dict, Any, List, Tuple, Optional
from rank_bm25 import BM25Okapi
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from backend.normalizer import CANONICAL_SKILLS_MAP, RELATED_SKILLS_MAP

# Singleton model holder
_EMBEDDING_MODEL = None


def get_embedding_model():
    """
    Loads all-MiniLM-L6-v2 once and reuses the instance across calls.
    Completely local inference, zero API calls.
    """
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        from sentence_transformers import SentenceTransformer
        _EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _EMBEDDING_MODEL


# Common English stop words for BM25 tokenization
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}

# Neutral background documents ensuring positive Okapi BM25 IDF for short corpora
REFERENCE_BACKGROUND_DOCS = [
    ["general", "professional", "work", "responsibilities", "deliverables"],
    ["education", "academic", "university", "bachelor", "master", "gpa"],
    ["project", "team", "organization", "management", "collaboration"]
]


def tokenize(text: str) -> List[str]:
    """Tokenizes text into meaningful lowercase word tokens, filtering stop words."""
    if not text:
        return []
    tokens = re.findall(r"[a-zA-Z0-9+#.]+", text.lower())
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


def compute_bm25_score(jd_text: str, resume_text: str) -> float:
    """
    Computes normalized BM25 score between JD and Resume using rank-bm25 BM25Okapi.
    Includes neutral reference documents to establish a robust multi-document corpus
    so term IDF remains positive and non-zero.
    Uses soft saturation curve S / (S + k) so score is strictly in [0, 1].
    """
    jd_tokens = tokenize(jd_text)
    res_tokens = tokenize(resume_text)

    if not jd_tokens or not res_tokens:
        return 0.0

    corpus = [res_tokens] + REFERENCE_BACKGROUND_DOCS
    try:
        bm25 = BM25Okapi(corpus)
        raw_scores = bm25.get_scores(jd_tokens)
        raw_score = float(raw_scores[0]) if len(raw_scores) > 0 else 0.0

        if raw_score <= 0.0:
            return 0.0

        # Soft saturation curve mapping [0, inf) -> [0, 1]
        normalized = raw_score / (raw_score + 5.0)
        return max(0.0, min(1.0, round(normalized, 4)))
    except Exception:
        return 0.0


def compute_batch_bm25_scores(jd_text: str, candidate_resumes: List[str]) -> List[float]:
    """
    Computes BM25Okapi scores across a batch of candidate resumes.
    Normalizes scores robustly even when scores are equal.
    """
    if not candidate_resumes:
        return []

    jd_tokens = tokenize(jd_text)
    if not jd_tokens:
        return [0.0] * len(candidate_resumes)

    tokenized_resumes = [tokenize(r) for r in candidate_resumes]
    corpus = tokenized_resumes + REFERENCE_BACKGROUND_DOCS

    try:
        bm25 = BM25Okapi(corpus)
        raw_scores = bm25.get_scores(jd_tokens)[:len(candidate_resumes)]

        max_s = max(raw_scores) if len(raw_scores) > 0 else 0.0
        min_s = min(raw_scores) if len(raw_scores) > 0 else 0.0

        normalized = []
        for s in raw_scores:
            if s <= 0.0:
                normalized.append(0.0)
            elif max_s > min_s:
                norm_val = (s - min_s) / (max_s - min_s)
                normalized.append(round(max(0.0, min(1.0, float(norm_val))), 4))
            else:
                normalized.append(round(s / (s + 5.0), 4))

        return normalized
    except Exception:
        return [0.0] * len(candidate_resumes)


def compute_semantic_similarity(text1: str, text2: str) -> float:
    """
    Computes cosine similarity between two texts using local MiniLM embeddings.
    Strictly normalized to [0, 1].
    """
    if not text1.strip() or not text2.strip():
        return 0.0

    model = get_embedding_model()
    embeddings = model.encode([text1, text2], convert_to_numpy=True)
    cos_sim = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])

    norm_sim = max(0.0, min(1.0, (cos_sim + 1.0) / 2.0 if cos_sim < 0 else cos_sim))
    return round(norm_sim, 4)


def match_skills(jd_parsed: Dict[str, Any], resume_parsed: Dict[str, Any]) -> Tuple[List[str], List[str], List[str], float]:
    """
    Compares JD skills against Resume skills.
    Returns:
    (required_matches, preferred_matches, bonus_matches, required_coverage_ratio)
    """
    candidate_skills = set(resume_parsed.get("skills", []))

    required_skills = jd_parsed.get("required_skills", [])
    preferred_skills = jd_parsed.get("preferred_skills", [])
    bonus_skills = jd_parsed.get("bonus_skills", [])

    required_matches = sorted(list(candidate_skills.intersection(set(required_skills))))
    preferred_matches = sorted(list(candidate_skills.intersection(set(preferred_skills))))
    bonus_matches = sorted(list(candidate_skills.intersection(set(bonus_skills))))

    if not required_skills:
        coverage = 1.0 if candidate_skills else 0.0
    else:
        coverage = len(required_matches) / len(required_skills)

    return (
        required_matches,
        preferred_matches,
        bonus_matches,
        max(0.0, min(1.0, round(coverage, 4)))
    )


def compute_detailed_skill_coverage(jd_parsed: Dict[str, Any], resume_parsed: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculates detailed categorized coverage for Required, Preferred, Bonus, and Overall skills.
    All scores normalized to [0, 1].
    """
    candidate_skills = set(resume_parsed.get("skills", []))

    required_skills = jd_parsed.get("required_skills", [])
    preferred_skills = jd_parsed.get("preferred_skills", [])
    bonus_skills = jd_parsed.get("bonus_skills", [])

    req_matches = candidate_skills.intersection(set(required_skills))
    pref_matches = candidate_skills.intersection(set(preferred_skills))
    bonus_matches = candidate_skills.intersection(set(bonus_skills))

    req_cov = len(req_matches) / len(required_skills) if required_skills else (1.0 if candidate_skills else 0.0)
    pref_cov = len(pref_matches) / len(preferred_skills) if preferred_skills else 0.0
    bonus_cov = len(bonus_matches) / len(bonus_skills) if bonus_skills else 0.0

    total_jd_skills = len(required_skills) + len(preferred_skills) + len(bonus_skills)
    total_matched = len(req_matches) + len(pref_matches) + len(bonus_matches)

    overall_cov = total_matched / total_jd_skills if total_jd_skills > 0 else (1.0 if candidate_skills else 0.0)

    return {
        "required_skill_coverage": max(0.0, min(1.0, round(req_cov, 4))),
        "preferred_skill_coverage": max(0.0, min(1.0, round(pref_cov, 4))),
        "bonus_skill_coverage": max(0.0, min(1.0, round(bonus_cov, 4))),
        "overall_skill_coverage": max(0.0, min(1.0, round(overall_cov, 4)))
    }


def match_experience(jd_parsed: Dict[str, Any], resume_parsed: Dict[str, Any]) -> float:
    """
    Evaluates candidate experience against JD requirements contextually.
    Checks duration against min_years and discounts unrelated experience domains.
    Returns normalized score in [0, 1].
    """
    req_exp = jd_parsed.get("experience_requirements", {})
    min_years_required = float(req_exp.get("min_years", 0.0))

    exp_entries = resume_parsed.get("experience", [])
    total_cand_years = sum(entry.get("duration_years", 0.0) for entry in exp_entries)

    # Domain relevance check
    cand_skills = set(resume_parsed.get("skills", []))
    req_skills = set(jd_parsed.get("required_skills", []))
    pref_skills = set(jd_parsed.get("preferred_skills", []))

    role_text = " ".join([e.get("role", "") + " " + e.get("description", "") for e in exp_entries]).lower()
    tech_keywords = [s.lower() for s in (req_skills | pref_skills)]
    has_tech_in_exp = any(tk in role_text for tk in tech_keywords)

    if req_skills:
        if cand_skills.intersection(req_skills):
            relevance = 1.0
        elif cand_skills.intersection(pref_skills):
            relevance = 0.75
        elif has_tech_in_exp:
            relevance = 0.60
        else:
            # Candidate has experience, but in an unrelated field
            relevance = 0.25
    else:
        relevance = 1.0 if (cand_skills or has_tech_in_exp) else 0.5

    if min_years_required <= 0.0:
        if total_cand_years >= 2.0:
            base_score = 1.0
        elif total_cand_years > 0.0:
            base_score = 0.8
        else:
            base_score = 0.5
        return max(0.0, min(1.0, round(base_score * relevance, 4)))

    duration_ratio = total_cand_years / min_years_required
    duration_score = min(1.0, duration_ratio)

    final_score = duration_score * relevance
    return max(0.0, min(1.0, round(final_score, 4)))


def extract_evidence(
    matched_skills: List[str],
    raw_resume_text: str,
    jd_parsed: Optional[Dict[str, Any]] = None,
    candidate_skills: Optional[List[str]] = None
) -> List[Dict[str, str]]:
    """
    Extracts verbatim evidence snippets from the resume for matched skills.
    If jd_parsed is supplied, also extracts partial and missing requirement statuses.
    Never invents quotes.
    """
    evidence_list = []
    if not raw_resume_text and not jd_parsed:
        return evidence_list

    lines = [line.strip() for line in raw_resume_text.splitlines() if line.strip()]

    # 1. Matched Skills Evidence
    for skill in matched_skills:
        found_snippet = ""
        skill_lower = skill.lower()

        for line in lines:
            if re.search(rf"\b{re.escape(skill_lower)}\b", line.lower()):
                found_snippet = line.strip(" -•*")
                break

        if not found_snippet:
            for alias, canonical in CANONICAL_SKILLS_MAP.items():
                if canonical == skill:
                    for line in lines:
                        if re.search(rf"\b{re.escape(alias)}\b", line.lower()):
                            found_snippet = line.strip(" -•*")
                            break
                    if found_snippet:
                        break

        if found_snippet:
            clean_snip = re.sub(r"\s+", " ", found_snippet)
            if len(clean_snip) > 160:
                clean_snip = clean_snip[:157] + "..."
            evidence_list.append({
                "skill": skill,
                "status": "matched",
                "evidence": clean_snip
            })
        else:
            evidence_list.append({
                "skill": skill,
                "status": "matched",
                "evidence": f"Explicitly listed under skills in candidate resume."
            })

    # 2. If jd_parsed is provided, include Missing & Partial statuses for unfulfilled requirements
    if jd_parsed:
        cand_skill_set = set(candidate_skills if candidate_skills is not None else matched_skills)
        all_req_pref = [
            ("required", jd_parsed.get("required_skills", [])),
            ("preferred", jd_parsed.get("preferred_skills", []))
        ]

        for req_type, skill_list in all_req_pref:
            for skill in skill_list:
                if skill in matched_skills:
                    continue

                # Check if candidate has related skill
                related_candidates = RELATED_SKILLS_MAP.get(skill, [])
                matched_related = [r for r in related_candidates if r in cand_skill_set]

                if matched_related:
                    evidence_list.append({
                        "skill": skill,
                        "status": "partial",
                        "evidence": f"Candidate demonstrates related experience in {matched_related[0]}, though {skill} was not explicitly mentioned."
                    })
                else:
                    evidence_list.append({
                        "skill": skill,
                        "status": "missing",
                        "evidence": f"{req_type.capitalize()} '{skill}' not found in candidate resume text."
                    })

    return evidence_list


def calculate_weighted_match(
    semantic_score: float,
    skill_coverage: float,
    bm25_score: float,
    semantic_weight: float = 0.40,
    skill_weight: float = 0.35,
    bm25_weight: float = 0.25
) -> float:
    """
    Computes dynamically weighted hybrid match score.
    Weights default to 0.40 (semantic) / 0.35 (skills) / 0.25 (BM25).
    Validates non-negative weights and normalizes them automatically.
    Returns normalized score strictly in [0, 1].
    """
    if semantic_weight < 0 or skill_weight < 0 or bm25_weight < 0:
        raise ValueError("Matching weights must be non-negative numbers.")

    total_w = semantic_weight + skill_weight + bm25_weight
    if total_w <= 0:
        raise ValueError("Sum of matching weights must be strictly greater than zero.")

    w_sem = semantic_weight / total_w
    w_skill = skill_weight / total_w
    w_bm25 = bm25_weight / total_w

    score = (
        w_sem * float(semantic_score) +
        w_skill * float(skill_coverage) +
        w_bm25 * float(bm25_score)
    )

    return max(0.0, min(1.0, round(score, 4)))
