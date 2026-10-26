import { useNavigate } from 'react-router-dom';
import { Languages, LogOut } from 'lucide-react';
import { navGroupLabels, type NavItem } from '../../constants/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import { Card, ListGroup, ListRow, Screen, SectionTitle } from '../MobileKit';

const copy = {
  vi: {
    consultant: 'Cố vấn nghề nghiệp',
    admin: 'Quản trị viên',
    settings: 'Cài đặt',
    language: 'Ngôn ngữ',
    languageValue: 'Tiếng Việt',
    signOut: 'Đăng xuất',
  },
  en: {
    consultant: 'Career consultant',
    admin: 'Administrator',
    settings: 'Settings',
    language: 'Language',
    languageValue: 'English',
    signOut: 'Sign out',
  },
};

/**
 * Account tab for consultants and admins. It replaces the sidebar drawer:
 * every page that is not already a tab is listed here, grouped like the sidebar.
 */
export default function MobileStaffAccount({
  role,
  nav,
  tabs,
}: {
  role: 'consultant' | 'admin';
  nav: NavItem[];
  tabs: string[];
}) {
  const { isVietnamese, toggleLanguage } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const name = user?.name ?? c[role];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const rest = nav.filter((item) => !tabs.includes(item.to));
  const groups: { group: NavItem['group']; items: NavItem[] }[] = [];
  for (const item of rest) {
    const last = groups[groups.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else groups.push({ group: item.group, items: [item] });
  }

  return (
    <Screen>
      <Card>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-night text-[20px] font-medium text-white">
            {initials || 'U'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[19px] font-medium text-ink">{name}</p>
            <p className="truncate text-[13px] text-slate-600">{c[role]}</p>
            {user?.email && <p className="truncate text-[13px] text-slate-500">{user.email}</p>}
          </div>
        </div>
      </Card>

      {groups.map(({ group, items }) => (
        <div key={group} className="space-y-3">
          <SectionTitle title={navGroupLabels[group][isVietnamese ? 'vi' : 'en']} />
          <ListGroup>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <ListRow
                  key={item.to}
                  to={item.to}
                  icon={<Icon size={18} />}
                  title={isVietnamese ? item.labelVi : item.label}
                />
              );
            })}
          </ListGroup>
        </div>
      ))}

      <SectionTitle title={c.settings} />
      <ListGroup>
        <ListRow
          onClick={toggleLanguage}
          icon={<Languages size={18} />}
          title={c.language}
          detail={c.languageValue}
        />
        <ListRow
          danger
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          icon={<LogOut size={18} />}
          title={c.signOut}
        />
      </ListGroup>
      <p className="pb-2 text-center text-[12px] text-slate-400">CCV · FA26SE119</p>
    </Screen>
  );
}
