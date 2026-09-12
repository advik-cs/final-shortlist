import React from 'react';
import { UnifiedCandidate } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ScoreBar } from './ScoreBar';
import { 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface CandidateVerticalCardProps {
  candidate: UnifiedCandidate;
  isFirst: boolean;
  onSelect: (candidate: UnifiedCandidate) => void;
  onOpenCompareWith?: (candidate: UnifiedCandidate) => void;
}

export const CandidateVerticalCard: React.FC<CandidateVerticalCardProps> = ({
  candidate,
  isFirst,
  onSelect,
}) => {
  const isTop3 = candidate.rank <= 3;

  // COMPACT VIEW FOR CANDIDATES RANK #4 AND BEYOND
  // Explicit User Requirement: "in the ranking system mention key strength gap of only top 3 and only the rank name and score of remaining candidates"
  if (!isTop3) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1, transition: { duration: 0.12 } }}
        onClick={() => onSelect(candidate)}
        className="group relative flex items-center justify-between rounded-xl bg-white/95 px-4 sm:px-6 py-3.5 border border-[#D8DFDC] hover:border-[#697C70] shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer"
      >
        {/* Left: Rank and Candidate Name */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2EFE2] font-bold text-sm text-[#5A6765] border border-[#D8DFDC] shrink-0">
            #{candidate.rank}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-[#2D3536] group-hover:text-[#697C70] transition-colors truncate">
              {candidate.name}
            </h4>
            <p className="text-xs text-[#64736E] truncate">
              {candidate.currentTitle} • {candidate.experienceYears} yrs exp
            </p>
          </div>
        </div>

        {/* Right: Score and Quick View Action */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#64736E] block font-medium">Score</span>
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-lg sm:text-xl font-bold text-[#2D3536]">
                {candidate.finalScore.toFixed(1)}
              </span>
              <span className="text-xs text-[#64736E]">/100</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#F2EFE2] group-hover:bg-[#98AA9D]/30 group-hover:text-[#2D3536] text-[#8FA396] flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    );
  }

  // DETAILED VIEW FOR TOP 3 CANDIDATES
  // Includes Rank, Name, Score, Explanation, Key Strength, and Gap
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`relative rounded-2xl bg-white/95 backdrop-blur-sm p-5 sm:p-6 transition-all duration-200 border shadow-2xs ${
        isFirst
          ? 'border-[#2D3536] ring-2 ring-[#B3C9D6]/40 shadow-xs'
          : 'border-[#D8DFDC] hover:border-[#697C70]'
      }`}
    >
      {/* Top Banner Tag for #1 */}
      {isFirst && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[#2D3536] px-3.5 py-0.5 text-xs font-semibold text-[#F2EFE2] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#B3C9D6]" />
          <span>Top Rank Candidate</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Column: Rank + Identity + Title + Clear High-Contrast Explanation + Strength + Gap */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Rank Badge */}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl font-extrabold text-lg shrink-0 shadow-2xs ${
              candidate.rank === 1
                ? 'bg-[#2D3536] text-[#F2EFE2]'
                : candidate.rank === 2
                ? 'bg-[#F2EFE2] text-[#2D3536] border border-[#98AA9D]'
                : 'bg-white text-[#5A6765] border border-[#D8DFDC]'
            }`}
          >
            #{candidate.rank}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 
                className="text-lg sm:text-xl font-bold text-[#2D3536] hover:text-[#697C70] transition-colors cursor-pointer truncate"
                onClick={() => onSelect(candidate)}
              >
                {candidate.name}
              </h3>
              <ConfidenceBadge confidence={candidate.confidence} size="sm" />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F2EFE2] text-[#2D3536] border border-[#D8DFDC]">
                Top 3 Cohort
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-[#5A6765] mt-0.5 font-medium">
              {candidate.currentTitle} • {candidate.experienceYears} yrs experience
            </p>

            {/* Explanation Quote with High Contrast & Crystal-Clear Visibility */}
            <div className="mt-3 p-3.5 rounded-xl bg-[#F2EFE2]/70 border border-[#D8DFDC]">
              <p className="text-xs font-medium text-[#2D3536] leading-relaxed">
                <span className="font-semibold text-[#2D3536]">Assessment: </span>
                {candidate.explanation}
              </p>
            </div>

            {/* Key Strength and Gap specifically for Top 3 */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {candidate.strengths.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#98AA9D]/15 border border-[#98AA9D]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#697C70] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[#2D3536] block text-[11px] uppercase tracking-wider">
                      Key Strength
                    </span>
                    <span className="text-[#3E4A47] font-medium leading-tight line-clamp-2">
                      {candidate.strengths[0]}
                    </span>
                  </div>
                </div>
              )}

              {candidate.evidenceGaps.length > 0 ? (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#C2E9E5]/25 border border-[#B3C9D6]/50">
                  <HelpCircle className="w-4 h-4 text-[#697C70] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[#2D3536] block text-[11px] uppercase tracking-wider">
                      Identified Gap
                    </span>
                    <span className="text-[#4E5B58] font-medium leading-tight line-clamp-2">
                      {candidate.evidenceGaps[0].note}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F2EFE2] border border-[#D8DFDC]">
                  <CheckCircle2 className="w-4 h-4 text-[#697C70] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-[#2D3536] block text-[11px] uppercase tracking-wider">
                      Identified Gap
                    </span>
                    <span className="text-[#5A6765] font-medium leading-tight">
                      No critical technical gaps identified
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Metric Progress Bars */}
        <div className="w-full lg:w-64 space-y-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-5 border-[#D8DFDC]">
          <ScoreBar label="Semantic Match" value={candidate.semanticScore} color="#697C70" size="sm" />
          <ScoreBar label="Exact Keyword Match" value={candidate.bm25Score} color="#2D3536" size="sm" />
          <ScoreBar label="Skill Coverage" value={candidate.skillCoverage} color="#98AA9D" size="sm" />
        </div>

        {/* Right Column: Score Display & Action CTA */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-5 border-[#D8DFDC] min-w-[130px]">
          <div className="text-left lg:text-right">
            <span className="text-[11px] text-[#5A6765] font-semibold uppercase tracking-wider block">
              Match Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D3536]">
                {candidate.finalScore.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-[#5A6765]">/100</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(candidate)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isFirst
                ? 'bg-[#2D3536] text-[#F2EFE2] hover:bg-[#3D4748]'
                : 'border border-[#B9C5BE] bg-white text-[#2D3536] hover:bg-[#F2EFE2]'
            }`}
          >
            <span>View Profile</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#697C70]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
