import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { getUserSubscription } from '../services/subscriptionService';
import { navGroupLabels, type NavItem } from '../constants/navigation';
import { CcvLogo } from '../components/brand/CcvLogo';
import { IS_APP } from '../utils/platform';

const ROOT_PATHS = ['/candidate', '/consultant', '/admin'];

/**
 * Picks the single nav item that best matches the current URL.
 * Items may carry a query string (e.g. /admin/users?role=...), so a plain
 * NavLink match would light up both /admin/users and its filtered variant.
 */
function findActiveTo(nav: NavItem[], pathname: string, search: string) {
  const current = new URLSearchParams(search);
  let best: { to: string; score: number } | null = null;

  for (const item of nav) {
    const [path, query = ''] = item.to.split('?');
    const params = new URLSearchParams(query);
    const isRoot = ROOT_PATHS.includes(path);
    const pathMatches = pathname === path || (!isRoot && pathname.startsWith(`${path}/`));
    if (!pathMatches) continue;

    let queryMatches = true;
    params.forEach((value, key) => {
      if (current.get(key) !== value) queryMatches = false;
    });
    if (!queryMatches) continue;

    const score = path.length + [...params.keys()].length * 1000;
    if (!best || score > best.score) best = { to: item.to, score };
  }

  return best?.to ?? null;
}

/** Paths shown in the app's bottom tab bar, per area; everything else lives under "More". */
const APP_TABS: Record<string, { to: string; labelVi: string; label: string }[]> = {
  candidate: [
    { to: '/candidate', labelVi: 'Trang chủ', label: 'Home' },
    { to: '/candidate/jobs', labelVi: 'Việc làm', label: 'Jobs' },
    { to: '/candidate/resumes', labelVi: 'CV', label: 'CVs' },
    { to: '/candidate/consultations', labelVi: 'Tư vấn', label: 'Advice' },
  ],
  consultant: [
    { to: '/consultant', labelVi: 'Trang chủ', label: 'Home' },
    { to: '/consultant/consultations', labelVi: 'Yêu cầu', label: 'Requests' },
    { to: '/consultant/candidates', labelVi: 'Ứng viên', label: 'Candidates' },
  ],
  admin: [
    { to: '/admin', labelVi: 'Tổng quan', label: 'Overview' },
    { to: '/admin/users', labelVi: 'Người dùng', label: 'Users' },
    { to: '/admin/subscriptions', labelVi: 'Gói', label: 'Plans' },
    { to: '/admin/payments', labelVi: 'Thanh toán', label: 'Payments' },
  ],
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1);
  return `${first}${last ?? ''}`.toUpperCase();
}

export function DashboardLayout({ nav, area }: { nav: NavItem[]; area: string }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isVietnamese, toggleLanguage } = useTranslation();
  const areaKey = area.toLowerCase();
  const isCandidate = areaKey === 'candidate';
  const isAdmin = areaKey === 'admin';

  // Re-read the token balance on every navigation so top-ups show up right away.
  const subscription = useMemo(
    () => (isCandidate ? getUserSubscription() : null),
    [isCandidate, location.key]
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const areaLabel = (() => {
    switch (areaKey) {
      case 'candidate':
        return isVietnamese ? 'Không gian ứng viên' : 'Candidate workspace';
      case 'consultant':
        return isVietnamese ? 'Không gian cố vấn' : 'Consultant workspace';
      case 'admin':
        return isVietnamese ? 'Quản trị hệ thống' : 'System administration';
      default:
        return `${area} workspace`;
    }
  })();

  const roleLabel = (() => {
    switch (areaKey) {
      case 'candidate':
        return isVietnamese ? 'Ứng viên' : 'Candidate';
      case 'consultant':
        return isVietnamese ? 'Cố vấn' : 'Consultant';
      case 'admin':
        return isVietnamese ? 'Quản trị viên' : 'Administrator';
      default:
        return area;
    }
  })();

  // The admin mockup shows the role as the display name.
  const displayName = isAdmin ? roleLabel : user?.name || roleLabel;
  const userSubtitle = isAdmin ? 'FA26SE119 · Demo' : `${roleLabel} · FA26SE119 Demo`;
  const avatarInitials = isAdmin ? (isVietnamese ? 'QT' : 'AD') : initialsOf(displayName);

  const activeTo = findActiveTo(nav, location.pathname, location.search);

  const groups = useMemo(() => {
    const result: { group: NavItem['group']; items: NavItem[] }[] = [];
    for (const item of nav) {
      const last = result[result.length - 1];
      if (last && last.group === item.group) last.items.push(item);
      else result.push({ group: item.group, items: [item] });
    }
    return result;
  }, [nav]);

  const tokenLimit = subscription?.tokenLimit ?? 0;
  const tokensLeft = Math.max(0, tokenLimit - (subscription?.tokensUsed ?? 0));
  const tokenPercent = tokenLimit > 0 ? Math.min(100, Math.round((tokensLeft / tokenLimit) * 100)) : 0;
  const number = (value: number) => value.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');

  const appTabs = (APP_TABS[areaKey] ?? []).map((tab) => ({
    ...tab,
    icon: nav.find((item) => item.to === tab.to)?.icon ?? MoreHorizontal,
  }));
  const activeItem = nav.find((item) => item.to === activeTo);
  const appTitle = activeItem ? (isVietnamese ? activeItem.labelVi : activeItem.label) : 'CCV';
  // Tabs light up for their own sub-pages too (e.g. a job detail stays under "Jobs").
  const activeTab = appTabs.reduce<string | null>((best, tab) => {
    const isRoot = ROOT_PATHS.includes(tab.to);
    const hit = location.pathname === tab.to || (!isRoot && location.pathname.startsWith(`${tab.to}/`));
    return hit && (!best || tab.to.length > best.length) ? tab.to : best;
  }, null);
  // On the web the sidebar is pinned from lg up; in the app it always behaves as a drawer.
  const lg = (classes: string) => (IS_APP ? '' : classes);

  const textLink =
    'border-b border-slate-400 pb-px text-[13px] text-slate-700 transition-colors hover:border-ink hover:text-ink';

  return (
    <div className={`min-h-screen bg-canvas text-ink ${lg('lg:pl-[280px]')}`}>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity ${lg('lg:hidden')} ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-label={t('layout.closeMenu')}
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="workspace-sidebar"
        aria-label={areaLabel}
        className={`invisible fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] max-w-[86vw] -translate-x-full flex-col border-r border-border bg-canvas transition-transform duration-200 ease-out ${lg('lg:visible lg:translate-x-0')} ${
          open ? 'visible translate-x-0' : ''
        }`}
      >
        <div className="flex shrink-0 items-start px-7 pb-7 pt-9">
          <div className="min-w-0">
            <Link
              to="/"
              aria-label="CCV"
              className="inline-flex rounded-control focus-visible:outline-offset-4"
            >
              <CcvLogo height={36} />
            </Link>
            <p className="mt-2.5 text-[13px] text-slate-600">{areaLabel}</p>
          </div>
          <button
            type="button"
            className={`-mr-2 ml-auto grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink ${lg('lg:hidden')}`}
            aria-label={t('layout.closeMenu')}
            onClick={() => setOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label={areaLabel} className="flex-1 overflow-y-auto px-7 pb-6">
          {groups.map(({ group, items }, groupIndex) => (
            <div key={`${group}-${groupIndex}`} className={groupIndex === 0 ? '' : 'mt-5'}>
              {groupIndex > 0 && (
                <p className="pb-1.5 pl-[15px] text-[12px] text-slate-500">
                  {isVietnamese ? navGroupLabels[group].vi : navGroupLabels[group].en}
                </p>
              )}
              <ul className="border-l border-border">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.to === activeTo;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        aria-current={isActive ? 'page' : undefined}
                        className={`relative -ml-px flex min-h-[37px] items-center gap-3 border-l-2 py-1.5 pl-[14px] pr-2 text-[15px] transition-colors duration-150 focus-visible:outline-offset-2 ${
                          isActive
                            ? 'border-brand font-medium text-brand'
                            : 'border-transparent text-slate-800 hover:text-brand'
                        }`}
                      >
                        <Icon
                          size={17}
                          strokeWidth={1.6}
                          className={`shrink-0 ${isActive ? 'text-brand' : 'text-slate-500'}`}
                        />
                        <span className="min-w-0 truncate">
                          {isVietnamese ? item.labelVi : item.label}
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 px-7 pb-6">
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink text-[13px] font-medium text-ink">
                {avatarInitials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-ink">{displayName}</span>
                <span className="block truncate text-[12px] text-slate-600">{userSubtitle}</span>
              </span>
            </div>

            {isCandidate && subscription && (
              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-slate-700">
                    {isVietnamese ? 'Token còn lại' : 'Tokens left'}
                  </span>
                  <Link
                    to="/candidate/subscription"
                    className="border-b border-brand pb-px text-[13px] text-brand transition-colors hover:text-brand-800"
                  >
                    {isVietnamese ? 'Nạp thêm' : 'Top up'}
                  </Link>
                </div>
                <p className="mt-1 flex items-baseline gap-1 tabular-nums">
                  <span className="text-[24px] leading-tight text-ink">{number(tokensLeft)}</span>
                  <span className="text-[13px] text-slate-500">/{number(tokenLimit)}</span>
                </p>
                <div
                  className="mt-2 h-[3px] w-full bg-slate-200"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={tokenLimit}
                  aria-valuenow={tokensLeft}
                  aria-label={isVietnamese ? 'Token còn lại' : 'Tokens left'}
                >
                  <div className="h-full bg-brand" style={{ width: `${tokenPercent}%` }} />
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleLanguage}
                className={textLink}
                title={t('layout.switchLanguage')}
                aria-label={`${t('layout.switchLanguage')}: ${isVietnamese ? 'English' : 'Tiếng Việt'}`}
              >
                {isVietnamese ? 'Tiếng Việt' : 'English'}
              </button>
              <button type="button" onClick={signOut} className={textLink}>
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0">
        {IS_APP ? (
          <>
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-canvas px-4">
              <CcvLogo height={22} markOnly />
              <h2 className="min-w-0 flex-1 truncate text-[17px] font-medium text-ink">{appTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t('layout.openMenu')}
                aria-expanded={open}
                aria-controls="workspace-sidebar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink text-[12px] font-medium text-ink"
              >
                {avatarInitials}
              </button>
            </header>

            <main className="w-full px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-5">
              <Outlet />
            </main>

            <nav
              aria-label={areaLabel}
              className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-canvas pb-[env(safe-area-inset-bottom)]"
            >
              <ul className="flex">
                {appTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.to === activeTab;
                  return (
                    <li key={tab.to} className="flex-1">
                      <Link
                        to={tab.to}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                          isActive ? 'font-medium text-brand' : 'text-slate-600'
                        }`}
                      >
                        <span className={`h-[2px] w-6 -mt-[7px] mb-[3px] ${isActive ? 'bg-brand' : 'bg-transparent'}`} />
                        <Icon size={20} strokeWidth={isActive ? 1.9 : 1.6} />
                        <span>{isVietnamese ? tab.labelVi : tab.label}</span>
                      </Link>
                    </li>
                  );
                })}
                <li className="flex-1">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-controls="workspace-sidebar"
                    className={`flex h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] ${
                      activeTab ? 'text-slate-600' : 'font-medium text-brand'
                    }`}
                  >
                    <span className={`h-[2px] w-6 -mt-[7px] mb-[3px] ${activeTab ? 'bg-transparent' : 'bg-brand'}`} />
                    <MoreHorizontal size={20} strokeWidth={1.6} />
                    <span>{isVietnamese ? 'Thêm' : 'More'}</span>
                  </button>
                </li>
              </ul>
            </nav>
          </>
        ) : (
          <>
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-canvas px-4 sm:px-5 lg:hidden">
              <button
                type="button"
                className="-ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-ink"
                onClick={() => setOpen(true)}
                aria-label={t('layout.openMenu')}
                aria-expanded={open}
                aria-controls="workspace-sidebar"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
              <Link to="/" aria-label="CCV" className="inline-flex">
                <CcvLogo height={28} />
              </Link>
              <span className="ml-auto truncate text-[13px] text-slate-600">{areaLabel}</span>
            </header>

            <main className="mx-auto w-full max-w-[1680px] px-5 py-8 md:px-8 lg:px-[clamp(2rem,4vw,5rem)] lg:py-10">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardLayout;
