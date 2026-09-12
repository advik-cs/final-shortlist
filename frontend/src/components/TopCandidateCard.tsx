import React from 'react';
import { UnifiedCandidate } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ScoreBar } from './ScoreBar';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

interface TopCandidateCardProps {
  candidate: UnifiedCandidate;
  isFirst: boolean;
  onSelect: (candidate: UnifiedCandidate) => void;
}

export const TopCandidateCard: React.FC<TopCandidateCardProps> = ({
  candidate,
  isFirst,
  onSelect
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 transition-all duration-200 shadow-xs border ${
        isFirst
          ? 'border-[#9B8AFB]/70 ring-2 ring-[#EDE9FE] shadow-sm'
          : 'border-[#E5E7EB] hover:border-[#9B8AFB]/40'
      }`}
    >
      {/* Top Banner Tag for #1 */}
      {isFirst && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[#182338] px-3 py-0.5 text-[11px] font-medium text-white shadow-xs">
          <Sparkles className="w-3 h-3 text-[#9B8AFB]" />
          <span>Top Candidate Match</span>
        </div>
      )}

      <div>
        {/* Header: Rank + Name + Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm shrink-0 ${
                candidate.rank === 1
                  ? 'bg-[#182338] text-[#9B8AFB]'
                  : candidate.rank === 2
                  ? 'bg-[#EDE9FE] text-[#182338]'
                  : 'bg-[#F8F7F4] text-[#687080] border border-[#E5E7EB]'
              }`}
            >
              #{candidate.rank}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#182338] hover:text-[#9B8AFB] transition-colors cursor-pointer" onClick={() => onSelect(candidate)}>
                {candidate.name}
              </h3>
              <p className="text-xs text-[#687080] font-normal line-clamp-1">
                {candidate.currentTitle} • {candidate.experienceYears}y exp
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-bold tracking-tight text-[#182338]">
                {candidate.finalScore.toFixed(1)}
              </span>
              <span className="text-xs text-[#687080]">/100</span>
            </div>
            <div className="mt-0.5">
              <ConfidenceBadge confidence={candidate.confidence} size="sm" />
            </div>
          </div>
        </div>

        {/* Core Metric Mini-Bars */}
        <div className="mt-5 space-y-2.5 pt-4 border-t border-[#E5E7EB]">
          <ScoreBar label="Semantic Match" value={candidate.semanticScore} color="#9B8AFB" size="sm" />
          <ScoreBar label="Exact Keyword Match" value={candidate.bm25Score} color="#182338" size="sm" />
          <ScoreBar label="Skill Coverage" value={candidate.skillCoverage} color="#3FA66B" size="sm" />
        </div>

        {/* Short Explanation Quote */}
        <p className="mt-4 text-xs text-[#20242C] bg-[#F8F7F4] p-3 rounded-xl border border-[#E5E7EB] line-clamp-2 leading-relaxed italic">
          "{candidate.explanation}"
        </p>

        {/* Strengths, Partial Matches & Gaps Summary */}
        <div className="mt-4 space-y-2 text-xs">
          {/* Strongest area */}
          {candidate.strengths.length > 0 && (
            <div className="flex items-start gap-1.5 text-[#3FA66B]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="text-[#20242C] line-clamp-1">
                <strong className="text-[#3FA66B] font-medium">Strength:</strong> {candidate.strengths[0]}
              </span>
            </div>
          )}

          {/* Partial Match */}
          {candidate.partialMatches.length > 0 && (
            <div className="flex items-start gap-1.5 text-[#D6A343]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="text-[#20242C] line-clamp-1">
                <strong className="text-[#D6A343] font-medium">Partial:</strong> {candidate.partialMatches[0].skill} ({candidate.partialMatches[0].context})
              </span>
            </div>
          )}

          {/* Evidence Gap (strict wording) */}
          {candidate.evidenceGaps.length > 0 && (
            <div className="flex items-start gap-1.5 text-[#D76565]">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="text-[#20242C] line-clamp-1">
                <strong className="text-[#D76565] font-medium">Gap:</strong> {candidate.evidenceGaps[0].note}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
        <span className="text-[11px] text-[#687080]">
          {candidate.evidence.length} evidence excerpts
        </span>
        <button
          onClick={() => onSelect(candidate)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
            isFirst
              ? 'bg-[#182338] text-white hover:bg-[#20242C]'
              : 'border border-[#E5E7EB] bg-white text-[#182338] hover:bg-[#F8F7F4]'
          }`}
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#9B8AFB]" />
        </button>
      </div>
    </motion.div>
  );
};
