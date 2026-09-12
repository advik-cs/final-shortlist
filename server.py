"""
InternLoom — FastAPI REST API Server.
Wraps Person 1 & Person 2 Local Document Intelligence & Ranking Engines.
100% Local Execution | Zero External APIs | Zero API Keys Required.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.pipeline import analyze_candidate, analyze_candidates
from backend.jd_parser import parse_jd
from backend.resume_parser import parse_resume
from backend.pdf_extractor import extract_pdf_text
from backend.ranking import (
    DEFAULT_WEIGHTS,
    rank_candidates,
    compare_candidates,
    answer_recruiter_query,
    detect_jd_bias
)

# Sample JD & Resumes for Instant 1-Click Verification
from backend.sample_data import SAMPLE_JD, SAMPLE_CANDIDATES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("internloom.server")

app = FastAPI(
    title="InternLoom Local API",
    description="100% Local Recruiter Intelligence & Resume Matching API. Zero external AI dependencies.",
    version="1.0.0"
)

# Configure CORS
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class JDPayload(BaseModel):
    text: str


class RerankRequest(BaseModel):
    candidates: List[Dict[str, Any]]
    weights: Optional[Dict[str, float]] = None
    jd_parsed: Optional[Dict[str, Any]] = None


class CompareRequest(BaseModel):
    candidate_a: Dict[str, Any]
    candidate_b: Dict[str, Any]
    jd_parsed: Optional[Dict[str, Any]] = None


class QARequest(BaseModel):
    query: str
    candidates: List[Dict[str, Any]]
    jd_parsed: Optional[Dict[str, Any]] = None


# Endpoints
@app.get("/api/health")
def health_check():
    """Confirms service is up and completely independent of external AI."""
    return {
        "status": "ok",
        "service": "InternLoom P1 Backend",
        "models_loaded": True,
        "zero_external_api": True
    }


@app.post("/api/jd/parse")
async def parse_job_description(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Parses a Job Description from an uploaded PDF file or raw text string.
    Runs local regex/heuristic section parser and bias detector.
    """
    raw_text = ""
    filename = "Job_Description.pdf"
    file_size_str = "Unknown"

    if file is not None:
        filename = file.filename or "Job_Description.pdf"
        file_bytes = await file.read()
        file_size_str = f"{round(len(file_bytes) / 1024, 1)} KB"
        try:
            raw_text = extract_pdf_text(file_bytes)
        except Exception as err:
            logger.error(f"Failed to parse JD PDF: {err}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to extract text from PDF '{filename}': {str(err)}"
            )
    elif text:
        raw_text = text.strip()
        filename = "pasted_job_description.txt"
        file_size_str = f"{len(raw_text.encode('utf-8'))} B"

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in the provided Job Description."
        )

    jd_parsed = parse_jd(raw_text)
    bias_report = detect_jd_bias(raw_text, jd_parsed=jd_parsed)

    return {
        "jd_parsed": jd_parsed,
        "bias_report": bias_report,
        "filename": filename,
        "file_size": file_size_str
    }


@app.post("/api/candidates/analyze")
async def analyze_candidates_endpoint(
    resumes: List[UploadFile] = File(...),
    jd_text: Optional[str] = Form(None),
    jd_json: Optional[str] = Form(None),
    weights: Optional[str] = Form(None)
):
    """
    Full Person 1 & 2 pipeline:
    1. Extracts text from each uploaded PDF resume via pdfplumber.
    2. Parses candidate structure (name, experience, skills, education).
    3. Runs Person 1 unified matching (BM25 + all-MiniLM-L6-v2 + skill taxonomy + evidence).
    4. Runs Person 2 ranking and explanation generation.
    Returns real structured candidate data contract.
    """
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one resume file must be uploaded."
        )

    # Resolve JD
    jd_parsed = None
    if jd_json:
        try:
            jd_parsed = json.loads(jd_json)
        except Exception:
            pass

    if not jd_parsed and jd_text:
        jd_parsed = parse_jd(jd_text)

    if not jd_parsed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid Job Description (jd_json or jd_text) is required for matching."
        )

    # Resolve Weights
    parsed_weights = None
    if weights:
        try:
            parsed_weights = json.loads(weights)
        except Exception:
            parsed_weights = None

    active_weights = parsed_weights or DEFAULT_WEIGHTS

    parsed_resumes = []
    file_metadata = []

    for idx, r_file in enumerate(resumes):
        fname = r_file.filename or f"resume_{idx+1}.pdf"
        r_bytes = await r_file.read()
        fsize = f"{round(len(r_bytes) / 1024, 1)} KB"

        try:
            extracted_text = extract_pdf_text(r_bytes)
            if not extracted_text.strip():
                # Fallback to UTF-8 decoding if plain text
                extracted_text = r_bytes.decode("utf-8", errors="ignore")
        except Exception as err:
            logger.warning(f"Failed to extract text from {fname}: {err}")
            extracted_text = ""

        if not extracted_text.strip():
            extracted_text = f"Candidate from {fname}"

        p_resume = parse_resume(extracted_text)
        if p_resume.get("name") in ["Candidate", ""] and fname:
            base_name = fname.replace(".pdf", "").replace("_", " ").replace("-", " ")
            p_resume["name"] = base_name.title()

        parsed_resumes.append(p_resume)
        file_metadata.append({"filename": fname, "file_size": fsize})

    # Run Person 1 Unified Pipeline
    cids = [f"C{i+1:03d}" for i in range(len(parsed_resumes))]
    analyzed = analyze_candidates(
        jd_parsed,
        parsed_resumes,
        candidate_ids=cids,
        weights=active_weights
    )

    # Run Person 2 Ranking & Explanations
    ranked = rank_candidates(analyzed, weights=active_weights, jd_parsed=jd_parsed)

    # Attach file metadata to corresponding candidates
    for i, cand in enumerate(ranked):
        # find matching meta by candidate_id
        for orig_idx, orig_cid in enumerate(cids):
            if cand.get("candidate_id") == orig_cid:
                cand["resume_filename"] = file_metadata[orig_idx]["filename"]
                cand["resume_size"] = file_metadata[orig_idx]["file_size"]
                break

    return {
        "candidates": ranked,
        "jd_parsed": jd_parsed,
        "total": len(ranked)
    }


@app.post("/api/candidates/rerank")
def rerank_endpoint(req: RerankRequest):
    """Recalculates scores & rankings dynamically using recruiter-adjusted weights."""
    if not req.candidates:
        return {"candidates": []}

    active_weights = req.weights or DEFAULT_WEIGHTS
    ranked = rank_candidates(req.candidates, weights=active_weights, jd_parsed=req.jd_parsed)
    return {"candidates": ranked}


@app.post("/api/candidates/compare")
def compare_endpoint(req: CompareRequest):
    """Compares Candidate A vs Candidate B and produces differentiator statement."""
    comparison = compare_candidates(req.candidate_a, req.candidate_b, jd_parsed=req.jd_parsed)
    return comparison


@app.post("/api/qa")
def qa_endpoint(req: QARequest):
    """Answers recruiter queries deterministically using verified backend evidence."""
    answer = answer_recruiter_query(req.query, req.candidates, jd_parsed=req.jd_parsed)
    return {
        "query": req.query,
        "answer": answer
    }


@app.get("/api/sample-data")
def sample_data_endpoint():
    """
    Dynamically executes Person 1 & Person 2 local pipelines on sample JD and resumes.
    Guarantees REAL local calculation rather than static mocks.
    """
    jd_parsed = parse_jd(SAMPLE_JD)
    bias_report = detect_jd_bias(SAMPLE_JD, jd_parsed=jd_parsed)

    resumes_text = [c["text"] for c in SAMPLE_CANDIDATES]
    cids = [c["id"] for c in SAMPLE_CANDIDATES]

    analyzed = analyze_candidates(jd_parsed, resumes_text, candidate_ids=cids)
    ranked = rank_candidates(analyzed, jd_parsed=jd_parsed)

    for i, cand in enumerate(ranked):
        cand["resume_filename"] = f"{cand['name'].lower().replace(' ', '_')}_resume.pdf"
        cand["resume_size"] = "18 KB"

    return {
        "jd_parsed": jd_parsed,
        "bias_report": bias_report,
        "candidates": ranked,
        "filename": "Sample_Backend_Engineer_JD.pdf",
        "file_size": "4 KB"
    }


# Mount built frontend for combined single-port full-stack execution
dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        target_file = os.path.join(dist_dir, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("server:app", host=host, port=port, reload=True)
