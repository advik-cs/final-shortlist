import React, { useState, useRef, useEffect } from 'react';
import { UnifiedCandidate } from '../types';
import { GitCompare, X, Search, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: UnifiedCandidate[];
  onCompare: (c1: UnifiedCandidate, c2: UnifiedCandidate) => void;
  initialCandidateA?: UnifiedCandidate;
  initialCandidateB?: UnifiedCandidate;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  candidates,
  onCompare,
  initialCandidateA,
  initialCandidateB
}) => {
  const [selectedA, setSelectedA] = useState<UnifiedCandidate | null>(initialCandidateA || null);
  const [selectedB, setSelectedB] = useState<UnifiedCandidate | null>(initialCandidateB || null);

  const [inputA, setInputA] = useState<string>(initialCandidateA ? initialCandidateA.name : '');
  const [inputB, setInputB] = useState<string>(initialCandidateB ? initialCandidateB.name : '');

  const [isFocusedA, setIsFocusedA] = useState<boolean>(false);
  const [isFocusedB, setIsFocusedB] = useState<boolean>(false);

  // Sync with initial candidates when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCandidateA) {
        setSelectedA(initialCandidateA);
        setInputA(initialCandidateA.name);
      } else {
        setSelectedA(null);
        setInputA('');
      }

      if (initialCandidateB) {
        setSelectedB(initialCandidateB);
        setInputB(initialCandidateB.name);
      } else {
        setSelectedB(null);
        setInputB('');
      }
    }
  }, [isOpen, initialCandidateA, initialCandidateB]);

  if (!isOpen) return null;

  // Filter candidates matching typed input for blank 1
  const suggestionsA = candidates.filter(c => {
    if (selectedB && c.id === selectedB.id) return false;
    if (!inputA.trim()) return true;
    return c.name.toLowerCase().startsWith(inputA.toLowerCase()) || 
           c.name.toLowerCase().includes(inputA.toLowerCase());
  });

  // Filter candidates matching typed input for blank 2
  const suggestionsB = candidates.filter(c => {
    if (selectedA && c.id === selectedA.id) return false;
    if (!inputB.trim()) return true;
    return c.name.toLowerCase().startsWith(inputB.toLowerCase()) || 
           c.name.toLowerCase().includes(inputB.toLowerCase());
  });

  const handleSelectA = (c: UnifiedCandidate) => {
    setSelectedA(c);
    setInputA(c.name);
    setIsFocusedA(false);
  };

  const handleSelectB = (c: UnifiedCandidate) => {
    setSelectedB(c);
    setInputB(c.name);
    setIsFocusedB(false);
  };

  const handleExecuteCompare = () => {
    if (selectedA && selectedB) {
      onCompare(selectedA, selectedB);
      onClose();
    }
  };

  const canCompare = selectedA && selectedB && selectedA.id !== selectedB.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#2D3536]/70 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#B9C5BE]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#5A6765] hover:text-[#2D3536] hover:bg-[#F2EFE2] rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-md mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F2EFE2] text-[#2D3536] flex items-center justify-center mx-auto mb-3 shadow-xs border border-[#B9C5BE]">
            <GitCompare className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#2D3536]">
            Compare Candidates
          </h3>
          <p className="text-xs sm:text-sm text-[#5A6765] mt-1">
            Type candidate names into the blanks to evaluate head-to-head metrics.
          </p>
        </div>

        {/* The blanks "________ vs ________" interactive zone */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center mb-8">
          {/* First Blank Input */}
          <div className="relative md:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3536] mb-2">
              Candidate 1
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type candidate name..."
                value={inputA}
                onChange={(e) => {
                  setInputA(e.target.value);
                  setSelectedA(null);
                  setIsFocusedA(true);
                }}
                onFocus={() => {
                  setIsFocusedA(true);
                  setIsFocusedB(false);
                }}
                className={`w-full px-4 py-3 bg-[#F2EFE2]/50 border rounded-2xl text-sm font-semibold text-[#2D3536] placeholder-[#8FA396] focus:outline-none transition-all ${
                  selectedA 
                    ? 'border-[#697C70] bg-white ring-2 ring-[#B3C9D6]/30' 
                    : 'border-[#B9C5BE] focus:border-[#697C70] focus:bg-white'
                }`}
              />
              {selectedA ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F2EFE2] text-[#2D3536] border border-[#B9C5BE]">
                    #{selectedA.rank} • {selectedA.finalScore.toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedA(null); setInputA(''); }}
                    className="p-1 hover:bg-[#D8DFDC] rounded-md text-[#5A6765]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA396] pointer-events-none" />
              )}
            </div>

            {/* Dropdown suggestions list matching letter */}
            {isFocusedA && !selectedA && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#B9C5BE] rounded-2xl shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                {suggestionsA.length > 0 ? (
                  suggestionsA.map(candidate => (
                    <div
                      key={candidate.id}
                      onMouseDown={() => handleSelectA(candidate)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F2EFE2] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-center text-xs font-bold text-[#5A6765]">
                          #{candidate.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2D3536] truncate">
                            {candidate.name}
                          </p>
                          <p className="text-[10px] text-[#5A6765] truncate">
                            {candidate.currentTitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2D3536] shrink-0 ml-2">
                        {candidate.finalScore.toFixed(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-[#5A6765]">
                    No candidates matching "{inputA}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-[#2D3536] text-[#F2EFE2] flex items-center justify-center text-xs font-bold shadow-xs">
              VS
            </div>
          </div>

          {/* Second Blank Input */}
          <div className="relative md:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3536] mb-2">
              Candidate 2
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type candidate name..."
                value={inputB}
                onChange={(e) => {
                  setInputB(e.target.value);
                  setSelectedB(null);
                  setIsFocusedB(true);
                }}
                onFocus={() => {
                  setIsFocusedB(true);
                  setIsFocusedA(false);
                }}
                className={`w-full px-4 py-3 bg-[#F2EFE2]/50 border rounded-2xl text-sm font-semibold text-[#2D3536] placeholder-[#8FA396] focus:outline-none transition-all ${
                  selectedB 
                    ? 'border-[#697C70] bg-white ring-2 ring-[#B3C9D6]/30' 
                    : 'border-[#B9C5BE] focus:border-[#697C70] focus:bg-white'
                }`}
              />
              {selectedB ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F2EFE2] text-[#2D3536] border border-[#B9C5BE]">
                    #{selectedB.rank} • {selectedB.finalScore.toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedB(null); setInputB(''); }}
                    className="p-1 hover:bg-[#D8DFDC] rounded-md text-[#5A6765]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA396] pointer-events-none" />
              )}
            </div>

            {/* Dropdown suggestions list matching letter */}
            {isFocusedB && !selectedB && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto bg-white border border-[#B9C5BE] rounded-2xl shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                {suggestionsB.length > 0 ? (
                  suggestionsB.map(candidate => (
                    <div
                      key={candidate.id}
                      onMouseDown={() => handleSelectB(candidate)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F2EFE2] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-center text-xs font-bold text-[#5A6765]">
                          #{candidate.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2D3536] truncate">
                            {candidate.name}
                          </p>
                          <p className="text-[10px] text-[#5A6765] truncate">
                            {candidate.currentTitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2D3536] shrink-0 ml-2">
                        {candidate.finalScore.toFixed(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-[#5A6765]">
                    No candidates matching "{inputB}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual Preview of selected pair if chosen */}
        {selectedA && selectedB && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-[#F2EFE2]/60 border border-[#B9C5BE] flex items-center justify-between gap-4 mb-6 shadow-2xs"
          >
            <div className="text-left">
              <span className="text-[11px] text-[#5A6765] font-semibold block">Candidate A</span>
              <span className="text-sm font-bold text-[#2D3536]">
                {selectedA.name}
              </span>
              <span className="text-xs text-[#5A6765] block">
                Score: {selectedA.finalScore.toFixed(1)}/100
              </span>
            </div>

            <div className="text-xs font-bold text-[#2D3536] px-3 py-1 rounded-full bg-[#B3C9D6]/40 border border-[#B3C9D6]">
              Differential: {Math.abs(selectedA.finalScore - selectedB.finalScore).toFixed(1)} pts
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#5A6765] font-semibold block">Candidate B</span>
              <span className="text-sm font-bold text-[#2D3536]">
                {selectedB.name}
              </span>
              <span className="text-xs text-[#5A6765] block">
                Score: {selectedB.finalScore.toFixed(1)}/100
              </span>
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8DFDC]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#B9C5BE] text-xs sm:text-sm font-semibold text-[#5A6765] hover:bg-[#F2EFE2] hover:text-[#2D3536] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canCompare}
            onClick={handleExecuteCompare}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs ${
              canCompare
                ? 'bg-[#2D3536] text-[#F2EFE2] hover:bg-[#3E4A47] hover:gap-2.5 cursor-pointer'
                : 'bg-[#D8DFDC] text-[#8FA396] cursor-not-allowed'
            }`}
          >
            <span>Compare Now</span>
            <ArrowRight className="w-4 h-4 text-[#98AA9D]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
