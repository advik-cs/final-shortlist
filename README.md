# InternLoom — Intelligent Candidate Shortlisting & Resume Matching Platform

InternLoom is a 100% local, full-stack recruitment intelligence engine and resume matching platform. It combines lexical retrieval (BM25), semantic sentence embeddings (`all-MiniLM-L6-v2`), deterministic skill taxonomy extraction, and rule-based candidate ranking with zero external AI APIs and zero API keys.

---

## Key Features

- **100% Local & Privacy-Preserving**: All NLP, sentence embeddings, BM25 indexing, and scoring run locally on CPU/hardware. Zero data leaves your machine.
- **Zero API Keys Required**: No OpenAI, Gemini, Claude, Groq, or Hugging Face API keys needed.
- **Real PDF Ingestion Pipeline**: Extracts structured text from multi-page PDF Job Descriptions and candidate resumes via `pdfplumber`.
- **Hybrid Matching Engine (Person 1)**:
  - Lexical keyword matching with BM25 (`rank-bm25`)
  - Semantic contextual matching using `sentence-transformers/all-MiniLM-L6-v2`
  - Normalized skill taxonomy mapping (required, preferred, bonus)
  - Contextual experience duration and scale matching
  - Verbatim grounding evidence extraction (zero-hallucination citations)
- **Recruiter Intelligence & Ranking (Person 2)**:
  - Multi-dimensional candidate ranking and leaderboard
  - Dynamic recruiter weighting (semantic vs keyword vs skill balance)
  - Confidence scoring with explicit rationale
  - Head-to-head candidate comparison with comparative differentiators
  - Deterministic Recruiter Q&A console
  - Job Description bias and inclusiveness audit
- **Modern Responsive Frontend**: Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Motion.

---

## Architecture Overview

```
├── backend/                      # Core Person 1 & Person 2 Local Python Modules
│   ├── jd_parser.py              # Rule-based job description parser
│   ├── matcher.py                # BM25 & sentence-transformers matching logic
│   ├── normalizer.py             # Skill normalization & taxonomy dictionary
│   ├── pdf_extractor.py          # PDF text extraction with pdfplumber
│   ├── pipeline.py               # Unified Person 1 matching pipeline
│   ├── ranking.py                # Person 2 ranking, confidence & explanations
│   ├── resume_parser.py          # Resume section segmentation & metadata extraction
│   └── sample_data.py            # Sample candidate pool for instant demo
├── frontend/                     # React 19 + Vite + Tailwind v4 Single-Page Application
│   ├── src/
│   │   ├── components/           # UI components (Upload, Dashboard, Profile, Compare, Q&A)
│   │   ├── services/
│   │   │   ├── api.ts            # Centralized typed API client
│   │   │   └── adapter.ts        # Real backend-to-UI data normalization
│   │   ├── App.tsx               # Fullstack state management & view router
│   │   └── types.ts              # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── server.py                     # FastAPI REST server with CORS & static asset serving
├── test_backend.py               # Unit test suite for Person 1 pipeline
├── test_p2.py                    # Unit test suite for Person 2 ranking
├── test_api.py                   # API integration test suite
├── requirements.txt              # Backend dependencies
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the FastAPI server:
   ```bash
   python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
   ```
   - REST API: `http://localhost:8000`
   - Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup

1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Web Application: `http://localhost:3000`

---

## Combined Production Mode (Single Port)

You can also run the entire full-stack application on a single port (`http://localhost:8000`):

1. Build the frontend bundle:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
2. Start the backend:
   ```bash
   python -m uvicorn server:app --host 0.0.0.0 --port 8000
   ```
3. Open **`http://localhost:8000`** in your browser. FastAPI automatically serves the React UI at the root `/` and all API endpoints at `/api/...`.

---

## Running Tests

Run the full automated test suite (35 tests):
```bash
python -m unittest test_backend.py test_p2.py test_api.py
```

---

## License

MIT
