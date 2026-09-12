import React, { useState, useEffect } from 'react';
import { AppView, UnifiedCandidate, JobDescriptionData } from './types';
import { Navbar } from './components/Navbar';
import { JDUpload } from './components/JDUpload';
import { JDProcessing } from './components/JDProcessing';
import { ResumeUpload } from './components/ResumeUpload';
import { CandidateProcessing } from './components/CandidateProcessing';
import { RankingDashboard } from './components/RankingDashboard';
import { CandidateProfile } from './components/CandidateProfile';
import { CandidateComparison } from './components/CandidateComparison';
import { RecruiterAssistant } from './components/RecruiterAssistant';
import { JDAnalysisView } from './components/JDAnalysisView';
import { checkBackendHealth } from './services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const DEFAULT_EMPTY_JD: JobDescriptionData = {
  id: 'JD-EMPTY',
  title: 'Backend Software Engineer',
  department: 'Core Infrastructure',
  experienceLevel: '3+ years experience',
  location: 'Hybrid / Remote',
  summary: 'Please upload a Job Description PDF to extract role criteria and required technical competencies.',
  filename: 'No_JD_Loaded.pdf',
  fileSize: '0 KB',
  requiredSkills: [],
  preferredSkills: [],
  coreResponsibilities: [],
  biasAndRestrictions: []
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('upload-jd');
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

  // Backend Connectivity Status
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Real full-stack state
  const [jdFileOrSample, setJdFileOrSample] = useState<File | 'sample' | null>(null);
  const [jdFilename, setJdFilename] = useState<string>('Job_Description.pdf');
  const [jdData, setJdData] = useState<JobDescriptionData | null>(null);
  const [rawJdParsed, setRawJdParsed] = useState<any>(null);

  const [resumePayload, setResumePayload] = useState<{ files: File[]; useSample: boolean }>({
    files: [],
    useSample: false
  });

  const [candidates, setCandidates] = useState<UnifiedCandidate[]>([]);
  const [rawCandidates, setRawCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<UnifiedCandidate | null>(null);
  const [comparePair, setComparePair] = useState<{ c1: UnifiedCandidate | null; c2: UnifiedCandidate | null }>({
    c1: null,
    c2: null
  });

  const verifyBackend = async () => {
    setIsCheckingBackend(true);
    try {
      await checkBackendHealth();
      setBackendError(null);
    } catch (err: any) {
      setBackendError(err.message || 'Cannot connect to InternLoom backend.');
    } finally {
      setIsCheckingBackend(false);
    }
  };

  useEffect(() => {
    verifyBackend();
  }, []);

  // Step 1: JD Uploaded -> Show animated JD processing screen
  const handleJDUploaded = (fileOrSample: File | 'sample', filename: string, fileSize: string) => {
    setJdFileOrSample(fileOrSample);
    setJdFilename(filename);
    setCurrentView('jd-processing');
  };

  // Step 2: JD Processing Complete -> Move to Resume Upload
  const handleJDProcessingComplete = (adaptedJD: JobDescriptionData, rawParsed: any) => {
    setJdData(adaptedJD);
    setRawJdParsed(rawParsed);
    setCurrentView('upload-resumes');
  };

  // Step 3: Analyze Candidates Clicked
  const handleAnalyzeCandidates = (payload: { files: File[]; useSample: boolean }) => {
    setResumePayload(payload);
    setCurrentView('candidate-processing');
  };

  // Step 4: Candidate Processing Complete -> Enter Dashboard
  const handleCandidateProcessingComplete = (adaptedCandidates: UnifiedCandidate[], rawCands: any[]) => {
    setCandidates(adaptedCandidates);
    setRawCandidates(rawCands);
    if (adaptedCandidates.length > 0) {
      setSelectedCandidate(adaptedCandidates[0]);
      setComparePair({
        c1: adaptedCandidates[0],
        c2: adaptedCandidates[1] || adaptedCandidates[0]
      });
    }
    setHasAnalyzed(true);
    setCurrentView('dashboard');
  };

  // Candidate selection for Profile
  const handleSelectCandidate = (candidate: UnifiedCandidate) => {
    setSelectedCandidate(candidate);
    setCurrentView('profile');
  };

  // Candidate compare trigger
  const handleCompareCandidates = (c1: UnifiedCandidate, c2: UnifiedCandidate) => {
    setComparePair({ c1, c2 });
    setCurrentView('compare');
  };

  // Reset entire flow back to Step 1 for fresh demonstrations
  const handleResetFlow = () => {
    setHasAnalyzed(false);
    setCandidates([]);
    setRawCandidates([]);
    setJdData(null);
    setRawJdParsed(null);
    setSelectedCandidate(null);
    setComparePair({ c1: null, c2: null });
    setCurrentView('upload-jd');
  };

  return (
    <div className="relative min-h-screen text-[#2D3536] flex flex-col selection:bg-[#B3C9D6]/40 selection:text-[#2D3536] overflow-hidden">
      {/* Background aesthetic layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-br from-[#B3C9D6]/35 via-[#D8EFFE]/25 to-transparent blur-3xl"
          style={{ animation: 'subtle-float-slow 28s ease-in-out infinite alternate' }}
        />
        <div 
          className="absolute top-[35%] -right-[12%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-bl from-[#98AA9D]/30 via-[#697C70]/15 to-transparent blur-3xl"
          style={{ animation: 'subtle-float-reverse 34s ease-in-out infinite alternate' }}
        />
        <div 
          className="absolute -bottom-[15%] left-[20%] w-[60vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-tr from-[#C2E9E5]/30 via-[#F2EFE2]/60 to-transparent blur-3xl"
          style={{ animation: 'subtle-float-slow 40s ease-in-out infinite alternate' }}
        />
      </div>

      {/* Persistent Global Navbar with Logo & Active Controls */}
      <div className="relative z-40">
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onReset={handleResetFlow}
          candidateCount={candidates.length}
          hasAnalyzed={hasAnalyzed}
          selectedCandidateName={selectedCandidate?.name}
        />
      </div>

      {/* Backend Offline Warning Banner */}
      {backendError && (
        <div className="relative z-50 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Backend Unavailable:</strong> {backendError}
              </span>
            </div>
            <button
              onClick={verifyBackend}
              disabled={isCheckingBackend}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 font-bold transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="relative z-10 flex-1 w-full">
        {/* PAGE 1: Initial Upload / Welcome */}
        {currentView === 'upload-jd' && (
          <JDUpload onJDUploaded={handleJDUploaded} />
        )}

        {/* PAGE 2: JD Analysis & Understanding Role */}
        {(currentView === 'jd-analysis' || currentView === 'jd-processing') && (
          <JDProcessing
            filename={jdFilename}
            fileOrSample={jdFileOrSample}
            onComplete={handleJDProcessingComplete}
            onBackToUpload={() => setCurrentView('upload-jd')}
          />
        )}

        {/* PAGE 3: Resume Upload */}
        {currentView === 'upload-resumes' && (
          <ResumeUpload onAnalyze={handleAnalyzeCandidates} />
        )}

        {/* PAGE 4: Candidate Analysis / Processing */}
        {currentView === 'candidate-processing' && (
          <CandidateProcessing
            files={resumePayload.files}
            useSample={resumePayload.useSample}
            rawJdParsed={rawJdParsed}
            onComplete={handleCandidateProcessingComplete}
            onBackToUpload={() => setCurrentView('upload-resumes')}
          />
        )}

        {/* PAGE 5: Main Ranking Dashboard */}
        {currentView === 'dashboard' && (
          <RankingDashboard
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            onCompareCandidates={handleCompareCandidates}
          />
        )}

        {/* PAGE 6: Candidate Intelligence Profile */}
        {currentView === 'profile' && selectedCandidate && (
          <CandidateProfile
            candidate={selectedCandidate}
            allCandidates={candidates}
            onBack={() => setCurrentView('dashboard')}
            onCompareWith={(target) => handleCompareCandidates(selectedCandidate, target)}
          />
        )}

        {/* PAGE 7 & 8: Candidate Comparison & Why A > B */}
        {currentView === 'compare' && comparePair.c1 && comparePair.c2 && (
          <CandidateComparison
            candidates={candidates}
            initialCandidateA={comparePair.c1}
            initialCandidateB={comparePair.c2}
            rawCandidates={rawCandidates}
            rawJdParsed={rawJdParsed}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {/* PAGE 9: Recruiter Intelligence Assistant (Q&A) */}
        {currentView === 'qa' && (
          <RecruiterAssistant
            candidates={candidates}
            rawCandidates={rawCandidates}
            rawJdParsed={rawJdParsed}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {/* PAGE 10: JD Analysis & Bias/Restrictiveness Audit */}
        {currentView === 'jd-spec' && (
          <JDAnalysisView
            jobDescription={jdData || DEFAULT_EMPTY_JD}
            onProceedToUpload={!hasAnalyzed ? () => setCurrentView('upload-resumes') : undefined}
          />
        )}
      </main>
    </div>
  );
}
