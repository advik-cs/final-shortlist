"""
Unified Pipeline for Person 1.
Provides analyze_candidate() and analyze_candidates() returning the clean
structured match data contract for Person 2.
"""

from typing import Union, Dict, Any, List, Optional
from pathlib import Path

from backend.pdf_extractor import extract_pdf_text
from backend.jd_parser import parse_jd
from backend.resume_parser import parse_resume
from backend.matcher import (
    compute_bm25_score,
    compute_semantic_similarity,
    match_skills,
    compute_detailed_skill_coverage,
    match_experience,
    extract_evidence,
    calculate_weighted_match
)


def analyze_candidate(
    jd: Union[str, Path, Dict[str, Any]],
    resume: Union[str, Path, Dict[str, Any]],
    candidate_id: str = "C001",
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Executes the full Person 1 document intelligence & matching pipeline for a single candidate.
    Accepts raw text, PDF file paths, or pre-parsed dicts for JD and Resume.

    Returns the backward-compatible Person 2 data contract with normalized [0, 1] scores
    and extended coverage and dynamic weighting fields.
    """
    # 1. Resolve JD input
    if isinstance(jd, dict) and "required_skills" in jd:
        jd_parsed = jd
    else:
        jd_text = extract_pdf_text(jd) if isinstance(jd, (str, Path)) else str(jd)
        jd_parsed = parse_jd(jd_text)

    # 2. Resolve Resume input
    if isinstance(resume, dict) and "skills" in resume:
        resume_parsed = resume
    else:
        resume_text = extract_pdf_text(resume) if isinstance(resume, (str, Path)) else str(resume)
        resume_parsed = parse_resume(resume_text)

    # 3. Compute lexical BM25 score
    bm25_score = compute_bm25_score(
        jd_parsed.get("raw_text", ""),
        resume_parsed.get("raw_text", "")
    )

    # 4. Compute local semantic similarity using all-MiniLM-L6-v2
    semantic_score = compute_semantic_similarity(
        jd_parsed.get("raw_text", ""),
        resume_parsed.get("raw_text", "")
    )

    # 5. Compute skill matches and coverage
    req_matches, pref_matches, bonus_matches, skill_cov = match_skills(
        jd_parsed,
        resume_parsed
    )
    detailed_cov = compute_detailed_skill_coverage(jd_parsed, resume_parsed)

    # 6. Compute contextual experience score
    experience_score = match_experience(jd_parsed, resume_parsed)

    # 7. Extract verbatim evidence
    matched_all = req_matches + pref_matches + bonus_matches
    # Preserved matched-only evidence for backward compatibility
    evidence = extract_evidence(matched_all, resume_parsed.get("raw_text", ""))

    # Complete requirement evidence with matched, partial, and missing statuses
    requirement_evidence = extract_evidence(
        matched_all,
        resume_parsed.get("raw_text", ""),
        jd_parsed=jd_parsed,
        candidate_skills=resume_parsed.get("skills", [])
    )

    # 8. Compute dynamic weighted match score (default 40% semantic, 35% skill, 25% BM25)
    w = weights or {}
    sem_w = w.get("semantic_weight", 0.40)
    skill_w = w.get("skill_weight", 0.35)
    bm25_w = w.get("bm25_weight", 0.25)

    weighted_score_norm = calculate_weighted_match(
        semantic_score=semantic_score,
        skill_coverage=skill_cov,
        bm25_score=bm25_score,
        semantic_weight=sem_w,
        skill_weight=skill_w,
        bm25_weight=bm25_w
    )

    # Human-facing match score scaled to 0-100
    weighted_match_score = round(weighted_score_norm * 100.0, 2)

    # 9. Return exact Person 2 Data Contract (fully backward-compatible + extended fields)
    return {
        "candidate_id": str(candidate_id),
        "name": resume_parsed.get("name", "Candidate"),

        "skills": resume_parsed.get("skills", []),
        "experience": resume_parsed.get("experience", []),
        "education": resume_parsed.get("education", []),
        "projects": resume_parsed.get("projects", []),

        "required_matches": req_matches,
        "preferred_matches": pref_matches,
        "bonus_matches": bonus_matches,

        "bm25_score": max(0.0, min(1.0, float(bm25_score))),
        "semantic_score": max(0.0, min(1.0, float(semantic_score))),
        "skill_coverage": max(0.0, min(1.0, float(skill_cov))),
        "experience_score": max(0.0, min(1.0, float(experience_score))),

        "evidence": evidence,
        "raw_text": resume_parsed.get("raw_text", ""),

        # Extended P1 features for P2
        "required_skill_coverage": detailed_cov["required_skill_coverage"],
        "preferred_skill_coverage": detailed_cov["preferred_skill_coverage"],
        "bonus_skill_coverage": detailed_cov["bonus_skill_coverage"],
        "overall_skill_coverage": detailed_cov["overall_skill_coverage"],
        "weighted_match_score": weighted_match_score,
        "match_components": {
            "semantic_score": float(semantic_score),
            "skill_coverage": float(skill_cov),
            "bm25_score": float(bm25_score),
            "weights": {
                "semantic_weight": sem_w,
                "skill_weight": skill_w,
                "bm25_weight": bm25_w
            }
        },
        "requirement_evidence": requirement_evidence
    }


def analyze_candidates(
    jd: Union[str, Path, Dict[str, Any]],
    resumes: List[Union[str, Path, Dict[str, Any]]],
    candidate_ids: Optional[List[str]] = None,
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Processes a batch of candidate resumes against a single JD.
    Parses the JD once to optimize performance.
    Returns a list of structured match-data dictionaries.
    Does NOT rank candidates (Person 2 owns final ranking).
    """
    if not resumes:
        return []

    # Parse JD once
    if isinstance(jd, dict) and "required_skills" in jd:
        jd_parsed = jd
    else:
        jd_text = extract_pdf_text(jd) if isinstance(jd, (str, Path)) else str(jd)
        jd_parsed = parse_jd(jd_text)

    results = []
    for i, resume in enumerate(resumes):
        cid = candidate_ids[i] if candidate_ids and i < len(candidate_ids) else f"C{i+1:03d}"
        res = analyze_candidate(jd_parsed, resume, candidate_id=cid, weights=weights)
        results.append(res)

    return results
