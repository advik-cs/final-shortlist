"""
Job Description (JD) Parser.
Rule and heuristic based parser extracting job title, required skills,
preferred skills, bonus skills, experience thresholds, and responsibilities.
"""

import re
from typing import Dict, Any, List, Optional
from backend.normalizer import extract_skills_from_text, normalize_skills


# Header patterns
REQUIRED_HEADERS = [
    r"(?:required\s*(?:skills|qualifications|requirements)?|must\s*have|mandatory|minimum\s*requirements|basic\s*qualifications|what\s*you(?:'ll|\s*will)\s*need)"
]

PREFERRED_HEADERS = [
    r"(?:preferred\s*(?:skills|qualifications)?|nice\s*to\s*have|good\s*to\s*have|desired(?:\s*qualifications)?)"
]

BONUS_HEADERS = [
    r"(?:bonus(?:\s*points|\s*skills)?|additional(?:\s*skills)?|plus|advantage)"
]

EXPERIENCE_HEADERS = [
    r"(?:experience\s*requirements?|work\s*experience|minimum\s*experience)"
]

RESPONSIBILITIES_HEADERS = [
    r"(?:responsibilities|duties|what\s*you(?:'ll|\s*will)\s*do|key\s*responsibilities|role\s*overview)"
]

EDUCATION_HEADERS = [
    r"(?:education|academic\s*qualifications|degrees?)"
]


def extract_min_experience_years(text: str) -> float:
    """Extracts minimum years of experience from text using regex."""
    patterns = [
        r"(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:-|to\s*\d+\s*)?(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|hands-on|professional|work))?\s*experience",
        r"experience\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years?|yrs?)",
        r"at\s+least\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
    ]
    min_years = 0.0
    for pat in patterns:
        matches = re.findall(pat, text, flags=re.IGNORECASE)
        for m in matches:
            try:
                val = float(m)
                if val > min_years:
                    min_years = val
            except ValueError:
                continue
    return min_years


def parse_jd(raw_text: str) -> Dict[str, Any]:
    """
    Parses raw JD text into categorized skills and requirements.
    """
    if not raw_text:
        return {
            "title": "",
            "required_skills": [],
            "preferred_skills": [],
            "bonus_skills": [],
            "experience_requirements": {"min_years": 0.0, "description": ""},
            "education_requirements": [],
            "certifications": [],
            "responsibilities": [],
            "raw_text": ""
        }

    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    # Infer Title
    title = ""
    for line in lines[:5]:
        if re.search(r"(?:engineer|developer|architect|designer|manager|lead|intern|analyst|specialist)", line, re.IGNORECASE):
            title = line
            break
    if not title and lines:
        title = lines[0]

    # Section segmentation
    sections = {
        "required": [],
        "preferred": [],
        "bonus": [],
        "experience": [],
        "responsibilities": [],
        "education": [],
        "general": []
    }

    current_section = "general"

    req_pat = re.compile(r"^#*\s*(?:" + "|".join(REQUIRED_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)
    pref_pat = re.compile(r"^#*\s*(?:" + "|".join(PREFERRED_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)
    bonus_pat = re.compile(r"^#*\s*(?:" + "|".join(BONUS_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)
    exp_pat = re.compile(r"^#*\s*(?:" + "|".join(EXPERIENCE_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)
    resp_pat = re.compile(r"^#*\s*(?:" + "|".join(RESPONSIBILITIES_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)
    edu_pat = re.compile(r"^#*\s*(?:" + "|".join(EDUCATION_HEADERS) + r")\s*[:\-\b]", re.IGNORECASE)

    for line in lines:
        # Check if line matches a new section header
        if req_pat.search(line):
            current_section = "required"
            continue
        elif pref_pat.search(line):
            current_section = "preferred"
            continue
        elif bonus_pat.search(line):
            current_section = "bonus"
            continue
        elif exp_pat.search(line):
            current_section = "experience"
            continue
        elif resp_pat.search(line):
            current_section = "responsibilities"
            continue
        elif edu_pat.search(line):
            current_section = "education"
            continue

        sections[current_section].append(line)

    # Extract skills per section
    required_text = "\n".join(sections["required"])
    preferred_text = "\n".join(sections["preferred"])
    bonus_text = "\n".join(sections["bonus"])
    general_text = "\n".join(sections["general"])
    exp_text = "\n".join(sections["experience"])
    resp_text = "\n".join(sections["responsibilities"])

    required_skills = set(extract_skills_from_text(required_text))
    preferred_skills = set(extract_skills_from_text(preferred_text))
    bonus_skills = set(extract_skills_from_text(bonus_text))

    # Also check inline sentence cues like "Nice to have: Docker" or "Required: Node.js"
    inline_req = re.findall(r"(?:must\s+have|required|mandatory)[:\s]+([^\n.]+)", raw_text, re.IGNORECASE)
    for match in inline_req:
        required_skills.update(extract_skills_from_text(match))

    inline_pref = re.findall(r"(?:nice\s+to\s+have|preferred|good\s+to\s+have)[:\s]+([^\n.]+)", raw_text, re.IGNORECASE)
    for match in inline_pref:
        preferred_skills.update(extract_skills_from_text(match))

    inline_bonus = re.findall(r"(?:bonus|plus|advantage)[:\s]+([^\n.]+)", raw_text, re.IGNORECASE)
    for match in inline_bonus:
        bonus_skills.update(extract_skills_from_text(match))

    # Disjoint refinement: preferred and bonus shouldn't swallow required
    preferred_skills = preferred_skills - required_skills
    bonus_skills = bonus_skills - required_skills - preferred_skills

    # Fallback if no explicit sections were found:
    # Treat extracted skills from responsibilities and general text as required
    if not required_skills and not preferred_skills and not bonus_skills:
        all_found = extract_skills_from_text(raw_text)
        required_skills = set(all_found)

    # Experience
    min_years = extract_min_experience_years(raw_text)

    # Education degrees
    education_reqs = []
    edu_matches = re.findall(r"(?:bachelor(?:'s)?|master(?:'s)?|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|ph\.?d|degree\s+in\s+computer\s+science)", raw_text, re.IGNORECASE)
    if edu_matches:
        education_reqs = sorted(list(set(m.strip() for m in edu_matches)))

    return {
        "title": title,
        "required_skills": sorted(list(required_skills)),
        "preferred_skills": sorted(list(preferred_skills)),
        "bonus_skills": sorted(list(bonus_skills)),
        "experience_requirements": {
            "min_years": min_years,
            "description": exp_text if exp_text else f"{min_years}+ years of experience required" if min_years > 0 else ""
        },
        "education_requirements": education_reqs,
        "certifications": [],
        "responsibilities": sections["responsibilities"],
        "raw_text": raw_text
    }
