import React, { useEffect, useState } from 'react';
import { Check, Loader2, FileText, ArrowRight, ShieldCheck, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobDescriptionData } from '../types';
import { parseJobDescription, getSampleData } from '../services/api';
import { adaptBackendJD } from '../services/adapter';

interface JDProcessingProps {
  filename: string;
  fileOrSample: File | 'sample' | null;
  onComplete: (jdData: JobDescriptionData, rawJdParsed: any) => void;
  onBackToUpload: () => void;
}

interface Step {
  id: number;
  label: string;
  detail: string;
}

const steps: Step[] = [
  { id: 1, label: 'Reading job description', detail: 'Parsing document structure and technical parameters via pdfplumber' },
  { id: 2, label: 'Identifying required skills', detail: 'Extracting core competencies, systems scale, and tech stack' },
  { id: 3, label: 'Understanding preferred skills', detail: 'Synthesizing bonus qualifications and nice-to-haves' },
  { id: 4, label: 'Auditing bias & preparing matching', detail: 'Scanning for restrictive criteria & preparing local embeddings' }
];

export const JDProcessing: React.FC<JDProcessingProps> = ({
  filename,
  fileOrSample,
  onComplete,
  onBackToUpload
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(20);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeProcessing = async () => {
    setErrorMessage(null);
    setCurrentStepIndex(0);
    setProgressPercent(25);

    try {
      // Step progression animations
      const stepTimer1 = setTimeout(() => { setCurrentStepIndex(1); setProgressPercent(50); }, 400);
      const stepTimer2 = setTimeout(() => { setCurrentStepIndex(2); setProgressPercent(75); }, 800);

      let response: any;
      if (fileOrSample === 'sample') {
        response = await getSampleData();
      } else if (fileOrSample instanceof File) {
        response = await parseJobDescription(fileOrSample);
      } else {
        response = await getSampleData();
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setCurrentStepIndex(3);
      setProgressPercent(95);

      const adaptedJD = adaptBackendJD(
        response.jd_parsed,
        response.bias_report,
        response.filename || filename,
        response.file_size || '25 KB'
      );

      setTimeout(() => {
        setCurrentStepIndex(4);
        setProgressPercent(100);
        setIsDone(true);

        setTimeout(() => {
          onComplete(adaptedJD, response.jd_parsed);
        }, 500);
      }, 400);

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process Job Description with backend.');
    }
  };

  useEffect(() => {
    executeProcessing();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-xl text-center">
        {/* Animated Document Intelligence Icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative inline-flex items-center justify-center mb-6"
        >
          <div className="absolute w-32 h-32 rounded-full bg-[#EEF2FF] animate-ping opacity-40" />
          <div className="absolute w-24 h-24 rounded-full bg-[#6366F1]/10 animate-pulse" />

          <div className="w-20 h-20 rounded-2xl bg-white border border-[#CBD5E1] shadow-md flex items-center justify-center relative z-10">
            <FileText className="w-9 h-9 text-[#6366F1]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0F172A] flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3 text-[#818CF8]" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-extrabold tracking-tight text-[#0F172A]"
        >
          Analyzing Job Description
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-[#64748B] font-medium"
        >
          Extracting requirement criteria from <span className="font-bold text-[#0F172A] bg-[#EEF2FF] px-2 py-0.5 rounded-md border border-[#C7D2FE]">{filename}</span>
        </motion.p>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Backend Analysis Error</h4>
                <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={executeProcessing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={onBackToUpload}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-800 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shimmer Progress Bar */}
        {!errorMessage && (
          <div className="mt-8 w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] relative"
              initial={{ width: '18%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
            </motion.div>
          </div>
        )}

        {/* Stages Checklist */}
        <div className="mt-8 space-y-2.5 text-left">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-white border-[#6366F1] shadow-xs ring-2 ring-[#EEF2FF]'
                    : isCompleted
                    ? 'bg-white/80 border-[#E2E8F0]'
                    : 'bg-transparent border-transparent opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center text-white shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#6366F1]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-[10px] text-[#64748B] font-bold">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isCurrent ? 'text-[#0F172A]' : isCompleted ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                      {step.label}
                    </span>
                    {isCompleted && (
                      <span className="text-[11px] text-[#059669] font-bold bg-[#ECFDF5] px-2 py-0.5 rounded-md">Completed</span>
                    )}
                    {isCurrent && !errorMessage && (
                      <span className="text-[11px] text-[#4338CA] font-bold bg-[#EEF2FF] px-2 py-0.5 rounded-md animate-pulse">Analyzing...</span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 font-medium leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Indicator */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Job criteria extracted with 100% local analysis. Proceeding...</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#818CF8]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
