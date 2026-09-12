import React from 'react';
import { JobDescriptionData } from '../types';
import { 
  FileSearch, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Building2, 
  MapPin, 
  Briefcase,
  FileText,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';

interface JDAnalysisViewProps {
  jobDescription: JobDescriptionData;
  onProceedToUpload?: () => void;
}

export const JDAnalysisView: React.FC<JDAnalysisViewProps> = ({
  jobDescription,
  onProceedToUpload
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-1">
            <FileSearch className="w-3.5 h-3.5" />
            <span>Role Specification Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">
            Job Description Analysis
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Synthesized competency criteria, benchmark requirements, and inclusive hiring audit.
          </p>
        </div>

        {onProceedToUpload && (
          <button
            onClick={onProceedToUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#1E293B] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <span>Upload Candidates</span>
          </button>
        )}
      </div>

      {/* Role Overview Card */}
      <div className="mt-8 rounded-2xl bg-white border border-[#CBD5E1] p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6366F1] tracking-wide uppercase">
              Target Position
            </span>
            <h2 className="text-2xl font-bold text-[#0F172A]">
              {jobDescription.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] font-medium">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
                {jobDescription.department}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#6366F1]" />
                {jobDescription.experienceLevel}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6366F1]" />
                {jobDescription.location}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-4 text-xs text-[#64748B] space-y-1.5 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
              <FileText className="w-4 h-4 text-[#6366F1]" />
              <span>{jobDescription.filename}</span>
            </div>
            <p>Parsed size: {jobDescription.fileSize} • Spec ID: {jobDescription.id}</p>
          </div>
        </div>

        {/* Executive Role Summary */}
        <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            Role Summary & Architecture Focus
          </h3>
          <p className="text-sm text-[#334155] leading-relaxed font-medium">
            {jobDescription.summary}
          </p>
        </div>
      </div>

      {/* Required vs Preferred Competencies */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <div className="rounded-2xl bg-white border border-[#CBD5E1] p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A]" />
              <span>Detected Required Skills ({jobDescription.requiredSkills.length})</span>
            </h3>
            <span className="text-[11px] font-bold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
              Core Filter
            </span>
          </div>

          <div className="space-y-3">
            {jobDescription.requiredSkills.map((skill, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0F172A]">{skill.name}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    skill.importance === 'critical' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                  }`}>
                    {skill.importance}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Skills */}
        <div className="rounded-2xl bg-white border border-[#CBD5E1] p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
              <span>Detected Preferred Skills ({jobDescription.preferredSkills.length})</span>
            </h3>
            <span className="text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
              Differentiator
            </span>
          </div>

          <div className="space-y-3">
            {jobDescription.preferredSkills.map((skill, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#0F172A]">{skill.name}</h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Responsibilities */}
      <div className="mt-8 rounded-2xl bg-white border border-[#CBD5E1] p-6 shadow-2xs">
        <h3 className="text-base font-bold text-[#0F172A] mb-4">
          Candidate-Relevant Core Responsibilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobDescription.coreResponsibilities.map((resp, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#1E293B] font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>{resp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* JD BIAS & RESTRICTIVENESS AUDIT SECTION */}
      <div className="mt-8 rounded-2xl bg-white border border-[#F59E0B]/50 p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              JD Restrictiveness & Inclusivity Audit
            </h3>
            <p className="text-xs text-[#64748B]">
              Automated detection of requirements that may unnecessarily exclude qualified talent
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {jobDescription.biasAndRestrictions.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Potentially restrictive requirement</span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  item.severity === 'high' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                }`}>
                  {item.severity} severity
                </span>
              </div>

              {/* Requirement Quote */}
              <blockquote className="border-l-2 border-[#D97706] pl-3 text-xs font-semibold text-[#0F172A] italic">
                "{item.requirementText}"
              </blockquote>

              {/* Why it may exclude candidates */}
              <div className="text-xs text-[#475569] leading-relaxed">
                <strong className="text-[#0F172A] font-bold">Exclusion Risk: </strong>
                {item.concern}
              </div>

              {/* Suggested Inclusive Alternative */}
              <div className="p-3 rounded-lg bg-white border border-[#A7F3D0] text-xs text-[#065F46] flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#065F46] font-bold">Recommended Inclusive Alternative: </strong>
                  <span>{item.inclusiveAlternative}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
