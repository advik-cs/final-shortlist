"""
Resume Parser.
Extracts candidate name, contact details, structured experience, education,
projects, skills, and dates from raw resume text using deterministic rules.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from dateutil import parser as date_parser
from backend.normalizer import extract_skills_from_text, normalize_skills


SECTION_HEADERS = {
    "skills": re.compile(r"^(?:#*\s*)(?:technical\s+skills|skills(?:\s+summary)?|technologies|core\s+competencies|tools\s+&\s+technologies|tech\s+stack)\s*[:\-]?$", re.IGNORECASE),
    "experience": re.compile(r"^(?:#*\s*)(?:work\s+experience|professional\s+experience|employment\s+history|experience|career\s+history|work\s+history)\s*[:\-]?$", re.IGNORECASE),
    "education": re.compile(r"^(?:#*\s*)(?:education|academic\s+background|academic\s+qualifications|academics)\s*[:\-]?$", re.IGNORECASE),
    "projects": re.compile(r"^(?:#*\s*)(?:projects|personal\s+projects|academic\s+projects|key\s+projects|featured\s+projects)\s*[:\-]?$", re.IGNORECASE),
}

DATE_RANGE_REGEX = re.compile(
    r"(?P<start>(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\s,.'-]+)?\d{4}|\d{1,2}/\d{4}|\d{4})"
    r"\s*(?:-|–|—|to)\s*"
    r"(?P<end>(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[a-z]*[\s,.'-]+)?\d{4}|\d{1,2}/\d{4}|\d{4}|present|current|now)",
    re.IGNORECASE
)


def parse_date_safe(date_str: str) -> Optional[datetime]:
    """Parse a fuzzy date string safely."""
    date_str = date_str.strip().lower()
    if date_str in ["present", "current", "now"]:
        return datetime(2026, 1, 1)

    try:
        if re.match(r"^\d{4}$", date_str):
            return datetime(int(date_str), 1, 1)
        return date_parser.parse(date_str, fuzzy=True)
    except Exception:
        return None


def calculate_duration_years(start_str: str, end_str: str) -> float:
    """Calculates duration in years from date strings."""
    start_dt = parse_date_safe(start_str)
    end_dt = parse_date_safe(end_str)

    if not start_dt:
        return 0.0
    if not end_dt:
        end_dt = datetime(2026, 1, 1)

    diff_days = (end_dt - start_dt).days
    if diff_days < 0:
        return 0.0

    years = round(diff_days / 365.25, 2)
    return max(years, 0.1)


def parse_resume(raw_text: str) -> Dict[str, Any]:
    """
    Parses resume text into structured fields.
    """
    if not raw_text:
        return {
            "name": "Candidate",
            "email": "",
            "phone": "",
            "skills": [],
            "experience": [],
            "education": [],
            "projects": [],
            "dates": [],
            "raw_text": ""
        }

    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    # Extract Contact Information
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}", raw_text)
    phone = phone_match.group(0) if phone_match else ""

    # Infer Candidate Name from top lines
    name = "Candidate"
    for line in lines[:5]:
        if "@" in line or "http" in line or (phone and phone in line):
            continue
        if re.search(r"(?:resume|curriculum|vitae|profile|portfolio|contact)", line, re.IGNORECASE):
            continue
        cleaned_name = re.sub(r"[^a-zA-Z\s]", "", line).strip()
        words = cleaned_name.split()
        if 1 <= len(words) <= 4 and len(cleaned_name) < 35:
            name = cleaned_name
            break

    # Segment into sections
    sections: Dict[str, List[str]] = {
        "header": [],
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "other": []
    }
    current_sec = "header"

    for line in lines:
        matched_new_sec = False
        for sec_name, pat in SECTION_HEADERS.items():
            if pat.match(line):
                current_sec = sec_name
                matched_new_sec = True
                break

        if matched_new_sec:
            continue

        sections[current_sec].append(line)

    # Extract Skills
    skills_sec_text = "\n".join(sections["skills"])
    skills_from_sec = extract_skills_from_text(skills_sec_text)
    all_doc_skills = extract_skills_from_text(raw_text)
    combined_skills = sorted(list(set(skills_from_sec + all_doc_skills)))

    # Parse Experience Entries
    exp_entries = []
    exp_lines = sections["experience"]
    all_dates_found = []

    current_entry: Optional[Dict[str, Any]] = None
    desc_lines: List[str] = []

    for line in exp_lines:
        date_match = DATE_RANGE_REGEX.search(line)
        if date_match:
            # Save previous entry if exists
            if current_entry:
                current_entry["description"] = "\n".join(desc_lines).strip()
                exp_entries.append(current_entry)
                desc_lines = []

            start_d = date_match.group("start")
            end_d = date_match.group("end")
            duration = calculate_duration_years(start_d, end_d)
            all_dates_found.append(f"{start_d} - {end_d}")

            header_candidate = ""
            # Check line right before date
            if desc_lines:
                last_line = desc_lines.pop()
                if len(last_line) < 80 and not last_line.startswith(("-", "•", "*")):
                    header_candidate = last_line
                else:
                    desc_lines.append(last_line)

            line_without_date = DATE_RANGE_REGEX.sub("", line).strip(" -|,")
            target_str = header_candidate if header_candidate else line_without_date

            role = "Software Engineer"
            company = "Company"

            if "|" in target_str:
                parts = [p.strip() for p in target_str.split("|") if p.strip()]
                role = parts[0]
                if len(parts) > 1:
                    company = parts[1]
            elif " at " in target_str:
                parts = target_str.split(" at ")
                role = parts[0].strip()
                company = parts[1].strip()
            elif target_str:
                role = target_str

            current_entry = {
                "company": company,
                "role": role,
                "start_date": start_d,
                "end_date": end_d,
                "duration_years": duration,
                "description": ""
            }
        else:
            desc_lines.append(line)

    if current_entry:
        current_entry["description"] = "\n".join(desc_lines).strip()
        exp_entries.append(current_entry)
    elif desc_lines and sections["experience"]:
        exp_entries.append({
            "company": "Experience",
            "role": "Engineer",
            "start_date": "",
            "end_date": "",
            "duration_years": 1.0,
            "description": "\n".join(desc_lines).strip()
        })

    # Projects Entries
    project_entries = []
    proj_lines = sections["projects"]
    curr_proj = []
    for line in proj_lines:
        if line.startswith(("-", "•", "*")) or len(line.split()) < 5:
            if curr_proj:
                project_entries.append("\n".join(curr_proj))
                curr_proj = []
        curr_proj.append(line)
    if curr_proj:
        project_entries.append("\n".join(curr_proj))

    # Education Entries
    education_entries = [line for line in sections["education"] if line.strip()]

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": combined_skills,
        "experience": exp_entries,
        "education": education_entries,
        "projects": project_entries,
        "dates": all_dates_found,
        "raw_text": raw_text
    }
