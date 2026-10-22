import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import type { NavItem } from '../constants/navigation';

export function DashboardLayout({ nav, area }: { nav: NavItem[]; area: string }) {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, isVietnamese } = useTranslation();

  useEffect(() => {
    if (!open && !userMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, userMenu]);

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

  const groupLabels: Record<NavItem['group'], string> = {
    workspace: isVietnamese ? 'Không gian làm việc' : 'Workspace',
    career:
      area.toLowerCase() === 'consultant'
        ? isVietnamese
          ? 'Tư vấn & ứng viên'
          : 'Consultations & candidates'
        : isVietnamese
          ? 'Công cụ nghề nghiệp'
          : 'Career tools',
    account: isVietnamese ? 'Tài khoản' : 'Account',
    management: isVietnamese ? 'Quản lý' : 'Management',
    platform: isVietnamese ? 'Nền tảng' : 'Platform',
    operations: isVietnamese ? 'Vận hành & báo cáo' : 'Operations & reporting',
  };

  const closeMobileNav = () => setOpen(false);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:pl-[272px]">
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={closeMobileNav}
        aria-label={t('layout.closeMenu')}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="workspace-sidebar"
        aria-label={`${area} workspace`}
        className={`invisible fixed inset-y-0 left-0 z-50 flex h-screen w-[272px] -translate-x-full flex-col border-r border-border bg-canvas transition-transform duration-200 ease-out lg:visible lg:translate-x-0 ${
          open ? 'visible translate-x-0' : ''
        }`}
      >
        <div className="flex shrink-0 items-center px-7 pb-6 pt-8">
          <Link
            to="/"
            className="flex items-baseline gap-1 rounded-control text-ink focus-visible:outline-offset-4"
            onClick={closeMobileNav}
          >
            <span className="text-2xl font-medium tracking-[-0.02em]">Jobie</span>
            <span className="text-xs text-brand">ai</span>
          </Link>
          <button
            type="button"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
            aria-label={t('layout.closeMenu')}
            onClick={closeMobileNav}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 pb-6">
          <p className="pb-3 text-[13px] text-slate-600">{getAreaLabel()}</p>
          <nav aria-label={`${area} navigation`}>
            {nav.map(({ label, translationKey, to, group }, index) => {
              const beginsGroup = index === 0 || nav[index - 1].group !== group;

              return (
                <div key={to}>
                  {beginsGroup && (
                    <p
                      className={`pb-2 pt-6 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 ${
                        index === 0 ? 'sr-only' : ''
                      }`}
                    >
                      {groupLabels[group]}
                    </p>
                  )}
                  <NavLink
                    to={to}
                    end={to === '/candidate' || to === '/consultant' || to === '/admin'}
                    onClick={closeMobileNav}
                    className={({ isActive }) =>
                      `group flex items-baseline gap-3 border-t border-border py-2.5 text-[15px] transition-colors duration-150 focus-visible:outline-offset-2 ${
                        isActive ? 'text-brand' : 'text-slate-800 hover:text-brand'
                      }`
                    }
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums text-slate-500 group-aria-[current=page]:text-brand">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">{t(translationKey, label)}</span>
                  </NavLink>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-white">
              {user?.name.charAt(0) || 'U'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-ink">{user?.name}</span>
              <span className="block text-xs text-slate-600">{t('layout.projectCode')}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex min-h-11 w-full items-center justify-between rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            {t('nav.signOut')}
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="min-h-screen min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-canvas px-5 md:px-8 xl:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t('layout.openMenu')}
              aria-expanded={open}
              aria-controls="workspace-sidebar"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <p className="truncate text-sm text-brand">{getAreaLabel()}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
              aria-label={t('layout.notifications')}
              title={t('layout.notifications')}
            >
              <Bell size={18} aria-hidden="true" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((current) => !current)}
                aria-expanded={userMenu}
                aria-controls="workspace-user-menu"
                className="flex min-h-9 items-center gap-2 rounded-full px-1.5 text-left transition-colors hover:bg-slate-100 sm:px-2"
              >
                <span className="hidden max-w-40 truncate text-sm text-ink sm:block">{user?.name}</span>
                <ChevronDown size={15} aria-hidden="true" className="text-slate-500" />
              </button>

              {userMenu && (
                <div
                  id="workspace-user-menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-panel border border-border bg-surface p-1 shadow-lg"
                >
                  <p className="border-b border-border px-3 py-2 text-xs text-slate-600">{area}</p>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex min-h-10 w-full items-center gap-2.5 rounded-control px-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-8 xl:px-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
