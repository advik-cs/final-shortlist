import React, { useRef, useState, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';

export type SortOption = 'score' | 'semantic' | 'keyword' | 'experience';

interface CustomSortDropdownProps {
  value: SortOption;
  onChange: (val: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; desc: string }[] = [
  { value: 'score', label: 'Final Score', desc: 'Weighted overall performance' },
  { value: 'semantic', label: 'Semantic Match', desc: 'Deep contextual fit' },
  { value: 'keyword', label: 'Exact Keyword Match', desc: 'Exact text concordance' },
  { value: 'experience', label: 'Experience Level', desc: 'Years & leadership scope' }
];

export const CustomSortDropdown: React.FC<CustomSortDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0 w-full sm:w-auto">
      {/* Trigger Button styled perfectly with theme */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto inline-flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#6366F1] rounded-xl text-xs sm:text-sm font-medium text-[#0F172A] transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EEF2FF]"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#6366F1]" />
          <span className="text-[#64748B]">Sort:</span>
          <span className="font-bold text-[#0F172A]">{selectedOption.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#6366F1]' : ''}`} />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Sort Candidates By
          </div>
          <div className="space-y-1 mt-1">
            {sortOptions.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF2FF] text-[#0F172A]'
                      : 'hover:bg-[#F8FAFC] text-[#1E293B]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{option.label}</p>
                    <p className="text-[10px] text-[#64748B]">{option.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
