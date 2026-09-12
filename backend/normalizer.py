"""
Skill Normalization Engine.
Provides a comprehensive canonical technical skill taxonomy with alias mapping
and conservative RapidFuzz fuzzy matching to prevent false positives.
"""

import re
from typing import List, Optional, Set, Dict
from rapidfuzz import fuzz

# Canonical Skills Taxonomy & Known Aliases
CANONICAL_SKILLS_MAP = {
    # Programming Languages
    "python": "Python",
    "py": "Python",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "c programming": "C",
    "c language": "C",
    "r programming": "R",
    "r language": "R",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "scala": "Scala",
    "kotlin": "Kotlin",
    "swift": "Swift",

    # Backend
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node js": "Node.js",
    "express": "Express",
    "express.js": "Express",
    "expressjs": "Express",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "asp.net": "ASP.NET",
    "asp net": "ASP.NET",
    "dotnet": ".NET",
    ".net": ".NET",
    "ruby on rails": "Ruby on Rails",
    "rails": "Ruby on Rails",

    # Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "react native": "React Native",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "next js": "Next.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "vue": "Vue",
    "vue.js": "Vue",
    "vuejs": "Vue",
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "redux": "Redux",

    # Databases
    "sql": "SQL",
    "nosql": "NoSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "mongo db": "MongoDB",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "postgres sql": "PostgreSQL",
    "mysql": "MySQL",
    "my sql": "MySQL",
    "redis": "Redis",
    "sqlite": "SQLite",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "dynamo db": "DynamoDB",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",

    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "linux": "Linux",

    # APIs, Architecture & Tools
    "rest": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "restful apis": "REST API",
    "rest apis": "REST API",
    "graphql": "GraphQL",
    "microservices": "Microservices",
    "microservice": "Microservices",
    "grpc": "gRPC",
    "kafka": "Kafka",
    "rabbitmq": "RabbitMQ",
    "rabbit mq": "RabbitMQ",
    "websockets": "WebSockets",
    "websocket": "WebSockets",
}

ALL_CANONICAL_SKILLS = sorted(list(set(CANONICAL_SKILLS_MAP.values())))

# Related Technologies Map for Partial Skill Matching
RELATED_SKILLS_MAP: Dict[str, List[str]] = {
    "TypeScript": ["JavaScript"],
    "JavaScript": ["TypeScript"],
    "Next.js": ["React", "JavaScript"],
    "React": ["Next.js", "Vue", "Angular", "JavaScript"],
    "Node.js": ["Express", "JavaScript"],
    "Express": ["Node.js"],
    "MongoDB": ["NoSQL"],
    "PostgreSQL": ["SQL", "MySQL"],
    "MySQL": ["SQL", "PostgreSQL"],
    "Docker": ["Kubernetes"],
    "Kubernetes": ["Docker"],
    "FastAPI": ["Python", "Flask", "Django"],
    "Django": ["Python", "Flask", "FastAPI"],
    "Flask": ["Python", "Django", "FastAPI"],
    "AWS": ["GCP", "Azure"],
    "Azure": ["AWS", "GCP"],
    "GCP": ["AWS", "Azure"],
}


def clean_skill_string(skill: str) -> str:
    """Strip punctuation and extra whitespace, keeping essential tech symbols."""
    cleaned = skill.strip().lower()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def normalize_skill(skill: str, threshold: float = 88.0) -> Optional[str]:
    """
    Normalizes a single skill string to its canonical representation.
    Uses exact alias lookup first, then careful RapidFuzz fuzzy matching for typos.
    Never fuzzy matches very short strings (<= 3 chars) to avoid false positives.
    """
    if not skill or not isinstance(skill, str):
        return None

    cleaned = clean_skill_string(skill)
    if not cleaned:
        return None

    # 1. Exact alias match
    if cleaned in CANONICAL_SKILLS_MAP:
        return CANONICAL_SKILLS_MAP[cleaned]

    # Normalize dot variants (e.g., node.js vs node js)
    dot_normalized = cleaned.replace(".", " ")
    dot_normalized = re.sub(r"\s+", " ", dot_normalized).strip()
    if dot_normalized in CANONICAL_SKILLS_MAP:
        return CANONICAL_SKILLS_MAP[dot_normalized]

    joined_normalized = cleaned.replace(" ", "").replace("-", "").replace(".", "")
    for alias, canonical in CANONICAL_SKILLS_MAP.items():
        if alias.replace(" ", "").replace("-", "").replace(".", "") == joined_normalized:
            return canonical

    # 2. Conservative Fuzzy Matching
    # Strictly avoid fuzzy matching short strings like 'go', 'c', 'r', 'js', 'aws', 'gcp'
    if len(cleaned) < 4:
        return None

    best_match = None
    best_score = 0.0

    for alias, canonical in CANONICAL_SKILLS_MAP.items():
        if len(alias) < 4:
            continue
        score = fuzz.ratio(cleaned, alias)
        if score > best_score:
            best_score = score
            best_match = canonical

    if best_score >= threshold:
        return best_match

    for canonical in ALL_CANONICAL_SKILLS:
        if len(canonical) < 4:
            continue
        score = fuzz.ratio(cleaned, canonical.lower())
        if score > best_score:
            best_score = score
            best_match = canonical

    if best_score >= threshold:
        return best_match

    return None


def normalize_skills(skills: List[str]) -> List[str]:
    """
    Normalizes a list of skills, removing duplicates while preserving order.
    """
    if not skills:
        return []

    seen: Set[str] = set()
    result: List[str] = []

    for s in skills:
        norm = normalize_skill(s)
        if norm and norm not in seen:
            seen.add(norm)
            result.append(norm)

    return result


def extract_skills_from_text(text: str) -> List[str]:
    """
    Scans a text block for technical skills using word boundary matching
    for canonical skills and aliases.
    """
    if not text:
        return []

    found_skills: Set[str] = set()
    sorted_aliases = sorted(CANONICAL_SKILLS_MAP.keys(), key=lambda x: len(x), reverse=True)

    text_lower = " " + text.lower() + " "
    # Strip sentence-ending periods without affecting node.js or asp.net
    text_lower = re.sub(r"\.(?=\s|$)", " ", text_lower)
    clean_search_text = re.sub(r"[,/|;()\[\]{}•\*\n\r\t!?:\"']", " ", text_lower)
    clean_search_text = re.sub(r"\s+", " ", clean_search_text)

    for alias in sorted_aliases:
        escaped_alias = re.escape(alias)
        # Safeguard: single-character aliases like 'c' or 'r' are only mapped via 'c programming', 'r language', etc.
        pattern = rf"(?:^|[\s,;:(/]){escaped_alias}(?:[\s,;:)/]|$)"
        if re.search(pattern, clean_search_text):
            found_skills.add(CANONICAL_SKILLS_MAP[alias])

    return sorted(list(found_skills))
