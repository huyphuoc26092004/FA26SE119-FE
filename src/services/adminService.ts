import type { AdminDashboardData, AuditLogEvent } from '../types/admin';
import type { UserRole } from '../types/domain';
import { apiClient } from './apiClient';
import { notConnected } from './apiPending';
import { type ApiRow, num, obj, rows, str } from './candidateMappers';
import { featureLabel } from './subscriptionService';
import { formatDateTime } from './supportService';
import { getManagedUsers, toggleLockUser } from './userService';

type TimeRange = '24h' | '7d' | '30d' | '90d';

const RANGE_MS: Record<TimeRange, number> = { '24h': 86_400_000, '7d': 7 * 86_400_000, '30d': 30 * 86_400_000, '90d': 90 * 86_400_000 };
const COLORS = ['#1f5f4c', '#2f7d66', '#4a9a82', '#7ab5a1', '#a7cfc0', '#c9c3b6', '#8a8577'];

/** Một nhóm giám sát: ai-usage, vector-stores, indexing-jobs, logs, audit, billing, crawl-runs (100 dòng mới nhất). */
export async function getMonitoring(category: string): Promise<ApiRow[]> {
  const { data } = await apiClient.get<ApiRow[]>(`/admin/monitoring/${category}`);
  return data;
}

const safe = (p: Promise<ApiRow[]>) => p.catch(() => [] as ApiRow[]);

const severityOf = (action: string): AuditLogEvent['severity'] =>
  /DELETE|SUSPEND|REVOKE/.test(action) ? 'CRITICAL' : /RESTORE|ARCHIVE|UPDATE|EDIT/.test(action) ? 'WARN' : /CREATE|PUBLISH|RESOLVE/.test(action) ? 'SUCCESS' : 'INFO';

/**
 * Bảng điều khiển admin ghép từ /admin/dashboard và các nhóm /admin/monitoring.
 * Backend chưa có số liệu hạ tầng (CPU, RAM, uptime) nên các ô đó để 0.
 */
export async function getAdminDashboardData(timeRange: TimeRange = '30d'): Promise<AdminDashboardData> {
  const [{ data: dash }, aiRows, billingRows, auditRows, jobRows, crawlRows, users] = await Promise.all([
    apiClient.get<ApiRow>('/admin/dashboard'),
    safe(getMonitoring('ai-usage')),
    safe(getMonitoring('billing')),
    safe(getMonitoring('audit')),
    safe(getMonitoring('indexing-jobs')),
    safe(getMonitoring('crawl-runs')),
    getManagedUsers().catch(() => []),
  ]);
  const since = Date.now() - RANGE_MS[timeRange];
  const inRange = (row: ApiRow, key = 'created_at') => new Date(str(row[key])).getTime() >= since;
  const userName = new Map(users.map((u) => [u.id, u]));

  // AI
  const ai = aiRows.filter((r) => inRange(r));
  const promptTokens = ai.reduce((s, r) => s + num(r.input_tokens), 0);
  const completionTokens = ai.reduce((s, r) => s + num(r.output_tokens), 0);
  const aiTokens = ai.reduce((s, r) => s + num(r.total_tokens), 0);
  const group = <K extends string>(list: ApiRow[], key: (r: ApiRow) => K) => {
    const map = new Map<K, ApiRow[]>();
    for (const r of list) map.set(key(r), [...(map.get(key(r)) ?? []), r]);
    return [...map.entries()];
  };
  const month = obj(dash.aiUsage);
  const byDay = group(ai, (r) => str(r.created_at).slice(0, 10) as string).sort(([a], [b]) => a.localeCompare(b));

  // Doanh thu
  const revenue = rows(dash.revenue);
  const vnd = num(revenue.find((r) => str(r.currency) === 'VND')?.amount);
  const paid = billingRows.filter((r) => str(r.status) === 'COMPLETED');
  const byMonth = group(paid, (r) => str(r.completed_at ?? r.created_at).slice(0, 7) as string).sort(([a], [b]) => a.localeCompare(b));
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mrr = paid.filter((r) => str(r.completed_at ?? r.created_at).startsWith(thisMonth)).reduce((s, r) => s + num(r.amount) / Math.max(1, num(r.duration_months, 1)), 0);
  const byProvider = group(paid, (r) => str(r.payment_provider) || 'UNKNOWN');

  // Người dùng
  const count = (role: UserRole) => users.filter((u) => u.role === role).length;
  const created = (u: { createdAt: string }) => {
    const [d, m, y] = u.createdAt.split(' ')[0].split('/');
    return new Date(`${y}-${m}-${d}`).getTime();
  };
  const newUsers = users.filter((u) => created(u) >= Date.now() - 30 * 86_400_000).length;
  const activeSubs = num(dash.activeSubscriptions);

  // Hàng đợi
  const today = new Date().toDateString();
  const queues = group(jobRows, (r) => str(r.entity_type) || 'OTHER').map(([name, list]) => {
    const todays = list.filter((r) => new Date(str(r.created_at)).toDateString() === today);
    const pendingJobs = list.filter((r) => ['PENDING', 'QUEUED', 'PROCESSING'].includes(str(r.status))).length;
    return {
      queueName: `Embedding ${name.toLowerCase()}`,
      pendingJobs,
      processedToday: todays.filter((r) => str(r.status) === 'COMPLETED').length,
      failedToday: todays.filter((r) => str(r.status) === 'FAILED').length,
      status: (pendingJobs > 20 ? 'congested' : pendingJobs > 0 ? 'active' : 'idle') as 'active' | 'idle' | 'congested',
    };
  });
  const lastCrawl = crawlRows[0];
  const aiFailures = ai.filter((r) => r.success === false).length;
  const nowLabel = formatDateTime(new Date().toISOString());

  return {
    timeRange,
    lastUpdated: new Date().toISOString(),
    systemHealth: {
      overallStatus: aiFailures > ai.length / 2 && ai.length > 0 ? 'DEGRADED' : 'OPERATIONAL',
      uptimePercentage: 0,
      uptimeDays: 0,
      incidentCountToday: ai.filter((r) => r.success === false && new Date(str(r.created_at)).toDateString() === today).length,
      microservices: [
        { name: 'API backend', key: 'api', status: 'HEALTHY', latencyMs: 0, uptimePercent: 0, lastChecked: nowLabel, details: 'GET /admin/dashboard trả lời bình thường' },
        {
          name: 'AI (Ollama)',
          key: 'ai',
          status: ai.length === 0 ? 'WARNING' : aiFailures ? 'WARNING' : 'HEALTHY',
          latencyMs: ai.length ? Math.round(ai.reduce((s, r) => s + num(r.latency_ms), 0) / ai.length) : 0,
          uptimePercent: ai.length ? Math.round(((ai.length - aiFailures) / ai.length) * 100) : 0,
          lastChecked: formatDateTime(ai[0]?.created_at) || nowLabel,
          details: ai.length ? `${ai.length} lượt gọi, ${aiFailures} lỗi` : 'Chưa có lượt gọi AI trong khoảng này',
        },
        {
          name: 'Thu thập việc làm',
          key: 'crawler',
          status: !lastCrawl ? 'WARNING' : str(lastCrawl.status) === 'FAILED' ? 'DOWN' : 'HEALTHY',
          latencyMs: 0,
          uptimePercent: 0,
          lastChecked: formatDateTime(lastCrawl?.started_at) || nowLabel,
          details: lastCrawl ? `Lần chạy gần nhất: ${str(lastCrawl.status)}` : 'Chưa chạy crawl',
        },
      ],
      resources: { cpuUsagePercent: 0, cpuCores: 0, memoryUsedGB: 0, memoryTotalGB: 0, memoryUsagePercent: 0, diskUsedGB: 0, diskTotalGB: 0, diskUsagePercent: 0, dbPoolActive: 0, dbPoolMax: 0, activeWebsockets: 0 },
      backgroundQueues: queues,
      auditLogs: auditRows.slice(0, 50).map((r) => {
        const actor = userName.get(str(r.actor_user_id));
        const action = str(r.action);
        return {
          id: str(r.id),
          timestamp: formatDateTime(r.created_at),
          actorName: actor?.name ?? 'Hệ thống',
          actorEmail: actor?.email ?? '',
          actorRole: actor?.role ?? 'ADMIN',
          action,
          severity: severityOf(action),
          ipAddress: str(r.ip_address),
          details: `${str(r.entity_type)} ${str(r.entity_id)}`.trim(),
        };
      }),
    },
    aiMetrics: {
      totalRequests: ai.length || num(month.requests),
      totalTokens: aiTokens || num(month.total_tokens),
      promptTokens,
      completionTokens,
      totalCostUSD: ai.reduce((s, r) => s + num(r.estimated_cost), 0) || num(month.estimated_cost),
      totalCostVND: 0,
      avgLatencyMs: ai.length ? Math.round(ai.reduce((s, r) => s + num(r.latency_ms), 0) / ai.length) : 0,
      cacheHitRatioPercent: 0,
      costSavedUSD: 0,
      modelBreakdown: group(ai, (r) => str(r.model_name) || str(r.provider)).map(([model, list], i) => {
        const tokens = list.reduce((s, r) => s + num(r.total_tokens), 0);
        return {
          modelName: model,
          requestCount: list.length,
          totalTokens: tokens,
          promptTokens: list.reduce((s, r) => s + num(r.input_tokens), 0),
          completionTokens: list.reduce((s, r) => s + num(r.output_tokens), 0),
          avgLatencyMs: Math.round(list.reduce((s, r) => s + num(r.latency_ms), 0) / list.length),
          estimatedCostUSD: list.reduce((s, r) => s + num(r.estimated_cost), 0),
          sharePercentage: aiTokens ? Math.round((tokens / aiTokens) * 100) : 0,
          color: COLORS[i % COLORS.length],
        };
      }),
      featureBreakdown: group(ai, (r) => str(r.feature_code)).map(([code, list], i) => {
        const tokens = list.reduce((s, r) => s + num(r.total_tokens), 0);
        return { featureKey: code, featureName: featureLabel(code), requestCount: list.length, tokenCount: tokens, percentage: aiTokens ? Math.round((tokens / aiTokens) * 100) : 0, color: COLORS[i % COLORS.length] };
      }),
      dailyTrend: byDay.map(([date, list]) => ({
        date,
        totalTokens: list.reduce((s, r) => s + num(r.total_tokens), 0),
        totalRequests: list.length,
        estimatedCostUSD: list.reduce((s, r) => s + num(r.estimated_cost), 0),
      })),
    },
    revenueMetrics: {
      totalRevenueVND: vnd,
      growthPercentMoM: 0,
      mrrVND: Math.round(mrr),
      arrVND: Math.round(mrr * 12),
      arpuVND: activeSubs ? Math.round(mrr / activeSubs) : 0,
      conversionRatePercent: count('CANDIDATE') ? Math.round((activeSubs / count('CANDIDATE')) * 100) : 0,
      paidSubscribersCount: activeSubs,
      // Backend chưa trả số gói đang dùng theo từng tier.
      activeSubscriptionsByPlan: [],
      paymentMethodDistribution: byProvider.map(([provider, list], i) => ({
        method: provider,
        label: provider,
        count: list.length,
        amountVND: list.reduce((s, r) => s + num(r.amount), 0),
        percentage: paid.length ? Math.round((list.length / paid.length) * 100) : 0,
        color: COLORS[i % COLORS.length],
      })),
      monthlyRevenueTrend: byMonth.map(([m, list]) => ({ month: m, revenueVND: list.reduce((s, r) => s + num(r.amount), 0), transactionsCount: list.length })),
      recentTransactions: billingRows.slice(0, 20).map((r) => {
        const u = userName.get(str(r.user_id));
        const status = str(r.status);
        return {
          id: str(r.id),
          orderCode: str(r.provider_order_id) || str(r.id).slice(0, 8).toUpperCase(),
          candidateName: u?.name ?? '',
          candidateEmail: u?.email ?? '',
          planName: `${num(r.duration_months, 1)} tháng`,
          amountVND: num(r.amount),
          paymentMethod: str(r.payment_provider),
          status: status === 'COMPLETED' ? 'success' : status === 'PENDING' ? 'pending' : 'failed',
          createdAt: formatDateTime(r.created_at),
        };
      }),
    },
    userMetrics: {
      totalUsers: num(dash.users, users.length),
      candidateCount: count('CANDIDATE'),
      consultantCount: count('CAREER_CONSULTANT'),
      adminCount: count('ADMIN'),
      newUsersThisMonth: newUsers,
      growthPercent: users.length ? Math.round((newUsers / users.length) * 100) : 0,
      dau: users.filter((u) => u.lastActiveAt.startsWith(formatDateTime(new Date().toISOString()).split(' ')[0])).length,
      mau: users.filter((u) => u.lastActiveAt !== '—').length,
      stickinessRatio: 0,
      verifiedPercent: users.length ? Math.round((users.filter((u) => u.isVerified).length / users.length) * 100) : 0,
      retentionRatePercent: 0,
      churnRatePercent: 0,
      userList: users.slice(0, 50).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isVerified: u.isVerified,
        status: u.status,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        planName: u.planName,
        tokensUsed: u.tokensUsedThisMonth,
      })),
    },
    openSupportTickets: num(dash.openSupportTickets),
  };
}

// TODO(api): POST /api/v1/admin/system/maintenance (BE chưa có API)
export async function toggleMaintenanceMode(enable: boolean): Promise<{ maintenance: boolean; message: string }> {
  return notConnected('BE chưa có API', enable);
}

// TODO(api): POST /api/v1/admin/system/cache/purge (BE chưa có API)
export async function purgeSystemCache(): Promise<{ clearedKeysCount: number; freedMemoryMB: number }> {
  return notConnected('BE chưa có API');
}

export async function toggleUserStatus(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED'): Promise<{ userId: string; status: 'ACTIVE' | 'SUSPENDED' }> {
  await toggleLockUser(userId, newStatus);
  return { userId, status: newStatus };
}
