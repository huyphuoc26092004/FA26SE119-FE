import React, { useState } from 'react';
import type {
  AdminTokenTopupPack,
  TokenConsumptionRule,
  TokenPolicySettings,
  UserQuotaOverride,
} from '../../../types/subscriptionManagement';
import {
  CheckBox,
  EmptyRow,
  Modal,
  RowMenu,
  SectionHead,
  brandLink,
  dangerLink,
  fieldLabel,
  primaryButton,
  smallPrimary,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';

const n = (v: number) => v.toLocaleString('vi-VN');
const inlineNumber =
  'w-24 border-0 border-b border-brand bg-transparent py-1 text-right text-sm tabular-nums text-ink outline-none';

function PolicyRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-3 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center">
      <div>
        <p className="text-[15px] text-ink">{label}</p>
        <p className="mt-0.5 text-[13px] text-slate-500">{hint}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

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

  const ruleGrid = 'md:grid-cols-[minmax(0,1fr)_9rem_8rem_7rem_6rem_7rem]';
  const ovrGrid = 'md:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem_6rem]';

  return (
    <div className="space-y-[clamp(3rem,6vw,4.5rem)]">
      {/* 01 Policy */}
      <section>
        <SectionHead
          index="01"
          title="Chính sách hạn mức"
          meta={policySavedFeedback ? <span className="text-brand">Đã lưu.</span> : 'Áp dụng toàn hệ thống'}
          action={
            <button type="button" onClick={handleSavePolicySubmit} disabled={isSavingPolicy} className={smallPrimary}>
              {isSavingPolicy ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          }
        />
        <PolicyRow label="Cảnh báo sớm" hint="Gửi email và hiện banner khi người dùng dùng tới ngưỡng này.">
          <label className="flex items-baseline gap-3">
            <input type="number" min="50" max="95" value={softLimit} onChange={(e) => setSoftLimit(Number(e.target.value))} className={`${underlineInput} w-24 tabular-nums`} />
            <span className="whitespace-nowrap text-[13px] text-slate-600">% hạn mức</span>
          </label>
        </PolicyRow>
        <PolicyRow label="Khi dùng hết 100%" hint="Cách xử lý yêu cầu khi tài khoản hết token trong tháng.">
          <select value={hardLimitAction} onChange={(e) => setHardLimitAction(e.target.value as TokenPolicySettings['hardLimitAction'])} className={underlineSelect}>
            <option value="FALLBACK_FLASH">Chuyển sang Gemini Flash</option>
            <option value="BLOCK">Chặn, yêu cầu nạp thêm</option>
            <option value="THROTTLE">Giảm tốc, 1 request / 30 giây</option>
          </select>
        </PolicyRow>
        <PolicyRow label="Cộng dồn token" hint="Chuyển token chưa dùng sang chu kỳ sau.">
          <div className="flex flex-wrap items-center gap-x-6">
            <div className="flex-1 [&>label]:border-b-0">
              <CheckBox checked={allowRollover} onChange={setAllowRollover} label="Cho phép cộng dồn" />
            </div>
            {allowRollover && (
              <label className="flex items-baseline gap-2 whitespace-nowrap text-[13px] text-slate-600">
                Tối đa
                <input type="number" min="10" max="100" value={maxRollover} onChange={(e) => setMaxRollover(Number(e.target.value))} className={`${underlineInput} w-16 text-center tabular-nums`} />
                %
              </label>
            )}
          </div>
        </PolicyRow>
        <PolicyRow label="Token dùng thử" hint="Cấp cho ứng viên ngay khi đăng ký tài khoản.">
          <label className="flex items-baseline gap-3">
            <input type="number" min="5000" step="5000" value={trialTokens} onChange={(e) => setTrialTokens(Number(e.target.value))} className={`${underlineInput} w-32 tabular-nums`} />
            <span className="text-[13px] text-slate-600">token</span>
          </label>
        </PolicyRow>
      </section>

      {/* 02 Rules */}
      <section>
        <SectionHead index="02" title="Định mức theo tính năng" meta={`${rules.length} tính năng`} />
        <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${ruleGrid}`}>
          <span>Tính năng</span>
          <span className="text-right">Token / lượt</span>
          <span className="text-right">Chi phí</span>
          <span className="text-right">Tháng này</span>
          <span>Trạng thái</span>
          <span />
        </div>
        <ul>
          {rules.map((rule) => {
            const isEditing = editingRuleKey === rule.featureKey;
            const isEnabled = rule.status === 'ENABLED';
            return (
              <li key={rule.featureKey} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-border py-4 ${ruleGrid}`}>
                <div className="min-w-0">
                  <p className={`text-[15px] ${isEnabled ? 'text-ink' : 'text-slate-500'}`}>{rule.featureName}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                    {rule.modelAssigned} · {rule.description}
                  </p>
                  {!isEditing && (
                    <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                      {n(rule.baseTokensPerAction)} token · {n(rule.estimatedCostVND)}đ
                    </p>
                  )}
                </div>
                <span className={`text-right text-sm tabular-nums text-ink ${isEditing ? '' : 'hidden md:block'}`}>
                  {isEditing ? (
                    <input type="number" step="100" aria-label="Token mỗi lượt" value={ruleTokensInput} onChange={(e) => setRuleTokensInput(Number(e.target.value))} className={inlineNumber} />
                  ) : (
                    n(rule.baseTokensPerAction)
                  )}
                </span>
                <span className={`text-right text-sm tabular-nums text-slate-700 ${isEditing ? '' : 'hidden md:block'}`}>
                  {isEditing ? (
                    <input type="number" step="10" aria-label="Chi phí ước tính" value={ruleCostInput} onChange={(e) => setRuleCostInput(Number(e.target.value))} className={inlineNumber} />
                  ) : (
                    `${n(rule.estimatedCostVND)}đ`
                  )}
                </span>
                <span className="hidden text-right text-sm tabular-nums text-slate-700 md:block">{n(rule.monthlyUsageCount || 0)}</span>
                <button
                  type="button"
                  onClick={() => onUpdateRule(rule.featureKey, { status: isEnabled ? 'DISABLED' : 'ENABLED' })}
                  className={`hidden text-left text-sm md:block ${isEnabled ? 'text-brand' : 'text-slate-500'} hover:underline`}
                  title={isEnabled ? 'Bấm để tắt' : 'Bấm để bật'}
                >
                  {isEnabled ? 'Đang bật' : 'Đang tắt'}
                </button>
                <span className="flex justify-end gap-x-5 text-[13px]">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveRuleEdit(rule.featureKey)} className={`${brandLink} text-[13px]`}>
                        Lưu
                      </button>
                      <button type="button" onClick={() => setEditingRuleKey(null)} className={`${textLink} text-[13px] text-slate-600`}>
                        Huỷ
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => startEditRule(rule)} className={`${textLink} text-[13px] text-ink`}>
                      Sửa
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 03 Top-up packs */}
      <section>
        <SectionHead
          index="03"
          title="Gói nạp token"
          meta="Cho người dùng cần thêm ngoài hạn mức tháng"
          action={
            <button type="button" onClick={handleOpenAddPack} className={`${textLink} text-[13px] text-ink`}>
              Thêm gói nạp
            </button>
          }
        />
        {topupPacks.length === 0 ? (
          <EmptyRow>Chưa có gói nạp nào.</EmptyRow>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {topupPacks.map((pack, i) => (
              <article
                key={pack.id}
                className={`flex flex-col border-b border-border py-6 sm:px-6 ${i % 2 === 1 ? 'sm:border-l' : 'sm:pl-0'} ${
                  i % 4 !== 0 ? 'lg:border-l lg:pl-6' : 'lg:border-l-0 lg:pl-0'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] text-ink">
                    {pack.name}
                    {pack.popular && <span className="ml-2 text-[13px] text-brand">Phổ biến</span>}
                  </p>
                  <RowMenu
                    label={`Thao tác cho ${pack.name}`}
                    items={[
                      { label: 'Chỉnh sửa', onClick: () => handleOpenEditPack(pack) },
                      { label: 'Xoá gói nạp', onClick: () => onDeleteTopupPack(pack.id), tone: 'danger' },
                    ]}
                  />
                </div>
                <p className="mt-3 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-none tracking-[-0.02em] tabular-nums text-ink">
                  {n(pack.priceVND)}đ
                </p>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">
                  {n(pack.tokens)} token
                  {pack.bonusTokens > 0 && <span className="text-brand"> + {n(pack.bonusTokens)} thưởng</span>}
                  <br />
                  Tổng nhận <span className="text-ink">{n(pack.tokens + pack.bonusTokens)}</span>
                </p>
                <p className="mt-auto pt-4 text-[13px] text-slate-500">Đã bán {n(pack.totalSold || 0)} lượt</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 04 Overrides */}
      <section>
        <SectionHead
          index="04"
          title="Hạn mức riêng & token thưởng"
          meta={`${overrides.filter((o) => o.status === 'ACTIVE').length} đang hiệu lực`}
          action={
            <button type="button" onClick={onOpenGrantModal} className={smallPrimary}>
              Cấp token
            </button>
          }
        />
        <div className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 md:grid ${ovrGrid}`}>
          <span>Tài khoản & lý do</span>
          <span className="text-right">Hạn mức gốc → mới</span>
          <span className="text-right">Token thưởng</span>
          <span>Hiệu lực</span>
          <span />
        </div>
        {overrides.length === 0 ? (
          <EmptyRow>Chưa cấp hạn mức riêng cho tài khoản nào.</EmptyRow>
        ) : (
          <ul>
            {overrides.map((ovr) => {
              const isActive = ovr.status === 'ACTIVE';
              return (
                <li key={ovr.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 border-b border-border py-5 ${ovrGrid} ${isActive ? '' : 'opacity-60'}`}>
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">
                      {ovr.userName} <span className="text-[13px] text-slate-500">· {ovr.userEmail}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-700">{ovr.reason}</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      {ovr.grantedBy} · {ovr.grantedAt}
                      {!isActive && ' · Đã thu hồi'}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                      {n(ovr.originalMonthlyQuota)} → {n(ovr.customMonthlyQuota)}
                      {ovr.bonusTokensGranted > 0 && ` · +${n(ovr.bonusTokensGranted)}`}
                    </p>
                  </div>
                  <span className="hidden text-right text-sm tabular-nums md:block">
                    <span className="text-slate-500">{n(ovr.originalMonthlyQuota)}</span>
                    <span className="block text-[15px] text-ink">{n(ovr.customMonthlyQuota)}</span>
                  </span>
                  <span className="hidden text-right text-sm tabular-nums text-brand md:block">
                    {ovr.bonusTokensGranted > 0 ? `+${n(ovr.bonusTokensGranted)}` : '—'}
                  </span>
                  <span className="hidden text-[13px] text-slate-600 md:block">{ovr.expiresAt || 'Vĩnh viễn'}</span>
                  <span className="text-right">
                    {isActive && (
                      <button type="button" onClick={() => onRevokeOverride(ovr.id)} className={`${dangerLink} text-[13px]`}>
                        Thu hồi
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isPackModalOpen && (
        <Modal
          eyebrow="Gói nạp token"
          title={editingPack ? 'Chỉnh sửa gói nạp.' : 'Thêm gói nạp.'}
          onClose={() => setIsPackModalOpen(false)}
          width="max-w-md"
          footer={
            <>
              <button type="button" onClick={() => setIsPackModalOpen(false)} className={`${textLink} text-slate-600`}>
                Huỷ
              </button>
              <button type="submit" form="topup-pack-form" className={primaryButton}>
                Lưu gói nạp
              </button>
            </>
          }
        >
          <form id="topup-pack-form" onSubmit={handleSavePack} className="space-y-5">
            <label className="block">
              <span className={fieldLabel}>Tên gói</span>
              <input type="text" required value={packName} onChange={(e) => setPackName(e.target.value)} placeholder="Gói nạp 500K token" className={underlineInput} />
            </label>
            <div className="grid grid-cols-2 gap-x-8">
              <label className="block">
                <span className={fieldLabel}>Token cơ bản</span>
                <input type="number" step="10000" required value={packTokens} onChange={(e) => setPackTokens(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
              </label>
              <label className="block">
                <span className={fieldLabel}>Token thưởng</span>
                <input type="number" step="5000" value={packBonus} onChange={(e) => setPackBonus(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
              </label>
            </div>
            <label className="block">
              <span className={fieldLabel}>Giá bán (VNĐ)</span>
              <input type="number" step="1000" required value={packPrice} onChange={(e) => setPackPrice(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </label>
            <div className="border-t border-border">
              <CheckBox checked={packPopular} onChange={setPackPopular} label="Đánh dấu “Phổ biến”" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
