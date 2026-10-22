import { useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-canvas text-ink lg:pl-[248px]">
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity lg:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={closeMobileNav}
        aria-label={t('layout.closeMenu')}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="workspace-sidebar"
        aria-label={`${area} workspace`}
        className={`invisible fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] -translate-x-full flex-col border-r border-border bg-surface transition-transform duration-200 ease-out lg:visible lg:translate-x-0 ${
          open ? 'visible translate-x-0' : ''
        }`}
      >
        <div className="flex h-[68px] shrink-0 items-center border-b border-border px-5">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-control font-bold tracking-tight text-ink focus-visible:outline-offset-4"
            onClick={closeMobileNav}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white transition-colors group-hover:bg-blue-700">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <span className="text-lg">
              Jobie<span className="text-brand">.</span>
            </span>
          </Link>
          <button
            type="button"
            className="ml-auto grid h-9 w-9 place-items-center rounded-control text-slate-500 transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-offset-2 lg:hidden"
            aria-label={t('layout.closeMenu')}
            onClick={closeMobileNav}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-4 px-3 text-xs font-semibold tracking-wide text-slate-600">
            {getAreaLabel()}
          </p>
          <nav aria-label={`${area} navigation`} className="space-y-5">
            {nav.map(({ label, translationKey, to, icon: Icon, group }, index) => {
              const beginsGroup = index === 0 || nav[index - 1].group !== group;

              return (
                <div key={to}>
                  {beginsGroup && (
                    <p
                      className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 ${
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
                      `group flex min-h-10 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-offset-2 ${
                        isActive
                          ? 'bg-blue-50 text-brand'
                          : 'text-slate-700 hover:bg-canvas hover:text-ink'
                      }`
                    }
                  >
                    <Icon
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 transition-colors group-hover:text-brand"
                    />
                    <span className="min-w-0">{t(translationKey, label)}</span>
                  </NavLink>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <div className="rounded-control bg-canvas px-3.5 py-3">
            <p className="text-xs font-semibold text-ink">{t('layout.projectCode')}</p>
            <p className="mt-1 text-xs text-slate-600">{t('layout.mockEnvSubtitle')}</p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border bg-surface px-5 md:px-7 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-slate-600 transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-offset-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label={t('layout.openMenu')}
              aria-expanded={open}
              aria-controls="workspace-sidebar"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{getAreaLabel()}</p>
              <p className="hidden truncate text-xs text-slate-600 sm:block">
                {t('layout.workspaceTagline')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
            <LanguageSwitcher />

            <span aria-hidden="true" className="hidden h-7 w-px bg-border sm:block" />

            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-control text-slate-600 transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-offset-2"
              aria-label={t('layout.notifications')}
              title={t('layout.notifications')}
            >
              <Bell size={19} aria-hidden="true" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((current) => !current)}
                aria-expanded={userMenu}
                aria-controls="workspace-user-menu"
                className="flex min-h-10 items-center gap-2 rounded-control px-1.5 text-left transition-colors hover:bg-canvas focus-visible:outline-offset-2 sm:gap-2.5 sm:px-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-brand">
                  {user?.name.charAt(0) || 'U'}
                </span>
                <span className="hidden max-w-40 sm:block">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {user?.name}
                  </span>
                  <span className="block text-xs text-slate-600">{area}</span>
                </span>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="hidden text-slate-500 sm:block"
                />
              </button>

              {userMenu && (
                <div
                  id="workspace-user-menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-panel border border-border bg-surface p-1.5 shadow-panel"
                >
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex min-h-10 w-full items-center gap-2.5 rounded-control px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-offset-2"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-5 py-7 md:px-7 xl:px-8 2xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
