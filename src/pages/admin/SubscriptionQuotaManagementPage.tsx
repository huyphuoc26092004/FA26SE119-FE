import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Zap,
  Cpu,
  Wallet,
  RefreshCw,
  Download,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
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
    showToast(isVietnamese ? 'Đã làm mới dữ liệu hệ thống!' : 'Refreshed system data!');
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

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-sm">
              <CreditCard size={22} />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {isVietnamese ? 'Quản lý Gói cước & Hạn mức' : 'Subscription & Quota Management'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVietnamese
                  ? 'Quản trị danh mục gói dịch vụ, định mức tiêu thụ AI Tokens, chính sách cấp phát và cổng API Rate Limits'
                  : 'Manage pricing tiers, AI token quotas, consumption rules, and API gateway rate limits'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={handleExportFullConfig}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            title="Xuất file backup cấu hình hệ thống"
          >
            <Download size={14} />
            <span>{isVietnamese ? 'Sao lưu cấu hình' : 'Backup Config'}</span>
          </button>

          <button
            onClick={handleRefreshAll}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            title="Làm mới toàn bộ dữ liệu"
          >
            <RefreshCw size={14} />
            <span>{isVietnamese ? 'Làm mới' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedPlanForEdit(null);
              setIsPlanModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            <span>{isVietnamese ? 'Thêm gói cước' : 'Add Plan'}</span>
          </button>
        </div>
      </div>

      {/* Top Aggregated KPI Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Doanh thu định kỳ (MRR)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-slate-900">
                {(overview.totalMrrVND / 1000000).toFixed(1)}M
              </span>
              <span className="text-xs font-bold text-slate-500">VND</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              +14.8% tăng trưởng
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Thuê bao đang kích hoạt
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-blue-700">
                {overview.activeSubscribers.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">user</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {plans.length} gói cước lưu hành
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Mức sử dụng Token tháng
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-amber-600">
                {overview.tokenUtilizationPercent}%
              </span>
              <span className="text-xs text-slate-400">hạn ngạch</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {(overview.monthlyTokensConsumed / 1000000).toFixed(1)}M /{' '}
              {(overview.monthlyTokensAllocated / 1000000).toFixed(1)}M tokens
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Lưu lượng API (24h)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl md:text-2xl font-black text-emerald-700">
                {overview.apiRequestsToday.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">reqs</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              TB {overview.avgApiLatencyMs}ms · {overview.apiSuccessRatePercent}% OK
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 self-start overflow-x-auto max-w-full">
        <button
          onClick={() => handleTabChange('plans')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard size={15} className="text-blue-600" />
          <span>{isVietnamese ? 'Quản lý Gói cước (Plans)' : 'Subscription Plans'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('tokens')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap size={15} className="text-amber-500" />
          <span>{isVietnamese ? 'Hạn mức Token & Quy tắc' : 'Token Quotas & Rules'}</span>
        </button>

        <button
          onClick={() => handleTabChange('api')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'api'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu size={15} className="text-indigo-600" />
          <span>{isVietnamese ? 'Cổng API & Rate Limits' : 'API Gateway & Rate Limits'}</span>
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet size={15} className="text-emerald-600" />
          <span>{isVietnamese ? 'Giao dịch & Hóa đơn' : 'Payments & Invoices'}</span>
          {overview && overview.pendingTransactionsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {overview.pendingTransactionsCount} chờ duyệt
            </span>
          )}
        </button>
      </div>

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

      {/* Modals */}
      <PlanEditorModal
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
