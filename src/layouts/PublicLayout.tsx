import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Button } from '../components/ui';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { Sparkles, Bot, Briefcase, ArrowRight, LogIn, LayoutDashboard, LogOut } from 'lucide-react';

export default function PublicLayout() {
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const { t, isVietnamese } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 w-full max-w-[1536px] items-center justify-between px-4 sm:px-6 lg:px-8 2xl:px-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 mr-4 lg:mr-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">Jobie</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">FA26SE119 • Capstone</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-sm font-medium text-slate-600 shrink-0">
            <Link
              to="/"
              className={`transition-colors whitespace-nowrap px-3 py-1.5 rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                location.pathname === '/'
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {t('nav.overview', 'Tổng quan')}
            </Link>
            <Link
              to="/jobs"
              className={`transition-colors flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                location.pathname.startsWith('/jobs')
                  ? 'bg-blue-50/80 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Briefcase className={`h-4 w-4 ${location.pathname.startsWith('/jobs') ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{t('nav.jobDiscovery', 'Khám phá việc làm')}</span>
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                if (window.location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/#features');
                }
              }}
              className="hover:text-blue-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>{t('nav.aiAgentMatching', 'Khớp nối AI Agent')}</span>
            </a>
            <Link
              to="/guest-trial"
              className="transition-colors flex items-center gap-1.5 whitespace-nowrap outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full ml-1"
            >
              <span className="rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/80 hover:bg-blue-100 hover:text-blue-800 transition shadow-2xs whitespace-nowrap">
                {isVietnamese ? 'Trải nghiệm ngay' : 'Guest Trial'}
              </span>
            </Link>
          </nav>

          {/* Controls & Auth CTA */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Vertical separator */}
            <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                {/* User Identity Card */}
                <div className="hidden xl:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 py-1.5 px-3 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{user.name}</div>
                    <div className="text-[10px] font-semibold text-blue-600">{getRoleLabel()}</div>
                  </div>
                </div>

                {/* Open Workspace button */}
                <Link to={getRoleDashboardPath()} className="shrink-0">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap">
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>{t('common.openWorkspace', 'Mở không gian làm việc')}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Button>
                </Link>

                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  className="text-xs sm:text-sm py-2 px-3 text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl"
                  onClick={logout}
                  title={t('common.signOut', 'Đăng xuất')}
                >
                  <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-600" />
                  <span className="hidden sm:inline font-semibold">{t('common.signOut', 'Đăng xuất')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" className="text-xs sm:text-sm py-2.5 px-3.5 text-slate-700 hover:text-blue-600 flex items-center gap-1.5 font-semibold rounded-xl">
                    <LogIn className="h-4 w-4" />
                    <span>{t('common.signIn', 'Đăng nhập')}</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm">
                    <span>{t('common.getStarted', 'Bắt đầu ngay')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">{t('footer.projectCode', 'Mã đồ án: FA26SE119')}</span>
              <span>•</span>
              <span>{t('footer.projectDescription', 'Hệ thống AI Agent khớp nối CV thông minh hỗ trợ gợi ý việc làm và tư vấn lộ trình nghề nghiệp')}</span>
            </div>
            <div>
              {t('footer.capstoneTag', 'Đồ án Tốt nghiệp Đại học FPT • Mô hình Kiến trúc Frontend')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
