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
    }
]

# Custom CSS styling for sleek, modern UI
st.markdown("""
<style>
    .metric-card {
        background-color: #1e2130;
        border-radius: 10px;
        padding: 16px;
        border-left: 4px solid #4CAF50;
        margin-bottom: 12px;
    }
    .badge-matched {
        background-color: #1b5e20;
        color: #e8f5e9;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: bold;
        display: inline-block;
        margin: 2px 4px;
        font-size: 0.85em;
    }
    .badge-partial {
        background-color: #f57f17;
        color: #fffde7;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: bold;
        display: inline-block;
        margin: 2px 4px;
        font-size: 0.85em;
    }
    .badge-missing {
        background-color: #b71c1c;
        color: #ffebee;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: bold;
        display: inline-block;
        margin: 2px 4px;
        font-size: 0.85em;
    }
    .confidence-high {
        color: #4CAF50;
        font-weight: bold;
    }
    .confidence-med {
        color: #FF9800;
        font-weight: bold;
    }
    .confidence-low {
        color: #F44336;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)


# Sidebar Controls
st.sidebar.title("⚙️ Recruiter Controls")

# Session state initialization
if "jd_text" not in st.session_state:
    st.session_state.jd_text = SAMPLE_JD

if "candidates_data" not in st.session_state:
    st.session_state.candidates_data = SAMPLE_CANDIDATES

if "active_weights" not in st.session_state:
    st.session_state.active_weights = dict(DEFAULT_WEIGHTS)

# Weight Preset Quick-Select
st.sidebar.subheader("⚖️ 'What If?' Simulator")
preset = st.sidebar.radio(
    "Weight Preset:",
    ["Default Balanced (40/35/25)", "Skill-Heavy (10/80/10)", "Semantic-Heavy (80/10/10)", "Custom Sliders"],
    index=0
)

if preset == "Default Balanced (40/35/25)":
    sem_val, skill_val, bm25_val = 0.40, 0.35, 0.25
elif preset == "Skill-Heavy (10/80/10)":
    sem_val, skill_val, bm25_val = 0.10, 0.80, 0.10
elif preset == "Semantic-Heavy (80/10/10)":
    sem_val, skill_val, bm25_val = 0.80, 0.10, 0.10
else:
    sem_val = st.sidebar.slider("Semantic Similarity Weight %", 0, 100, 40) / 100.0
    skill_val = st.sidebar.slider("Skill Coverage Weight %", 0, 100, 35) / 100.0
    bm25_val = st.sidebar.slider("Keyword (BM25) Weight %", 0, 100, 25) / 100.0

st.session_state.active_weights = {
    "semantic_weight": sem_val,
    "skill_weight": skill_val,
    "bm25_weight": bm25_val
}

st.sidebar.caption(
    f"Active Weights: Semantic: {round(sem_val*100)}% | Skills: {round(skill_val*100)}% | BM25: {round(bm25_val*100)}%"
)

# Input Management
st.sidebar.divider()
st.sidebar.subheader("📄 Job Description")
uploaded_jd = st.sidebar.file_uploader("Upload JD (PDF)", type=["pdf"], key="jd_upload")
if uploaded_jd:
    st.session_state.jd_text = extract_pdf_text(uploaded_jd.read())

st.sidebar.subheader("👥 Candidate Resumes")
uploaded_resumes = st.sidebar.file_uploader("Upload Resumes (Batch PDF)", type=["pdf"], accept_multiple_files=True, key="resumes_upload")
if uploaded_resumes:
    batch = []
    for idx, rfile in enumerate(uploaded_resumes):
        text = extract_pdf_text(rfile.read())
        batch.append({
            "id": f"C{idx+1:03d}",
            "name": rfile.name.replace(".pdf", ""),
            "text": text
        })
    st.session_state.candidates_data = batch

if st.sidebar.button("🔄 Reset to Sample Data"):
    st.session_state.jd_text = SAMPLE_JD
    st.session_state.candidates_data = SAMPLE_CANDIDATES
    st.rerun()


# Main Application Content
st.title("🎯 InternLoom — Intelligent Candidate Matcher")
st.caption("Zero-API local hybrid matching: BM25 + all-MiniLM-L6-v2 Semantic Embeddings + Categorized Skill Coverage")

# Process P1 Analysis (cached in session state)
jd_parsed = parse_jd(st.session_state.jd_text)
resumes_texts = [c["text"] for c in st.session_state.candidates_data]
candidate_ids = [c["id"] for c in st.session_state.candidates_data]

# Execute P1 pipeline
with st.spinner("Analyzing candidate documents with local neural embeddings & lexical indices..."):
    p1_results = analyze_candidates(
        jd=jd_parsed,
        resumes=resumes_texts,
        candidate_ids=candidate_ids,
        weights=st.session_state.active_weights
    )

# Execute P2 ranking & intelligence
ranked_candidates = rank_candidates(
    p1_results,
    weights=st.session_state.active_weights,
    jd_parsed=jd_parsed
)

# Navigation Tabs
tab_leaderboard, tab_compare, tab_qa, tab_bias = st.tabs([
    "🏆 Leaderboard & Deep Dive",
    "⚖️ 'Why X Over Y?' Comparator",
    "💬 Recruiter Q&A",
    "🛡️ JD Bias Detector"
])


# TAB 1: LEADERBOARD & DEEP DIVE
with tab_leaderboard:
    st.subheader(f"📊 Candidate Leaderboard ({len(ranked_candidates)} evaluated)")

    # Construct Leaderboard Table Data
    table_data = []
    for c in ranked_candidates:
        conf = c.get("confidence", {})
        table_data.append({
            "Rank": f"#{c['rank']}",
            "Candidate Name": c["name"],
            "Final Match": f"{c['final_score']}%",
            "Semantic Cosine": f"{round(c['semantic_score']*100, 1)}%",
            "Skill Coverage": f"{round(c['skill_coverage']*100, 1)}%",
            "BM25 Keyword": f"{round(c['bm25_score']*100, 1)}%",
            "Confidence": conf.get("level", "MED"),
            "Skills Matched": f"{len(c.get('required_matches', []))}/{len(jd_parsed.get('required_skills', []))}"
        })

    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True, hide_index=True)

    st.divider()

    # Candidate Deep Dive Card
    st.subheader("🔍 Candidate Intelligence Deep-Dive")
    cand_names = [f"Rank #{c['rank']}: {c['name']} ({c['final_score']}%)" for c in ranked_candidates]
    selected_cand_idx = st.selectbox("Select Candidate for Deep-Dive Analysis:", range(len(cand_names)), format_func=lambda i: cand_names[i])
    selected_c = ranked_candidates[selected_cand_idx]

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown(f"### {selected_c['name']} — Rank #{selected_c['rank']}")
        st.markdown(f"**Score:** `{selected_c['final_score']}%` | **Confidence:** `{selected_c.get('confidence', {}).get('level', 'HIGH')}`")

        st.info(f"💡 **Summary Rationale:** {selected_c.get('summary_rationale', '')}")
        st.markdown(f"**Domain Alignment:** _{selected_c.get('domain_alignment', '')}_")

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

    st.success(f"🎯 **Differentiator:** {comparison['differentiator_sentence']}")

    comp_table = [
        {"Metric": "Final Match Score", sel_a: f"{cand_obj_a['final_score']}%", sel_b: f"{cand_obj_b['final_score']}%"},
        {"Metric": "Leaderboard Rank", sel_a: f"#{cand_obj_a['rank']}", sel_b: f"#{cand_obj_b['rank']}"},
        {"Metric": "Required Skills Coverage", sel_a: f"{round(cand_obj_a['skill_coverage']*100, 1)}%", sel_b: f"{round(cand_obj_b['skill_coverage']*100, 1)}%"},
        {"Metric": "Semantic Context Similarity", sel_a: f"{round(cand_obj_a['semantic_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['semantic_score']*100, 1)}%"},
        {"Metric": "Keyword BM25 Score", sel_a: f"{round(cand_obj_a['bm25_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['bm25_score']*100, 1)}%"},
        {"Metric": "Experience Score", sel_a: f"{round(cand_obj_a['experience_score']*100, 1)}%", sel_b: f"{round(cand_obj_b['experience_score']*100, 1)}%"},
        {"Metric": "Exclusive Skills", sel_a: ", ".join(comparison['skills_a_only']) or "None", sel_b: ", ".join(comparison['skills_b_only']) or "None"},
    ]
    st.table(pd.DataFrame(comp_table))


# TAB 3: RECRUITER Q&A
with tab_qa:
    st.subheader("💬 Recruiter Q&A Engine")
    st.caption("Ask questions about the candidate rankings, requirements, and skill coverage. 100% deterministic & local.")

    col_q1, col_q2, col_q3 = st.columns(3)
    preset_query = ""
    if col_q1.button(f"❓ Why is {ranked_candidates[0]['name']} above {ranked_candidates[1]['name'] if len(ranked_candidates) > 1 else 'Candidate'}?"):
        preset_query = f"Why is {ranked_candidates[0]['name']} ranked above {ranked_candidates[1]['name']}?"
    if col_q2.button("❓ Who knows Docker?"):
        preset_query = "Who knows Docker?"
    if col_q3.button(f"❓ What is {ranked_candidates[1]['name'] if len(ranked_candidates) > 1 else 'Candidate'} missing?"):
        preset_query = f"What is {ranked_candidates[1]['name']} missing?"

    user_query = st.text_input("Ask a question about candidates:", value=preset_query, placeholder="e.g. Why is Rahul ranked above Priya?")

    if user_query:
        answer = answer_recruiter_query(user_query, ranked_candidates, jd_parsed=jd_parsed)
        st.markdown(f"**Answer:**\n\n{answer}")


# TAB 4: JD BIAS DETECTOR
with tab_bias:
    st.subheader("🛡️ Job Description Bias & Inclusiveness Detector")
    st.caption("Scans job descriptions for restrictive criteria, institutional elitism, or demographic proxies.")

    bias_report = detect_jd_bias(st.session_state.jd_text, jd_parsed=jd_parsed)

    m1, m2, m3 = st.columns(3)
    m1.metric("Skills Detected", bias_report["skills_detected"])
    m2.metric("Required Skills", bias_report["required_count"])
    m3.metric("Bias Flags Raised", bias_report["flag_count"])

    if bias_report["bias_detected"]:
        st.warning(f"⚠️ {bias_report['summary']}")
        for f in bias_report["flags"]:
            with st.expander(f"🚩 Issue: {f['category']} ('{f['phrase']}')"):
                st.markdown(f"**Why it's problematic:** {f['why']}")
                st.markdown(f"**Suggested Alternative:** {f['suggestion']}")
    else:
        st.success("✅ " + bias_report["summary"])

    with st.expander("Inspect Raw Parsed JD JSON"):
        st.json(jd_parsed)
