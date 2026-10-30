import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, LogIn, PanelLeftClose, PanelLeftOpen, PenLine, X, CheckCircle2, UserCheck } from 'lucide-react';
import { useSidebarCollapsed } from '../../utils/useSidebarCollapsed';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { GuestJobsTab } from './GuestJobsTab';
import { GuestCvDemoTab } from './GuestCvDemoTab';
import { GuestAiBuilderTab } from './GuestAiBuilderTab';
import { GuestAiChatWidget } from './GuestAiChatTab';
import type { DemoCvData } from './guestTrialData';
import { Button } from '../ui';
import { useTranslation } from '../../i18n';
import { CcvLogo } from '../brand/CcvLogo';

export type GuestTrialTab = 'jobs' | 'resumes' | 'builder';

export function GuestTrialSection({ isStandalone = false }: { isStandalone?: boolean } = {}) {
  const { t, isVietnamese } = useTranslation();
  const [activeTab, setActiveTab] = useState<GuestTrialTab>('jobs');
  const [builderInitialData, setBuilderInitialData] = useState<DemoCvData | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed('ccv.guestSidebar.collapsed');
  const collapseLabel = collapsed
    ? isVietnamese ? 'Mở rộng thanh bên' : 'Expand sidebar'
    : isVietnamese ? 'Thu gọn thanh bên' : 'Collapse sidebar';

  // Bản dùng thử luôn dùng mẫu "Hiện đại"; chỉ mang dữ liệu của CV demo sang.
  const handleSelectTemplateForBuilder = (cv: DemoCvData) => {
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
      icon: BriefcaseBusiness,
      label: isVietnamese ? 'Duyệt việc làm' : 'Browse jobs',
      hint: isVietnamese ? 'Công khai, không cần đăng nhập' : 'Public, no sign-in needed',
    },
    {
      id: 'resumes' as const,
      icon: FileText,
      label: isVietnamese ? 'Xem CV demo' : 'Demo CVs',
      hint: isVietnamese ? 'Mẫu chuẩn ATS, điểm 90+' : 'ATS-ready samples, 90+ score',
    },
    {
      id: 'builder' as const,
      icon: PenLine,
      label: 'AI Resume Builder',
      hint: isVietnamese ? 'Tạo CV với 1 mẫu miễn phí' : 'Build a CV with 1 free template',
    },
  ];

  const tabList = (
    <div>
      <p className="pb-4 text-sm text-slate-600">
        {isVietnamese ? 'Ba thứ bạn có thể thử' : 'Three things you can try'}
      </p>
      <div role="tablist" className="grid grid-cols-3 gap-x-4 border-b border-border lg:block">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="group flex w-full items-baseline gap-3 border-t border-border py-4 text-left"
            >
              <span
                className={`w-6 shrink-0 text-xs tabular-nums ${isActive ? 'text-brand' : 'text-slate-600'}`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-base transition-colors sm:text-lg ${
                    isActive ? 'text-brand' : 'text-slate-800 group-hover:text-brand'
                  }`}
                >
                  {tab.label}
                </span>
                <span className="mt-1 hidden text-sm leading-snug text-slate-600 sm:block">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Thanh bên thu gọn của trang dùng thử: chỉ còn biểu tượng.
  const iconTabList = (
    <div role="tablist" className="flex flex-col items-center gap-2 border-t border-border pt-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => setActiveTab(tab.id)}
            className={`grid h-11 w-11 cursor-pointer place-items-center rounded-xl transition-colors ${
              isActive ? 'bg-brand-50 text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
            }`}
          >
            <Icon size={19} strokeWidth={1.6} />
          </button>
        );
      })}
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
          initialData={builderInitialData}
          onOpenSaveModal={() => setShowSaveModal(true)}
        />
      )}
    </div>
  );

  const heading = (
    <header className="mb-[clamp(3rem,6vh,5rem)]">
      <p className="text-base text-brand">
        {isVietnamese ? 'Trải nghiệm dùng thử dành cho khách' : 'Guest trial for visitors'}
      </p>
      <h1 className="mt-5 text-[clamp(2.25rem,4.4vw,5.5rem)] font-normal leading-[1.06] tracking-[-0.03em] text-ink">
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
      <p className="mt-7 max-w-3xl text-lg leading-relaxed text-slate-700">
        {isVietnamese
          ? 'Xem việc làm công khai, đọc bản phân tích CV mẫu, tự tạo CV bằng AI và trò chuyện với trợ lý nghề nghiệp.'
          : 'Browse public jobs, read a sample CV analysis, build a CV and chat with the career assistant.'}
      </p>
    </header>
  );

  return (
    <section
      id="guest-trial"
      // Fluid scale for the whole trial: Tailwind's spacing and text sizes grow with the viewport.
      className="scroll-mt-24 [--spacing:clamp(0.25rem,0.2rem+0.11vw,0.32rem)] [--text-xs:clamp(0.75rem,0.69rem+0.17vw,0.9375rem)] [--text-sm:clamp(0.875rem,0.8rem+0.2vw,1.0625rem)] [--text-base:clamp(1rem,0.92rem+0.22vw,1.1875rem)] [--text-lg:clamp(1.125rem,1.03rem+0.26vw,1.375rem)] [--text-xl:clamp(1.25rem,1.13rem+0.32vw,1.5rem)] [--text-2xl:clamp(1.5rem,1.33rem+0.45vw,1.875rem)] [--text-3xl:clamp(1.875rem,1.6rem+0.7vw,2.375rem)]"
    >
      {isStandalone ? (
        <div
          className={`min-h-screen lg:grid ${
            collapsed ? 'lg:grid-cols-[4.75rem_minmax(0,1fr)]' : 'lg:grid-cols-[clamp(18.5rem,21vw,28rem)_minmax(0,1fr)]'
          }`}
        >
          <aside
            className={`border-b border-border px-6 py-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:py-10 ${
              collapsed ? 'lg:items-center lg:px-0' : 'lg:px-[clamp(1.5rem,2vw,2.5rem)]'
            }`}
          >
            <div className={`flex items-center justify-between gap-3 ${collapsed ? 'lg:flex-col lg:gap-4' : ''}`}>
              <Link to="/" aria-label="CCV" className="inline-flex">
                <span className={collapsed ? 'lg:hidden' : ''}>
                  <CcvLogo height={40} />
                </span>
                {collapsed && (
                  <span className="hidden lg:inline">
                    <CcvLogo height={32} markOnly />
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapseLabel}
                title={collapseLabel}
                className="hidden h-9 w-9 cursor-pointer place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink lg:grid"
              >
                {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
              </button>
            </div>
            {collapsed && <div className="mt-8 hidden flex-1 lg:block">{iconTabList}</div>}
            {collapsed && (
              <div className="mt-6 hidden flex-col items-center gap-2 lg:flex">
                <Link
                  to="/register"
                  aria-label={t('common.getStarted', isVietnamese ? 'Bắt đầu ngay' : 'Get started')}
                  title={t('common.getStarted', isVietnamese ? 'Bắt đầu ngay' : 'Get started')}
                  className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800"
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  aria-label={t('common.signIn', isVietnamese ? 'Đăng nhập' : 'Sign in')}
                  title={t('common.signIn', isVietnamese ? 'Đăng nhập' : 'Sign in')}
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
                >
                  <LogIn size={18} aria-hidden="true" />
                </Link>
              </div>
            )}
            <div className={`mt-10 flex-1 overflow-y-auto ${collapsed ? 'lg:hidden' : ''}`}>{tabList}</div>
            <div className={`mt-8 ${collapsed ? 'lg:hidden' : ''}`}>
              <Link
                to="/register"
                className="btn btn-p btn-m min-h-12 w-full justify-between!"
              >
                {t('common.getStarted', isVietnamese ? 'Bắt đầu ngay' : 'Get started')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <div className="mt-4 flex items-center justify-between text-base">
                <Link to="/login" className="text-slate-700 transition-colors hover:text-brand">
                  {t('common.signIn', isVietnamese ? 'Đăng nhập' : 'Sign in')}
                </Link>
                <LanguageSwitcher className="-mr-2" />
              </div>
            </div>
          </aside>
          <div className="min-w-0 px-5 py-12 sm:px-10 lg:px-[clamp(3rem,4.5vw,6rem)] lg:py-[clamp(3.5rem,7vh,6rem)]">
            <div className="max-w-[1640px]">
              {heading}
              {content}
            </div>
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

      {/* Floating assistant chat, available from every tab */}
      <GuestAiChatWidget onOpenSaveModal={() => setShowSaveModal(true)} />

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
