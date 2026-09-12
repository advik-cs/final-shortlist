import React, { useState, useRef, useEffect } from 'react';
import { UnifiedCandidate } from '../types';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface CandidateComboboxProps {
  candidates: UnifiedCandidate[];
  selectedCandidate: UnifiedCandidate | null;
  onSelect: (candidate: UnifiedCandidate) => void;
  disabledCandidateId?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const CandidateCombobox: React.FC<CandidateComboboxProps> = ({
  candidates,
  selectedCandidate,
  onSelect,
  disabledCandidateId,
  label,
  placeholder = 'Type candidate name or select...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedCandidate ? selectedCandidate.name : '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal query string whenever selectedCandidate changes
  useEffect(() => {
    if (selectedCandidate) {
      setQuery(selectedCandidate.name);
    } else {
      setQuery('');
    }
  }, [selectedCandidate]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to match selected candidate if user typed something but didn't pick
        if (selectedCandidate) {
          setQuery(selectedCandidate.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCandidate]);

  // Filter candidates based on typed text
  const filteredCandidates = candidates.filter(candidate => {
    if (disabledCandidateId && candidate.id === disabledCandidateId) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      candidate.name.toLowerCase().includes(q) ||
      candidate.currentTitle.toLowerCase().includes(q) ||
      `#${candidate.rank}`.includes(q)
    );
  });

  const handleSelect = (candidate: UnifiedCandidate) => {
    onSelect(candidate);
    setQuery(candidate.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3536] mb-1.5">
          {label}
        </label>
      )}

      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`group relative flex items-center w-full rounded-xl border bg-white transition-all duration-150 shadow-2xs cursor-text ${
          isOpen
            ? 'border-[#697C70] ring-2 ring-[#B3C9D6]/30'
            : 'border-[#B9C5BE] hover:border-[#697C70]'
        }`}
      >
        <div className="pl-3.5 pr-2 py-2.5 flex items-center text-[#5A6765]">
          <Search className="w-4 h-4 text-[#8FA396] group-hover:text-[#697C70] transition-colors" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full py-2.5 pr-14 text-xs sm:text-sm font-semibold text-[#2D3536] placeholder-[#8FA396] bg-transparent focus:outline-none"
        />

        {/* Right action icons (Clear or Chevron) */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-[#8FA396] hover:text-[#2D3536] hover:bg-[#F2EFE2] transition-colors cursor-pointer"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(prev => !prev);
            }}
            className="p-1 text-[#8FA396] hover:text-[#2D3536] transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Options matching clean, professional aesthetic */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-[#B9C5BE] rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map(candidate => {
              const isSelected = selectedCandidate?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => handleSelect(candidate)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#F2EFE2] text-[#2D3536]'
                      : 'hover:bg-[#F2EFE2]/60 text-[#2D3536]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#F2EFE2] flex items-center justify-center text-xs font-bold text-[#2D3536] shrink-0 border border-[#B9C5BE]">
                      #{candidate.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#2D3536] truncate">
                        {candidate.name}
                      </p>
                      <p className="text-[11px] text-[#5A6765] truncate">
                        {candidate.currentTitle} • {candidate.experienceYears} yrs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-extrabold text-[#2D3536] bg-white px-2 py-0.5 rounded-md border border-[#D8DFDC] shadow-2xs">
                      {candidate.finalScore.toFixed(1)}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#697C70]" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-[#5A6765]">
              No candidate found matching "<span className="font-semibold text-[#2D3536]">{query}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
