import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Inbox, UserX } from 'lucide-react';
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import { getAdminDashboardData } from '../../services/adminService';
import { getManagedUsers } from '../../services/userService';
import { getConsultationRequests } from '../../services/consultationService';
import { getAdminPaymentTransactions } from '../../services/paymentManagementService';
import { formatMillions } from '../../components/admin/AdminKit';
import { useTranslation } from '../../i18n';
import {
  Avatar,
  Bar,
  Card,
  ListGroup,
  ListRow,
  Screen,
  SectionTitle,
  Skeleton,
  StatGrid,
} from '../MobileKit';
import { roleLabel } from './MobileAdminUsers';

const copy = {
  vi: {
    status: {
      OPERATIONAL: 'Hệ thống hoạt động ổn định',
      DEGRADED: 'Hệ thống chậm',
      MAINTENANCE: 'Đang bảo trì',
      OUTAGE: 'Hệ thống gián đoạn',
    },
    uptime: (p: number, d: number) => `Uptime ${p}% · ${d} ngày liên tục`,
    incidents: (n: number) => `${n} sự cố hôm nay`,
    users: 'Người dùng',
    newUsers: (n: number) => `+${n} tháng này`,
    revenue: 'Doanh thu',
    growth: (p: number) => `${p >= 0 ? '+' : ''}${p}% so với tháng trước`,
    ai: 'Yêu cầu AI',
    cost: 'Chi phí AI',
    cache: (p: number) => `Cache ${p}%`,
    todo: 'Cần xử lý',
    pendingConsult: 'Yêu cầu tư vấn chờ duyệt',
    pendingPay: 'Giao dịch đang chờ',
    suspended: 'Tài khoản bị khoá',
    plans: 'Doanh thu theo gói',
    subscribers: (n: number) => `${n} người dùng`,
    services: 'Dịch vụ',
    latest: 'Người dùng mới',
    seeAll: 'Xem tất cả',
  },
  en: {
    status: {
      OPERATIONAL: 'All systems operational',
      DEGRADED: 'Degraded performance',
      MAINTENANCE: 'Under maintenance',
      OUTAGE: 'Outage',
    },
    uptime: (p: number, d: number) => `Uptime ${p}% · ${d} days`,
    incidents: (n: number) => `${n} incidents today`,
    users: 'Users',
    newUsers: (n: number) => `+${n} this month`,
    revenue: 'Revenue',
    growth: (p: number) => `${p >= 0 ? '+' : ''}${p}% vs last month`,
    ai: 'AI requests',
    cost: 'AI cost',
    cache: (p: number) => `Cache ${p}%`,
    todo: 'To do',
    pendingConsult: 'Consultations awaiting approval',
    pendingPay: 'Pending transactions',
    suspended: 'Suspended accounts',
    plans: 'Revenue by plan',
    subscribers: (n: number) => `${n} users`,
    services: 'Services',
    latest: 'New users',
    seeAll: 'See all',
  },
};

const serviceDot = { HEALTHY: 'bg-brand', WARNING: 'bg-amber-500', DOWN: 'bg-red-600' };

/** `?tab=...` links from other screens still open the full web dashboard. */
export default function MobileAdminHome() {
  const [params] = useSearchParams();
  return params.get('tab') ? <AdminDashboardPage /> : <HomeScreen />;
}

function HomeScreen() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');

  const { data } = useQuery({
    queryKey: ['admin-dashboard', '30d'],
    queryFn: () => getAdminDashboardData('30d'),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['admin-managed-users'],
    queryFn: () => getManagedUsers(),
  });
  const { data: consultations = [] } = useQuery({
    queryKey: ['admin-consultations'],
    queryFn: () => getConsultationRequests(),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payment-transactions'],
    queryFn: () => getAdminPaymentTransactions(),
  });

  if (!data) {
    return (
      <Screen>
        <Skeleton />
      </Screen>
    );
  }

  const health = data.systemHealth;
  const latest = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  return (
    <Screen>
      <Card className="bg-night text-white border-night">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${health.overallStatus === 'OPERATIONAL' ? 'bg-mint' : 'bg-amber-400'}`}
          />
          <p className="text-[17px] font-medium">{c.status[health.overallStatus]}</p>
        </div>
        <p className="mt-1.5 text-[13px] text-white/70">
          {c.uptime(health.uptimePercentage, health.uptimeDays)}
        </p>
        <p className="text-[13px] text-white/70">{c.incidents(health.incidentCountToday)}</p>
      </Card>

      <StatGrid
        items={[
          {
            label: c.users,
            value: num(data.userMetrics.totalUsers),
            hint: c.newUsers(data.userMetrics.newUsersThisMonth),
            to: '/admin/users',
          },
          {
            label: c.revenue,
            value: formatMillions(data.revenueMetrics.totalRevenueVND, lang),
            hint: c.growth(data.revenueMetrics.growthPercentMoM),
            to: '/admin/payments',
          },
          { label: c.ai, value: num(data.aiMetrics.totalRequests) },
          {
            label: c.cost,
            value: `$${num(Math.round(data.aiMetrics.totalCostUSD))}`,
            hint: c.cache(data.aiMetrics.cacheHitRatioPercent),
          },
        ]}
      />

      <SectionTitle title={c.todo} />
      <ListGroup>
        <ListRow
          to="/admin?tab=consultations"
          icon={<Inbox size={18} />}
          title={c.pendingConsult}
          detail={num(consultations.filter((x) => x.status === 'PENDING').length)}
        />
        <ListRow
          to="/admin/payments"
          icon={<CreditCard size={18} />}
          title={c.pendingPay}
          detail={num(payments.filter((p) => p.status === 'pending').length)}
        />
        <ListRow
          to="/admin/users"
          icon={<UserX size={18} />}
          title={c.suspended}
          detail={num(users.filter((u) => u.status === 'SUSPENDED').length)}
        />
      </ListGroup>

      <SectionTitle title={c.plans} />
      <Card>
        <div className="space-y-3.5">
          {data.revenueMetrics.activeSubscriptionsByPlan.map((p) => (
            <div key={p.planId}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-[14px]">
                <span className="text-ink">{p.planName}</span>
                <span className="tabular-nums text-slate-600">
                  {formatMillions(p.totalRevenueVND, lang)}
                </span>
              </div>
              <Bar value={p.percentage} />
              <p className="mt-1 text-[12px] text-slate-500">{c.subscribers(p.activeCount)}</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle title={c.services} />
      <ListGroup>
        {health.microservices.map((s) => (
          <div key={s.key} className="flex min-h-[56px] items-center gap-3 px-4 py-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${serviceDot[s.status]}`} />
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{s.name}</span>
            <span className="shrink-0 text-[13px] tabular-nums text-slate-600">
              {s.latencyMs} ms
            </span>
          </div>
        ))}
      </ListGroup>

      <SectionTitle title={c.latest} action={{ label: c.seeAll, to: '/admin/users' }} />
      <ListGroup>
        {latest.map((u) => (
          <ListRow
            key={u.id}
            to={`/admin/users/${u.id}`}
            icon={<Avatar name={u.name} size={36} />}
            title={u.name}
            detail={`${roleLabel[lang][u.role]} · ${u.planName}`}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
