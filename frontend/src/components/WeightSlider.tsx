import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sliders, Sparkles, Binary } from 'lucide-react';
import { motion } from 'motion/react';

interface WeightSliderProps {
  semanticWeight: number; // 0 to 100 (Exact Keyword weight is 100 - semanticWeight)
  onChange: (value: number) => void;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({
  semanticWeight,
  onChange
}) => {
  const keywordWeight = 100 - semanticWeight;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Quick preset ratios
  const presets = [
    { label: 'Semantic Focus', s: 80 },
    { label: 'Balanced 50/50', s: 50 },
    { label: 'Keyword Focus', s: 20 }
  ];

  // Calculate percentage based on pointer coordinate
  const updateWeightFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.round(Math.max(0, Math.min(100, raw)));
    onChange(clamped);
  }, [onChange]);

  // Pointer drag listeners attached to window for smooth dragging even outside container
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateWeightFromPointer(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      updateWeightFromPointer(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-[#D8DFDC] bg-[#F2EFE2]/95 backdrop-blur-sm p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 select-none"
    >
      {/* Dynamic Ambient Background Glow that responds smoothly to slider */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 blur-3xl transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${semanticWeight}% 50%, #98AA9D, transparent 65%)`
        }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#2D3536] flex items-center justify-center text-[#F2EFE2] shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-[#B3C9D6]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3536]">
              Scoring Weight Engine
            </span>
            <span className="text-[10px] text-[#5A6765] block sm:hidden">
              Adjust balance dynamically
            </span>
          </div>
        </div>

        {/* Dynamic Badges with smooth pill indicators */}
        <div className="flex items-center gap-2 text-xs">
          <motion.div 
            animate={{ scale: semanticWeight >= 50 ? 1.03 : 1 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all ${
              semanticWeight >= 50 
                ? 'bg-white text-[#2D3536] border border-[#697C70] shadow-2xs' 
                : 'bg-white/60 text-[#5A6765] border border-[#D8DFDC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#697C70]" />
            <span className="text-[11px] font-medium">Semantic:</span>
            <span className="font-bold text-[#2D3536]">{semanticWeight}%</span>
          </motion.div>

          <span className="text-[#98AA9D] font-bold">:</span>

          <motion.div 
            animate={{ scale: keywordWeight >= 50 ? 1.03 : 1 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all ${
              keywordWeight >= 50 
                ? 'bg-[#2D3536] text-[#F2EFE2] shadow-2xs' 
                : 'bg-white/60 text-[#5A6765] border border-[#D8DFDC]'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-[#B3C9D6]" />
            <span className="text-[11px] font-medium">Exact Keyword:</span>
            <span className="font-bold">{keywordWeight}%</span>
          </motion.div>
        </div>
      </div>

      {/* Interactive Slider Bar Area - Direct pointer drag & touch on whole bar & knob */}
      <div className="relative z-10 pt-4 pb-2 px-1">
        {/* Track Container & Click/Drag target */}
        <div 
          ref={trackRef}
          onPointerDown={handlePointerDown}
          className="relative w-full h-8 flex items-center cursor-pointer touch-none"
        >
          {/* Visual Track */}
          <div className="relative w-full h-3.5 bg-[#D8DFDC] rounded-full overflow-hidden border border-[#B9C5BE] shadow-inner">
            {/* Animated active filled region with shimmer shine */}
            <div 
              className="h-full bg-gradient-to-r from-[#697C70] via-[#98AA9D] to-[#B3C9D6] relative shadow-xs"
              style={{ width: `${semanticWeight}%` }}
            >
              {/* Shimmer highlight on the region */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          </div>

          {/* Draggable Dot / Thumb element */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 pointer-events-none"
            style={{ 
              left: `calc(${semanticWeight}% - 14px)`
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Soft glow aura when dragging or hovering */}
              <div className={`absolute w-10 h-10 rounded-full bg-[#98AA9D]/35 transition-all duration-150 ${
                isDragging ? 'scale-125 opacity-100' : 'scale-90 opacity-70'
              }`} />
              
              {/* Main Knob Dot */}
              <div className={`w-7 h-7 rounded-full bg-[#F2EFE2] border-2 border-[#2D3536] shadow-md flex items-center justify-center transition-transform duration-100 ${
                isDragging ? 'scale-115 ring-4 ring-[#697C70]/25' : 'scale-100 hover:scale-110'
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#2D3536]" />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Accessible native input for keyboard accessibility (arrow keys) */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={semanticWeight}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sr-only"
          aria-label="Semantic vs Exact Keyword Weight Slider"
        />

        {/* Preset & Label Sub-bar clearly separated beneath thumb */}
        <div className="flex justify-between items-center text-xs text-[#5A6765] mt-3 font-medium select-none">
          <span className={`transition-colors ${semanticWeight >= 60 ? 'text-[#2D3536] font-bold' : ''}`}>
            ← High Semantic Context
          </span>

          {/* Quick preset buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.s)}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  semanticWeight === p.s
                    ? 'border-[#2D3536] bg-[#2D3536] text-[#F2EFE2] font-bold shadow-2xs'
                    : 'border-[#D8DFDC] hover:bg-white text-[#5A6765]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <span className={`transition-colors ${keywordWeight >= 60 ? 'text-[#2D3536] font-bold' : ''}`}>
            Exact Keyword Match →
          </span>
        </div>
      </div>
    </div>
  );
};
