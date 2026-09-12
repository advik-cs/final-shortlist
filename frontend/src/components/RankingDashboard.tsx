import React, { useState, useMemo } from 'react';
import { UnifiedCandidate } from '../types';
import { CandidateVerticalCard } from './CandidateVerticalCard';
import { WeightSlider } from './WeightSlider';
import { CustomSortDropdown, SortOption } from './CustomSortDropdown';
import { CompareModal } from './CompareModal';
import { 
  Search, 
  Filter, 
  GitCompare, 
  Sparkles, 
  Users,
  Trophy,
  ListFilter
} from 'lucide-react';

interface RankingDashboardProps {
  candidates: UnifiedCandidate[];
  onSelectCandidate: (candidate: UnifiedCandidate) => void;
  onCompareCandidates: (c1: UnifiedCandidate, c2: UnifiedCandidate) => void;
}

export const RankingDashboard: React.FC<RankingDashboardProps> = ({
  candidates,
  onSelectCandidate,
  onCompareCandidates
}) => {
  const [semanticWeight, setSemanticWeight] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Recalculate dynamic scores based on semantic vs keyword weight slider
  const reweightedCandidates = useMemo(() => {
    const sRatio = semanticWeight / 100;
    const kRatio = (100 - semanticWeight) / 100;

    const list = candidates.map(c => {
      // Dynamic formula combining weights with minor experience component (10%)
      const weightedCore = (c.semanticScore * sRatio) + (c.bm25Score * kRatio);
      const dynamicFinalScore = Math.min(100, Math.round((weightedCore * 0.9 + c.experienceScore * 0.1) * 10) / 10);
      
      return {
        ...c,
        finalScore: dynamicFinalScore
      };
    });

    // Sort based on current sort criteria
    list.sort((a, b) => {
      if (sortBy === 'semantic') return b.semanticScore - a.semanticScore;
      if (sortBy === 'keyword') return b.bm25Score - a.bm25Score;
      if (sortBy === 'experience') return b.experienceScore - a.experienceScore;
      return b.finalScore - a.finalScore;
    });

    // Re-assign ranks 1..N based on current sorting
    return list.map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [candidates, semanticWeight, sortBy]);

  // Filter based on search & confidence
  const filteredCandidates = useMemo(() => {
    return reweightedCandidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.currentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.other.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesConfidence = selectedConfidence === 'all' || c.confidence.level === selectedConfidence;

      return matchesSearch && matchesConfidence;
    });
  }, [reweightedCandidates, searchQuery, selectedConfidence]);

  const top3Candidates = filteredCandidates.filter(c => c.rank <= 3);
  const remainingCandidates = filteredCandidates.filter(c => c.rank > 3);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#D8DFDC]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#697C70] uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate Evaluation & Shortlisting</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D3536]">
            Candidate Ranking
          </h1>
          <p className="mt-1 text-sm text-[#5A6765] max-w-2xl">
            Showing <span className="font-bold text-[#2D3536]">{filteredCandidates.length}</span> ranked resumes against the job specification.
          </p>
        </div>

        {/* Compare Button triggers the modal with blanks */}
        <button
          onClick={() => setIsCompareModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-[#B9C5BE] hover:border-[#697C70] hover:bg-[#F2EFE2] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#2D3536] shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <GitCompare className="w-4 h-4 text-[#697C70]" />
          <span>Compare</span>
        </button>
      </div>

      {/* Control Strip: Weight Slider + Search + Custom Dropdown */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Weighting Slider (takes 7 columns) */}
        <div className="lg:col-span-7">
          <WeightSlider
            semanticWeight={semanticWeight}
            onChange={setSemanticWeight}
          />
        </div>

        {/* Search, Filter & Sort Bar (takes 5 columns) */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-2">
          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA396]" />
            <input
              type="text"
              placeholder="Search candidate or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#D8DFDC] rounded-xl text-xs sm:text-sm text-[#2D3536] placeholder-[#8FA396] focus:outline-none focus:border-[#697C70] focus:ring-2 focus:ring-[#B3C9D6]/40 shadow-2xs font-medium"
            />
          </div>

          {/* Custom Stylized Sort Dropdown */}
          <CustomSortDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val)}
          />
        </div>
      </div>

      {/* Confidence Quick Filters */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[#5A6765] font-semibold shrink-0 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#697C70]" /> Filter Confidence:
        </span>
        {(['all', 'High', 'Medium', 'Low'] as const).map((conf) => (
          <button
            key={conf}
            onClick={() => setSelectedConfidence(conf)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer capitalize shadow-2xs ${
              selectedConfidence === conf
                ? 'bg-[#2D3536] text-[#F2EFE2] shadow-xs'
                : 'bg-white/90 text-[#5A6765] hover:text-[#2D3536] hover:bg-[#F2EFE2] border border-[#D8DFDC]'
            }`}
          >
            {conf === 'all' ? 'All Confidences' : `${conf} Confidence`}
          </button>
        ))}
      </div>

      {/* VERTICAL CANDIDATE RANKING SYSTEM */}
      {filteredCandidates.length > 0 ? (
        <div className="mt-8 space-y-8">
          {/* Top 3 Section with Detailed Cards, Key Strengths and Evidence Gaps */}
          {top3Candidates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#6366F1]">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                    Top Candidates
                  </span>
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-bold text-[#4338CA] border border-[#C7D2FE]">
                    Detailed Intelligence
                  </span>
                </div>
                <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
                  Full assessment with strengths & gaps
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {top3Candidates.map((candidate) => (
                  <CandidateVerticalCard
                    key={candidate.id}
                    candidate={candidate}
                    isFirst={candidate.rank === 1}
                    onSelect={onSelectCandidate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remaining Candidates Section (#4 onwards) showing only Rank, Name, and Score */}
          {remainingCandidates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                    <ListFilter className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Other Evaluated Candidates
                  </span>
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#64748B] border border-[#E2E8F0]">
                    Ranks #{remainingCandidates[0]?.rank} — #{remainingCandidates[remainingCandidates.length - 1]?.rank}
                  </span>
                </div>
                <span className="text-xs text-[#64748B] font-medium">
                  Click any row to open full profile
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {remainingCandidates.map((candidate) => (
                  <CandidateVerticalCard
                    key={candidate.id}
                    candidate={candidate}
                    isFirst={false}
                    onSelect={onSelectCandidate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Results State */
        <div className="mt-12 rounded-2xl bg-white border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No matching candidates found</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Try adjusting your search query or relaxing your confidence filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedConfidence('all'); }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] text-xs font-semibold text-white hover:bg-[#1E293B] transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Compare Modal ("________ vs ________" with type-ahead search) */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        candidates={candidates}
        onCompare={onCompareCandidates}
        initialCandidateA={filteredCandidates[0]}
        initialCandidateB={filteredCandidates[1]}
      />
    </div>
  );
};
