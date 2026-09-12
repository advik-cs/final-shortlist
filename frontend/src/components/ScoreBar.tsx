import React from 'react';

interface ScoreBarProps {
  label: string;
  value: number; // 0 - 100
  color?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  value,
  color = '#697C70',
  showPercent = true,
  size = 'md'
}) => {
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#5A6765] font-semibold">{label}</span>
        {showPercent && (
          <span className="text-[#2D3536] font-bold">{Math.round(value)}%</span>
        )}
      </div>
      <div className={`w-full bg-[#D8DFDC] ${heightClass} rounded-full overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
