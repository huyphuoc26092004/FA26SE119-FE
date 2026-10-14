import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  X,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { GuestJobsTab } from './GuestJobsTab';
import { GuestCvDemoTab } from './GuestCvDemoTab';
import { GuestAiBuilderTab } from './GuestAiBuilderTab';
import { GuestAiChatTab } from './GuestAiChatTab';
import type { DemoCvData } from './guestTrialData';
import { Button } from '../ui';
import { useTranslation } from '../../i18n';

export type GuestTrialTab = 'jobs' | 'resumes' | 'builder' | 'chat';

export function GuestTrialSection({ isStandalone = false }: { isStandalone?: boolean } = {}) {
  const { t, isVietnamese } = useTranslation();
  const [activeTab, setActiveTab] = useState<GuestTrialTab>('jobs');
  const [builderTemplate, setBuilderTemplate] = useState<'modern' | 'tech' | 'classic'>('modern');
  const [builderInitialData, setBuilderInitialData] = useState<DemoCvData | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSelectTemplateForBuilder = (
    template: 'modern' | 'tech' | 'classic',
    cv: DemoCvData
  ) => {
    setBuilderTemplate(template);
    setBuilderInitialData(cv);
    setActiveTab('builder');
    // Smooth scroll to builder
    const el = document.getElementById('guest-trial');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const tabs = [
    {
      id: 'jobs' as const,
      icon: Briefcase,
      label: isVietnamese ? 'Duyệt Việc Làm' : 'Browse Public Jobs',
      badge: isVietnamese ? 'Công khai' : 'Public',
      badgeTone: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'resumes' as const,
      icon: FileText,
      label: isVietnamese ? 'Xem CV Demo' : 'Demo CV Showcase',
      badge: 'ATS 90+',
      badgeTone: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'builder' as const,
      icon: Sparkles,
      label: isVietnamese ? 'AI Resume Builder' : 'AI Resume Builder',
      badge: isVietnamese ? 'Mẫu cơ bản' : 'Basic Templates',
      badgeTone: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'chat' as const,
      icon: Bot,
      label: isVietnamese ? 'Trò Chuyện Với AI' : 'AI Assistant Chat',
      badge: isVietnamese ? '3 lượt hỏi thử' : '3 Free Queries',
      badgeTone: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <section id="guest-trial" className={`scroll-mt-24 ${isStandalone ? 'mt-4' : 'mt-24'}`}>
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-4 shadow-2xs">
          <Sparkles size={14} className="text-blue-600" />
          <span>
            {isVietnamese
              ? 'Guest Trial · Trải nghiệm dùng thử dành cho Khách'
              : 'Guest Trial · Instant hands-on access for visitors'}
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {isVietnamese ? (
            <>
              Dùng thử không cần tài khoản,{' '}
              <span className="text-blue-600">trải nghiệm sức mạnh AI</span>
            </>
          ) : (
            <>
              Try core features without sign-up,{' '}
              <span className="text-blue-600">powered by AI</span>
            </>
          )}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
          {isVietnamese
            ? 'Khám phá các việc làm công khai, xem bản phân tích CV mẫu chuẩn ATS, tự tay tạo CV bằng AI với các mẫu cơ bản và trò chuyện trực tiếp cùng trợ lý nghề nghiệp.'
            : 'Explore public jobs, inspect ATS-optimized demo CVs, create your resume with AI using basic templates, and test our intelligent career assistant.'}
        </p>
      </div>

      {/* Modern Trial Workspace Container */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:p-6 lg:p-8">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeTone
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="min-h-[500px]">
          {activeTab === 'jobs' && <GuestJobsTab />}
          {activeTab === 'resumes' && (
            <GuestCvDemoTab onSelectTemplateForBuilder={handleSelectTemplateForBuilder} />
          )}
          {activeTab === 'builder' && (
            <GuestAiBuilderTab
              initialTemplate={builderTemplate}
              initialData={builderInitialData}
              onOpenSaveModal={() => setShowSaveModal(true)}
            />
          )}
          {activeTab === 'chat' && (
            <GuestAiChatTab onOpenSaveModal={() => setShowSaveModal(true)} />
          )}
        </div>
      </div>

      {/* Modal Prompt to Register / Login */}
      {showSaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                <Sparkles size={28} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                {isVietnamese
                  ? 'Mở Khoá Toàn Bộ Quyền Năng AI'
                  : 'Unlock Full AI Career Capabilities'}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isVietnamese
                  ? 'Bạn đang ở phiên dùng thử. Hãy đăng ký tài khoản miễn phí hoặc đăng nhập bằng tài khoản Demo để lưu trữ và tận hưởng trọn vẹn nền tảng.'
                  : 'You are currently in guest trial mode. Sign up for free or sign in with demo credentials to save and unlock all features.'}
              </p>
            </div>

            <div className="my-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs sm:text-sm text-slate-700 space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {isVietnamese
                    ? 'Lưu trữ CV không giới hạn & Xuất file PDF chuẩn ATS'
                    : 'Unlimited CV storage & ATS-compliant PDF export'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {isVietnamese
                    ? '10+ mẫu CV chuyên nghiệp cho mọi ngành nghề'
                    : '10+ premium templates for all job categories'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {isVietnamese
                    ? 'Phân tích tương thích CV với mọi bài tuyển dụng'
                    : 'Full CV vs Job Description deep matching analysis'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {isVietnamese
                    ? 'Trò chuyện không giới hạn cùng Trợ lý AI và Cố vấn nghề nghiệp'
                    : 'Unlimited consultation with AI Career Assistant'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link to="/register" className="w-full">
                <Button className="w-full py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700">
                  <UserCheck size={16} />
                  {isVietnamese ? 'Tạo tài khoản miễn phí' : 'Create Free Account'}
                </Button>
              </Link>
              <Link to="/login" className="w-full">
                <Button variant="secondary" className="w-full py-2.5 text-sm font-semibold">
                  {isVietnamese
                    ? 'Đăng nhập với tài khoản Demo có sẵn'
                    : 'Sign in with pre-configured Demo account'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
