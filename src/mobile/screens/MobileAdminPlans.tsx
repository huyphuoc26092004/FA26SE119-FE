import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SubscriptionQuotaManagementPage from '../../pages/admin/SubscriptionQuotaManagementPage';
import {
  getAdminPlans,
  getSubscriptionOverviewMetrics,
  toggleAdminPlanStatus,
} from '../../services/subscriptionManagementService';
import type { PlanStatus } from '../../types/subscriptionManagement';
import { formatMillions } from '../../components/admin/AdminKit';
import { useTranslation } from '../../i18n';
import {
  BigLink,
  Card,
  InfoRow,
  Pill,
  Screen,
  SectionTitle,
  Skeleton,
  StatGrid,
  Tag,
  useToast,
} from '../MobileKit';

const copy = {
  vi: {
    mrr: 'MRR',
    arr: (v: string) => `ARR dự kiến ${v}`,
    subscribers: 'Người dùng trả phí',
    growth: (p: number) => `${p >= 0 ? '+' : ''}${p}% tăng trưởng`,
    tokens: 'Token đã dùng',
    pending: 'Giao dịch chờ duyệt',
    plans: 'Các gói',
    perMonth: '/ tháng',
    free: 'Miễn phí',
    quota: 'Token mỗi tháng',
    users: 'Người đăng ký',
    planMrr: 'MRR của gói',
    status: { ACTIVE: 'Đang bán', DRAFT: 'Bản nháp', ARCHIVED: 'Đã lưu trữ' } as Record<
      PlanStatus,
      string
    >,
    activate: 'Mở bán',
    deactivate: 'Ngừng bán',
    toggled: (name: string, s: string) => `${name}: ${s}`,
    manage: 'Sửa gói, quota & API key',
  },
  en: {
    mrr: 'MRR',
    arr: (v: string) => `Projected ARR ${v}`,
    subscribers: 'Paying users',
    growth: (p: number) => `${p >= 0 ? '+' : ''}${p}% growth`,
    tokens: 'Tokens used',
    pending: 'Pending transactions',
    plans: 'Plans',
    perMonth: '/ month',
    free: 'Free',
    quota: 'Monthly tokens',
    users: 'Subscribers',
    planMrr: 'Plan MRR',
    status: { ACTIVE: 'On sale', DRAFT: 'Draft', ARCHIVED: 'Archived' } as Record<
      PlanStatus,
      string
    >,
    activate: 'Put on sale',
    deactivate: 'Stop selling',
    toggled: (name: string, s: string) => `${name}: ${s}`,
    manage: 'Edit plans, quotas & API keys',
  },
};

/** `?view=full` opens the full web page (plan editor, token rules, API gateway) inside the app. */
export default function MobileAdminPlans() {
  const [params] = useSearchParams();
  return params.get('view') === 'full' ? <SubscriptionQuotaManagementPage /> : <PlansScreen />;
}

function PlansScreen() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: overview } = useQuery({
    queryKey: ['subscription-overview'],
    queryFn: getSubscriptionOverviewMetrics,
  });
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: getAdminPlans,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminPlanStatus,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.show(c.toggled(updated.name, c.status[updated.status]));
    },
  });

  return (
    <Screen>
      {overview ? (
        <StatGrid
          items={[
            {
              label: c.mrr,
              value: formatMillions(overview.totalMrrVND, lang),
              hint: c.arr(formatMillions(overview.projectedArrVND, lang)),
            },
            {
              label: c.subscribers,
              value: num(overview.activeSubscribers),
              hint: c.growth(overview.subscriberGrowthPercent),
            },
            { label: c.tokens, value: `${overview.tokenUtilizationPercent}%` },
            {
              label: c.pending,
              value: num(overview.pendingTransactionsCount),
              hint: formatMillions(overview.pendingTransactionsAmountVND, lang),
              to: '/admin/payments',
            },
          ]}
        />
      ) : (
        <Skeleton rows={1} />
      )}

      <BigLink to="/admin/subscriptions?view=full" tone="secondary">
        {c.manage}
      </BigLink>

      <SectionTitle title={c.plans} />
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="space-y-3">
          {[...plans]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((p) => (
              <Card key={p.id} className={p.highlight ? 'border-ink' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-medium text-ink">{p.name}</p>
                    <p className="mt-0.5 text-[20px] font-medium tabular-nums text-ink">
                      {p.monthlyPriceVND === 0 ? (
                        c.free
                      ) : (
                        <>
                          {num(p.monthlyPriceVND)}₫
                          <span className="text-[13px] font-normal text-slate-500">
                            {' '}
                            {c.perMonth}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <Tag tone={p.status === 'ACTIVE' ? 'brand' : 'neutral'}>{c.status[p.status]}</Tag>
                </div>
                {p.description && (
                  <p className="mt-2 text-[13px] leading-5 text-slate-600">{p.description}</p>
                )}
                <div className="mt-2 divide-y divide-border">
                  <InfoRow label={c.quota}>{num(p.tokenMonthlyQuota)}</InfoRow>
                  <InfoRow label={c.users}>{num(p.activeSubscribersCount)}</InfoRow>
                  <InfoRow label={c.planMrr}>{formatMillions(p.mrrVND, lang)}</InfoRow>
                </div>
                <div className="mt-3 flex justify-end">
                  <Pill
                    onClick={() => toggleMutation.mutate(p.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {p.status === 'ACTIVE' ? c.deactivate : c.activate}
                  </Pill>
                </div>
              </Card>
            ))}
        </div>
      )}
      {toast.node}
    </Screen>
  );
}
