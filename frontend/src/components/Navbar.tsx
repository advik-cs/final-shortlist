import React from 'react';
import { Logo } from './Logo';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  GitCompare, 
  FileSearch, 
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onReset: () => void;
  candidateCount: number;
  hasAnalyzed: boolean;
  selectedCandidateName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onReset,
  candidateCount,
  hasAnalyzed,
  selectedCandidateName
}) => {
  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard, requiresAnalyzed: true },
    { id: 'profile' as AppView, label: selectedCandidateName ? `Candidate: ${selectedCandidateName.split(' ')[0]}` : 'Candidate Profile', icon: Users, requiresAnalyzed: true },
    { id: 'compare' as AppView, label: 'Compare', icon: GitCompare, requiresAnalyzed: true },
    { id: 'jd-spec' as AppView, label: 'JD Analysis', icon: FileSearch, requiresAnalyzed: false },
    { id: 'qa' as AppView, label: 'Recruiter Q&A', icon: MessageSquareQuote, requiresAnalyzed: true }
  ];

  return (
    <header id="main-navigation" className="sticky top-0 z-40 w-full border-b border-[#D8DFDC]/80 bg-[#F2EFE2]/85 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <div 
            className="cursor-pointer transition-opacity hover:opacity-90 py-1"
            onClick={() => onNavigate(hasAnalyzed ? 'dashboard' : 'upload-jd')}
          >
            <Logo size="sm" />
          </div>
          {hasAnalyzed && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#2D3536] font-semibold bg-[#C2E9E5]/40 border border-[#98AA9D]/60 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#697C70]"></span>
              {candidateCount} Ranked Candidates
            </span>
          )}
        </div>

        {/* Center: Main Navigation Tabs */}
        {hasAnalyzed ? (
          <nav className="flex items-center gap-1 md:gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2D3536] text-[#F2EFE2] shadow-xs'
                      : 'text-[#5A6765] hover:text-[#2D3536] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#B3C9D6]' : 'text-[#697C70]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#64736E] font-medium">
            <span className={currentView === 'upload-jd' || currentView === 'jd-processing' ? 'font-bold text-[#2D3536]' : ''}>1. Job Description</span>
            <ChevronRight className="w-3 h-3 text-[#98AA9D]" />
            <span className={currentView === 'upload-resumes' ? 'font-bold text-[#2D3536]' : ''}>2. Resumes</span>
            <ChevronRight className="w-3 h-3 text-[#98AA9D]" />
            <span className={currentView === 'candidate-processing' ? 'font-bold text-[#2D3536]' : ''}>3. Ranking</span>
          </div>
        )}

        {/* Right: Restart Action Controls */}
        <div className="flex items-center gap-3">
          <button
            id="btn-demo-reset"
            onClick={onReset}
            title="Reset to initial upload flow"
            className="flex items-center gap-1.5 rounded-xl border border-[#D8DFDC] bg-white/80 px-3 py-2 text-xs font-semibold text-[#5A6765] hover:border-[#2D3536] hover:text-[#2D3536] hover:bg-white transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Flow</span>
          </button>
        </div>
      </div>
    </header>
  );
};
