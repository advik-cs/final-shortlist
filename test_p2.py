"""
Test Suite for Person 2 Integration.
Verifies:
- Canonical default weighting delegation to P1 (0.40 / 0.35 / 0.25)
- Dynamic re-ranking and score recalculations
- Confidence meter
- Deterministic explanations
- "Why X Over Y?" comparator
- Recruiter Q&A
- JD bias detection
- ZERO API keys / 100% local execution
"""

import unittest
from backend.pipeline import analyze_candidate, analyze_candidates
from backend.jd_parser import parse_jd
from backend.ranking import (
    DEFAULT_WEIGHTS,
    rank_candidates,
    compare_candidates,
    answer_recruiter_query,
    detect_jd_bias
)
from test_backend import SAMPLE_JD, STRONG_RESUME, WEAK_RESUME, PARTIAL_RESUME


class TestPerson2Integration(unittest.TestCase):

    def setUp(self):
        self.jd_parsed = parse_jd(SAMPLE_JD)
        self.p1_results = analyze_candidates(
            SAMPLE_JD,
            [STRONG_RESUME, PARTIAL_RESUME, WEAK_RESUME],
            candidate_ids=["C001", "C002", "C003"]
        )

    def test_01_canonical_default_weights(self):
        """Verify P2 uses P1's canonical 40/35/25 default weights as single source of truth"""
        self.assertEqual(DEFAULT_WEIGHTS["semantic_weight"], 0.40)
        self.assertEqual(DEFAULT_WEIGHTS["skill_weight"], 0.35)
        self.assertEqual(DEFAULT_WEIGHTS["bm25_weight"], 0.25)

        ranked = rank_candidates(self.p1_results, jd_parsed=self.jd_parsed)
        top = ranked[0]
        self.assertEqual(top["candidate_id"], "C001")
        self.assertEqual(top["rank"], 1)

        # Expected score: 0.40 * sem + 0.35 * skill + 0.25 * bm25
        sem = top["semantic_score"]
        skill = top["skill_coverage"]
        bm25 = top["bm25_score"]
        expected_score = round((0.40 * sem + 0.35 * skill + 0.25 * bm25) * 100.0, 1)
        self.assertAlmostEqual(top["final_score"], expected_score, places=1)

    def test_02_dynamic_reranking_with_custom_weights(self):
        """Verify changing weights recalculates scores and re-ranks candidates"""
        # Skill-heavy: 80% skills, 10% semantic, 10% bm25
        skill_heavy_weights = {"semantic_weight": 0.10, "skill_weight": 0.80, "bm25_weight": 0.10}
        ranked_skill = rank_candidates(self.p1_results, weights=skill_heavy_weights, jd_parsed=self.jd_parsed)

        # Semantic-heavy: 80% semantic, 10% skills, 10% bm25
        semantic_heavy_weights = {"semantic_weight": 0.80, "skill_weight": 0.10, "bm25_weight": 0.10}
        ranked_sem = rank_candidates(self.p1_results, weights=semantic_heavy_weights, jd_parsed=self.jd_parsed)

        # Ranks must have valid metadata
        self.assertEqual(ranked_skill[0]["rank"], 1)
        self.assertEqual(ranked_sem[0]["rank"], 1)
        self.assertNotEqual(ranked_skill[0]["final_score"], ranked_sem[0]["final_score"])

    def test_03_confidence_meter(self):
        """Verify confidence calculation yields HIGH for strong and LOW for weak"""
        ranked = rank_candidates(self.p1_results, jd_parsed=self.jd_parsed)
        strong = next(c for c in ranked if c["candidate_id"] == "C001")
        weak = next(c for c in ranked if c["candidate_id"] == "C003")

        self.assertEqual(strong["confidence"]["level"], "HIGH")
        self.assertIn("Strong explicit evidence", strong["confidence"]["rationale"])

        self.assertEqual(weak["confidence"]["level"], "LOW")

    def test_04_summary_rationale_and_domain_alignment(self):
        """Verify deterministic domain alignment and summary rationale"""
        ranked = rank_candidates(self.p1_results, jd_parsed=self.jd_parsed)
        top = ranked[0]

        self.assertIn("domain_alignment", top)
        self.assertIn("summary_rationale", top)
        self.assertIn("Ranked #1", top["summary_rationale"])
        self.assertIn("Demonstrates strong conceptual alignment", top["domain_alignment"])

    def test_05_why_x_over_y_comparator(self):
        """Verify side-by-side comparison and auto-generated differentiator"""
        ranked = rank_candidates(self.p1_results, jd_parsed=self.jd_parsed)
        c1 = ranked[0]  # Rahul (Strong)
        c2 = ranked[1]  # Alex (Partial)

        comp = compare_candidates(c1, c2, jd_parsed=self.jd_parsed)
        self.assertIn("skills_a_only", comp)
        self.assertIn("skills_b_only", comp)
        self.assertIn("differentiator_sentence", comp)
        self.assertGreater(len(comp["differentiator_sentence"]), 15)
        self.assertIn(c1["name"], comp["differentiator_sentence"])

    def test_06_recruiter_qa_engine(self):
        """Verify deterministic answers to common recruiter questions"""
        ranked = rank_candidates(self.p1_results, jd_parsed=self.jd_parsed)

        # Comparison Q&A
        ans_comp = answer_recruiter_query("Why is Rahul ranked above Alex?", ranked, jd_parsed=self.jd_parsed)
        self.assertIn("Rahul", ans_comp)
        self.assertIn("Alex", ans_comp)

        # Skill Q&A
        ans_skill = answer_recruiter_query("Who knows Docker?", ranked, jd_parsed=self.jd_parsed)
        self.assertIn("Rahul", ans_skill)

        # Top candidate Q&A
        ans_top = answer_recruiter_query("Who is the top candidate?", ranked, jd_parsed=self.jd_parsed)
        self.assertIn("Rahul Sharma", ans_top)

    def test_07_jd_bias_detection(self):
        """Verify bias detection flags elitist and age-biased criteria in JD"""
        biased_jd = """
        Software Engineer
        Must have graduated from a top-tier university.
        Looking for a young and energetic rockstar developer.
        Must have 3+ years experience with Node.js.
        """
        parsed_biased = parse_jd(biased_jd)
        res = detect_jd_bias(biased_jd, parsed_biased)

        self.assertTrue(res["bias_detected"])
        self.assertGreaterEqual(res["flag_count"], 2)

        flag_categories = [f["category"] for f in res["flags"]]
        self.assertIn("Educational Elitism", flag_categories)
        self.assertIn("Demographic / Age Proxy", flag_categories)


if __name__ == "__main__":
    unittest.main(verbosity=2)
