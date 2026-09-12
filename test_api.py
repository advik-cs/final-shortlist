"""
Integration Tests for FastAPI REST Server.
100% Local Execution | Zero External APIs | Zero API Keys Required.
"""

import unittest
import io
from fastapi.testclient import TestClient
from server import app
from backend.sample_data import SAMPLE_JD, SAMPLE_CANDIDATES


class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["zero_external_api"])
        self.assertTrue(data["models_loaded"])

    def test_parse_jd_text(self):
        response = self.client.post("/api/jd/parse", data={"text": SAMPLE_JD})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("jd_parsed", data)
        self.assertIn("bias_report", data)
        jd_parsed = data["jd_parsed"]
        self.assertIn("Node.js", jd_parsed["required_skills"])
        self.assertIn("Express", jd_parsed["required_skills"])

    def test_parse_jd_empty_error(self):
        response = self.client.post("/api/jd/parse", data={"text": "   "})
        self.assertEqual(response.status_code, 400)

    def test_sample_data_endpoint(self):
        response = self.client.get("/api/sample-data")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("candidates", data)
        self.assertIn("jd_parsed", data)
        self.assertIn("bias_report", data)
        self.assertGreater(len(data["candidates"]), 0)
        # Check first candidate has valid metrics
        top = data["candidates"][0]
        self.assertIn("final_score", top)
        self.assertIn("confidence", top)
        self.assertIn("rank", top)

    def test_analyze_candidates_endpoint(self):
        # Prepare two synthetic resume files
        files = [
            ("resumes", ("rahul_resume.txt", io.BytesIO(SAMPLE_CANDIDATES[0]["text"].encode("utf-8")), "text/plain")),
            ("resumes", ("priya_resume.txt", io.BytesIO(SAMPLE_CANDIDATES[1]["text"].encode("utf-8")), "text/plain"))
        ]
        response = self.client.post(
            "/api/candidates/analyze",
            data={"jd_text": SAMPLE_JD},
            files=files
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 2)
        candidates = data["candidates"]
        self.assertEqual(len(candidates), 2)
        self.assertEqual(candidates[0]["rank"], 1)
        self.assertEqual(candidates[1]["rank"], 2)

    def test_rerank_endpoint(self):
        sample_resp = self.client.get("/api/sample-data").json()
        cands = sample_resp["candidates"]
        jd_parsed = sample_resp["jd_parsed"]

        # Shift weights to 80% BM25 keyword
        response = self.client.post(
            "/api/candidates/rerank",
            json={
                "candidates": cands,
                "weights": {"semantic_weight": 0.1, "skill_weight": 0.1, "bm25_weight": 0.8},
                "jd_parsed": jd_parsed
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("candidates", data)
        self.assertEqual(len(data["candidates"]), len(cands))

    def test_compare_endpoint(self):
        sample_resp = self.client.get("/api/sample-data").json()
        cands = sample_resp["candidates"]
        jd_parsed = sample_resp["jd_parsed"]

        response = self.client.post(
            "/api/candidates/compare",
            json={
                "candidate_a": cands[0],
                "candidate_b": cands[1],
                "jd_parsed": jd_parsed
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("differentiator_sentence", data)
        self.assertIn("score_a", data)
        self.assertIn("score_b", data)

    def test_qa_endpoint(self):
        sample_resp = self.client.get("/api/sample-data").json()
        cands = sample_resp["candidates"]
        jd_parsed = sample_resp["jd_parsed"]

        response = self.client.post(
            "/api/qa",
            json={
                "query": "Who knows MongoDB?",
                "candidates": cands,
                "jd_parsed": jd_parsed
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("query", data)
        self.assertIn("answer", data)
        self.assertIn("MONGODB", data["answer"].upper())


if __name__ == "__main__":
    unittest.main()
