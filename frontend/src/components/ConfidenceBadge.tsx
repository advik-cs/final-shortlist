import React from 'react';
import { ConfidenceInfo } from '../types';
import { ShieldCheck, AlertCircle, ShieldAlert } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: ConfidenceInfo;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, size = 'sm' }) => {
  const isHigh = confidence.level === 'High';
  const isMedium = confidence.level === 'Medium';

  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (isHigh) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-[#98AA9D]/20 text-[#2D3536] font-semibold border border-[#98AA9D]/50 ${textClass}`}>
        <ShieldCheck className={`${iconClass} text-[#697C70]`} />
        <span>High Confidence</span>
      </span>
    );
  }

  if (isMedium) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-[#B3C9D6]/30 text-[#2D3536] font-semibold border border-[#B3C9D6]/60 ${textClass}`}>
        <AlertCircle className={`${iconClass} text-[#5A6765]`} />
        <span>Medium Confidence</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-[#F2EFE2] text-[#5A6765] font-semibold border border-[#D8DFDC] ${textClass}`}>
      <ShieldAlert className={`${iconClass} text-[#8FA396]`} />
      <span>Low Confidence</span>
    </span>
  );
};
