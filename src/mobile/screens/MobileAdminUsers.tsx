import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getManagedUsers } from '../../services/userService';
import type { UserRole } from '../../types/domain';
import type { UserAccountStatus } from '../../types/userManagement';
import { useTranslation } from '../../i18n';
import {
  Avatar,
  Bar,
  Card,
  Empty,
  Pill,
  PillRow,
  Screen,
  Skeleton,
  StickySearch,
  Tag,
} from '../MobileKit';

export const roleLabel: Record<'vi' | 'en', Record<UserRole, string>> = {
  vi: { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn', ADMIN: 'Quản trị' },
  en: { CANDIDATE: 'Candidate', CAREER_CONSULTANT: 'Consultant', ADMIN: 'Admin' },
};

export const accountStatusLabel: Record<'vi' | 'en', Record<UserAccountStatus, string>> = {
  vi: { ACTIVE: 'Hoạt động', SUSPENDED: 'Bị khoá', PENDING: 'Chờ xác minh' },
  en: { ACTIVE: 'Active', SUSPENDED: 'Suspended', PENDING: 'Pending' },
};

export const accountStatusTone: Record<UserAccountStatus, 'brand' | 'danger' | 'warn'> = {
  ACTIVE: 'brand',
  SUSPENDED: 'danger',
  PENDING: 'warn',
};

type Filter = 'ALL' | UserRole | 'SUSPENDED';

const copy = {
  vi: {
    search: 'Tìm theo tên, email…',
    all: 'Tất cả',
    suspended: 'Bị khoá',
    count: (n: number) => `${n} người dùng`,
    tokens: (u: string, q: string) => `${u} / ${q} token tháng này`,
    empty: 'Không có người dùng phù hợp.',
  },
  en: {
    search: 'Search name, email…',
    all: 'All',
    suspended: 'Suspended',
    count: (n: number) => `${n} users`,
    tokens: (u: string, q: string) => `${u} / ${q} tokens this month`,
    empty: 'No matching users.',
  },
};

export default function MobileAdminUsers() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  // The dashboard links here with ?role=CAREER_CONSULTANT, like the web page.
  const [filter, setFilter] = useState<Filter>((params.get('role') as UserRole | null) ?? 'ALL');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-managed-users'],
    queryFn: () => getManagedUsers(),
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === 'ALL' ||
          (filter === 'SUSPENDED' ? u.status === 'SUSPENDED' : u.role === filter)) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, query, filter]);

  const filters: Filter[] = ['ALL', 'CANDIDATE', 'CAREER_CONSULTANT', 'ADMIN', 'SUSPENDED'];
  const filterLabel = (f: Filter) =>
    f === 'ALL' ? c.all : f === 'SUSPENDED' ? c.suspended : roleLabel[lang][f];

  return (
    <Screen>
      <StickySearch value={query} onChange={setQuery} placeholder={c.search}>
        <PillRow>
          {filters.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {filterLabel(f)}
            </Pill>
          ))}
        </PillRow>
      </StickySearch>

      {isLoading ? (
        <Skeleton />
      ) : visible.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-[13px] text-slate-600">{c.count(visible.length)}</p>
          {visible.map((u) => (
            <Card key={u.id} to={`/admin/users/${u.id}`}>
              <div className="flex items-center gap-3">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{u.name}</p>
                  <p className="truncate text-[13px] text-slate-600">{u.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag>{roleLabel[lang][u.role]}</Tag>
                <Tag tone={accountStatusTone[u.status]}>{accountStatusLabel[lang][u.status]}</Tag>
                <Tag>{u.planName}</Tag>
              </div>
              {u.tokenMonthlyQuota > 0 && (
                <div className="mt-3 border-t border-border pt-2.5">
                  <Bar value={(u.tokensUsedThisMonth / u.tokenMonthlyQuota) * 100} />
                  <p className="mt-1 text-[12px] text-slate-500">
                    {c.tokens(num(u.tokensUsedThisMonth), num(u.tokenMonthlyQuota))}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
