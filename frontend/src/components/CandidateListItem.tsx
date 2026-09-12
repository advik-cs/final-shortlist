import React from 'react';
import { UnifiedCandidate } from '../types';
import { ChevronRight } from 'lucide-react';

interface CandidateListItemProps {
  candidate: UnifiedCandidate;
  onSelect: (candidate: UnifiedCandidate) => void;
}

export const CandidateListItem: React.FC<CandidateListItemProps> = ({
  candidate,
  onSelect
}) => {
  return (
    <div
      onClick={() => onSelect(candidate)}
      className="group flex items-center justify-between px-4 py-3 bg-white border border-[#E5E7EB] hover:border-[#9B8AFB]/50 hover:bg-[#EDE9FE]/10 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-7 text-xs font-semibold text-[#687080] shrink-0 text-center">
          #{candidate.rank}
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-[#182338] group-hover:text-[#9B8AFB] transition-colors truncate">
            {candidate.name}
          </h4>
          <p className="text-xs text-[#687080] truncate">
            {candidate.currentTitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold text-[#182338]">
            {candidate.finalScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-[#687080] ml-0.5">/100</span>
        </div>

        <div className="w-6 h-6 rounded-lg bg-[#F8F7F4] group-hover:bg-[#EDE9FE] flex items-center justify-center text-[#687080] group-hover:text-[#182338] transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
