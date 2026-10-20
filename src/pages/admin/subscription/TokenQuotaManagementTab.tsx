import React, { useState } from 'react';
import {
  Zap,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Coins,
  Cpu,
} from 'lucide-react';
import type {
  AdminTokenTopupPack,
  TokenConsumptionRule,
  TokenPolicySettings,
  UserQuotaOverride,
} from '../../../types/subscriptionManagement';

interface TokenQuotaManagementTabProps {
  rules: TokenConsumptionRule[];
  policy: TokenPolicySettings;
  topupPacks: AdminTokenTopupPack[];
  overrides: UserQuotaOverride[];
  onUpdateRule: (featureKey: string, updates: Partial<TokenConsumptionRule>) => Promise<void>;
  onSavePolicy: (policy: Partial<TokenPolicySettings>) => Promise<void>;
  onSaveTopupPack: (pack: Partial<AdminTokenTopupPack>) => Promise<void>;
  onDeleteTopupPack: (id: string) => Promise<void>;
  onOpenGrantModal: () => void;
  onRevokeOverride: (id: string) => Promise<void>;
}

export const TokenQuotaManagementTab: React.FC<TokenQuotaManagementTabProps> = ({
  rules,
  policy,
  topupPacks,
  overrides,
  onUpdateRule,
  onSavePolicy,
  onSaveTopupPack,
  onDeleteTopupPack,
  onOpenGrantModal,
  onRevokeOverride,
}) => {
  // Local editable policy state
  const [softLimit, setSoftLimit] = useState(policy.softLimitThresholdPercent);
  const [hardLimitAction, setHardLimitAction] = useState(policy.hardLimitAction);
  const [allowRollover, setAllowRollover] = useState(policy.allowRollover);
  const [maxRollover, setMaxRollover] = useState(policy.maxRolloverPercent);
  const [trialTokens, setTrialTokens] = useState(policy.freeTierTrialTokens);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policySavedFeedback, setPolicySavedFeedback] = useState(false);

  // Edit topup pack modal state
  const [editingPack, setEditingPack] = useState<AdminTokenTopupPack | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);

  // Pack modal form fields
  const [packName, setPackName] = useState('');
  const [packTokens, setPackTokens] = useState(100000);
  const [packBonus, setPackBonus] = useState(10000);
  const [packPrice, setPackPrice] = useState(49000);
  const [packPopular, setPackPopular] = useState(false);

  // Inline rule edit state
  const [editingRuleKey, setEditingRuleKey] = useState<string | null>(null);
  const [ruleTokensInput, setRuleTokensInput] = useState<number>(0);
  const [ruleCostInput, setRuleCostInput] = useState<number>(0);

  const handleSavePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      await onSavePolicy({
        softLimitThresholdPercent: Number(softLimit),
        hardLimitAction,
        allowRollover,
        maxRolloverPercent: Number(maxRollover),
        freeTierTrialTokens: Number(trialTokens),
      });
      setPolicySavedFeedback(true);
      setTimeout(() => setPolicySavedFeedback(false), 3000);
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleOpenAddPack = () => {
    setEditingPack(null);
    setPackName('');
    setPackTokens(500000);
    setPackBonus(100000);
    setPackPrice(199000);
    setPackPopular(false);
    setIsPackModalOpen(true);
  };

  const handleOpenEditPack = (pack: AdminTokenTopupPack) => {
    setEditingPack(pack);
    setPackName(pack.name);
    setPackTokens(pack.tokens);
    setPackBonus(pack.bonusTokens || 0);
    setPackPrice(pack.priceVND);
    setPackPopular(pack.popular || false);
    setIsPackModalOpen(true);
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveTopupPack({
      id: editingPack?.id,
      name: packName,
      tokens: Number(packTokens),
      bonusTokens: Number(packBonus),
      priceVND: Number(packPrice),
      popular: packPopular,
      status: 'ACTIVE',
    });
    setIsPackModalOpen(false);
  };

  const startEditRule = (r: TokenConsumptionRule) => {
    setEditingRuleKey(r.featureKey);
    setRuleTokensInput(r.baseTokensPerAction);
    setRuleCostInput(r.estimatedCostVND);
  };

  const saveRuleEdit = async (featureKey: string) => {
    await onUpdateRule(featureKey, {
      baseTokensPerAction: Number(ruleTokensInput),
      estimatedCostVND: Number(ruleCostInput),
    });
    setEditingRuleKey(null);
  };

  return (
    <div className="space-y-8">
      {/* 1. Global Token Quota Policy Configuration */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings size={20} className="text-blue-600" />
              <span>Chính sách hạn ngạch Token toàn hệ thống (Global Token Policy)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quy định cơ chế xử lý khi chạm ngưỡng hạn ngạch, chính sách cộng dồn (Rollover) và cảnh báo sử dụng
            </p>
          </div>

          <div className="flex items-center gap-2">
            {policySavedFeedback && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 size={15} />
                Đã lưu thành công!
              </span>
            )}
            <button
              onClick={handleSavePolicySubmit}
              disabled={isSavingPolicy}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSavingPolicy ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Soft limit */}
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Cảnh báo Soft-Limit (%)
            </label>
            <p className="text-[11px] text-slate-500">
              Gửi email cảnh báo & hiển thị banner khi user tiêu thụ đạt ngưỡng này.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="50"
                max="95"
                value={softLimit}
                onChange={(e) => setSoftLimit(Number(e.target.value))}
                className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-hidden"
              />
              <span className="text-xs font-semibold text-slate-600">% hạn ngạch</span>
            </div>
          </div>

          {/* Hard limit action */}
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Hành động khi chạm Hard-Limit (100%)
            </label>
            <p className="text-[11px] text-slate-500">
              Xử lý yêu cầu khi tài khoản đã dùng hết hạn mức token trong tháng.
            </p>
            <select
              value={hardLimitAction}
              onChange={(e) =>
                setHardLimitAction(e.target.value as TokenPolicySettings['hardLimitAction'])
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value="FALLBACK_FLASH">Fallback Flash (Chuyển sang Gemini Flash nhẹ)</option>
              <option value="BLOCK">Chặn toàn bộ (Yêu cầu nạp thêm gói Top-up)</option>
              <option value="THROTTLE">Hạ băng thông (Giới hạn 1 request / 30s)</option>
            </select>
          </div>

          {/* Rollover policy */}
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Chính sách cộng dồn (Token Rollover)
            </label>
            <p className="text-[11px] text-slate-500">
              Cho phép chuyển số token chưa sử dụng sang chu kỳ thanh toán tiếp theo.
            </p>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={allowRollover}
                  onChange={(e) => setAllowRollover(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Kích hoạt Rollover</span>
              </label>

              {allowRollover && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Tối đa:</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={maxRollover}
                    onChange={(e) => setMaxRollover(Number(e.target.value))}
                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 text-center"
                  />
                  <span className="text-xs text-slate-600">%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Free trial grant row */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="font-bold text-slate-800">Token dùng thử miễn phí khi đăng ký mới (Free Tier Trial):</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Số lượng Token cấp phát cho ứng viên ngay khi đăng ký tài khoản thành công.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min="5000"
              step="5000"
              value={trialTokens}
              onChange={(e) => setTrialTokens(Number(e.target.value))}
              className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 text-center"
            />
            <span className="font-semibold text-slate-700">Tokens</span>
          </div>
        </div>
      </div>

      {/* 2. Feature Token Consumption Rules Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <span>Định mức tiêu thụ Token theo tính năng (Feature Consumption Rules)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Số lượng AI Tokens trừ vào tài khoản người dùng và chi phí hệ thống ước tính cho từng tác vụ
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tính năng AI</th>
                <th className="py-3 px-4">Mô hình AI chỉ định</th>
                <th className="py-3 px-4">Định mức Token / Lượt</th>
                <th className="py-3 px-4">Chi phí ước tính</th>
                <th className="py-3 px-4">Lượt dùng tháng này</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => {
                const isEditing = editingRuleKey === rule.featureKey;
                const isEnabled = rule.status === 'ENABLED';

                return (
                  <tr key={rule.featureKey} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rule.featureName}</div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{rule.description}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                        <Cpu size={11} />
                        <span>{rule.modelAssigned}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-700">
                      {isEditing ? (
                        <input
                          type="number"
                          step="100"
                          value={ruleTokensInput}
                          onChange={(e) => setRuleTokensInput(Number(e.target.value))}
                          className="w-24 rounded-lg border border-blue-400 px-2 py-1 text-xs font-bold text-blue-700"
                        />
                      ) : (
                        <span>{rule.baseTokensPerAction.toLocaleString()} Tokens</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {isEditing ? (
                        <input
                          type="number"
                          step="10"
                          value={ruleCostInput}
                          onChange={(e) => setRuleCostInput(Number(e.target.value))}
                          className="w-20 rounded-lg border border-blue-400 px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      ) : (
                        <span>{rule.estimatedCostVND.toLocaleString('vi-VN')} đ</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {rule.monthlyUsageCount?.toLocaleString() || 0} lượt
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          onUpdateRule(rule.featureKey, {
                            status: isEnabled ? 'DISABLED' : 'ENABLED',
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{isEnabled ? 'BẬT' : 'TẮT'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveRuleEdit(rule.featureKey)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                          >
                            <Save size={12} />
                            <span>Lưu</span>
                          </button>
                          <button
                            onClick={() => setEditingRuleKey(null)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs transition"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditRule(rule)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="Sửa định mức"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Token Top-up Addon Packs Manager */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins size={18} className="text-emerald-600" />
              <span>Gói nạp Token bổ sung (Token Top-up Addon Packs)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các gói nạp nhanh cho người dùng khi có nhu cầu sử dụng vượt hạn mức hàng tháng
            </p>
          </div>

          <button
            onClick={handleOpenAddPack}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Thêm gói nạp</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topupPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative p-5 rounded-2xl border bg-white flex flex-col justify-between transition shadow-2xs ${
                pack.popular
                  ? 'border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                  <Sparkles size={11} />
                  <span>Phổ biến</span>
                </span>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">{pack.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">
                    {pack.priceVND.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">đ</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Token cơ bản:</span>
                    <strong className="text-blue-700">{pack.tokens.toLocaleString()}</strong>
                  </div>
                  {pack.bonusTokens > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>+ Thưởng thêm:</span>
                      <span>+{pack.bonusTokens.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900">
                    <span>Tổng nhận:</span>
                    <span>{(pack.tokens + pack.bonusTokens).toLocaleString()} Tokens</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  Đã bán: <strong>{pack.totalSold || 0}</strong> lượt
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditPack(pack)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                    title="Chỉnh sửa gói nạp"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteTopupPack(pack.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                    title="Xóa gói nạp"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. User Quota Overrides & Grants */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-600" />
              <span>Hạn mức Token đặc thù & Thưởng cấp phát (User Quota Overrides)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách tài khoản được nâng hạn mức VIP cá nhân hoặc nhận token đền bù / hỗ trợ trải nghiệm
            </p>
          </div>

          <button
            onClick={onOpenGrantModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Cấp Token / Hạn mức cá nhân</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ứng viên / Tài khoản</th>
                <th className="py-3 px-4">Hạn mức tháng gốc</th>
                <th className="py-3 px-4">Hạn mức tùy chỉnh</th>
                <th className="py-3 px-4">Token thưởng cộng thêm</th>
                <th className="py-3 px-4">Lý do cấp phát</th>
                <th className="py-3 px-4">Hiệu lực</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overrides.map((ovr) => {
                const isActive = ovr.status === 'ACTIVE';

                return (
                  <tr key={ovr.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ovr.userName}</div>
                      <span className="text-[11px] text-slate-400 font-mono">{ovr.userEmail}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ovr.originalMonthlyQuota.toLocaleString()} Tokens
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-700">
                      {ovr.customMonthlyQuota.toLocaleString()} Tokens
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {ovr.bonusTokensGranted > 0 ? `+${ovr.bonusTokensGranted.toLocaleString()} Tokens` : '—'}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-1">{ovr.reason}</p>
                      <span className="text-[10px] text-slate-400">Cấp bởi: {ovr.grantedBy} ({ovr.grantedAt})</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {ovr.expiresAt || 'Vĩnh viễn'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{isActive ? 'HOẠT ĐỘNG' : 'ĐÃ THU HỒI'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isActive && (
                        <button
                          onClick={() => onRevokeOverride(ovr.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold transition"
                        >
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-up Pack Edit Modal */}
      {isPackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingPack ? 'Chỉnh sửa gói nạp Token' : 'Thêm gói nạp Token mới'}
            </h3>
            <form onSubmit={handleSavePack} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên gói nạp
                </label>
                <input
                  type="text"
                  required
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder="Ví dụ: Gói nạp 500K Tokens"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Token cơ bản
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={packTokens}
                    onChange={(e) => setPackTokens(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Token thưởng thêm
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={packBonus}
                    onChange={(e) => setPackBonus(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá bán (VND)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={packPrice}
                  onChange={(e) => setPackPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden font-bold text-emerald-700"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-1 select-none">
                <input
                  type="checkbox"
                  checked={packPopular}
                  onChange={(e) => setPackPopular(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Đánh dấu gói phổ biến (Popular Badge)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPackModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Lưu gói nạp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
