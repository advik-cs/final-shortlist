"""
Comprehensive Test Suite for Person 1 Backend.
Tests synthetic in-memory JD/resume cases with zero external API dependencies.
Covers all Person 1 features: Document extraction, Parsing, Normalization,
Hybrid matching, Dynamic weights, Detailed coverage, Evidence extraction, and Batch processing.
"""

import unittest
from backend.normalizer import (
    normalize_skill,
    normalize_skills,
    extract_skills_from_text
)
from backend.jd_parser import parse_jd
from backend.resume_parser import parse_resume
from backend.matcher import (
    get_embedding_model,
    compute_bm25_score,
    compute_semantic_similarity,
    match_skills,
    compute_detailed_skill_coverage,
    match_experience,
    extract_evidence,
    calculate_weighted_match
)
from backend.pipeline import analyze_candidate, analyze_candidates


# Synthetic Test Fixtures
SAMPLE_JD = """
Backend Software Engineer

Responsibilities:
- Design and develop scalable RESTful microservices.
- Manage database schemas and perform query optimization.

Must have:
- Node.js
- Express
- MongoDB
- 3+ years of experience in backend software engineering

Nice to have:
- React
- Docker

Bonus:
- AWS
"""

STRONG_RESUME = """
Rahul Sharma
rahul.sharma@example.com | +91 9876543210

TECHNICAL SKILLS
Languages & Frameworks: Node JS, Express, Python, React, Mongo DB, Docker, AWS, REST API

WORK EXPERIENCE
Senior Backend Engineer | TechCorp
Jan 2021 - Present
- Architected REST microservices using Node.js and Express handling 10k RPS.
- Designed distributed schemas and optimized queries in MongoDB.
- Containerized microservices with Docker and deployed them to AWS ECS.

Software Engineer | StartupX
Jan 2019 - Dec 2020
- Built backend APIs with Node.js and PostgreSQL.

EDUCATION
B.Tech in Computer Science, IIT Bombay, 2019

PROJECTS
Personal Cloud Storage: Distributed object storage built using Node.js and AWS S3.
"""

WEAK_RESUME = """
Jane Doe
jane.doe@example.com

SUMMARY
Passionate Graphic Designer and Digital Marketer.

SKILLS
Photoshop, Illustrator, SEO, Social Media, Content Writing

EXPERIENCE
Graphic Designer | Studio Art
Feb 2023 - Present
- Created marketing collateral and branding assets.

EDUCATION
B.A. in Graphic Design, 2022
"""

PARTIAL_RESUME = """
Alex Chen
alex.chen@example.com

SKILLS
JavaScript, Python, SQL, NoSQL

EXPERIENCE
Full Stack Developer | WebSolutions
Jan 2022 - Dec 2023
- Built web features with JavaScript and SQL databases.
"""


class TestPerson1Backend(unittest.TestCase):

    def test_01_skill_normalization_aliases(self):
        """Test NodeJS -> Node.js, Mongo DB -> MongoDB, RESTful API -> REST API"""
        self.assertEqual(normalize_skill("NodeJS"), "Node.js")
        self.assertEqual(normalize_skill("Node JS"), "Node.js")
        self.assertEqual(normalize_skill("node.js"), "Node.js")
        self.assertEqual(normalize_skill("Mongo DB"), "MongoDB")
        self.assertEqual(normalize_skill("mongodb"), "MongoDB")
        self.assertEqual(normalize_skill("RESTful API"), "REST API")
        self.assertEqual(normalize_skill("k8s"), "Kubernetes")

    def test_02_skill_normalization_fuzzy_typo(self):
        """Test typo tolerance without false positives on short strings"""
        self.assertEqual(normalize_skill("PostgreSql"), "PostgreSQL")
        self.assertIsNone(normalize_skill("go1234"))
        self.assertIsNone(normalize_skill("xyz"))

    def test_03_jd_parsing_categorization(self):
        """Test that JD parser categorizes Required, Preferred, Bonus, and Experience"""
        parsed_jd = parse_jd(SAMPLE_JD)
        self.assertIn("Node.js", parsed_jd["required_skills"])
        self.assertIn("Express", parsed_jd["required_skills"])
        self.assertIn("MongoDB", parsed_jd["required_skills"])

        self.assertIn("React", parsed_jd["preferred_skills"])
        self.assertIn("Docker", parsed_jd["preferred_skills"])

        self.assertIn("AWS", parsed_jd["bonus_skills"])
        self.assertGreaterEqual(parsed_jd["experience_requirements"]["min_years"], 3.0)

    def test_04_resume_parsing_structure(self):
        """Test structured resume extraction (name, contact, skills, experience duration)"""
        parsed_res = parse_resume(STRONG_RESUME)
        self.assertEqual(parsed_res["name"], "Rahul Sharma")
        self.assertEqual(parsed_res["email"], "rahul.sharma@example.com")
        self.assertIn("Node.js", parsed_res["skills"])
        self.assertIn("MongoDB", parsed_res["skills"])
        self.assertGreater(len(parsed_res["experience"]), 0)

    def test_05_singleton_model_loaded_once(self):
        """Verify SentenceTransformer model is loaded only once and cached"""
        model1 = get_embedding_model()
        model2 = get_embedding_model()
        self.assertIs(model1, model2)

    def test_06_bm25_scoring_and_bounds(self):
        """Test BM25 scoring is in [0, 1] and strong candidate beats weak candidate"""
        score_strong = compute_bm25_score(SAMPLE_JD, STRONG_RESUME)
        score_weak = compute_bm25_score(SAMPLE_JD, WEAK_RESUME)

        self.assertGreaterEqual(score_strong, 0.0)
        self.assertLessEqual(score_strong, 1.0)
        self.assertGreaterEqual(score_weak, 0.0)
        self.assertLessEqual(score_weak, 1.0)
        self.assertGreater(score_strong, score_weak)

    def test_07_semantic_matching_and_bounds(self):
        """Test local MiniLM semantic matching is in [0, 1] and differentiates candidates"""
        sim_strong = compute_semantic_similarity(SAMPLE_JD, STRONG_RESUME)
        sim_weak = compute_semantic_similarity(SAMPLE_JD, WEAK_RESUME)

        self.assertGreaterEqual(sim_strong, 0.0)
        self.assertLessEqual(sim_strong, 1.0)
        self.assertGreaterEqual(sim_weak, 0.0)
        self.assertLessEqual(sim_weak, 1.0)
        self.assertGreater(sim_strong, sim_weak)

    def test_08_skill_coverage_categorized(self):
        """Test Required, Preferred, and Bonus skill matching breakdowns"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_strong = parse_resume(STRONG_RESUME)
        req_matches, pref_matches, bonus_matches, cov = match_skills(parsed_jd, parsed_strong)

        self.assertEqual(set(req_matches), {"Node.js", "Express", "MongoDB"})
        self.assertEqual(cov, 1.0)
        self.assertIn("Docker", pref_matches)
        self.assertIn("AWS", bonus_matches)

        parsed_weak = parse_resume(WEAK_RESUME)
        w_req, w_pref, w_bonus, w_cov = match_skills(parsed_jd, parsed_weak)
        self.assertEqual(len(w_req), 0)
        self.assertEqual(w_cov, 0.0)

    def test_09_experience_matching(self):
        """Test experience duration scoring against JD min years"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_strong = parse_resume(STRONG_RESUME)
        exp_score = match_experience(parsed_jd, parsed_strong)

        self.assertGreaterEqual(exp_score, 0.9)
        self.assertLessEqual(exp_score, 1.0)

    def test_10_evidence_extraction_snippets(self):
        """Test that evidence snippets are non-empty, verbatim, and not invented"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_strong = parse_resume(STRONG_RESUME)
        req_matches, _, _, _ = match_skills(parsed_jd, parsed_strong)
        evidence = extract_evidence(req_matches, parsed_strong["raw_text"])

        self.assertEqual(len(evidence), len(req_matches))
        for ev in evidence:
            self.assertIn("skill", ev)
            self.assertEqual(ev["status"], "matched")
            self.assertGreater(len(ev["evidence"]), 5)
            self.assertTrue(any(part in ev["evidence"].lower() for part in ev["skill"].lower().split()))

    def test_11_analyze_candidate_data_contract(self):
        """Verify analyze_candidate returns EXACT Person 2 data contract keys and bounds"""
        result = analyze_candidate(SAMPLE_JD, STRONG_RESUME, candidate_id="C001")

        expected_keys = {
            "candidate_id",
            "name",
            "skills",
            "experience",
            "education",
            "projects",
            "required_matches",
            "preferred_matches",
            "bonus_matches",
            "bm25_score",
            "semantic_score",
            "skill_coverage",
            "experience_score",
            "evidence",
            "raw_text"
        }
        # Check all expected base keys exist
        self.assertTrue(expected_keys.issubset(set(result.keys())))
        self.assertEqual(result["candidate_id"], "C001")
        self.assertEqual(result["name"], "Rahul Sharma")

        for score_field in ["bm25_score", "semantic_score", "skill_coverage", "experience_score"]:
            val = result[score_field]
            self.assertIsInstance(val, float)
            self.assertGreaterEqual(val, 0.0, f"{score_field} < 0.0")
            self.assertLessEqual(val, 1.0, f"{score_field} > 1.0")

    def test_12_empty_and_malformed_inputs(self):
        """Verify pipeline handles empty inputs without crashing"""
        res_empty = analyze_candidate("", "", candidate_id="C_EMPTY")
        self.assertIsNotNone(res_empty)
        self.assertEqual(res_empty["bm25_score"], 0.0)
        self.assertEqual(res_empty["semantic_score"], 0.0)
        self.assertEqual(res_empty["skill_coverage"], 0.0)

        res_no_req = analyze_candidate("Job title without skills", STRONG_RESUME)
        self.assertIsNotNone(res_no_req)
        self.assertGreaterEqual(res_no_req["skill_coverage"], 0.0)

    def test_13_dynamic_matching_weights_default(self):
        """Verify default 40% semantic, 35% skill, 25% BM25 weighting"""
        score = calculate_weighted_match(
            semantic_score=0.80,
            skill_coverage=1.00,
            bm25_score=0.60
        )
        expected = 0.40 * 0.80 + 0.35 * 1.00 + 0.25 * 0.60  # 0.32 + 0.35 + 0.15 = 0.82
        self.assertAlmostEqual(score, expected, places=3)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_14_dynamic_matching_weights_custom(self):
        """Verify custom dynamic weights properly modify the resulting score"""
        # Semantic heavy: 80% semantic, 10% skills, 10% bm25
        score_sem_heavy = calculate_weighted_match(
            semantic_score=0.90,
            skill_coverage=0.20,
            bm25_score=0.20,
            semantic_weight=0.80,
            skill_weight=0.10,
            bm25_weight=0.10
        )
        # Skill heavy: 10% semantic, 80% skills, 10% bm25
        score_skill_heavy = calculate_weighted_match(
            semantic_score=0.90,
            skill_coverage=0.20,
            bm25_score=0.20,
            semantic_weight=0.10,
            skill_weight=0.80,
            bm25_weight=0.10
        )
        self.assertGreater(score_sem_heavy, score_skill_heavy)

    def test_15_dynamic_matching_weights_validation(self):
        """Verify negative weights or zero weights raise ValueError"""
        with self.assertRaises(ValueError):
            calculate_weighted_match(0.5, 0.5, 0.5, semantic_weight=-0.1)

        with self.assertRaises(ValueError):
            calculate_weighted_match(0.5, 0.5, 0.5, semantic_weight=0.0, skill_weight=0.0, bm25_weight=0.0)

    def test_16_detailed_skill_coverage_breakdown(self):
        """Verify detailed coverage calculation for required, preferred, bonus, and overall"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_strong = parse_resume(STRONG_RESUME)
        cov = compute_detailed_skill_coverage(parsed_jd, parsed_strong)

        self.assertIn("required_skill_coverage", cov)
        self.assertIn("preferred_skill_coverage", cov)
        self.assertIn("bonus_skill_coverage", cov)
        self.assertIn("overall_skill_coverage", cov)

        self.assertEqual(cov["required_skill_coverage"], 1.0)
        self.assertGreaterEqual(cov["preferred_skill_coverage"], 0.5)
        self.assertEqual(cov["bonus_skill_coverage"], 1.0)

    def test_17_evidence_statuses_matched_partial_missing(self):
        """Verify requirement evidence produces matched, partial, and missing statuses"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_partial = parse_resume(PARTIAL_RESUME)

        req_matches, pref_matches, bonus_matches, _ = match_skills(parsed_jd, parsed_partial)
        all_ev = extract_evidence(
            matched_skills=req_matches + pref_matches + bonus_matches,
            raw_resume_text=parsed_partial["raw_text"],
            jd_parsed=parsed_jd,
            candidate_skills=parsed_partial["skills"]
        )

        statuses = {ev["status"] for ev in all_ev}
        # Partial resume has JavaScript for Node.js requirement -> partial status
        self.assertIn("missing", statuses)
        self.assertTrue("matched" in statuses or "partial" in statuses)

    def test_18_multi_candidate_batch_processing(self):
        """Verify analyze_candidates processes a batch of resumes efficiently"""
        resumes = [STRONG_RESUME, WEAK_RESUME, PARTIAL_RESUME]
        batch_results = analyze_candidates(SAMPLE_JD, resumes)

        self.assertEqual(len(batch_results), 3)
        self.assertEqual(batch_results[0]["candidate_id"], "C001")
        self.assertEqual(batch_results[1]["candidate_id"], "C002")
        self.assertEqual(batch_results[2]["candidate_id"], "C003")

        # Verify candidate 1 scores higher on weighted_match_score than candidate 2
        self.assertGreater(batch_results[0]["weighted_match_score"], batch_results[1]["weighted_match_score"])

    def test_19_experience_relevance_discount(self):
        """Verify that unrelated experience receives lower score than relevant experience"""
        parsed_jd = parse_jd(SAMPLE_JD)
        parsed_strong = parse_resume(STRONG_RESUME)
        parsed_weak = parse_resume(WEAK_RESUME)

        exp_strong = match_experience(parsed_jd, parsed_strong)
        exp_weak = match_experience(parsed_jd, parsed_weak)

        self.assertGreater(exp_strong, exp_weak)

    def test_20_extended_p1_contract_fields(self):
        """Verify all extended P1 fields exist for Person 2 integration"""
        res = analyze_candidate(SAMPLE_JD, STRONG_RESUME, candidate_id="C100")

        extended_keys = [
            "required_skill_coverage",
            "preferred_skill_coverage",
            "bonus_skill_coverage",
            "overall_skill_coverage",
            "weighted_match_score",
            "match_components",
            "requirement_evidence"
        ]
        for k in extended_keys:
            self.assertIn(k, res)

        self.assertIsInstance(res["match_components"]["weights"], dict)
        self.assertGreater(res["weighted_match_score"], 0.0)
        self.assertLessEqual(res["weighted_match_score"], 100.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
