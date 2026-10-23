import {
  FileText,
  Briefcase,
  User,
  Info,
  Menu,
  RotateCcw,
  Download,
  ChevronDown,
} from 'lucide-react';
import type { CandidateProfile, Job, Resume } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface AssistantContextBarProps {
  profile?: CandidateProfile;
  resumes: Resume[];
  jobs: Job[];
  selectedCvId?: string;
  selectedJobId?: string;
  onSelectCv: (cvId?: string) => void;
  onSelectJob: (jobId?: string) => void;
  onOpenInspector: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onToggleSidebarMobile: () => void;
}

export function AssistantContextBar({
  profile,
  resumes,
  jobs,
  selectedCvId,
  selectedJobId,
  onSelectCv,
  onSelectJob,
  onOpenInspector,
  onClearChat,
  onExportChat,
  onToggleSidebarMobile,
}: AssistantContextBarProps) {
  const { t } = useTranslation();


  return (
    <div className="border-b border-slate-200/80 bg-surface px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile menu toggle & Active Context Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile open history button */}
          <button
            onClick={onToggleSidebarMobile}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle history menu"
          >
            <Menu size={18} />
          </button>

          {/* Profile indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1.5 text-xs text-slate-700 font-medium">
            <User size={13} className="text-brand-600" />
            <span className="truncate max-w-[120px]">{profile?.name || 'Alex Morgan'}</span>
          </div>

          {/* CV Selector */}
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/60 px-2.5 py-1.5 text-xs font-semibold text-brand-900 shadow-2xs">
              <FileText size={13} className="text-brand-600" />
              <select
                value={selectedCvId || ''}
                onChange={(e) => onSelectCv(e.target.value || undefined)}
                className="bg-transparent text-xs font-semibold text-brand-900 outline-none cursor-pointer pr-4 appearance-none max-w-[140px] sm:max-w-[200px] truncate"
                aria-label="Chọn CV đính kèm"
              >
                <option value="">{t('assistant.noCvAttached')}</option>
                {resumes.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} ({cv.atsScore}% ATS)
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="text-brand-500 pointer-events-none -ml-3" />
            </div>
          </div>

          {/* Job Selector */}
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs">
              <Briefcase size={13} className="text-emerald-600" />
              <select
                value={selectedJobId || ''}
                onChange={(e) => onSelectJob(e.target.value || undefined)}
                className="bg-transparent text-xs font-semibold text-emerald-900 outline-none cursor-pointer pr-4 appearance-none max-w-[160px] sm:max-w-[210px] truncate"
                aria-label="Chọn việc làm mục tiêu"
              >
                <option value="">{t('assistant.noJobAttached')}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="text-emerald-500 pointer-events-none -ml-3" />
            </div>
          </div>

          {/* Inspect Context Button */}
          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title={t('assistant.inspectContext')}
          >
            <Info size={13} className="text-brand-600" />
            <span className="hidden md:inline">{t('assistant.inspectContext')}</span>
          </button>
        </div>

        {/* Right: Actions (Clear Chat, Export Chat) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExportChat}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title={t('assistant.exportChat')}
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden sm:inline">{t('assistant.exportChat')}</span>
          </button>

          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            title={t('assistant.clearChat')}
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">{t('assistant.clearChat')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
