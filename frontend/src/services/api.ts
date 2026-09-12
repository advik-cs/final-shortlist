/**
 * InternLoom Centralized Frontend API Layer.
 * Communicates with the 100% local FastAPI backend.
 * Zero external AI / Zero API keys.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  service: string;
  models_loaded: boolean;
  zero_external_api: boolean;
}

export interface JDParseResponse {
  jd_parsed: {
    title: string;
    required_skills: string[];
    preferred_skills: string[];
    bonus_skills: string[];
    experience_requirements: {
      min_years: number;
      description: string;
    };
    education_requirements: string[];
    certifications: string[];
    responsibilities: string[];
    raw_text: string;
  };
  bias_report: {
    bias_detected: boolean;
    flag_count: number;
    flags: Array<{
      category: string;
      phrase: string;
      why: string;
      suggestion: string;
    }>;
    skills_detected: number;
    required_count: number;
    preferred_count: number;
    summary: string;
  };
  filename: string;
  file_size: string;
}

export interface CandidateAnalyzeResponse {
  candidates: any[];
  jd_parsed: any;
  total: number;
}

export interface CandidateCompareResponse {
  candidate_a_name: string;
  candidate_b_name: string;
  score_a: number;
  score_b: number;
  diff_final: number;
  diff_semantic: number;
  diff_coverage: number;
  diff_experience: number;
  skills_a_only: string[];
  skills_b_only: string[];
  shared_skills: string[];
  differentiator_sentence: string;
}

export interface QAResponse {
  query: string;
  answer: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // ignore non-json error responses
      }
      throw new Error(`API Error (${res.status}): ${errorDetail}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error(
        `Backend unreachable at ${API_BASE_URL}. Ensure the Python backend is running (python server.py / uvicorn server:app --port 8000).`
      );
    }
    throw err;
  }
}

/** Check backend health */
export async function checkBackendHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health');
}

/** Parse Job Description from a File or raw text */
export async function parseJobDescription(source: File | string): Promise<JDParseResponse> {
  const formData = new FormData();
  if (source instanceof File) {
    formData.append('file', source);
  } else {
    formData.append('text', source);
  }

  return request<JDParseResponse>('/api/jd/parse', {
    method: 'POST',
    body: formData,
  });
}

/** Analyze real candidate resumes against a parsed JD */
export async function analyzeCandidates(params: {
  resumes: File[];
  jd_text?: string;
  jd_json?: any;
  weights?: any;
}): Promise<CandidateAnalyzeResponse> {
  const formData = new FormData();
  for (const resume of params.resumes) {
    formData.append('resumes', resume);
  }

  if (params.jd_json) {
    formData.append('jd_json', typeof params.jd_json === 'string' ? params.jd_json : JSON.stringify(params.jd_json));
  } else if (params.jd_text) {
    formData.append('jd_text', params.jd_text);
  }

  if (params.weights) {
    formData.append('weights', typeof params.weights === 'string' ? params.weights : JSON.stringify(params.weights));
  }

  return request<CandidateAnalyzeResponse>('/api/candidates/analyze', {
    method: 'POST',
    body: formData,
  });
}

/** Recalculate rankings using dynamic recruiter weights */
export async function rerankCandidates(params: {
  candidates: any[];
  weights: { semantic_weight: number; skill_weight: number; bm25_weight: number };
  jd_parsed?: any;
}): Promise<{ candidates: any[] }> {
  return request<{ candidates: any[] }>('/api/candidates/rerank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/** Compare Candidate A vs Candidate B */
export async function compareCandidates(params: {
  candidate_a: any;
  candidate_b: any;
  jd_parsed?: any;
}): Promise<CandidateCompareResponse> {
  return request<CandidateCompareResponse>('/api/candidates/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/** Recruiter Q&A querying the candidate leaderboard */
export async function askRecruiterQuery(params: {
  query: string;
  candidates: any[];
  jd_parsed?: any;
}): Promise<QAResponse> {
  return request<QAResponse>('/api/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/** Load real 100% computed sample analysis from backend */
export async function getSampleData(): Promise<{
  jd_parsed: any;
  bias_report: any;
  candidates: any[];
  filename: string;
  file_size: string;
}> {
  return request<any>('/api/sample-data');
}
