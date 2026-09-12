import React, { useState, useEffect } from 'react';
import { UnifiedCandidate } from '../types';
import { compareCandidates } from '../services/api';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ScoreBar } from './ScoreBar';
import { CompareModal } from './CompareModal';
import { CandidateCombobox } from './CandidateCombobox';
import { 
  GitCompare, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CandidateComparisonProps {
  candidates: UnifiedCandidate[];
  initialCandidateA?: UnifiedCandidate;
  initialCandidateB?: UnifiedCandidate;
  rawCandidates?: any[];
  rawJdParsed?: any;
  onSelectCandidate: (candidate: UnifiedCandidate) => void;
}

export const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  candidates,
  initialCandidateA,
  initialCandidateB,
  rawCandidates,
  rawJdParsed,
  onSelectCandidate
}) => {
  const [candidateAId, setCandidateAId] = useState<string>(
    initialCandidateA?.id || candidates[0]?.id || ''
  );
  const [candidateBId, setCandidateBId] = useState<string>(
    initialCandidateB?.id || candidates[1]?.id || ''
  );
  const [showWhyADetails, setShowWhyADetails] = useState(true);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [differentiator, setDifferentiator] = useState<string | null>(null);

  const candidateA = candidates.find(c => c.id === candidateAId) || candidates[0];
  const candidateB = candidates.find(c => c.id === candidateBId) || candidates[1];

  React.useEffect(() => {
    if (!rawCandidates || rawCandidates.length < 2) return;
    const rawA = rawCandidates.find((c: any) => (c.candidate_id || c.id) === candidateA?.id);
    const rawB = rawCandidates.find((c: any) => (c.candidate_id || c.id) === candidateB?.id);
    if (!rawA || !rawB) return;

    compareCandidates({
      candidate_a: rawA,
      candidate_b: rawB,
      jd_parsed: rawJdParsed
    }).then(res => {
      if (res.differentiator_sentence) {
        setDifferentiator(res.differentiator_sentence);
      }
    }).catch(() => {});
  }, [candidateA?.id, candidateB?.id, rawCandidates, rawJdParsed]);

  const handleSwap = () => {
    setCandidateAId(candidateB.id);
    setCandidateBId(candidateA.id);
  };

  const handleModalCompare = (c1: UnifiedCandidate, c2: UnifiedCandidate) => {
    setCandidateAId(c1.id);
    setCandidateBId(c2.id);
  };

  // Determine which candidate ranks higher
  const aRanksHigher = candidateA.finalScore >= candidateB.finalScore;
  const higher = aRanksHigher ? candidateA : candidateB;
  const lower = aRanksHigher ? candidateB : candidateA;
  const higherLabel = aRanksHigher ? 'Candidate A' : 'Candidate B';
  const lowerLabel = aRanksHigher ? 'Candidate B' : 'Candidate A';

  // Compute metric advantages
  const scoreDiff = Math.abs(higher.finalScore - lower.finalScore).toFixed(1);
  const semanticDiff = higher.semanticScore - lower.semanticScore;
  const keywordDiff = higher.bm25Score - lower.bm25Score;
  const skillDiff = higher.skillCoverage - lower.skillCoverage;
  const expDiff = higher.experienceScore - lower.experienceScore;

  // Find skill differences
  const higherMissingSkills = higher.skills.required.filter(s => s.status === 'missing').map(s => s.name);
  const lowerMissingSkills = lower.skills.required.filter(s => s.status === 'missing').map(s => s.name);
  const uniqueToHigher = higher.skills.required.filter(
    hs => hs.status === 'strong' && lower.skills.required.some(ls => ls.name === hs.name && ls.status !== 'strong')
  ).map(s => s.name);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D8DFDC]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#697C70] uppercase tracking-wider mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Head-to-Head Evaluation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3536]">
            Compare Candidates
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6765] mt-1 font-medium">
            Side-by-side metric differential and evidence-backed variance analysis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-[#B9C5BE] hover:border-[#697C70] px-4 py-2 text-xs font-bold text-[#2D3536] transition-colors cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-[#697C70]" />
            <span>Select Pair (____ vs ____)</span>
          </button>

          <button
            onClick={handleSwap}
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-[#B9C5BE] px-4 py-2 text-xs font-bold text-[#2D3536] hover:border-[#697C70] transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#697C70]" />
            <span>Swap Sides</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate A Selector */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-5 shadow-2xs">
          <CandidateCombobox
            label="Candidate A"
            candidates={candidates}
            selectedCandidate={candidateA}
            onSelect={(c) => setCandidateAId(c.id)}
            disabledCandidateId={candidateB.id}
            placeholder="Type name or search Candidate A..."
          />
        </div>

        {/* Candidate B Selector */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-5 shadow-2xs">
          <CandidateCombobox
            label="Candidate B"
            candidates={candidates}
            selectedCandidate={candidateB}
            onSelect={(c) => setCandidateBId(c.id)}
            disabledCandidateId={candidateA.id}
            placeholder="Type name or search Candidate B..."
          />
        </div>
      </div>

      {/* Side-by-Side Candidate Overview Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[candidateA, candidateB].map((c, idx) => {
          const isA = idx === 0;
          const isWinner = c.id === higher.id;
          return (
            <div
              key={c.id}
              className={`rounded-2xl bg-white/95 backdrop-blur-sm p-6 border transition-all ${
                isWinner
                  ? 'border-[#697C70] ring-2 ring-[#B3C9D6]/30 shadow-xs'
                  : 'border-[#D8DFDC] shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#697C70]">
                      {isA ? 'Candidate A' : 'Candidate B'}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#98AA9D]/20 text-[#2D3536] border border-[#98AA9D]/50">
                        Higher Rank
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#2D3536] mt-1">
                    {c.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#5A6765]">{c.currentTitle} • {c.experienceYears} yrs</p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[#2D3536]">
                    {c.finalScore.toFixed(1)}
                  </div>
                  <ConfidenceBadge confidence={c.confidence} size="sm" />
                </div>
              </div>

              {/* Dimension Metrics */}
              <div className="mt-6 space-y-3 pt-4 border-t border-[#D8DFDC]">
                <ScoreBar label="Semantic Match" value={c.semanticScore} color="#697C70" size="sm" />
                <ScoreBar label="Exact Keyword Match" value={c.bm25Score} color="#2D3536" size="sm" />
                <ScoreBar label="Skill Coverage" value={c.skillCoverage} color="#98AA9D" size="sm" />
                <ScoreBar label="Experience Relevance" value={c.experienceScore} color="#5A6765" size="sm" />
              </div>

              <button
                onClick={() => onSelectCandidate(c)}
                className="mt-6 w-full py-2.5 rounded-xl border border-[#B9C5BE] text-xs font-bold text-[#2D3536] hover:bg-[#F2EFE2] transition-colors cursor-pointer shadow-2xs"
              >
                Inspect Full Profile
              </button>
            </div>
          );
        })}
      </div>

      {/* WHY A > B INTERACTION */}
      <div className="mt-8 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D8DFDC] p-6 sm:p-8 shadow-xs">
        <div 
          onClick={() => setShowWhyADetails(!showWhyADetails)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F2EFE2] flex items-center justify-center text-[#697C70] border border-[#B9C5BE]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D3536]">
                Why does {higher.name} ({higherLabel}) rank higher?
              </h2>
              <p className="text-xs text-[#5A6765] font-medium">
                +{scoreDiff} point differential • Evidence-backed breakdown
              </p>
            </div>
          </div>

          <div className="text-[#5A6765]">
            {showWhyADetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-[#5A6765]" />}
          </div>
        </div>

        <AnimatePresence>
          {showWhyADetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 space-y-4 pt-6 border-t border-[#D8DFDC] overflow-hidden"
            >
              {/* Backend AI Differentiator */}
              {differentiator && (
                <div className="p-4 rounded-xl bg-[#0F172A] text-white border border-[#334155] shadow-xs">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#818CF8] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
                    <span>AI Comparative Differentiator</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F1F5F9] font-medium leading-relaxed">
                    {differentiator}
                  </p>
                </div>
              )}

              {/* Summary Paragraph */}
              <div className="p-4 rounded-xl bg-[#F2EFE2]/60 border border-[#D8DFDC]">
                <p className="text-xs sm:text-sm text-[#2D3536] font-medium leading-relaxed">
                  <strong className="text-[#2D3536] font-bold">{higher.name}</strong> outscores <strong className="text-[#2D3536] font-bold">{lower.name}</strong> by <span className="font-bold text-[#697C70]">+{scoreDiff} points</span>. 
                  {semanticDiff > 0 ? ` ${higher.name} demonstrates superior contextual semantic alignment (+${semanticDiff}%).` : ''}
                  {keywordDiff > 0 ? ` ${higher.name} contains denser direct keyword phrasing (+${keywordDiff}%).` : ''}
                  {skillDiff > 0 ? ` Additionally, ${higher.name} matches more required competencies (+${skillDiff}%).` : ''}
                </p>
              </div>

              {/* Metric Difference Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#F2EFE2]/50 border border-[#D8DFDC]">
                  <span className="text-[11px] text-[#5A6765] font-semibold block">Semantic Edge</span>
                  <span className={`text-base font-bold ${semanticDiff >= 0 ? 'text-[#2D3536]' : 'text-[#8FA396]'}`}>
                    {semanticDiff > 0 ? `+${semanticDiff}%` : `${semanticDiff}%`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F2EFE2]/50 border border-[#D8DFDC]">
                  <span className="text-[11px] text-[#5A6765] font-semibold block">Exact Keyword Edge</span>
                  <span className={`text-base font-bold ${keywordDiff >= 0 ? 'text-[#2D3536]' : 'text-[#8FA396]'}`}>
                    {keywordDiff > 0 ? `+${keywordDiff}%` : `${keywordDiff}%`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F2EFE2]/50 border border-[#D8DFDC]">
                  <span className="text-[11px] text-[#5A6765] font-semibold block">Skill Edge</span>
                  <span className={`text-base font-bold ${skillDiff >= 0 ? 'text-[#697C70]' : 'text-[#8FA396]'}`}>
                    {skillDiff > 0 ? `+${skillDiff}%` : `${skillDiff}%`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F2EFE2]/50 border border-[#D8DFDC]">
                  <span className="text-[11px] text-[#5A6765] font-semibold block">Tenure Edge</span>
                  <span className={`text-base font-bold ${expDiff >= 0 ? 'text-[#2D3536]' : 'text-[#8FA396]'}`}>
                    {expDiff > 0 ? `+${expDiff}%` : `${expDiff}%`}
                  </span>
                </div>
              </div>

              {/* Unique Competencies */}
              {uniqueToHigher.length > 0 && (
                <div className="p-4 rounded-xl bg-[#98AA9D]/20 border border-[#98AA9D]/50">
                  <span className="text-xs font-bold text-[#2D3536] block mb-1">
                    Verified Competencies Unique to {higher.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uniqueToHigher.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-white/90 font-bold text-xs text-[#2D3536] border border-[#B9C5BE] shadow-2xs">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Head to Head Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        candidates={candidates}
        onCompare={handleModalCompare}
        initialCandidateA={candidateA}
        initialCandidateB={candidateB}
      />
    </div>
  );
};
