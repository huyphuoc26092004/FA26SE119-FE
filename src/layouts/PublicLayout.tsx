import { useEffect, useState } from 'react';
import { Outlet, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Button } from '../components/ui';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import {
  ArrowRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { CcvLogo } from '../components/brand/CcvLogo';
import { IS_APP } from '../utils/platform';

export default function PublicLayout() {
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const { t, isVietnamese } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const getRoleLabel = () => {
    if (role === 'ADMIN') return t('common.roleAdmin', 'Quản trị viên');
    if (role === 'CAREER_CONSULTANT') return t('common.roleConsultant', 'Cố vấn');
    return t('common.roleCandidate', 'Ứng viên');
  };

  const getRoleDashboardPath = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'CAREER_CONSULTANT') return '/consultant';
    return '/candidate';
  };

  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-otp',
  ].includes(location.pathname);

  // The app has no marketing landing page: it opens on sign-in or the user's workspace.
  if (IS_APP && location.pathname === '/') {
    return <Navigate to={isAuthenticated ? getRoleDashboardPath() : '/login'} replace />;
  }

  // The guest trial page brings its own sidebar shell.
  if (isAuthPage || location.pathname === '/guest-trial') {
    return <Outlet />;
  }

  const linkClass =
    'inline-flex min-h-10 items-center gap-2 text-[15px] transition-colors duration-150 focus-visible:outline-offset-2';
  const standardLinkClass = `${linkClass} text-slate-700 hover:text-brand`;
  const activeLinkClass = `${linkClass} text-brand`;
  const isJobsPage = location.pathname.startsWith('/jobs');

  const openFeatureSection = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      event.preventDefault();
      navigate('/#features');
    }
  };

  const publicNavigation = (
    <>
      <Link
        to="/"
        className={location.pathname === '/' ? activeLinkClass : standardLinkClass}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t('nav.overview', 'Tổng quan')}
      </Link>
      <Link
        to="/jobs"
        className={isJobsPage ? activeLinkClass : standardLinkClass}
        onClick={() => setMobileMenuOpen(false)}
      >
        <span>{t('nav.jobDiscovery', 'Khám phá việc làm')}</span>
      </Link>
      <a href="#features" onClick={openFeatureSection} className={standardLinkClass}>
        <span>{t('nav.aiAgentMatching', 'Khớp nối AI Agent')}</span>
      </a>
      <Link
        to="/guest-trial"
        className={location.pathname === '/guest-trial' ? activeLinkClass : standardLinkClass}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t('nav.guestTrial', isVietnamese ? 'Trải nghiệm ngay' : 'Guest trial')}
      </Link>
    </>
  );

  const accountActions =
    isAuthenticated && user ? (
      <>
        <Link
          to={getRoleDashboardPath()}
          onClick={() => setMobileMenuOpen(false)}
          className="btn btn-p btn-s min-h-10"
        >
          <span>{t('common.openWorkspace', 'Mở không gian làm việc')}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="min-h-10 px-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            logout();
            setMobileMenuOpen(false);
          }}
          title={t('common.signOut', 'Đăng xuất')}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('common.signOut', 'Đăng xuất')}
        </Button>
      </>
    ) : (
      <>
        <Link
          to="/login"
          onClick={() => setMobileMenuOpen(false)}
          className={`${standardLinkClass} justify-center`}
        >
          {t('common.signIn', 'Đăng nhập')}
        </Link>
        <Link
          to="/register"
          onClick={() => setMobileMenuOpen(false)}
          className="btn btn-p btn-s min-h-10"
        >
          {t('common.getStarted', 'Bắt đầu ngay')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </>
    );

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-canvas">
        <div className="relative mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-[clamp(2rem,4vw,5rem)]">
          <Link
            to="/"
            aria-label="CCV"
            className="inline-flex shrink-0 rounded-control focus-visible:outline-offset-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CcvLogo height={32} />
          </Link>

          <nav
            aria-label={t(
              'nav.publicNavigation',
              isVietnamese ? 'Điều hướng chính' : 'Main navigation',
            )}
            className="hidden items-center gap-7 lg:flex"
          >
            {publicNavigation}
          </nav>

          <div className="hidden shrink-0 items-center gap-4 xl:flex">
            <LanguageSwitcher />
            {isAuthenticated && user && (
              <span className="max-w-36 border-l border-border pl-4">
                <span className="block truncate text-xs text-ink">{user.name}</span>
                <span className="block text-xs text-slate-600">{getRoleLabel()}</span>
              </span>
            )}
            {accountActions}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink"
              aria-label={
                mobileMenuOpen
                  ? t('layout.closeMenu', 'Close navigation')
                  : t('layout.openMenu', 'Open navigation')
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-navigation"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div
              id="public-mobile-navigation"
              className="absolute inset-x-0 top-full border-b border-border bg-canvas px-5 py-4 lg:hidden sm:px-8"
            >
              <nav
                aria-label={t(
                  'nav.publicNavigation',
                  isVietnamese ? 'Điều hướng chính' : 'Main navigation',
                )}
                className="grid gap-1"
              >
                {publicNavigation}
              </nav>
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3">
                {accountActions}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className={`border-t border-border py-8 ${IS_APP ? 'hidden' : ''}`}>
        <div className="mx-auto flex max-w-[1680px] flex-col items-start justify-between gap-3 px-5 text-xs text-slate-600 sm:px-8 lg:px-[clamp(2rem,4vw,5rem)] md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-slate-700">{t('footer.projectCode', 'Mã đồ án: FA26SE119')}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t(
                'footer.projectDescription',
                'Hệ thống AI Agent khớp nối CV thông minh hỗ trợ gợi ý việc làm và tư vấn lộ trình nghề nghiệp',
              )}
            </span>
          </div>
          <div>
            {t('footer.capstoneTag', 'Đồ án Tốt nghiệp Đại học FPT • Mô hình Kiến trúc Frontend')}
          </div>
        </div>
      </footer>
    </div>
  );
}
