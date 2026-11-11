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
                setSelectedPlanForEdit(null);
                setIsPlanModalOpen(true);
              }}
              className={smallPrimary}
            >
              {isVietnamese ? 'Thêm gói cước' : 'Add plan'}
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
          onOpenAddPlan={() => {
            setSelectedPlanForEdit(null);
            setIsPlanModalOpen(true);
          }}
          onOpenEditPlan={(plan) => {
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
        <section className="space-y-5">
          <h2 className="text-2xl">Hạn mức token theo gói</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Đây là số token AI được cấp theo từng gói. Hạn mức được chỉnh sửa tại mục Gói cước.
          </p>
          {plans.map((plan) => (
            <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {plan.tokenMonthlyQuota.toLocaleString('vi-VN')} token
                  {plan.quotas?.find((quota) => quota.featureCode === 'AI_TOTAL_TOKENS')?.quotaPeriod === 'SUBSCRIPTION'
                    ? ' / kỳ gói' : ' / tháng'}
                </p>
              </div>
              <button type="button" className={textLink} onClick={() => { setSelectedPlanForEdit(plan); setIsPlanModalOpen(true); }}>
                Chỉnh sửa hạn mức
              </button>
            </div>
          ))}
        </section>
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
        key={selectedPlanForEdit?.id ?? 'new'}
        isOpen={isPlanModalOpen}
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
