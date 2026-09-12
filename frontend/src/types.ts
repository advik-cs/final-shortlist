export type MatchStatus = 'strong' | 'partial' | 'missing';

export interface ConfidenceInfo {
  level: 'High' | 'Medium' | 'Low';
  score?: number;
  reason: string;
}

export interface SkillItem {
  name: string;
  status: MatchStatus;
  evidenceExcerpt?: string;
  category?: 'language' | 'framework' | 'database' | 'cloud' | 'architecture' | 'other';
}

export interface EvidenceItem {
  id: string;
  requirement: string;
  category: string;
  excerpt: string;
  sourceSection: string;
  relevanceScore: number;
}

export interface TimelineItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  description: string;
  highlightSkills: string[];
  isEducation?: boolean;
}

export interface PartialMatch {
  skill: string;
  context: string;
  note: string;
}

export interface EvidenceGap {
  skill: string;
  requirement: string;
  note: string; // "Docker — required by the JD but not explicitly found in the resume."
}

// Person 1 backend format as per specification
export interface Person1BackendData {
  candidate_id: string;
  name: string;
  skills: string[];
  required_matches: string[];
  preferred_matches: string[];
  bm25_score: number;
  semantic_score: number;
  skill_coverage: number;
  experience_score: number;
  evidence: Array<{
    skill: string;
    text: string;
    section: string;
  }>;
}

// Person 2 backend format as per specification
export interface Person2BackendData {
  candidate_id: string;
  name: string;
  final_score: number;
  rank: number;
  confidence: {
    level?: 'High' | 'Medium' | 'Low';
    score?: number;
    reason?: string;
  };
  strengths: string[];
  weaknesses?: string[];
  partial_matches: Array<{
    skill: string;
    context: string;
    note: string;
  }>;
  match_analysis: {
    keyword_match?: number;
    semantic_match?: number;
    skill_coverage?: number;
    experience_match?: number;
  };
  explanation: string;
  evidence: Array<{
    requirement: string;
    excerpt: string;
    relevance: number;
  }>;
  timeline: Array<{
    period: string;
    role: string;
    company: string;
    description: string;
    skills: string[];
  }>;
}

// Unified candidate object consumed cleanly by the frontend UI
export interface UnifiedCandidate {
  id: string;
  name: string;
  currentTitle: string;
  experienceYears: number;
  rank: number;
  finalScore: number;
  bm25Score: number;       // 0 - 100
  semanticScore: number;   // 0 - 100
  skillCoverage: number;   // 0 - 100
  experienceScore: number; // 0 - 100
  confidence: ConfidenceInfo;
  strengths: string[];
  partialMatches: PartialMatch[];
  evidenceGaps: EvidenceGap[];
  skills: {
    required: SkillItem[];
    preferred: SkillItem[];
    other: string[];
  };
  explanation: string;
  evidence: EvidenceItem[];
  timeline: TimelineItem[];
  education: string;
  location: string;
  resumeFilename: string;
}

export interface JobDescriptionData {
  id: string;
  title: string;
  department: string;
  experienceLevel: string;
  location: string;
  summary: string;
  filename: string;
  fileSize: string;
  requiredSkills: Array<{ name: string; description: string; importance: 'high' | 'critical' }>;
  preferredSkills: Array<{ name: string; description: string }>;
  coreResponsibilities: string[];
  biasAndRestrictions: Array<{
    id: string;
    severity: 'high' | 'medium' | 'low';
    requirementText: string;
    concern: string;
    inclusiveAlternative: string;
  }>;
}

export type AppView = 
  | 'upload-jd' 
  | 'jd-analysis' 
  | 'upload-resumes' 
  | 'candidate-processing' 
  | 'dashboard' 
  | 'profile' 
  | 'compare' 
  | 'qa' 
  | 'jd-spec';
