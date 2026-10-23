import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
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
  deleteAdminPlan,
  toggleAdminPlanStatus,
  duplicateAdminPlan,
  getTokenConsumptionRules,
  updateTokenConsumptionRule,
  getTokenPolicySettings,
  saveTokenPolicySettings,
  getAdminTopupPacks,
  saveAdminTopupPack,
  deleteAdminTopupPack,
  getUserQuotaOverrides,
  grantUserTokens,
  revokeUserQuotaOverride,
  getAiModelConfigs,
  updateAiModelConfig,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getEndpointMetrics,
  testApiEndpointPing,
  getAdminTransactions,
  approveManualTransaction,
  refundTransaction,
  getSubscriptionOverviewMetrics,
} from '../../services/subscriptionManagementService';
import type {
  AdminSubscriptionPlan,
  AdminTokenTopupPack,
  AiModelConfig,
  GrantUserTokensPayload,
  CreateApiKeyPayload,
  TokenConsumptionRule,
} from '../../types/subscriptionManagement';
import type { PaymentTransaction } from '../../types/subscription';

import { PlanManagementTab } from './subscription/PlanManagementTab';
import { TokenQuotaManagementTab } from './subscription/TokenQuotaManagementTab';
import { ApiQuotaGatewayTab } from './subscription/ApiQuotaGatewayTab';
import { PaymentTransactionsTab } from './subscription/PaymentTransactionsTab';
import { PlanEditorModal } from './subscription/PlanEditorModal';
import { UserTokenGrantModal } from './subscription/UserTokenGrantModal';
import { ApiKeyModal } from './subscription/ApiKeyModal';
import { TransactionInvoiceModal } from './subscription/TransactionInvoiceModal';

export type SubscriptionManagementTabKey = 'plans' | 'tokens' | 'api' | 'payments';

interface SubscriptionQuotaManagementPageProps {
  defaultTab?: SubscriptionManagementTabKey;
}

export default function SubscriptionQuotaManagementPage({
  defaultTab = 'plans',
}: SubscriptionQuotaManagementPageProps) {
  const { isVietnamese } = useTranslation();
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

  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

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

  const { data: policy, refetch: refetchPolicy } = useQuery({
    queryKey: ['token-policy'],
    queryFn: getTokenPolicySettings,
  });

  const { data: topupPacks = [], refetch: refetchTopups } = useQuery({
    queryKey: ['admin-topup-packs'],
    queryFn: getAdminTopupPacks,
  });

  const { data: overrides = [], refetch: refetchOverrides } = useQuery({
    queryKey: ['quota-overrides'],
    queryFn: getUserQuotaOverrides,
  });

  const { data: models = [], refetch: refetchModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: getAiModelConfigs,
  });

  const { data: apiKeys = [], refetch: refetchApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: getApiKeys,
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
    refetchPolicy();
    refetchTopups();
    refetchOverrides();
    refetchModels();
    refetchApiKeys();
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

  // Delete Plan
  const deletePlanMutation = useMutation({
    mutationFn: deleteAdminPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      showToast(isVietnamese ? 'Đã xóa gói cước khỏi hệ thống.' : 'Deleted plan from system.');
    },
  });

  // Update Token Rule
  const updateRuleMutation = useMutation({
    mutationFn: ({
      featureKey,
      updates,
    }: {
      featureKey: string;
      updates: Partial<TokenConsumptionRule>;
    }) => updateTokenConsumptionRule(featureKey, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-rules'] });
      showToast(isVietnamese ? 'Đã cập nhật định mức tính năng.' : 'Updated feature quota rule.');
    },
  });

  // Save Token Policy
  const savePolicyMutation = useMutation({
    mutationFn: saveTokenPolicySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['token-policy'] });
      showToast(isVietnamese ? 'Đã lưu chính sách hạn ngạch Token.' : 'Saved token policy.');
    },
  });

  // Save Top-up Pack
  const saveTopupPackMutation = useMutation({
    mutationFn: (pack: Partial<AdminTokenTopupPack>) =>
      saveAdminTopupPack(
        pack as Omit<AdminTokenTopupPack, 'id' | 'totalSold'> & { id?: string }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topup-packs'] });
      showToast(isVietnamese ? 'Đã lưu gói nạp Token bổ sung.' : 'Saved token top-up pack.');
    },
  });

  // Delete Top-up Pack
  const deleteTopupPackMutation = useMutation({
    mutationFn: deleteAdminTopupPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topup-packs'] });
      showToast(isVietnamese ? 'Đã xóa gói nạp Token.' : 'Deleted top-up pack.');
    },
  });

  // Grant User Tokens
  const grantTokensMutation = useMutation({
    mutationFn: grantUserTokens,
    onSuccess: (ovr) => {
      queryClient.invalidateQueries({ queryKey: ['quota-overrides'] });
      showToast(
        isVietnamese
          ? `Đã cấp phát Token thành công cho: ${ovr.userName}!`
          : `Granted tokens for: ${ovr.userName}!`
      );
    },
  });

  // Revoke Override
  const revokeOverrideMutation = useMutation({
    mutationFn: revokeUserQuotaOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quota-overrides'] });
      showToast(isVietnamese ? 'Đã thu hồi hạn mức cá nhân.' : 'Revoked quota override.');
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

  // Create API Key
  const createApiKeyMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      showToast(isVietnamese ? 'Khởi tạo API Key thành công!' : 'Created API key successfully!');
    },
  });

  // Revoke API Key
  const revokeApiKeyMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      showToast(isVietnamese ? 'Đã thu hồi quyền API Key.' : 'Revoked API key.');
    },
  });

  // Approve Transaction
  const approveTxMutation = useMutation({
    mutationFn: approveManualTransaction,
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-overview'] });
      showToast(
        isVietnamese
          ? `Đã duyệt thành công đơn hàng: ${tx.orderCode} (${tx.candidateName})!`
          : `Approved transaction: ${tx.orderCode}!`
      );
    },
  });

  // Refund Transaction
  const refundTxMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      refundTransaction(orderId, reason),
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-overview'] });
      showToast(
        isVietnamese
          ? `Đã hoàn tiền cho đơn hàng: ${tx.orderCode}.`
          : `Refunded transaction: ${tx.orderCode}.`
      );
    },
  });

  // Export full system backup JSON
  const handleExportFullConfig = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      plans,
      rules,
      policy,
      topupPacks,
      overrides,
      models,
      apiKeys,
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
    { value: 'api', label: isVietnamese ? 'Cổng API & giới hạn' : 'API gateway & limits' },
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
                detail: isVietnamese ? '+14,8% tăng trưởng' : '+14.8% growth',
                detailTone: 'brand',
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
          onDeletePlan={async (id) => {
            await deletePlanMutation.mutateAsync(id);
          }}
        />
      )}

      {/* Tab 2: Token Quotas & Rules */}
      {activeTab === 'tokens' && policy && (
        <TokenQuotaManagementTab
          rules={rules}
          policy={policy}
          topupPacks={topupPacks}
          overrides={overrides}
          onUpdateRule={async (featureKey, updates) => {
            await updateRuleMutation.mutateAsync({ featureKey, updates });
          }}
          onSavePolicy={async (newPolicy) => {
            await savePolicyMutation.mutateAsync(newPolicy);
          }}
          onSaveTopupPack={async (pack) => {
            await saveTopupPackMutation.mutateAsync(pack);
          }}
          onDeleteTopupPack={async (id) => {
            await deleteTopupPackMutation.mutateAsync(id);
          }}
          onOpenGrantModal={() => setIsGrantModalOpen(true)}
          onRevokeOverride={async (id) => {
            await revokeOverrideMutation.mutateAsync(id);
          }}
        />
      )}

      {/* Tab 3: API Gateway & Models */}
      {activeTab === 'api' && (
        <ApiQuotaGatewayTab
          models={models}
          apiKeys={apiKeys}
          endpoints={endpoints}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onRevokeApiKey={async (id) => {
            await revokeApiKeyMutation.mutateAsync(id);
          }}
          onUpdateModel={async (modelId, updates) => {
            await updateModelMutation.mutateAsync({ modelId, updates });
          }}
          onTestEndpoint={testApiEndpointPing}
        />
      )}

      {/* Tab 4: Payments & Invoices */}
      {activeTab === 'payments' && (
        <PaymentTransactionsTab
          transactions={transactions}
          onApproveTransaction={async (id) => {
            await approveTxMutation.mutateAsync(id);
          }}
          onRefundTransaction={async (orderId, reason) => {
            await refundTxMutation.mutateAsync({ orderId, reason });
          }}
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

      <UserTokenGrantModal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        onGrant={async (payload: GrantUserTokensPayload) => {
          await grantTokensMutation.mutateAsync(payload);
        }}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onCreate={async (payload: CreateApiKeyPayload) => {
          return createApiKeyMutation.mutateAsync(payload);
        }}
      />

      <TransactionInvoiceModal
        isOpen={Boolean(selectedInvoiceTransaction)}
        onClose={() => setSelectedInvoiceTransaction(null)}
        transaction={selectedInvoiceTransaction}
      />
    </div>
  );
}
