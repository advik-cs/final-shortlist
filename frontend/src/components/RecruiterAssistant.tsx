import React, { useState } from 'react';
import { UnifiedCandidate } from '../types';
import { askRecruiterQuery } from '../services/api';
import { 
  MessageSquareQuote, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecruiterAssistantProps {
  candidates: UnifiedCandidate[];
  rawCandidates?: any[];
  rawJdParsed?: any;
  onSelectCandidate: (candidate: UnifiedCandidate) => void;
}

interface QAItem {
  id: string;
  question: string;
  category: string;
  answer: string;
}

export const RecruiterAssistant: React.FC<RecruiterAssistantProps> = ({
  candidates,
  rawCandidates,
  rawJdParsed,
  onSelectCandidate
}) => {
  const c1Name = candidates[0]?.name || 'Top Candidate';
  const c2Name = candidates[1]?.name || 'Second Candidate';

  // Dynamic suggested inquiries based on actual candidate pool
  const suggestedQuestions = [
    { id: 'sq-1', question: `Why is ${c1Name} ranked above ${c2Name}?`, category: 'Comparative' },
    { id: 'sq-2', question: `What is ${c1Name} missing?`, category: 'Skill Gap' },
    { id: 'sq-3', question: 'Who is the top candidate?', category: 'Leaderboard' },
    { id: 'sq-4', question: 'Who knows Python?', category: 'Skill Inquiry' },
    { id: 'sq-5', question: 'Who knows Docker?', category: 'Skill Inquiry' }
  ];

  const [activeQA, setActiveQA] = useState<QAItem>({
    id: 'initial-1',
    question: `Why is ${c1Name} ranked above ${c2Name}?`,
    category: 'Comparative',
    answer: `Candidate ${c1Name} leads with a final score of ${candidates[0]?.finalScore || 0}%, holding stronger skill coverage and semantic domain alignment across key job criteria.`
  });

  const [customQuery, setCustomQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnswer = async (queryText: string, category: string = 'Recruiter Inquiry') => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const candidatesToQuery = rawCandidates && rawCandidates.length > 0 ? rawCandidates : candidates;
      const res = await askRecruiterQuery({
        query: queryText,
        candidates: candidatesToQuery,
        jd_parsed: rawJdParsed
      });

      setActiveQA({
        id: `qa-${Date.now()}`,
        question: queryText,
        category,
        answer: res.answer
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve deterministic answer from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuestion = (q: { question: string; category: string }) => {
    fetchAnswer(q.question, q.category);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isLoading) return;
    fetchAnswer(customQuery, 'Custom Inquiry');
    setCustomQuery('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#697C70] uppercase tracking-wider mb-1">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Evidence-Backed Inquiry Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2D3536]">
          Recruiter Intelligence Assistant
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6765] mt-1 font-medium">
          Query candidate rankings, score drivers, and qualification gaps using 100% deterministic local evidence.
        </p>
      </div>

      {/* Query Search / Input */}
      <div className="mt-6">
        <form onSubmit={handleQuerySubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6765]" />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask any question (e.g. Why is ${c1Name} ranked above ${c2Name}? What is ${c1Name} missing? Who knows MongoDB?)`}
            className="w-full pl-12 pr-28 py-3.5 bg-white border border-[#D8DFDC] rounded-2xl text-sm text-[#2D3536] placeholder-[#8B9894] focus:outline-none focus:border-[#697C70] shadow-2xs"
          />
          <button
            type="submit"
            disabled={isLoading || !customQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D3536] text-xs font-bold text-[#F2EFE2] hover:bg-[#3D4748] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3 h-3 text-[#B3C9D6]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Suggested Questions Chips */}
      <div className="mt-5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5A6765] block mb-2">
          Suggested Inquiries For This Cohort:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => {
            const isSelected = activeQA?.question.toLowerCase() === q.question.toLowerCase();
            return (
              <button
                key={q.id}
                onClick={() => handleSelectQuestion(q)}
                disabled={isLoading}
                className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D3536] text-[#F2EFE2] border-[#2D3536] shadow-2xs'
                    : 'bg-white text-[#2D3536] border-[#D8DFDC] hover:border-[#697C70] hover:bg-[#F2EFE2]'
                }`}
              >
                <span>{q.question}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Inquiry Error</h4>
              <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="mt-8 rounded-2xl bg-white/80 border border-[#D8DFDC] p-8 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#697C70] animate-spin" />
          <p className="text-sm font-semibold text-[#2D3536]">Consulting local candidate intelligence engine...</p>
        </div>
      )}

      {/* Answer Panel */}
      <AnimatePresence mode="wait">
        {!isLoading && activeQA && (
          <motion.div
            key={activeQA.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8 rounded-2xl bg-white/95 border border-[#D8DFDC] p-6 sm:p-8 shadow-xs"
          >
            {/* Answer Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D8DFDC]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D3536] bg-[#B3C9D6]/30 border border-[#B3C9D6]/60 px-2.5 py-0.5 rounded-md">
                  {activeQA.category} Assessment
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#2D3536] mt-2">
                  {activeQA.question}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#2D3536] font-bold bg-[#C2E9E5]/40 border border-[#98AA9D]/60 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-[#697C70]" />
                <span>100% Deterministic Evidence</span>
              </div>
            </div>

            {/* Answer Box */}
            <div className="mt-6 p-5 rounded-xl bg-[#F2EFE2]/70 border border-[#D8DFDC] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#697C70] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-semibold text-[#2D3536] leading-relaxed whitespace-pre-line">
                {activeQA.answer}
              </div>
            </div>

            {/* Candidate Quick Navigation */}
            {candidates.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[#D8DFDC] flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#5A6765] font-bold">Top Candidates in Pool:</span>
                {candidates.slice(0, 4).map(cand => (
                  <button
                    key={cand.id}
                    onClick={() => onSelectCandidate(cand)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#B9C5BE] bg-white text-xs font-bold text-[#2D3536] hover:border-[#697C70] hover:bg-[#F2EFE2] transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>#{cand.rank} {cand.name} ({cand.finalScore.toFixed(1)}%)</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
