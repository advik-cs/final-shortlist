import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Sparkles, 
  FileCheck,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ResumeFileItem {
  id: string;
  file?: File;
  name: string;
  size: string;
  candidateName: string;
  isSample?: boolean;
}

interface ResumeUploadProps {
  onAnalyze: (payload: { files: File[]; useSample: boolean }) => void;
}

const SAMPLE_POOL_ITEMS: ResumeFileItem[] = [
  { id: 'sample-1', name: 'rahul_sharma_resume.pdf', size: '18 KB', candidateName: 'Rahul Sharma (Senior Backend Engineer)', isSample: true },
  { id: 'sample-2', name: 'priya_patel_resume.pdf', size: '14 KB', candidateName: 'Priya Patel (Full Stack Developer)', isSample: true },
  { id: 'sample-3', name: 'alex_chen_resume.pdf', size: '12 KB', candidateName: 'Alex Chen (Software Engineer)', isSample: true },
  { id: 'sample-4', name: 'jane_doe_resume.pdf', size: '11 KB', candidateName: 'Jane Doe (Graphic Designer)', isSample: true },
  { id: 'sample-5', name: 'arjun_mehta_resume.pdf', size: '16 KB', candidateName: 'Arjun Mehta (Backend Systems Engineer)', isSample: true }
];

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onAnalyze }) => {
  const [resumes, setResumes] = useState<ResumeFileItem[]>(SAMPLE_POOL_ITEMS);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const validPdfList: ResumeFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
        validPdfList.push({
          id: `custom-${Date.now()}-${i}`,
          file,
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          candidateName: file.name.replace('.pdf', '').replace(/_/g, ' ')
        });
      }
    }

    if (validPdfList.length === 0) {
      alert('Please upload PDF resume files.');
      return;
    }

    setIsAnimatingIn(true);
    setTimeout(() => {
      setResumes(prev => {
        // If previous items were only sample items, replace with uploaded files
        const filtered = prev.filter(r => !r.isSample);
        return [...filtered, ...validPdfList];
      });
      setIsAnimatingIn(false);
    }, 400);
  };

  const handleRemove = (id: string) => {
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAll = () => {
    setResumes([]);
  };

  const handleLoadSamplePool = () => {
    setResumes(SAMPLE_POOL_ITEMS);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAnalyzeClick = () => {
    const realFiles = resumes.map(r => r.file).filter((f): f is File => Boolean(f));
    const hasSample = resumes.some(r => r.isSample);

    if (realFiles.length > 0) {
      onAnalyze({ files: realFiles, useSample: false });
    } else if (hasSample) {
      onAnalyze({ files: [], useSample: true });
    } else {
      alert('Please upload at least one PDF resume or load the sample pool.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#CBD5E1] text-xs font-semibold text-[#64748B] shadow-2xs mb-3">
            <span>Step 2 of 3</span>
            <span className="text-[#6366F1]">•</span>
            <span>Batch Candidate Intake</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Upload candidate resumes
          </h2>
          <p className="mt-2 text-sm text-[#64748B] font-medium">
            Add resumes to compare and rank against the uploaded job description specification.
          </p>
        </div>

        {/* Upload Box */}
        <div
          id="resume-dropzone"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative rounded-2xl border-2 transition-all duration-200 bg-white p-6 sm:p-8 shadow-2xs ${
            isDragging
              ? 'border-[#6366F1] bg-[#EEF2FF]/40 ring-4 ring-[#EEF2FF]'
              : 'border-dashed border-[#CBD5E1] hover:border-[#6366F1]/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <AnimatePresence mode="wait">
            {isAnimatingIn ? (
              <motion.div
                key="animating-files"
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#6366F1]">
                  <FileCheck className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-sm font-semibold text-[#0F172A]">Adding candidate resumes...</span>
              </motion.div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] shrink-0">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      Drop multiple candidate resumes
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Accepts bulk PDF files (drag & drop or browse)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#1E293B] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Browse PDFs</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSamplePool}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-white hover:border-[#6366F1]/50 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                    <span>Load Sample Pool (5 Resumes)</span>
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Uploaded Files Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0F172A]">
                Candidate Resumes
              </span>
              <span className="rounded-full bg-[#EEF2FF] text-[#4338CA] text-xs font-bold px-2.5 py-0.5 border border-[#C7D2FE]">
                {resumes.length} ready
              </span>
            </div>

            {resumes.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-[#64748B] hover:text-[#EF4444] transition-colors cursor-pointer font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
              <FileText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">No resumes attached yet</p>
              <p className="text-xs text-[#64748B] mt-1">Upload PDF files or click "Load Sample Pool" to test the real local ranking engine.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
              {resumes.map((resume, idx) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#6366F1]/50 shadow-2xs group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {resume.candidateName}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">
                        {resume.size} • {resume.isSample ? 'Backend Sample' : 'Custom PDF'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(resume.id)}
                    className="p-1 rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-8 pt-6 border-t border-[#CBD5E1] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>Real PDF parsing, BM25 matching, and local embeddings</span>
          </div>

          <button
            id="btn-analyze-candidates"
            disabled={resumes.length === 0}
            onClick={handleAnalyzeClick}
            className={`inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition-all shadow-2xs ${
              resumes.length > 0
                ? 'bg-[#0F172A] text-white hover:bg-[#1E293B] hover:gap-2.5 cursor-pointer'
                : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            <span>Analyze Candidates</span>
            <ArrowRight className="w-4 h-4 text-[#818CF8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
