"""
Person 2 — Ranking, Explanations, Confidence, Comparison, Q&A, and Bias Detection.
Delegates ALL weighting and hybrid scoring directly to Person 1's calculate_weighted_match().
Single source of truth for recruiter-controlled weighting.
100% deterministic, local, zero API keys.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from backend.matcher import calculate_weighted_match

# Canonical default weights from Person 1 (The Single Source of Truth)
DEFAULT_WEIGHTS = {
    "semantic_weight": 0.40,
    "skill_weight": 0.35,
    "bm25_weight": 0.25
}


def calculate_confidence(candidate: Dict[str, Any], jd_parsed: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Computes confidence level (HIGH / MEDIUM / LOW) and rationale
    based on explicit verifiable evidence for requirements.
    """
    req_skills = jd_parsed.get("required_skills", []) if jd_parsed else []
    total_important = len(req_skills) if req_skills else max(1, len(candidate.get("skills", [])))

    matched_reqs = len(candidate.get("required_matches", []))
    coverage = candidate.get("skill_coverage", 0.0)

    evidence_items = candidate.get("evidence", [])
    verified_count = len([e for e in evidence_items if e.get("status") == "matched"])

    ratio = matched_reqs / total_important if total_important > 0 else coverage

    if ratio >= 0.75 and verified_count >= 2:
        level = "HIGH"
    elif ratio >= 0.40 or verified_count >= 1:
        level = "MEDIUM"
    else:
        level = "LOW"

    rationale = f"Strong explicit evidence found for {matched_reqs} of {total_important} important requirements."
    if level == "LOW":
        rationale = f"Sparse explicit evidence found ({matched_reqs} of {total_important} requirements verified)."

    return {
        "level": level,
        "ratio": round(ratio, 2),
        "verified_count": verified_count,
        "total_important": total_important,
        "rationale": rationale
    }


def generate_explanations(
    candidate: Dict[str, Any],
    rank: int,
    jd_parsed: Optional[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Generates rule-based, deterministic explanations:
    - domain_alignment statement
    - summary_rationale sentence
    """
    sem_score = candidate.get("semantic_score", 0.0)
    req_matches = candidate.get("required_matches", [])
    req_skills = jd_parsed.get("required_skills", []) if jd_parsed else []
    req_total = len(req_skills) if req_skills else max(1, len(req_matches))

    # Domain alignment statement
    if sem_score >= 0.70:
        domain_statement = "Demonstrates strong conceptual alignment with full-stack development and modern API architecture."
    elif sem_score <= 0.45:
        domain_statement = "Low contextual overlap; projects focus primarily outside the required technology domain."
    else:
        domain_statement = "Moderate contextual overlap with core responsibilities and technical workflows."

    # Missing skills statement
    missing = [s for s in req_skills if s not in req_matches]
    if missing:
        missing_phrase = f"Lacks explicit mention of {', '.join(missing[:2])}."
    else:
        missing_phrase = "Fulfills all mandatory technical baseline requirements."

    # Top technical ecosystems
    cand_skills = candidate.get("skills", [])
    top_tech = ", ".join(cand_skills[:3]) if cand_skills else "general engineering"

    # Summary rationale assembled dynamically
    summary_rationale = (
        f"Ranked #{rank} due to exceptional skill coverage ({len(req_matches)}/{req_total} required skills) "
        f"and high semantic relevance in {top_tech} ecosystems. {missing_phrase}"
    )

    return {
        "domain_alignment": domain_statement,
        "summary_rationale": summary_rationale,
        "missing_phrase": missing_phrase
    }


def rank_candidates(
    candidates: List[Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None,
    jd_parsed: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Recalculates match scores using Person 1's calculate_weighted_match()
    as the SINGLE SOURCE OF TRUTH, re-ranks candidates, and updates explanations.
    Does NOT modify the frozen P1 contract keys; extends them with P2 metadata.
    """
    if not candidates:
        return []

    active_weights = weights or DEFAULT_WEIGHTS
    sem_w = active_weights.get("semantic_weight", DEFAULT_WEIGHTS["semantic_weight"])
    skill_w = active_weights.get("skill_weight", DEFAULT_WEIGHTS["skill_weight"])
    bm25_w = active_weights.get("bm25_weight", DEFAULT_WEIGHTS["bm25_weight"])

    scored_candidates = []
    for cand in candidates:
        cand_copy = dict(cand)

        # Delegate score calculation directly to Person 1's calculate_weighted_match
        norm_score = calculate_weighted_match(
            semantic_score=cand_copy.get("semantic_score", 0.0),
            skill_coverage=cand_copy.get("skill_coverage", 0.0),
            bm25_score=cand_copy.get("bm25_score", 0.0),
            semantic_weight=sem_w,
            skill_weight=skill_w,
            bm25_weight=bm25_w
        )

        cand_copy["final_score"] = round(norm_score * 100.0, 1)
        cand_copy["weighted_match_score"] = cand_copy["final_score"]

        cand_copy["match_components"] = {
            "semantic_score": float(cand_copy.get("semantic_score", 0.0)),
            "skill_coverage": float(cand_copy.get("skill_coverage", 0.0)),
            "bm25_score": float(cand_copy.get("bm25_score", 0.0)),
            "weights": {
                "semantic_weight": sem_w,
                "skill_weight": skill_w,
                "bm25_weight": bm25_w
            }
        }
        scored_candidates.append(cand_copy)

    scored_candidates.sort(
        key=lambda c: (
            c["final_score"],
            c.get("skill_coverage", 0.0),
            c.get("semantic_score", 0.0),
            c.get("experience_score", 0.0)
        ),
        reverse=True
    )

    ranked_candidates = []
    for idx, cand in enumerate(scored_candidates):
        rank = idx + 1
        cand["rank"] = rank

        conf = calculate_confidence(cand, jd_parsed=jd_parsed)
        cand["confidence"] = conf

        expl = generate_explanations(cand, rank=rank, jd_parsed=jd_parsed)
        cand["domain_alignment"] = expl["domain_alignment"]
        cand["summary_rationale"] = expl["summary_rationale"]

        ranked_candidates.append(cand)

    return ranked_candidates


def compare_candidates(
    cand_a: Dict[str, Any],
    cand_b: Dict[str, Any],
    jd_parsed: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Implements High-ROI 'Why X Over Y?' comparator:
    - Comparative skill diff
    - Component score delta
    - Auto-generated deterministic differentiator sentence
    """
    skills_a = set(cand_a.get("skills", []))
    skills_b = set(cand_b.get("skills", []))

    a_only = sorted(list(skills_a - skills_b))
    b_only = sorted(list(skills_b - skills_a))
    shared = sorted(list(skills_a.intersection(skills_b)))

    name_a = cand_a.get("name", "Candidate A")
    name_b = cand_b.get("name", "Candidate B")

    final_a = cand_a.get("final_score", 0.0)
    final_b = cand_b.get("final_score", 0.0)

    diff_final = round(final_a - final_b, 1)
    diff_semantic = round(cand_a.get("semantic_score", 0.0) - cand_b.get("semantic_score", 0.0), 3)
    diff_coverage = round(cand_a.get("skill_coverage", 0.0) - cand_b.get("skill_coverage", 0.0), 3)
    diff_experience = round(cand_a.get("experience_score", 0.0) - cand_b.get("experience_score", 0.0), 3)

    if final_a >= final_b:
        higher_name, lower_name = name_a, name_b
        advantage_skills = a_only
        missing_skills = b_only
    else:
        higher_name, lower_name = name_b, name_a
        advantage_skills = b_only
        missing_skills = a_only

    if advantage_skills and missing_skills:
        differentiator_sentence = (
            f"{higher_name} is ranked higher primarily due to having {', '.join(advantage_skills[:2])} experience, "
            f"whereas {lower_name} lacks {', '.join(missing_skills[:2])} despite shared competencies."
        )
    elif advantage_skills:
        differentiator_sentence = (
            f"{higher_name} is ranked higher primarily due to broader technical coverage in {', '.join(advantage_skills[:2])}."
        )
    elif abs(diff_semantic) > 0.05:
        differentiator_sentence = (
            f"{higher_name} is ranked higher due to stronger conceptual semantic alignment in core system architecture."
        )
    else:
        differentiator_sentence = (
            f"{higher_name} and {lower_name} have closely matched qualifications, with {higher_name} holding a marginal scoring edge."
        )

    return {
        "candidate_a_name": name_a,
        "candidate_b_name": name_b,
        "score_a": final_a,
        "score_b": final_b,
        "diff_final": diff_final,
        "diff_semantic": diff_semantic,
        "diff_coverage": diff_coverage,
        "diff_experience": diff_experience,
        "skills_a_only": a_only,
        "skills_b_only": b_only,
        "shared_skills": shared,
        "differentiator_sentence": differentiator_sentence
    }


def answer_recruiter_query(
    query: str,
    ranked_candidates: List[Dict[str, Any]],
    jd_parsed: Optional[Dict[str, Any]] = None
) -> str:
    """
    Deterministic Recruiter Q&A Engine (100% local, zero external API keys).
    Directly addresses recruiter questions:
    - 'Why is X ranked above Y?'
    - 'Who knows [skill]?'
    - 'What is [name] missing?'
    - 'Who is top candidate?'
    """
    if not ranked_candidates:
        return "No candidate data available to answer queries."

    q_lower = query.lower().strip()

    comp_match = re.search(r"why is\s+([a-zA-Z\s]+?)\s+(?:ranked\s+above|better than|higher than)\s+([a-zA-Z\s]+)", q_lower)
    if comp_match:
        cand_name_1 = comp_match.group(1).strip()
        cand_name_2 = comp_match.group(2).strip()

        c1 = next((c for c in ranked_candidates if cand_name_1 in c.get("name", "").lower()), None)
        c2 = next((c for c in ranked_candidates if cand_name_2 in c.get("name", "").lower()), None)

        if c1 and c2:
            comp = compare_candidates(c1, c2, jd_parsed=jd_parsed)
            return (
                f"{c1['name']} (Score: {c1['final_score']}%, Rank #{c1['rank']}) ranks above {c2['name']} "
                f"(Score: {c2['final_score']}%, Rank #{c2['rank']}).\n\n"
                f"{comp['differentiator_sentence']}"
            )

    skill_query_match = re.search(r"(?:who\s+(?:knows|has|uses|is\s+skilled\s+in)|candidates\s+with)\s+([a-zA-Z0-9.+]+)", q_lower)
    if skill_query_match:
        target_skill = skill_query_match.group(1).strip()
        matching_cands = []
        for c in ranked_candidates:
            cand_skills_lower = [s.lower() for s in c.get("skills", [])]
            if target_skill in cand_skills_lower or any(target_skill in s for s in cand_skills_lower):
                matching_cands.append(f"{c['name']} (Rank #{c['rank']})")

        if matching_cands:
            return f"Candidates with experience in {target_skill.upper()}: {', '.join(matching_cands)}."
        else:
            return f"No candidates in the current pool explicitly list experience in {target_skill.upper()}."

    missing_match = re.search(r"what is\s+([a-zA-Z\s]+?)\s+missing", q_lower)
    if missing_match:
        target_name = missing_match.group(1).strip()
        c = next((cand for cand in ranked_candidates if target_name in cand.get("name", "").lower()), None)
        if c and jd_parsed:
            req_skills = jd_parsed.get("required_skills", [])
            matched_skills = set(c.get("required_matches", []))
            missing = [s for s in req_skills if s not in matched_skills]
            if missing:
                return f"{c['name']} is missing the following required skills: {', '.join(missing)}."
            else:
                return f"{c['name']} satisfies all mandatory technical requirements in the JD."

    if "top candidate" in q_lower or "#1" in q_lower or "best candidate" in q_lower:
        top = ranked_candidates[0]
        return (
            f"The top-ranked candidate is {top['name']} with an overall match score of {top['final_score']}%. "
            f"{top.get('summary_rationale', '')}"
        )

    top = ranked_candidates[0]
    return (
        f"Processed {len(ranked_candidates)} candidates. "
        f"Top candidate: {top['name']} (Score: {top['final_score']}%, Skill Coverage: {round(top.get('skill_coverage', 0)*100)}%). "
        f"Ask specific questions like 'Why is Candidate A ranked above Candidate B?' or 'Who knows Docker?'."
    )


def detect_jd_bias(jd_text: str, jd_parsed: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    High-ROI JD Bias Detection Engine (100% deterministic, rule-based).
    Flags unnecessarily narrow or exclusionary criteria in job descriptions.
    """
    if not jd_text:
        return {"bias_detected": False, "flags": [], "summary": "Empty JD."}

    text_lower = jd_text.lower()
    flags = []

    elite_school_patterns = [
        (r"top[- ]tier\s+university", "Must have graduated from a top-tier university", "Focuses on institution pedigree rather than verified skills and capability.", "Evaluate candidates based on demonstrable skills, projects, and relevant experience rather than school ranking."),
        (r"ivy\s+league", "Ivy league graduates only", "Unnecessarily excludes qualified self-taught or diverse educational backgrounds.", "Broaden criteria to degree in Computer Science or equivalent hands-on experience."),
        (r"premier\s+institutes?|tier[- ]1\s+college", "Premier institutes / Tier-1 college only", "Restricts candidate pool based on legacy institutional prestige.", "Focus on domain knowledge and verified problem-solving ability.")
    ]

    for pat, label, why, suggestion in elite_school_patterns:
        match = re.search(pat, text_lower)
        if match:
            flags.append({
                "category": "Educational Elitism",
                "phrase": match.group(0),
                "why": why,
                "suggestion": suggestion
            })

    demo_patterns = [
        (r"recent\s+graduates?\s+only", "Recent graduate only", "May exclude experienced career changers or older candidates.", "Specify target skill proficiency level instead of graduation date."),
        (r"young\s+and\s+energetic", "Young and energetic", "Age-discriminatory terminology.", "Use 'collaborative and proactive problem solver'."),
        (r"digital\s+native", "Digital native", "Subtle age proxy that can deter experienced professionals.", "Specify exact software tooling proficiency required.")
    ]

    for pat, label, why, suggestion in demo_patterns:
        match = re.search(pat, text_lower)
        if match:
            flags.append({
                "category": "Demographic / Age Proxy",
                "phrase": match.group(0),
                "why": why,
                "suggestion": suggestion
            })

    buzzword_patterns = [
        (r"rockstar|ninja|wizard|guru", "Rockstar / Ninja / Wizard", "Vague persona requirement that disproportionately discourages qualified underrepresented applicants.", "Replace with specific deliverables and engineering competencies.")
    ]

    for pat, label, why, suggestion in buzzword_patterns:
        match = re.search(pat, text_lower)
        if match:
            flags.append({
                "category": "Exclusionary Buzzwords",
                "phrase": match.group(0),
                "why": why,
                "suggestion": suggestion
            })

    req_skills_count = len(jd_parsed.get("required_skills", [])) if jd_parsed else 0
    pref_skills_count = len(jd_parsed.get("preferred_skills", [])) if jd_parsed else 0

    return {
        "bias_detected": len(flags) > 0,
        "flag_count": len(flags),
        "flags": flags,
        "skills_detected": req_skills_count + pref_skills_count,
        "required_count": req_skills_count,
        "preferred_count": pref_skills_count,
        "summary": f"Detected {len(flags)} potentially restrictive or biased criteria." if flags else "Job description is inclusive with balanced technical expectations."
    }
