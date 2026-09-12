import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, CheckCircle2, ArrowRight, Sparkles, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JDUploadProps {
  onJDUploaded: (fileOrSample: File | 'sample', filename: string, fileSize: string) => void;
}

export const JDUpload: React.FC<JDUploadProps> = ({ onJDUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File | 'sample'; name: string; size: string } | null>(null);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF document for the job description.');
      return;
    }
    const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    triggerFileSelection(file, file.name, sizeStr);
  };

  const triggerFileSelection = (file: File | 'sample', name: string, size: string) => {
    setIsAnimatingIn(true);
    setTimeout(() => {
      setSelectedFile({ file, name, size });
      setIsAnimatingIn(false);
    }, 400);
  };

  const handleSampleJD = () => {
    triggerFileSelection('sample', 'Sample_Backend_Engineer_JD.pdf', '14 KB');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleProceed = () => {
    if (selectedFile) {
      onJDUploaded(selectedFile.file, selectedFile.name, selectedFile.size);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Background ambient aesthetic highlight using Mist and Eucalyptus */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50 overflow-hidden">
        <div className="w-[600px] h-[600px] rounded-full bg-[#B3C9D6]/25 blur-3xl transform -translate-y-12"></div>
        <div className="w-[450px] h-[450px] rounded-full bg-[#98AA9D]/20 blur-3xl transform translate-x-32 translate-y-24"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Category Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F2EFE2] border border-[#98AA9D]/40 text-xs font-semibold text-[#2D3536] shadow-xs mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#697C70]" />
          <span>Intelligent Candidate Shortlisting</span>
        </motion.div>

        {/* Large Elegant Heading & Minimal Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#2D3536] leading-[1.15]"
        >
          Find the right fit, faster.
        </motion.h1>

        {/* Supporting one-line explanation */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-4 text-base sm:text-lg text-[#5A6765] font-normal max-w-lg mx-auto leading-relaxed"
        >
          Start by uploading your Job Description. Our engine extracts role competencies, criteria, and evidence benchmarks.
        </motion.p>

        {/* Upload Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10"
        >
          <div
            id="jd-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-[#F2EFE2]/90 backdrop-blur-sm p-8 sm:p-10 shadow-sm ${
              isDragging
                ? 'border-[#697C70] bg-[#C2E9E5]/30 ring-4 ring-[#B3C9D6]/30'
                : selectedFile
                ? 'border-[#697C70] bg-[#F2EFE2]'
                : 'border-dashed border-[#B9C5BE] hover:border-[#697C70]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Document movement micro-animation representation */}
            <AnimatePresence mode="wait">
              {isAnimatingIn ? (
                <motion.div
                  key="animating"
                  initial={{ y: -24, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="py-8 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#C2E9E5]/50 flex items-center justify-center text-[#2D3536] shadow-sm">
                    <FileCheck className="w-8 h-8 text-[#697C70] animate-pulse" />
                  </div>
                  <span className="text-sm font-medium text-[#2D3536]">Ingesting document...</span>
                </motion.div>
              ) : selectedFile ? (
                /* Selected File State */
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#98AA9D]/20 text-[#697C70] mb-4">
                    <CheckCircle2 className="h-7 w-7 text-[#697C70]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2D3536] truncate max-w-sm">
                    {selectedFile.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#5A6765]">
                    <span>PDF Document</span>
                    <span>•</span>
                    <span>{selectedFile.size}</span>
                    <span>•</span>
                    <span className="text-[#697C70] font-bold">Ready for analysis</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      id="btn-jd-proceed"
                      onClick={handleProceed}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2D3536] px-6 py-3 text-sm font-semibold text-[#F2EFE2] shadow-sm hover:bg-[#3D4748] transition-all hover:gap-2.5 cursor-pointer"
                    >
                      <span>Analyze Job Description</span>
                      <ArrowRight className="w-4 h-4 text-[#B3C9D6]" />
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="rounded-xl border border-[#B9C5BE] bg-white px-4 py-3 text-sm font-medium text-[#5A6765] hover:bg-[#F2EFE2] hover:text-[#2D3536] transition-colors cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Upload Prompt State */
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B3C9D6]/30 text-[#2D3536] mb-4 group-hover:scale-105 transition-transform">
                    <FileText className="h-7 w-7 text-[#697C70]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2D3536]">
                    Upload Job Description
                  </h3>
                  <p className="mt-1 text-sm text-[#5A6765]">
                    Drag and drop your PDF here, or click browse
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      id="btn-browse-jd"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2D3536] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#F2EFE2] shadow-xs hover:bg-[#3D4748] transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#B3C9D6]" />
                      <span>Browse Files</span>
                    </button>
                    <button
                      id="btn-sample-jd"
                      type="button"
                      onClick={handleSampleJD}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#B9C5BE] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#2D3536] hover:bg-[#F2EFE2] hover:border-[#697C70] transition-all cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#697C70]" />
                      <span>Use Sample Job Description</span>
                    </button>
                  </div>

                  <span className="mt-4 text-[11px] text-[#64736E]">
                    PDF only • Up to 25MB
                  </span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Minimal trust indicator / info note */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#5A6765]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#697C70]"></span>
            100% Local Processing | Zero External AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#98AA9D]"></span>
            Zero API Keys Required
          </span>
        </div>
      </div>
    </div>
  );
};
