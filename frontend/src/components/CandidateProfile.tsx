import React, { useState, useEffect } from 'react';
import { UnifiedCandidate } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ScoreBar } from './ScoreBar';
import { CandidateCombobox } from './CandidateCombobox';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Briefcase, 
  GraduationCap, 
  ChevronDown, 
  ChevronUp, 
  Quote, 
  GitCompare, 
  MapPin, 
  Calendar,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CandidateProfileProps {
  candidate: UnifiedCandidate;
  allCandidates: UnifiedCandidate[];
  onBack: () => void;
  onCompareWith: (target: UnifiedCandidate) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  allCandidates,
  onBack,
  onCompareWith
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({
    'ev-0': true // expand first evidence quote by default
  });
  const [activeSkillTab, setActiveSkillTab] = useState<'required' | 'preferred' | 'other'>('required');

  // Smooth score count-up animation
  useEffect(() => {
    setDisplayScore(0);
    const target = candidate.finalScore;
    const duration = 600; // ms
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased * 10) / 10);

      if (currentStep >= steps) {
        setDisplayScore(target);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [candidate.id, candidate.finalScore]);

  const toggleEvidence = (id: string) => {
    setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const otherCandidates = allCandidates.filter(c => c.id !== candidate.id);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D8DFDC]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5A6765] hover:text-[#2D3536] transition-colors cursor-pointer self-start group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/90 border border-[#B9C5BE] group-hover:border-[#697C70] flex items-center justify-center transition-colors shadow-2xs">
            <ArrowLeft className="w-4 h-4 text-[#2D3536]" />
          </div>
          <span>Back to Rankings</span>
        </button>

        {/* Head-to-Head Comparison Direct Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-72">
            <CandidateCombobox
              candidates={otherCandidates}
              selectedCandidate={null}
              onSelect={(target) => onCompareWith(target)}
              placeholder="Compare vs (type name)..."
            />
          </div>
        </div>
      </div>

      {/* Hero Visual Focal Point: Candidate Profile Card */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Identity & Core Metadata */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#F2EFE2] text-[#2D3536] text-lg sm:text-xl font-extrabold border border-[#B9C5BE] shrink-0 shadow-2xs">
              #{candidate.rank}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2D3536]">
                  {candidate.name}
                </h1>
                <ConfidenceBadge confidence={candidate.confidence} size="md" />
              </div>
              <p className="mt-1 text-sm font-semibold text-[#3E4A47]">
                {candidate.currentTitle}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#5A6765]">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#697C70]" />
                  {candidate.experienceYears} Years Production Exp
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#697C70]" />
                  {candidate.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#697C70]" />
                  {candidate.resumeFilename}
                </span>
              </div>
            </div>
          </div>

          {/* Right Focal Point: Giant Animated Final Score */}
          <div className="flex items-center justify-start lg:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#D8DFDC]">
            <div className="text-left lg:text-right">
              <div className="flex items-baseline gap-1 lg:justify-end">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#2D3536]">
                  {displayScore.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-[#5A6765]">/ 100</span>
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#697C70] block mt-0.5">
                Composite Final Score
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Reason Box */}
        <div className="mt-6 p-4 rounded-xl bg-[#F2EFE2]/70 border border-[#D8DFDC] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#697C70] shrink-0 mt-0.5" />
          <div className="text-xs text-[#2D3536] leading-relaxed font-medium">
            <strong className="text-[#2D3536] font-bold">Confidence Assessment: </strong>
            {candidate.confidence.reason}
          </div>
        </div>
      </div>

      {/* Match Analysis: 4 Elegant Metric Cards */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#2D3536] mb-4">
          Match Dimension Analysis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
            <span className="text-xs text-[#5A6765] font-semibold block mb-1">Semantic Match</span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-[#2D3536]">{candidate.semanticScore}%</span>
              <span className="text-[11px] text-[#697C70] font-bold">Contextual Vector</span>
            </div>
            <ScoreBar label="" value={candidate.semanticScore} color="#697C70" showPercent={false} size="sm" />
          </div>

          <div className="p-5 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
            <span className="text-xs text-[#5A6765] font-semibold block mb-1">Exact Keyword Match</span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-[#2D3536]">{candidate.bm25Score}%</span>
              <span className="text-[11px] text-[#2D3536] font-bold">Lexical Match</span>
            </div>
            <ScoreBar label="" value={candidate.bm25Score} color="#2D3536" showPercent={false} size="sm" />
          </div>

          <div className="p-5 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
            <span className="text-xs text-[#5A6765] font-semibold block mb-1">Skill Coverage</span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-[#2D3536]">{candidate.skillCoverage}%</span>
              <span className="text-[11px] text-[#697C70] font-bold">Core Stack</span>
            </div>
            <ScoreBar label="" value={candidate.skillCoverage} color="#98AA9D" showPercent={false} size="sm" />
          </div>

          <div className="p-5 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
            <span className="text-xs text-[#5A6765] font-semibold block mb-1">Experience Relevance</span>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-[#2D3536]">{candidate.experienceScore}%</span>
              <span className="text-[11px] text-[#5A6765] font-bold">Tenure & Scope</span>
            </div>
            <ScoreBar label="" value={candidate.experienceScore} color="#5A6765" showPercent={false} size="sm" />
          </div>
        </div>
      </div>

      {/* Strengths, Partials, and Missing Evidence Gaps */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-[#98AA9D]/20 flex items-center justify-center text-[#697C70] border border-[#98AA9D]/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D3536]">
              Key Strengths ({candidate.strengths.length})
            </h3>
          </div>
          <ul className="space-y-3">
            {candidate.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2D3536] font-medium leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#697C70] mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Partial Matches */}
        <div className="p-6 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-[#F2EFE2] flex items-center justify-center text-[#5A6765] border border-[#B9C5BE]">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D3536]">
              Partial Matches ({candidate.partialMatches.length})
            </h3>
          </div>
          {candidate.partialMatches.length === 0 ? (
            <p className="text-xs text-[#5A6765] italic">No partial matches flagged.</p>
          ) : (
            <ul className="space-y-3">
              {candidate.partialMatches.map((pm, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-[#F2EFE2]/60 border border-[#D8DFDC] text-xs">
                  <div className="font-bold text-[#2D3536] mb-1">{pm.skill}</div>
                  <div className="text-[#3E4A47] font-medium mb-1">{pm.context}</div>
                  <div className="text-[11px] text-[#5A6765] italic">{pm.note}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Evidence Gaps */}
        <div className="p-6 rounded-2xl bg-white/95 border border-[#D8DFDC] shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-[#C2E9E5]/30 flex items-center justify-center text-[#697C70] border border-[#B3C9D6]">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#2D3536]">
              Evidence Gaps ({candidate.evidenceGaps.length})
            </h3>
          </div>
          {candidate.evidenceGaps.length === 0 ? (
            <p className="text-xs text-[#697C70] font-bold">All core JD requirements verified in resume.</p>
          ) : (
            <ul className="space-y-3">
              {candidate.evidenceGaps.map((gap, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-[#C2E9E5]/20 border border-[#B3C9D6]/60 text-xs">
                  <span className="text-[#3E4A47] leading-relaxed font-semibold">
                    {gap.note}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#2D3536]">
              Skill Coverage Breakdown
            </h2>
            <p className="text-xs text-[#5A6765] font-medium">
              Audited against Job Description technical parameters
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F2EFE2] p-1 rounded-xl border border-[#D8DFDC] text-xs">
            <button
              onClick={() => setActiveSkillTab('required')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeSkillTab === 'required' ? 'bg-[#2D3536] text-[#F2EFE2] shadow-2xs' : 'text-[#5A6765] hover:text-[#2D3536]'
              }`}
            >
              Required ({candidate.skills.required.length})
            </button>
            <button
              onClick={() => setActiveSkillTab('preferred')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeSkillTab === 'preferred' ? 'bg-[#2D3536] text-[#F2EFE2] shadow-2xs' : 'text-[#5A6765] hover:text-[#2D3536]'
              }`}
            >
              Preferred ({candidate.skills.preferred.length})
            </button>
            <button
              onClick={() => setActiveSkillTab('other')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeSkillTab === 'other' ? 'bg-[#2D3536] text-[#F2EFE2] shadow-2xs' : 'text-[#5A6765] hover:text-[#2D3536]'
              }`}
            >
              Other ({candidate.skills.other.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeSkillTab === 'required' && candidate.skills.required.map((skill, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                skill.status === 'strong'
                  ? 'bg-[#98AA9D]/20 border-[#98AA9D]/50 text-[#2D3536]'
                  : skill.status === 'partial'
                  ? 'bg-[#C2E9E5]/25 border-[#B3C9D6] text-[#2D3536]'
                  : 'bg-[#F2EFE2] border-[#D8DFDC] text-[#5A6765]'
              }`}
            >
              <span className="font-bold">{skill.name}</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90">
                {skill.status}
              </span>
            </div>
          ))}

          {activeSkillTab === 'preferred' && candidate.skills.preferred.map((skill, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                skill.status === 'strong'
                  ? 'bg-[#98AA9D]/20 border-[#98AA9D]/50 text-[#2D3536]'
                  : skill.status === 'partial'
                  ? 'bg-[#C2E9E5]/25 border-[#B3C9D6] text-[#2D3536]'
                  : 'bg-[#F2EFE2] border-[#D8DFDC] text-[#5A6765]'
              }`}
            >
              <span className="font-bold">{skill.name}</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90">
                {skill.status}
              </span>
            </div>
          ))}

          {activeSkillTab === 'other' && candidate.skills.other.map((skill, idx) => (
            <span
              key={idx}
              className="p-3 rounded-xl bg-[#F2EFE2]/60 border border-[#D8DFDC] text-xs font-semibold text-[#2D3536]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Why This Candidate Ranked Here (Explanation Card) */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="w-5 h-5 text-[#697C70]" />
          <h2 className="text-base font-bold text-[#2D3536]">
            Why this candidate ranked #{candidate.rank}
          </h2>
        </div>
        <p className="text-sm font-medium text-[#2D3536] leading-relaxed bg-[#F2EFE2]/70 p-5 rounded-xl border border-[#D8DFDC]">
          {candidate.explanation}
        </p>
      </div>

      {/* Concrete Evidence Excerpts */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#2D3536]">
              Extracted Resume Evidence
            </h2>
            <p className="text-xs text-[#5A6765] font-medium">
              Concrete citations and excerpts from {candidate.resumeFilename}
            </p>
          </div>
          <span className="text-xs font-bold text-[#2D3536] bg-[#F2EFE2] border border-[#98AA9D] px-2.5 py-1 rounded-lg">
            {candidate.evidence.length} Citations
          </span>
        </div>

        <div className="space-y-3 mt-4">
          {candidate.evidence.map((ev, idx) => {
            const isExpanded = !!expandedEvidence[ev.id || `ev-${idx}`];
            return (
              <div
                key={ev.id || idx}
                className="rounded-xl border border-[#D8DFDC] bg-white overflow-hidden transition-all hover:border-[#697C70]"
              >
                <div
                  onClick={() => toggleEvidence(ev.id || `ev-${idx}`)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#F2EFE2] text-[#2D3536] font-bold text-[11px] border border-[#B9C5BE]">
                      {ev.relevanceScore}% match
                    </span>
                    <span className="text-xs font-bold text-[#2D3536]">
                      {ev.requirement}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#5A6765] font-medium hidden sm:inline">
                      {ev.sourceSection}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#5A6765]" /> : <ChevronDown className="w-4 h-4 text-[#5A6765]" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-[#F2EFE2]/50 border-t border-[#D8DFDC] text-xs">
                    <blockquote className="text-[#2D3536] italic font-medium leading-relaxed pl-3 border-l-2 border-[#697C70]">
                      {ev.excerpt}
                    </blockquote>
                    <div className="mt-2 text-[11px] text-[#5A6765] font-semibold flex items-center justify-between">
                      <span>Source: {ev.sourceSection}</span>
                      <span>Category: {ev.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Career Timeline */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-[#697C70]" />
          <h2 className="text-base font-bold text-[#2D3536]">
            Career Progression & Education
          </h2>
        </div>

        <div className="relative pl-6 border-l-2 border-[#D8DFDC] space-y-6">
          {candidate.timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#697C70]" />
              <div>
                <span className="text-xs font-bold text-[#697C70]">
                  {item.period}
                </span>
                <h3 className="text-sm font-bold text-[#2D3536] mt-0.5">
                  {item.role}
                </h3>
                <span className="text-xs font-semibold text-[#5A6765]">
                  {item.organization}
                </span>
                <p className="mt-1 text-xs text-[#2D3536] font-medium leading-relaxed">
                  {item.description}
                </p>
                {item.highlightSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.highlightSkills.map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2EFE2] font-bold text-[#2D3536] border border-[#D8DFDC]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
