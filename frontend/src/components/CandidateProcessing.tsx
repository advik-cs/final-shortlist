import React, { useEffect, useState } from 'react';
import { Check, Loader2, Users, ArrowRight, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UnifiedCandidate } from '../types';
import { analyzeCandidates, getSampleData } from '../services/api';
import { adaptBackendCandidates } from '../services/adapter';

interface CandidateProcessingProps {
  files: File[];
  useSample: boolean;
  rawJdParsed: any;
  onComplete: (candidates: UnifiedCandidate[], rawCandidates: any[]) => void;
  onBackToUpload: () => void;
}

const processingStages = [
  'Extracting resume text via pdfplumber',
  'Parsing technical competencies & work history',
  'Computing exact lexical BM25 match',
  'Executing local sentence embeddings (all-MiniLM-L6-v2)',
  'Extracting verbatim grounding evidence',
  'Applying multi-dimensional ranking algorithm'
];

export const CandidateProcessing: React.FC<CandidateProcessingProps> = ({
  files,
  useSample,
  rawJdParsed,
  onComplete,
  onBackToUpload
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(useSample ? 5 : files.length);
  const [progressPercent, setProgressPercent] = useState(15);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeCandidateAnalysis = async () => {
    setErrorMessage(null);
    setCurrentStageIdx(0);
    setProgressPercent(15);
    setAnalyzedCount(0);

    const timer1 = setTimeout(() => { setCurrentStageIdx(1); setProgressPercent(32); setAnalyzedCount(1); }, 400);
    const timer2 = setTimeout(() => { setCurrentStageIdx(2); setProgressPercent(50); }, 900);
    const timer3 = setTimeout(() => { setCurrentStageIdx(3); setProgressPercent(68); }, 1500);

    try {
      let response: any;
      if (useSample || files.length === 0) {
        response = await getSampleData();
      } else {
        response = await analyzeCandidates({
          resumes: files,
          jd_json: rawJdParsed
        });
      }

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setCurrentStageIdx(4);
      setProgressPercent(88);
      setTotalCount(response.candidates.length);
      setAnalyzedCount(response.candidates.length);

      const adapted = adaptBackendCandidates(response.candidates, rawJdParsed || response.jd_parsed);

      setTimeout(() => {
        setCurrentStageIdx(5);
        setProgressPercent(100);
        setIsDone(true);

        setTimeout(() => {
          onComplete(adapted, response.candidates);
        }, 500);
      }, 400);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze candidate resumes with local backend.');
    }
  };

  useEffect(() => {
    executeCandidateAnalysis();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-xl text-center">
        {/* Animated Central Node */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative inline-flex items-center justify-center mb-6"
        >
          <div className="absolute w-32 h-32 rounded-full bg-[#B3C9D6]/30 animate-ping opacity-40" />
          <div className="absolute w-24 h-24 rounded-full bg-[#98AA9D]/20 animate-pulse" />

          <div className="w-20 h-20 rounded-2xl bg-white/95 border border-[#B9C5BE] shadow-md flex items-center justify-center relative z-10">
            <Users className="w-9 h-9 text-[#2D3536]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2D3536] flex items-center justify-center text-[#F2EFE2]">
              <Sparkles className="w-3 h-3 text-[#B3C9D6]" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-extrabold tracking-tight text-[#2D3536]"
        >
          Evaluating Resumes
        </motion.h2>

        {/* Counter Pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F2EFE2] border border-[#B9C5BE] text-xs font-bold text-[#2D3536]"
        >
          <span className="w-2 h-2 rounded-full bg-[#697C70] animate-pulse"></span>
          <span>{analyzedCount} of {totalCount} Resumes Analyzed Locally</span>
        </motion.div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Analysis Error</h4>
                <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={executeCandidateAnalysis}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                  <button
                    onClick={onBackToUpload}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-800 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Back to Resumes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!errorMessage && (
          <div className="mt-8 w-full bg-[#E0E6E3] h-2 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2D3536] via-[#697C70] to-[#98AA9D] relative"
              initial={{ width: '15%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
            </motion.div>
          </div>
        )}

        {/* Stages list */}
        <div className="mt-8 space-y-2 text-left">
          {processingStages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-white/95 border-[#697C70] shadow-xs'
                    : isCompleted
                    ? 'bg-white/70 border-[#D8DFDC]'
                    : 'bg-transparent border-transparent opacity-35'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#697C70] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-[#F2EFE2] flex items-center justify-center text-[#2D3536]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#697C70]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-[#B9C5BE] bg-[#F8F9F8] flex items-center justify-center text-[10px] text-[#5A6765] font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-semibold ${isCurrent ? 'text-[#2D3536]' : isCompleted ? 'text-[#5A6765]' : 'text-[#8B9894]'}`}>
                    {stage}
                  </span>
                </div>

                <div>
                  {isCompleted && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#697C70] bg-[#98AA9D]/20 px-2 py-0.5 rounded border border-[#98AA9D]/40">
                      Done
                    </span>
                  )}
                  {isCurrent && !errorMessage && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D3536] bg-[#B3C9D6]/30 px-2 py-0.5 rounded animate-pulse border border-[#B3C9D6]/60">
                      Processing
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Action */}
        <div className="mt-8 flex justify-center">
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D3536] text-[#F2EFE2] text-xs sm:text-sm font-bold shadow-md"
              >
                <span>Analysis complete. Loading leaderboard...</span>
                <ArrowRight className="w-4 h-4 text-[#B3C9D6]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
