import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import {
  StatRow,
  Toast,
  UnderlineTabs,
  formatMillions,
  smallPrimary,
  textLink,
} from '../../components/admin/AdminKit';
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  toggleAdminPlanStatus,
  duplicateAdminPlan,
  getTokenConsumptionRules,
  getAiModelConfigs,
  updateAiModelConfig,
  getEndpointMetrics,
  getAdminTransactions,
  getSubscriptionOverviewMetrics,
} from '../../services/subscriptionManagementService';
import type { AdminSubscriptionPlan, AiModelConfig } from '../../types/subscriptionManagement';
import type { PaymentTransaction } from '../../types/subscription';

import { PlanManagementTab } from './subscription/PlanManagementTab';
import { ApiQuotaGatewayTab } from './subscription/ApiQuotaGatewayTab';
import { PaymentTransactionsTab } from './subscription/PaymentTransactionsTab';
import { PlanEditorModal } from './subscription/PlanEditorModal';
import { TransactionInvoiceModal } from './subscription/TransactionInvoiceModal';

export type SubscriptionManagementTabKey = 'plans' | 'tokens' | 'api' | 'payments';

interface SubscriptionQuotaManagementPageProps {
  defaultTab?: SubscriptionManagementTabKey;
}

export default function SubscriptionQuotaManagementPage({
  defaultTab = 'plans',
}: SubscriptionQuotaManagementPageProps) {
  const { isVietnamese } = useTranslation();
  const isManager = useAuthStore((state) => state.role === 'MANAGER');
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state (read from URL query ?tab= or defaultTab)
  const tabParam = searchParams.get('tab') as SubscriptionManagementTabKey | null;
  const [activeTab, setActiveTab] = useState<SubscriptionManagementTabKey>(
    tabParam || defaultTab
  );

  // Sync tab with URL
  const handleTabChange = (tab: SubscriptionManagementTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<AdminSubscriptionPlan | null>(null);
  const [planModalDefaultType, setPlanModalDefaultType] = useState<'SUBSCRIPTION' | 'TOPUP'>('SUBSCRIPTION');

  const [selectedInvoiceTransaction, setSelectedInvoiceTransaction] =
    useState<PaymentTransaction | null>(null);

  // -------------------------------------------------------------
  // Data Queries
  // -------------------------------------------------------------
  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ['subscription-overview'],
    queryFn: getSubscriptionOverviewMetrics,
  });

  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: getAdminPlans,
  });

  const { data: rules = [], refetch: refetchRules } = useQuery({
    queryKey: ['token-rules'],
    queryFn: getTokenConsumptionRules,
  });

  const { data: models = [], refetch: refetchModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: getAiModelConfigs,
    enabled: !isManager,
  });

  const { data: endpoints = [], refetch: refetchEndpoints } = useQuery({
    queryKey: ['endpoint-metrics'],
    queryFn: getEndpointMetrics,
  });

  const { data: transactions = [], refetch: refetchTransactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => getAdminTransactions(),
  });

  // Global Refresh All
  const handleRefreshAll = () => {
    refetchOverview();
    refetchPlans();
    refetchRules();
    if (!isManager) refetchModels();
    refetchEndpoints();
    refetchTransactions();
    showToast(isVietnamese ? 'Đã làm mới dữ liệu.' : 'Data refreshed.');
  };

  // -------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------
  // Plan Save Mutation
  const savePlanMutation = useMutation({
    mutationFn: async (planData: Partial<AdminSubscriptionPlan>) => {
      if (selectedPlanForEdit) {
        return updateAdminPlan(selectedPlanForEdit.id, planData);
      } else {
        return createAdminPlan(
          planData as Omit<
            AdminSubscriptionPlan,
            'id' | 'createdAt' | 'updatedAt' | 'activeSubscribersCount' | 'mrrVND'
          >
        );
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-overview'] });
      showToast(
        isVietnamese
          ? `Đã lưu thành công gói cước: ${saved.name}!`
          : `Successfully saved plan: ${saved.name}!`
      );
    },
  });

  // Toggle Plan Status
  const togglePlanStatusMutation = useMutation({
    mutationFn: toggleAdminPlanStatus,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      showToast(
        isVietnamese
          ? `Gói ${updated.name} hiện đang ở trạng thái: ${updated.status}`
          : `Plan ${updated.name} status updated to: ${updated.status}`
      );
    },
  });

  // Duplicate Plan
  const duplicatePlanMutation = useMutation({
    mutationFn: duplicateAdminPlan,
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      showToast(
        isVietnamese
          ? `Đã nhân bản gói thành công: ${copy.name}`
          : `Duplicated plan: ${copy.name}`
      );
    },
  });

  // Update AI Model
  const updateModelMutation = useMutation({
    mutationFn: ({
      modelId,
      updates,
    }: {
      modelId: string;
      updates: Partial<AiModelConfig>;
    }) => updateAiModelConfig(modelId, updates),
    onSuccess: (m) => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      showToast(
        isVietnamese
          ? `Đã cập nhật trạng thái mô hình ${m.displayName} -> ${m.status}`
          : `Updated model ${m.displayName} status -> ${m.status}`
      );
    },
  });

  // Export full system backup JSON
  const handleExportFullConfig = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      plans,
      rules,
      models,
      endpoints,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerpilot-subscription-quota-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(isVietnamese ? 'Đã xuất file cấu hình JSON thành công!' : 'Exported config JSON!');
  };

  const tabs: { value: SubscriptionManagementTabKey; label: string; count?: number }[] = [
    { value: 'plans', label: isVietnamese ? 'Gói cước' : 'Plans', count: plans.length },
    { value: 'tokens', label: isVietnamese ? 'Hạn mức token & quy tắc' : 'Token quotas & rules' },
    ...(!isManager ? [{ value: 'api' as const, label: isVietnamese ? 'Cấu hình & theo dõi AI' : 'AI configuration & monitoring' }] : []),
    {
      value: 'payments',
      label: isVietnamese ? 'Giao dịch & hoá đơn' : 'Payments & invoices',
      count: overview && overview.pendingTransactionsCount > 0 ? overview.pendingTransactionsCount : undefined,
    },
  ];

  return (
    <div>
      <Toast message={toastMessage} />

      {/* Header */}
      <header>
        <div className="mb-[clamp(1.25rem,2.5vw,2rem)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-brand">{isVietnamese ? 'Gói & token' : 'Plans & tokens'}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="button" onClick={handleRefreshAll} className={`${textLink} text-[13px] text-slate-600`}>
              {isVietnamese ? 'Làm mới' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleExportFullConfig}
              className={`${textLink} text-[13px] text-slate-600`}
              title={isVietnamese ? 'Xuất file sao lưu cấu hình' : 'Download a config backup'}
            >
              {isVietnamese ? 'Sao lưu cấu hình' : 'Backup config'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlanModalDefaultType('SUBSCRIPTION');
                setSelectedPlanForEdit(null);
                setIsPlanModalOpen(true);
              }}
              className={smallPrimary}
            >
              {isVietnamese ? '+ Gói thuê bao' : '+ Subscription plan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlanModalDefaultType('TOPUP');
                setSelectedPlanForEdit(null);
                setIsPlanModalOpen(true);
              }}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-700 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 cursor-pointer shadow-2xs"
            >
              {isVietnamese ? '+ Gói nạp token' : '+ Token top-up pack'}
            </button>
          </div>
        </div>
        <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {isVietnamese ? 'Gói cước & hạn mức.' : 'Plans & quotas.'}
          <span className="block text-brand">
            {overview
              ? isVietnamese
                ? `${overview.activeSubscribers.toLocaleString('vi-VN')} thuê bao đang hoạt động.`
                : `${overview.activeSubscribers.toLocaleString('en-US')} active subscribers.`
              : isVietnamese
                ? 'Một nơi để quản lý.'
                : 'Managed in one place.'}
          </span>
        </h1>
        <p className="mt-[clamp(1rem,2vw,1.5rem)] max-w-[38rem] text-[clamp(1rem,1.25vw,1.0625rem)] leading-8 text-slate-600">
          {isVietnamese
            ? 'Quản lý danh mục gói, định mức token cho từng tính năng, chính sách cấp phát và giới hạn gọi API.'
            : 'Manage pricing tiers, per-feature token costs, grant policies and API rate limits.'}
        </p>
      </header>

      {/* KPI row */}
      {overview && (
        <div className="mt-[clamp(2rem,4vw,3rem)]">
          <StatRow
            items={[
              {
                label: isVietnamese ? 'Doanh thu định kỳ (MRR)' : 'Monthly recurring (MRR)',
                value: formatMillions(overview.totalMrrVND, isVietnamese ? 'vi' : 'en'),
                detail: isVietnamese ? 'Đơn hoàn tất trong tháng' : 'Orders completed this month',
              },
              {
                label: isVietnamese ? 'Thuê bao đang kích hoạt' : 'Active subscribers',
                value: overview.activeSubscribers.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US'),
                detail: isVietnamese ? `${plans.length} gói cước lưu hành` : `${plans.length} plans on sale`,
              },
              {
                label: isVietnamese ? 'Token đã dùng tháng này' : 'Tokens used this month',
                value: `${overview.tokenUtilizationPercent}%`,
                detail: `${(overview.monthlyTokensConsumed / 1000000).toFixed(1)}M / ${(overview.monthlyTokensAllocated / 1000000).toFixed(1)}M token`,
                valueTone: overview.tokenUtilizationPercent > 85 ? 'warning' : 'ink',
              },
              {
                label: isVietnamese ? 'Lượt gọi API (24 giờ)' : 'API requests (24h)',
                value: overview.apiRequestsToday.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US'),
                detail: `${isVietnamese ? 'TB' : 'Avg'} ${overview.avgApiLatencyMs} ms · ${overview.apiSuccessRatePercent}% OK`,
              },
            ]}
          />
        </div>
      )}

      <UnderlineTabs
        className="mt-[clamp(2.5rem,5vw,3.5rem)]"
        tabs={tabs}
        value={activeTab}
        onChange={handleTabChange}
        label={isVietnamese ? 'Mục quản lý' : 'Sections'}
      />

      <div className="mt-8">
      {/* Tab 1: Plan Management */}
      {activeTab === 'plans' && (
        <PlanManagementTab
          plans={plans}
          onOpenAddPlan={(defaultType = 'SUBSCRIPTION') => {
            setPlanModalDefaultType(defaultType);
            setSelectedPlanForEdit(null);
            setIsPlanModalOpen(true);
          }}
          onOpenEditPlan={(plan) => {
            setPlanModalDefaultType(plan.planType ?? 'SUBSCRIPTION');
            setSelectedPlanForEdit(plan);
            setIsPlanModalOpen(true);
          }}
          onToggleStatus={async (id) => {
            await togglePlanStatusMutation.mutateAsync(id);
          }}
          onDuplicatePlan={async (id) => {
            await duplicatePlanMutation.mutateAsync(id);
          }}
        />
      )}

      {/* Tab 2: Token Quotas & Rules */}
      {activeTab === 'tokens' && (
        <div className="space-y-10">
          {/* Section: Gói nạp token bổ sung */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-xl font-normal text-ink">Gói nạp token một lần (Top-up Packs)</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Các gói nạp nhanh cho người dùng khi cần bổ sung token vào ví để tiếp tục dùng AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlanModalDefaultType('TOPUP');
                  setSelectedPlanForEdit(null);
                  setIsPlanModalOpen(true);
                }}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-700 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 cursor-pointer shadow-2xs"
              >
                + Tạo gói nạp token
              </button>
            </div>

            {plans.filter((p) => p.planType === 'TOPUP').length === 0 ? (
              <p className="py-4 text-sm text-slate-500 italic">Chưa có gói nạp token nào. Bấm “+ Tạo gói nạp token” để thêm gói đầu tiên.</p>
            ) : (
              <div className="divide-y divide-border">
                {plans
                  .filter((p) => p.planType === 'TOPUP')
                  .map((pack) => (
                    <div key={pack.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{pack.name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] ${pack.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {pack.status === 'ACTIVE' ? 'Đang bán' : pack.status === 'DRAFT' ? 'Bản nháp' : 'Lưu trữ'}
                          </span>
                          {pack.badge && <span className="text-xs text-slate-400">({pack.badge})</span>}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          <strong className="text-emerald-700 tabular-nums">+{pack.tokenMonthlyQuota.toLocaleString('vi-VN')} token</strong> · Giá nạp:{' '}
                          <span className="font-medium text-ink tabular-nums">{pack.monthlyPriceVND.toLocaleString('vi-VN')}đ</span> · {pack.description || 'Cộng trực tiếp vào ví'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={textLink}
                          onClick={() => {
                            setPlanModalDefaultType('TOPUP');
                            setSelectedPlanForEdit(pack);
                            setIsPlanModalOpen(true);
                          }}
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Section: Hạn mức định kỳ theo gói thuê bao */}
          <section className="space-y-4 pt-4 border-t border-ink">
            <div>
              <h2 className="text-xl font-normal text-ink">Hạn mức token định kỳ theo gói thuê bao</h2>
              <p className="mt-1 text-sm text-slate-600">
                Định mức token cấp tự động theo chu kỳ mỗi tháng cho từng hạng gói cước thuê bao.
              </p>
            </div>
            <div className="divide-y divide-border">
              {plans
                .filter((p) => p.planType !== 'TOPUP')
                .map((plan) => (
                  <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-medium text-ink">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        <strong className="text-brand tabular-nums">{plan.tokenMonthlyQuota.toLocaleString('vi-VN')} token</strong> / tháng
                        {plan.monthlyPriceVND === 0 ? ' (Gói Miễn phí)' : ` · ${plan.monthlyPriceVND.toLocaleString('vi-VN')}đ/tháng`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={textLink}
                      onClick={() => {
                        setPlanModalDefaultType('SUBSCRIPTION');
                        setSelectedPlanForEdit(plan);
                        setIsPlanModalOpen(true);
                      }}
                    >
                      Chỉnh sửa hạn mức
                    </button>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: API Gateway & Models */}
      {activeTab === 'api' && !isManager && (
        <ApiQuotaGatewayTab
          models={models}
          endpoints={endpoints}
          onUpdateModel={async (modelId, updates) => {
            await updateModelMutation.mutateAsync({ modelId, updates });
          }}
        />
      )}

      {/* Tab 4: Payments & Invoices */}
      {activeTab === 'payments' && (
        <PaymentTransactionsTab
          transactions={transactions}
          onViewInvoice={(tx) => setSelectedInvoiceTransaction(tx)}
        />
      )}

      </div>

      {/* Modals */}
      <PlanEditorModal
        key={`${selectedPlanForEdit?.id ?? 'new'}-${planModalDefaultType}`}
        isOpen={isPlanModalOpen}
        defaultPlanType={planModalDefaultType}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedPlanForEdit(null);
        }}
        onSave={async (planData) => {
          await savePlanMutation.mutateAsync(planData);
        }}
        initialPlan={selectedPlanForEdit}
      />

      <TransactionInvoiceModal
        isOpen={Boolean(selectedInvoiceTransaction)}
        onClose={() => setSelectedInvoiceTransaction(null)}
        transaction={selectedInvoiceTransaction}
      />
    </div>
  );
}
