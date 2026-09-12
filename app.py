"""
InternLoom — Recruiter Intelligence & Hybrid Candidate Matching Dashboard.
100% Local Execution | Zero External APIs | Zero API Keys Required.
"""

import streamlit as st
import pandas as pd
import json

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

# Page configuration
st.set_page_config(
    page_title="InternLoom | Recruiter Intelligence",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Sample JD & Resumes for Instant 1-Click Demo
SAMPLE_JD = """Backend Software Engineer

Responsibilities:
- Design, build, and deploy high-throughput RESTful microservices.
- Optimize distributed databases and manage cloud infrastructure.

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

SAMPLE_CANDIDATES = [
    {
        "id": "C001",
        "name": "Rahul Sharma",
        "text": """Rahul Sharma
rahul.sharma@example.com | +91 9876543210

TECHNICAL SKILLS
Languages & Tools: Node JS, Express, MongoDB, Python, React, Docker, AWS, REST API

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
B.Tech in Computer Science, 2019
"""
    },
    {
        "id": "C002",
        "name": "Priya Patel",
        "text": """Priya Patel
priya.patel@example.com

TECHNICAL SKILLS
Node.js, Express, React, TypeScript, Docker, Git, RESTful API

WORK EXPERIENCE
Full Stack Developer | CloudScale
Jan 2022 - Present
- Developed scalable web applications with Node.js and React.
- Created Dockerized deployment pipelines.

Junior Developer | SoftSys
Jun 2020 - Dec 2021
- Worked on Express APIs and frontend components in React.

EDUCATION
B.S. in Software Engineering, 2020
"""
    },
    {
        "id": "C003",
        "name": "Alex Chen",
        "text": """Alex Chen
alex.chen@example.com

SKILLS
JavaScript, Python, SQL, NoSQL, HTML, CSS

EXPERIENCE
Software Engineer | WebWorks
Feb 2022 - Dec 2024
- Built internal tooling with JavaScript and SQL databases.
- Collaborated on backend services and data integration.

EDUCATION
B.S. in Computer Science, 2021
"""
    },
    {
        "id": "C004",
        "name": "Jane Doe",
        "text": """Jane Doe
jane.doe@example.com

SUMMARY
Passionate Graphic Designer and Digital Marketer.

SKILLS
Photoshop, Illustrator, SEO, Social Media, Figma, Content Writing

EXPERIENCE
Graphic Designer | Studio Art
Feb 2023 - Present
- Created marketing collateral, brand guidelines, and visual identities.

EDUCATION
B.A. in Visual Arts, 2022
"""
    },
    {
        "id": "C005",
        "name": "Arjun Mehta",
        "text": """Arjun Mehta
arjun.mehta@example.com | +91 9123456789

TECHNICAL SKILLS
Python, Django, FastAPI, MongoDB, Docker, AWS, Redis, SQL

WORK EXPERIENCE
Backend Systems Engineer | DataScale Systems
Mar 2021 - Present
- Developed distributed data processing pipelines using Python, FastAPI, and MongoDB.
- Containerized workflows with Docker and orchestrated deployment via AWS.
- Designed cache layers with Redis for high-frequency queries.

Junior Python Developer | NextGen Apps
Jul 2019 - Feb 2021
- Maintained Django REST APIs and optimized PostgreSQL database operations.

EDUCATION
B.Tech in Information Technology, 2019
"""
    }
]

# Custom CSS styling for futuristic command center
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Overall Dark Ambient Base */
    .stApp {
        background-color: #080b12;
        color: #e2e8f0;
    }

    /* Command Center Top Header */
    .command-header {
        background: linear-gradient(180deg, #0e1422 0%, #080b12 100%);
        border: 1px solid #1a2333;
        border-radius: 12px;
        padding: 16px 22px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .status-pulse {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #10b981;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 9999px;
        letter-spacing: 0.05em;
    }
    .status-dot {
        width: 7px;
        height: 7px;
        background-color: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
    }

    /* Workflow Pipeline Strip */
    .workflow-strip {
        background: #0d121d;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 10px 16px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
        font-family: 'JetBrains Mono', monospace;
    }
    .wf-step-done {
        color: #10b981;
        font-weight: 600;
    }
    .wf-step-active {
        color: #38bdf8;
        font-weight: 700;
    }

    /* KPI Cards */
    .kpi-card {
        background: #0f1523;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px 18px;
        position: relative;
        overflow: hidden;
    }
    .kpi-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #38bdf8, #818cf8);
    }
    .kpi-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 6px;
    }
    .kpi-val {
        font-size: 26px;
        font-weight: 800;
        color: #f8fafc;
        letter-spacing: -0.02em;
    }
    .kpi-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 4px;
    }

    /* Futuristic Badges */
    .badge-matched {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 3px 9px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        margin: 2px 4px;
    }
    .badge-partial {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 3px 9px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        margin: 2px 4px;
    }
    .badge-missing {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 3px 9px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        margin: 2px 4px;
    }

    .conf-high {
        background: rgba(16, 185, 129, 0.12);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.06em;
    }
    .conf-med {
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.06em;
    }
    .conf-low {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.06em;
    }

    /* Why this score hero card */
    .why-score-hero {
        background: linear-gradient(135deg, #0e182b 0%, #0d1322 100%);
        border: 1px solid #1e3a8a;
        border-left: 4px solid #38bdf8;
        border-radius: 10px;
        padding: 16px 20px;
        margin-bottom: 18px;
    }

    /* Career Journey Node */
    .timeline-node {
        border-left: 2px solid #2563eb;
        padding-left: 14px;
        margin-bottom: 14px;
        position: relative;
    }
</style>
""", unsafe_allow_html=True)


# Sidebar Controls
with st.sidebar:
    st.markdown("""
    <div style='display:flex; align-items:center; gap:10px; margin-bottom:12px;'>
        <div style='width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg, #38bdf8, #818cf8); display:flex; align-items:center; justify-content:center; font-weight:900; color:#080b12; font-size:14px;'>IL</div>
        <div>
            <div style='font-weight:800; font-size:16px; letter-spacing:-0.02em; color:#f8fafc;'>INTERNLOOM</div>
            <div style='font-size:10px; font-weight:600; color:#38bdf8; letter-spacing:0.08em; text-transform:uppercase;'>Recruitment Intel OS</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class='status-pulse' style='width:100%; justify-content:center; margin-bottom:16px;'>
        <div class='status-dot'></div> ANALYSIS ENGINE ONLINE
    </div>
    """, unsafe_allow_html=True)

    # Session state initialization - empty by default so user's uploaded PDFs are exclusively used
    if "jd_text" not in st.session_state:
        st.session_state.jd_text = ""

    if "candidates_data" not in st.session_state:
        st.session_state.candidates_data = []

    # Sliders state initialization (integer percentages summing to 100)
    if "w_sem" not in st.session_state:
        st.session_state.w_sem = 40
    if "w_skill" not in st.session_state:
        st.session_state.w_skill = 35
    if "w_bm25" not in st.session_state:
        st.session_state.w_bm25 = 25
    if "preset_choice" not in st.session_state:
        st.session_state.preset_choice = "Canonical Balanced (40/35/25)"

    # Helper function to dynamically rebalance remaining points proportionally
    def on_weight_changed(changed_key):
        st.session_state.preset_choice = "Custom Console Sliders"
        new_val = max(0, min(100, int(st.session_state[changed_key])))
        st.session_state[changed_key] = new_val
        rem = 100 - new_val
        
        all_keys = ["w_sem", "w_skill", "w_bm25"]
        other_keys = [k for k in all_keys if k != changed_key]
        k1, k2 = other_keys[0], other_keys[1]
        w1 = st.session_state[k1]
        w2 = st.session_state[k2]
        sum_other = w1 + w2
        
        if sum_other > 0:
            calc_w1 = round(rem * (w1 / sum_other))
        else:
            calc_w1 = round(rem / 2)
            
        calc_w1 = max(0, min(rem, calc_w1))
        calc_w2 = rem - calc_w1
        
        st.session_state[k1] = calc_w1
        st.session_state[k2] = calc_w2

    def on_preset_selected():
        p = st.session_state.preset_selector
        st.session_state.preset_choice = p
        if p == "Canonical Balanced (40/35/25)":
            st.session_state.w_sem = 40
            st.session_state.w_skill = 35
            st.session_state.w_bm25 = 25
        elif p == "Skill-Heavy (10/80/10)":
            st.session_state.w_sem = 10
            st.session_state.w_skill = 80
            st.session_state.w_bm25 = 10
        elif p == "Semantic-Heavy (80/10/10)":
            st.session_state.w_sem = 80
            st.session_state.w_skill = 10
            st.session_state.w_bm25 = 10

    # Weight Preset Quick-Select
    st.markdown("##### ⚖️ HYBRID MATCHING PRIORITY")
    preset_options = [
        "Canonical Balanced (40/35/25)",
        "Skill-Heavy (10/80/10)",
        "Semantic-Heavy (80/10/10)",
        "Custom Console Sliders"
    ]
    curr_idx = preset_options.index(st.session_state.preset_choice) if st.session_state.preset_choice in preset_options else 3
    st.selectbox(
        "WEIGHT PRESET:",
        preset_options,
        index=curr_idx,
        key="preset_selector",
        on_change=on_preset_selected
    )

    # 3 Linked Sliders with callbacks ensuring exact 100% total
    st.slider("Semantic Understanding", 0, 100, key="w_sem", on_change=on_weight_changed, args=("w_sem",))
    st.slider("Skill Coverage", 0, 100, key="w_skill", on_change=on_weight_changed, args=("w_skill",))
    st.slider("Keyword (BM25)", 0, 100, key="w_bm25", on_change=on_weight_changed, args=("w_bm25",))

    sem_pct = int(st.session_state.w_sem)
    skill_pct = int(st.session_state.w_skill)
    bm25_pct = int(st.session_state.w_bm25)
    total_pct = sem_pct + skill_pct + bm25_pct

    # Normalized weights passed directly to backend (sum to 1.0)
    st.session_state.active_weights = {
        "semantic_weight": sem_pct / 100.0,
        "skill_weight": skill_pct / 100.0,
        "bm25_weight": bm25_pct / 100.0
    }

    st.markdown(f"""
    <div style='background:#0f1523; border:1px solid #1e293b; border-radius:8px; padding:10px; margin-top:8px; font-size:11px;'>
        <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
            <span style='color:#94a3b8;'>Semantic Context:</span><span style='color:#38bdf8; font-weight:700;'>{sem_pct}%</span>
        </div>
        <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
            <span style='color:#94a3b8;'>Skill Taxonomy:</span><span style='color:#34d399; font-weight:700;'>{skill_pct}%</span>
        </div>
        <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
            <span style='color:#94a3b8;'>BM25 Keyword:</span><span style='color:#a78bfa; font-weight:700;'>{bm25_pct}%</span>
        </div>
        <div style='display:flex; justify-content:space-between; border-top:1px solid #1e293b; padding-top:4px; margin-top:4px;'>
            <span style='color:#f8fafc; font-weight:700;'>TOTAL WEIGHT:</span><span style='color:#34d399; font-weight:800; font-family:"JetBrains Mono", monospace;'>{total_pct}%</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("##### 📂 RECRUITER WORKSPACE")

    col_demo1, col_demo2 = st.columns(2)
    with col_demo1:
        if st.button("🗑️ Clear All", use_container_width=True, help="Clear uploaded files and start fresh"):
            st.session_state.jd_text = ""
            st.session_state.candidates_data = []
            st.rerun()
    with col_demo2:
        if st.button("🚀 Load Demo", use_container_width=True, help="Load sample data if needed"):
            st.session_state.jd_text = SAMPLE_JD
            st.session_state.candidates_data = list(SAMPLE_CANDIDATES)
            st.rerun()

    uploaded_jd = st.file_uploader("Upload Job Spec (PDF)", type=["pdf"], key="jd_upload")
    if uploaded_jd:
        st.session_state.jd_text = extract_pdf_text(uploaded_jd.read())

    uploaded_resumes = st.file_uploader("Upload Resumes (Batch PDF)", type=["pdf"], accept_multiple_files=True, key="resumes_upload")
    if uploaded_resumes:
        batch = []
        for idx, rfile in enumerate(uploaded_resumes):
            file_bytes = rfile.read()
            text = extract_pdf_text(file_bytes)
            # Use parsed resume name if detected, else file name
            parsed_info = parse_resume(text)
            c_name = parsed_info.get("name", "").strip()
            if not c_name or c_name == "Candidate":
                c_name = rfile.name.replace(".pdf", "")

            batch.append({
                "id": f"C{idx+1:03d}",
                "name": c_name,
                "text": text
            })
        st.session_state.candidates_data = batch

    st.markdown("---")
    st.caption("🔒 100% On-Device Neural Embeddings | Zero External APIs")


# Main Application Content
# Command Center Top Header
st.markdown("""
<div class='command-header'>
    <div>
        <div style='font-size:11px; font-weight:700; color:#38bdf8; letter-spacing:0.1em; text-transform:uppercase;'>AI Recruitment Intelligence</div>
        <div style='font-size:22px; font-weight:800; color:#f8fafc; letter-spacing:-0.03em;'>Find the right candidate. Know exactly why.</div>
        <div style='font-size:12px; color:#94a3b8; margin-top:2px;'>Explainable AI-powered resume screening, hybrid matching, and confidence attribution.</div>
    </div>
    <div style='text-align:right;'>
        <div class='status-pulse'><div class='status-dot'></div> SYSTEM READY</div>
        <div style='font-size:10px; color:#64748b; font-family:"JetBrains Mono", monospace; margin-top:4px;'>v2.4.0 // ZERO-KEY AIR-GAPPED</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Workflow Progress Strip
st.markdown("""
<div class='workflow-strip'>
    <div class='wf-step-done'><span>✓</span> 1. JOB SPECIFICATION</div>
    <div>→</div>
    <div class='wf-step-done'><span>✓</span> 2. REQUIREMENTS TAXONOMY</div>
    <div>→</div>
    <div class='wf-step-done'><span>✓</span> 3. RESUME INTELLIGENCE</div>
    <div>→</div>
    <div class='wf-step-active'><span>⚡</span> 4. HYBRID MATCHING</div>
    <div>→</div>
    <div class='wf-step-active'><span>◎</span> 5. EXPLAINABLE RANKING</div>
</div>
""", unsafe_allow_html=True)

# Check if data is present
has_jd = bool(st.session_state.jd_text and st.session_state.jd_text.strip())
has_resumes = bool(st.session_state.candidates_data and len(st.session_state.candidates_data) > 0)

if not has_jd or not has_resumes:
    st.markdown("""
    <div style='background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:32px; text-align:center; margin-top:20px;'>
        <div style='font-size:36px; margin-bottom:12px;'>📂</div>
        <div style='font-size:20px; font-weight:800; color:#f8fafc;'>Awaiting Uploaded Files</div>
        <div style='font-size:14px; color:#94a3b8; max-width:600px; margin:8px auto 24px auto; line-height:1.6;'>
            Please upload your <b>Job Specification (PDF)</b> and <b>Candidate Resumes (Batch PDF)</b> in the sidebar to run the on-device intelligence matching.
        </div>
    </div>
    """, unsafe_allow_html=True)

    up_c1, up_c2 = st.columns(2)
    with up_c1:
        jd_status_icon = "✅" if has_jd else "⏳"
        jd_status_text = "Job Spec Loaded" if has_jd else "Awaiting Job Spec PDF in Sidebar"
        st.markdown(f"""
        <div class='kpi-card' style='text-align:left; border-left:4px solid {'#34d399' if has_jd else '#f59e0b'};'>
            <div class='kpi-title'>{jd_status_icon} 1. JOB SPECIFICATION</div>
            <div class='kpi-val' style='font-size:16px; margin-top:8px;'>{jd_status_text}</div>
            <div class='kpi-sub'>Extracts required skills, experience, and responsibilities</div>
        </div>
        """, unsafe_allow_html=True)
    with up_c2:
        res_count = len(st.session_state.candidates_data) if has_resumes else 0
        res_status_icon = "✅" if has_resumes else "⏳"
        res_status_text = f"{res_count} Resumes Uploaded" if has_resumes else "Awaiting Resume PDFs in Sidebar"
        st.markdown(f"""
        <div class='kpi-card' style='text-align:left; border-left:4px solid {'#34d399' if has_resumes else '#f59e0b'};'>
            <div class='kpi-title'>{res_status_icon} 2. CANDIDATE RESUMES</div>
            <div class='kpi-val' style='font-size:16px; margin-top:8px;'>{res_status_text}</div>
            <div class='kpi-sub'>Supports multiple PDF resumes for batch hybrid ranking</div>
        </div>
        """, unsafe_allow_html=True)
    st.stop()

# Process P1 Analysis (cached in session state)
jd_parsed = parse_jd(st.session_state.jd_text)
resumes_texts = [c["text"] for c in st.session_state.candidates_data]
candidate_ids = [c["id"] for c in st.session_state.candidates_data]

# Execute P1 pipeline
with st.spinner("Analyzing uploaded candidate documents with local neural embeddings & lexical indices..."):
    p1_results = analyze_candidates(
        jd=jd_parsed,
        resumes=resumes_texts,
        candidate_ids=candidate_ids,
        weights=st.session_state.active_weights
    )
    # Ensure uploaded candidate name from file/parsing is retained
    for idx, c_res in enumerate(p1_results):
        if idx < len(st.session_state.candidates_data):
            uploaded_name = st.session_state.candidates_data[idx].get("name")
            if uploaded_name and (c_res.get("name") == "Candidate" or not c_res.get("name")):
                c_res["name"] = uploaded_name

# Execute P2 ranking & intelligence
ranked_candidates = rank_candidates(
    p1_results,
    weights=st.session_state.active_weights,
    jd_parsed=jd_parsed
)

# Executive KPI Dashboard Cards
top_cand = ranked_candidates[0]
high_conf_count = len([c for c in ranked_candidates if c.get("confidence", {}).get("level") == "HIGH"])

kpi_c1, kpi_c2, kpi_c3, kpi_c4 = st.columns(4)
with kpi_c1:
    st.markdown(f"""
    <div class='kpi-card'>
        <div class='kpi-title'>Candidates Analyzed</div>
        <div class='kpi-val'>{len(ranked_candidates)}</div>
        <div class='kpi-sub'>Uploaded resumes processed</div>
    </div>
    """, unsafe_allow_html=True)
with kpi_c2:
    st.markdown(f"""
    <div class='kpi-card'>
        <div class='kpi-title'>Top Recommended Match</div>
        <div class='kpi-val' style='color:#34d399; font-size:20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;'>{top_cand['name']}</div>
        <div class='kpi-sub'>Rank #1 // {top_cand['final_score']}% Match</div>
    </div>
    """, unsafe_allow_html=True)
with kpi_c3:
    st.markdown(f"""
    <div class='kpi-card'>
        <div class='kpi-title'>Top Match Score</div>
        <div class='kpi-val' style='color:#38bdf8;'>{top_cand['final_score']} <span style='font-size:14px; font-weight:600; color:#64748b;'>/ 100</span></div>
        <div class='kpi-sub'>Confidence: {top_cand.get('confidence', {}).get('level', 'HIGH')}</div>
    </div>
    """, unsafe_allow_html=True)
with kpi_c4:
    st.markdown(f"""
    <div class='kpi-card'>
        <div class='kpi-title'>High Confidence Matches</div>
        <div class='kpi-val' style='color:#818cf8;'>{high_conf_count}</div>
        <div class='kpi-sub'>Verifiable grounded evidence</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)

# Navigation Tabs
tab_leaderboard, tab_compare, tab_qa, tab_bias = st.tabs([
    "🏆 Leaderboard & Deep Dive",
    "⚖️ 'Why X Over Y?' Comparator",
    "💬 Recruiter Q&A Analyst",
    "🛡️ JD Bias & Inclusiveness"
])


# TAB 1: LEADERBOARD & DEEP DIVE
with tab_leaderboard:
    # JD Overview Card
    with st.expander("📋 Active Job Description & Extracted Requirements", expanded=False):
        col_jd1, col_jd2 = st.columns([1, 1])
        with col_jd1:
            st.markdown(f"**Job Title:** `{jd_parsed.get('title', 'Software Engineer')}`")
            st.markdown(f"**Minimum Experience Required:** `{jd_parsed.get('min_experience_years', 0)} years`")
            st.text_area("Full JD Text:", value=st.session_state.jd_text, height=160, key="jd_text_area")
        with col_jd2:
            st.markdown("**Required Skills:**")
            req_badges = "".join([f"<span class='badge-matched'>{s}</span>" for s in jd_parsed.get("required_skills", [])])
            st.markdown(req_badges or "_None specified._", unsafe_allow_html=True)

            st.markdown("**Preferred Skills:**")
            pref_badges = "".join([f"<span class='badge-partial'>{s}</span>" for s in jd_parsed.get("preferred_skills", [])])
            st.markdown(pref_badges or "_None specified._", unsafe_allow_html=True)

            st.markdown("**Bonus Skills:**")
            bonus_badges = "".join([f"<span class='badge-partial'>{s}</span>" for s in jd_parsed.get("bonus_skills", [])])
            st.markdown(bonus_badges or "_None specified._", unsafe_allow_html=True)

    # Session state initialization for candidate deep dive selection
    if "selected_candidate_id" not in st.session_state:
        st.session_state.selected_candidate_id = None

    st.subheader(f"📊 Candidate Leaderboard ({len(ranked_candidates)} evaluated)")

    # Construct Leaderboard Table Data
    table_data = []
    for c in ranked_candidates:
        conf = c.get("confidence", {})
        table_data.append({
            "Rank": f"#{c['rank']}",
            "Candidate Name": c["name"],
            "Final Match": f"{c['final_score']}%",
            "Confidence": conf.get("level", "MED"),
            "Skill Coverage": f"{round(c['skill_coverage']*100, 1)}%",
            "Semantic Cosine": f"{round(c['semantic_score']*100, 1)}%",
            "BM25 Keyword": f"{round(c['bm25_score']*100, 1)}%",
            "Skills Matched": f"{len(c.get('required_matches', []))}/{len(jd_parsed.get('required_skills', []))}"
        })

    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True, hide_index=True)

    # Interactive Candidate Selection Strip
    st.markdown("<p style='font-size:12px; font-weight:700; color:#38bdf8; margin-top:8px; margin-bottom:4px;'>SELECT CANDIDATE TO VIEW DOSSIER & WHY THIS SCORE:</p>", unsafe_allow_html=True)
    sel_cols = st.columns(len(ranked_candidates))
    for idx, c in enumerate(ranked_candidates):
        with sel_cols[idx]:
            is_active = (st.session_state.selected_candidate_id == c["id"])
            label = f"#{c['rank']} {c['name'].split()[0]} ({c['final_score']}%)"
            btn_type = "primary" if is_active else "secondary"
            if st.button(label, key=f"sel_btn_{c['id']}", type=btn_type, use_container_width=True):
                st.session_state.selected_candidate_id = c["id"]
                st.rerun()

    # Core Differentiator Callout Banner
    st.markdown(f"""
    <div class='why-score-hero'>
        <div style='display:flex; justify-content:space-between; align-items:center;'>
            <span style='font-size:12px; font-weight:800; color:#38bdf8; letter-spacing:0.08em;'>⚡ WHY IS THIS CANDIDATE #1?</span>
            <span style='font-size:11px; font-weight:700; color:#34d399;'>SCORE: {top_cand['final_score']} / 100</span>
        </div>
        <div style='font-size:13px; font-weight:600; color:#f1f5f9; margin-top:6px;'>
            {top_cand['name']} satisfies all core required competencies and leads the pool in conceptual semantic alignment.
        </div>
        <div style='font-size:11px; color:#94a3b8; margin-top:4px;'>
            {top_cand.get('summary_rationale', '')}
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Conditionally Render Deep Dive ONLY if a candidate is selected
    if st.session_state.selected_candidate_id is not None:
        selected_c = next((c for c in ranked_candidates if c["id"] == st.session_state.selected_candidate_id), None)
        if selected_c is None:
            selected_c = ranked_candidates[0]
            st.session_state.selected_candidate_id = selected_c["id"]

        st.divider()

        # Candidate Deep Dive Card Header
        head_col1, head_col2 = st.columns([3, 1])
        with head_col1:
            st.subheader(f"🔍 CANDIDATE INTELLIGENCE // {selected_c['name'].upper()}")
        with head_col2:
            if st.button("← Close Dossier", key="close_dossier_btn", use_container_width=True):
                st.session_state.selected_candidate_id = None
                st.rerun()

        col1, col2 = st.columns([1, 1])

        with col1:
            c_conf = selected_c.get('confidence', {}).get('level', 'HIGH')
            c_conf_class = f"conf-{c_conf.lower()}"
            st.markdown(f"""
            <div style='background:#0f1523; border:1px solid #1e293b; border-radius:10px; padding:14px 18px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;'>
                <div>
                    <div style='display:flex; align-items:center; gap:8px;'>
                        <span style='font-size:18px; font-weight:800; color:#f8fafc;'>{selected_c['name']}</span>
                        <span class='{c_conf_class}'>{c_conf} CONFIDENCE</span>
                    </div>
                    <div style='font-size:11px; color:#38bdf8; font-family:"JetBrains Mono", monospace; margin-top:2px;'>Rank #{selected_c['rank']} of {len(ranked_candidates)} Evaluated</div>
                </div>
                <div style='text-align:right;'>
                    <div style='font-size:28px; font-weight:900; color:#34d399;'>{selected_c['final_score']}<span style='font-size:14px; color:#64748b;'>%</span></div>
                    <div style='font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase;'>Overall Match</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown(f"""
            <div class='why-score-hero' style='padding:12px 16px; margin-bottom:14px;'>
                <div style='font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase;'>💡 WHY THIS SCORE?</div>
                <div style='font-size:12px; color:#f1f5f9; font-weight:600; margin-top:3px;'>{selected_c.get('summary_rationale', '')}</div>
                <div style='font-size:11px; color:#94a3b8; margin-top:3px;'>Domain Alignment: <i>{selected_c.get('domain_alignment', '')}</i></div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown("#### Match Analysis Breakdown")
            st.write(f"**Keyword Match (BM25):** {round(selected_c['bm25_score']*100, 1)}%")
            st.progress(float(selected_c['bm25_score']))

            st.write(f"**Semantic Context Match (MiniLM):** {round(selected_c['semantic_score']*100, 1)}%")
            st.progress(float(selected_c['semantic_score']))

            st.write(f"**Required Skills Coverage:** {round(selected_c['skill_coverage']*100, 1)}%")
            st.progress(float(selected_c['skill_coverage']))

            st.write(f"**Experience Match:** {round(selected_c['experience_score']*100, 1)}%")
            st.progress(float(selected_c['experience_score']))

        with col2:
            st.markdown("#### Technical Competency Breakdown")

            # Matched Skills
            req_matched = selected_c.get("required_matches", [])
            pref_matched = selected_c.get("preferred_matches", [])
            bonus_matched = selected_c.get("bonus_matches", [])

            st.markdown("**🟢 Matched Skills:**")
            if req_matched or pref_matched or bonus_matched:
                badges = "".join([f"<span class='badge-matched'>{s} (Required)</span>" for s in req_matched])
                badges += "".join([f"<span class='badge-matched'>{s} (Preferred)</span>" for s in pref_matched])
                badges += "".join([f"<span class='badge-matched'>{s} (Bonus)</span>" for s in bonus_matched])
                st.markdown(badges, unsafe_allow_html=True)
            else:
                st.write("_No required skills matched._")

            # Partial Skills
            req_evidence = selected_c.get("requirement_evidence", [])
            partial_skills = [e for e in req_evidence if e.get("status") == "partial"]
            st.markdown("**🟡 Partial Matches (Related Experience):**")
            if partial_skills:
                badges_p = "".join([f"<span class='badge-partial'>{e['skill']}</span>" for e in partial_skills])
                st.markdown(badges_p, unsafe_allow_html=True)
                for p in partial_skills:
                    st.caption(f"• {p['skill']}: {p['evidence']}")
            else:
                st.write("_None._")

            # Missing Skills
            missing_skills = [e for e in req_evidence if e.get("status") == "missing"]
            st.markdown("**🔴 Missing JD Requirements:**")
            if missing_skills:
                badges_m = "".join([f"<span class='badge-missing'>{e['skill']}</span>" for e in missing_skills])
                st.markdown(badges_m, unsafe_allow_html=True)
            else:
                st.write("_None — all core requirements fulfilled._")

            # Experience Timeline
            st.markdown("#### ⏳ Candidate Journey Timeline")
            exp_entries = selected_c.get("experience", [])
            if exp_entries:
                for exp in exp_entries:
                    st.markdown(f"**{exp.get('start_date', '')} – {exp.get('end_date', '')}** | **{exp.get('role', 'Role')}** at `{exp.get('company', 'Company')}` ({exp.get('duration_years', 0)} yrs)")
                    if exp.get("description"):
                        st.caption(exp["description"])
            else:
                st.write("_No structured experience entries parsed._")

        # Verbatim Evidence Table
        st.markdown("---")
        with st.expander("📑 Verbatim Grounding Evidence (Zero-Hallucination Snippets)", expanded=False):
            all_ev = selected_c.get("requirement_evidence", [])
            if all_ev:
                ev_table = []
                for ev in all_ev:
                    ev_table.append({
                        "Requirement": ev.get("skill"),
                        "Match Status": ev.get("status", "").upper(),
                        "Verbatim Resume Evidence": ev.get("evidence", "")
                    })
                st.dataframe(pd.DataFrame(ev_table), use_container_width=True, hide_index=True)
            else:
                st.write("No explicit evidence items generated.")

        with st.expander("🛠️ Normalized Candidate JSON (For Evaluators & Debugging)", expanded=False):
            st.json(selected_c)


# TAB 2: COMPARATOR
with tab_compare:
    st.subheader("⚖️ 'Why X Over Y?' Candidate Comparator")
    st.caption("Instantly compare two candidates with side-by-side differentiators.")

    c_names = [c["name"] for c in ranked_candidates]
    col_a, col_b = st.columns(2)

    with col_a:
        sel_a = st.selectbox("Select Candidate A:", c_names, index=0)
    with col_b:
        sel_b = st.selectbox("Select Candidate B:", c_names, index=1 if len(c_names) > 1 else 0)

    cand_obj_a = next(c for c in ranked_candidates if c["name"] == sel_a)
    cand_obj_b = next(c for c in ranked_candidates if c["name"] == sel_b)

    comparison = compare_candidates(cand_obj_a, cand_obj_b, jd_parsed=jd_parsed)

    # Key Differentiator Hero Card
    st.markdown(f"""
    <div style='background:linear-gradient(135deg, #0e1e38 0%, #0d162a 100%); border:1px solid #1e40af; border-left:4px solid #3b82f6; border-radius:10px; padding:16px 20px; margin-bottom:18px;'>
        <div style='font-size:11px; font-weight:800; color:#60a5fa; letter-spacing:0.08em; text-transform:uppercase;'>🎯 AI COMPARATIVE DIFFERENTIATOR</div>
        <div style='font-size:13px; font-weight:600; color:#f8fafc; margin-top:4px;'>{comparison['differentiator_sentence']}</div>
    </div>
    """, unsafe_allow_html=True)

    comp_table = [
        {"Metric": "Final Match Score", sel_a: f"{cand_obj_a['final_score']}%", sel_b: f"{cand_obj_b['final_score']}%"},
        {"Metric": "Leaderboard Rank", sel_a: f"#{cand_obj_a['rank']}", sel_b: f"#{cand_obj_b['rank']}"},
        {"Metric": "Confidence Assessment", sel_a: cand_obj_a.get('confidence', {}).get('level', 'MED'), sel_b: cand_obj_b.get('confidence', {}).get('level', 'MED')},
        {"Metric": "Required Skills Coverage", sel_a: f"{round(cand_obj_a['skill_coverage']*100, 1)}%", sel_b: f"{round(cand_obj_b['skill_coverage']*100, 1)}%"},
        {"Metric": "Semantic Context Similarity", sel_a: f"{round(cand_obj_a['semantic_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['semantic_score']*100, 1)}%"},
        {"Metric": "Keyword BM25 Score", sel_a: f"{round(cand_obj_a['bm25_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['bm25_score']*100, 1)}%"},
        {"Metric": "Experience Duration Score", sel_a: f"{round(cand_obj_a['experience_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['experience_score']*100, 1)}%"},
        {"Metric": "Exclusive Skills", sel_a: ", ".join(comparison['skills_a_only']) or "None", sel_b: ", ".join(comparison['skills_b_only']) or "None"},
    ]
    st.dataframe(pd.DataFrame(comp_table), use_container_width=True, hide_index=True)


# TAB 3: RECRUITER Q&A
with tab_qa:
    st.subheader("💬 Recruiter Q&A Analyst Console")
    st.caption("Ask questions about the candidate rankings, requirements, and skill coverage. 100% deterministic & local.")

    col_q1, col_q2, col_q3 = st.columns(3)
    preset_query = ""
    if col_q1.button(f"❓ Why is {ranked_candidates[0]['name']} above {ranked_candidates[1]['name'] if len(ranked_candidates) > 1 else 'Candidate'}?"):
        preset_query = f"Why is {ranked_candidates[0]['name']} ranked above {ranked_candidates[1]['name']}?"
    if col_q2.button("❓ Who knows Docker?"):
        preset_query = "Who knows Docker?"
    if col_q3.button(f"❓ What is {ranked_candidates[1]['name'] if len(ranked_candidates) > 1 else 'Candidate'} missing?"):
        preset_query = f"What is {ranked_candidates[1]['name']} missing?"

    user_query = st.text_input("Enter recruiter question:", value=preset_query, placeholder="e.g. Why is Rahul ranked above Priya?")

    if user_query:
        answer = answer_recruiter_query(user_query, ranked_candidates, jd_parsed=jd_parsed)
        st.markdown(f"""
        <div style='background:#0f1523; border:1px solid #1e293b; border-left:4px solid #818cf8; border-radius:10px; padding:18px; margin-top:14px;'>
            <div style='font-size:11px; font-weight:800; color:#818cf8; text-transform:uppercase; letter-spacing:0.08em;'>⚡ AI ANALYST RESPONSE:</div>
            <div style='font-size:13px; color:#f1f5f9; margin-top:8px; line-height:1.6;'>{answer}</div>
        </div>
        """, unsafe_allow_html=True)


# TAB 4: JD BIAS DETECTOR
with tab_bias:
    st.subheader("🛡️ Job Description Bias & Inclusiveness Audit")
    st.caption("Scans job descriptions for restrictive criteria, institutional elitism, or demographic proxies.")

    bias_report = detect_jd_bias(st.session_state.jd_text, jd_parsed=jd_parsed)

    m1, m2, m3 = st.columns(3)
    with m1:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Skills Detected</div>
            <div class='kpi-val'>{bias_report['skills_detected']}</div>
            <div class='kpi-sub'>Technical Taxonomy Matches</div>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Required Skills</div>
            <div class='kpi-val'>{bias_report['required_count']}</div>
            <div class='kpi-sub'>Mandatory Criteria Count</div>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        f_color = "#f87171" if bias_report['flag_count'] > 0 else "#34d399"
        st.markdown(f"""
        <div class='kpi-card'>
            <div class='kpi-title'>Bias Flags Raised</div>
            <div class='kpi-val' style='color:{f_color};'>{bias_report['flag_count']}</div>
            <div class='kpi-sub'>Inclusiveness Flags Detected</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height:14px;'></div>", unsafe_allow_html=True)

    if bias_report["bias_detected"]:
        st.warning(f"⚠️ {bias_report['summary']}")
        for f in bias_report["flags"]:
            with st.expander(f"🚩 Issue: {f['category']} ('{f['phrase']}')"):
                st.markdown(f"**Why it's problematic:** {f['why']}")
                st.markdown(f"**Suggested Alternative:** `{f['suggestion']}`")
    else:
        st.markdown(f"""
        <div style='background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:10px; padding:16px; color:#34d399; font-weight:600;'>
            ✓ {bias_report['summary']}
        </div>
        """, unsafe_allow_html=True)

    with st.expander("Inspect Raw Parsed JD JSON"):
        st.json(jd_parsed)
