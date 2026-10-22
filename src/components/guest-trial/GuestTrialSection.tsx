import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, CheckCircle2, UserCheck } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
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
      label: isVietnamese ? 'Duyệt việc làm' : 'Browse jobs',
      hint: isVietnamese ? 'Công khai, không cần đăng nhập' : 'Public, no sign-in needed',
    },
    {
      id: 'resumes' as const,
      label: isVietnamese ? 'Xem CV demo' : 'Demo CVs',
      hint: isVietnamese ? 'Mẫu chuẩn ATS, điểm 90+' : 'ATS-ready samples, 90+ score',
    },
    {
      id: 'builder' as const,
      label: 'AI Resume Builder',
      hint: isVietnamese ? 'Tạo CV với các mẫu cơ bản' : 'Build a CV from basic templates',
    },
    {
      id: 'chat' as const,
      label: isVietnamese ? 'Trò chuyện với AI' : 'Chat with the assistant',
      hint: isVietnamese ? '3 lượt hỏi thử' : '3 free questions',
    },
  ];

  const tabList = (
    <div>
      <p className="pb-3 text-[13px] text-slate-600">
        {isVietnamese ? 'Bốn thứ bạn có thể thử' : 'Four things you can try'}
      </p>
      <div role="tablist" className="border-b border-border">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="group flex w-full items-baseline gap-3 border-t border-border py-3.5 text-left"
            >
              <span className={`w-5 shrink-0 text-xs tabular-nums ${isActive ? 'text-brand' : 'text-slate-600'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[16px] transition-colors ${
                    isActive ? 'text-brand' : 'text-slate-800 group-hover:text-brand'
                  }`}
                >
                  {tab.label}
                </span>
                <span className="mt-0.5 block text-[13px] leading-5 text-slate-600">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const content = (
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
      {activeTab === 'chat' && <GuestAiChatTab onOpenSaveModal={() => setShowSaveModal(true)} />}
    </div>
  );

  const heading = (
    <header className="mb-14">
      <p className="text-sm text-brand">
        {isVietnamese ? 'Trải nghiệm dùng thử dành cho khách' : 'Guest trial for visitors'}
      </p>
      <h1 className="mt-5 text-4xl font-normal leading-[1.12] tracking-[-0.025em] text-ink sm:text-5xl lg:text-[3.6rem]">
        {isVietnamese ? (
          <>
            Dùng thử không cần tài khoản,
            <br />
            <span className="text-brand">trải nghiệm sức mạnh AI.</span>
          </>
        ) : (
          <>
            Try it without an account,
            <br />
            <span className="text-brand">see what it can do.</span>
          </>
        )}
      </h1>
      <p className="mt-7 max-w-[600px] text-[17px] leading-8 text-slate-700">
        {isVietnamese
          ? 'Xem việc làm công khai, đọc bản phân tích CV mẫu, tự tạo CV bằng AI và trò chuyện với trợ lý nghề nghiệp.'
          : 'Browse public jobs, read a sample CV analysis, build a CV and chat with the career assistant.'}
      </p>
    </header>
  );

  return (
    <section id="guest-trial" className="scroll-mt-24">
      {isStandalone ? (
        <div className="min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-border px-6 py-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
            <Link to="/" className="flex items-baseline gap-1 text-ink">
              <span className="text-[28px] font-medium tracking-[-0.02em]">Jobie</span>
              <span className="text-xs text-brand">ai</span>
            </Link>
            <div className="mt-10 flex-1 overflow-y-auto">{tabList}</div>
            <div className="mt-8">
              <Link
                to="/register"
                className="flex min-h-12 items-center justify-between rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-800"
              >
                {t('common.getStarted', isVietnamese ? 'Bắt đầu ngay' : 'Get started')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <div className="mt-4 flex items-center justify-between text-[15px]">
                <Link to="/login" className="text-slate-700 transition-colors hover:text-brand">
                  {t('common.signIn', isVietnamese ? 'Đăng nhập' : 'Sign in')}
                </Link>
                <LanguageSwitcher className="-mr-2" />
              </div>
            </div>
          </aside>
          <div className="min-w-0 px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
            {heading}
            {content}
          </div>
        </div>
      ) : (
        <div className="mt-24">
          {heading}
          <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
            {tabList}
            {content}
          </div>
        </div>
      )}

      {/* Modal Prompt to Register / Login */}
      {showSaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-surface p-6 sm:p-8 shadow-sm"
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
              <h3 className="text-2xl font-normal text-ink">
                {isVietnamese
                  ? 'Lưu lại và dùng đầy đủ tính năng'
                  : 'Save your work and unlock every feature'}
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
                <Button className="w-full py-3 text-sm">
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
