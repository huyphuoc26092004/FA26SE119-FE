import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Sparkles, X, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import type { NavItem } from '../constants/navigation';

export function DashboardLayout({ nav, area }: { nav: NavItem[]; area: string }) {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const getAreaLabel = () => {
    switch (area.toLowerCase()) {
      case 'candidate':
        return t('layout.candidateWorkspace');
      case 'consultant':
        return t('layout.consultantWorkspace');
      case 'admin':
        return t('layout.adminWorkspace');
      default:
        return `${area} Workspace`;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] lg:pl-64">
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <Sparkles size={20} />
            </span>
            CareerPilot<span className="text-blue-600">.</span>
          </Link>
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800"
            aria-label={t('layout.closeMenu')}
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-5">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {getAreaLabel()}
          </p>
          <nav aria-label={`${area} navigation`} className="space-y-1">
            {nav.map(({ label, translationKey, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/candidate' || to === '/consultant' || to === '/admin'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                <span>{t(translationKey, label)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mx-4 mb-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-700">{t('layout.projectCode')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('layout.mockEnvSubtitle')}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t('layout.openMenu')}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-800">{getAreaLabel()}</p>
              <p className="hidden text-xs text-slate-400 sm:block">
                {t('layout.workspaceTagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Global Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Bell */}
            <button
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
              aria-label={t('layout.notifications')}
              title={t('layout.notifications')}
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                aria-expanded={userMenu}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50 transition"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {user?.name.charAt(0) || 'U'}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-slate-800">{user?.name}</span>
                  <span className="block text-xs text-slate-400">{area}</span>
                </span>
                <ChevronDown size={15} className="text-slate-400" />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50">
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    <LogOut size={16} />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 md:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
