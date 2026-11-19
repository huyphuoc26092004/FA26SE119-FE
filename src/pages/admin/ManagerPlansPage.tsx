import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Modal, Note, fieldLabel, outlineButton, primaryButton, underlineInput, underlineSelect } from '../../components/admin/AdminKit';
import { DotStatus, ManagerHead, ManagerSection, dangerTextLink, inkLink, pillPrimary } from '../../components/manager/ManagerUi';
import { getManagerPlanCatalog, getManagerQuotaLimits, isTopupTier, saveManagerPlan, validateManagerPlanQuotas, type ManagerPlanQuota } from '../../services/managerService';
import { num, rows, str, type ApiRow } from '../../services/candidateMappers';

const PERIOD: Record<string, string> = { MONTHLY: 'Hàng tháng', DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', YEARLY: 'Hàng năm', SUBSCRIPTION_PERIOD: 'Theo đăng ký', SUBSCRIPTION: 'Theo đăng ký' };
const periodLabel = (p: string) => PERIOD[p] ?? p;

const toQuotas = (plan: ApiRow): ManagerPlanQuota[] =>
  rows(plan.quotas).map((row) => ({
    featureCode: str(row.feature_code || row.featureCode),
    quotaValue: num(row.quota_value ?? row.quotaValue),
    quotaPeriod: str(row.quota_period || row.quotaPeriod),
  }));
const planInput = (plan: ApiRow, active = plan.is_active !== false) => ({
  tierCode: str(plan.tier_code),
  displayName: str(plan.display_name),
  priceMonthly: num(plan.price_monthly),
  currency: str(plan.currency) || 'VND',
  active,
  tierType: isTopupTier(plan) ? ('TOKEN_TOPUP' as const) : ('SUBSCRIPTION' as const),
  tokenAmount: num(plan.token_amount ?? plan.tokenAmount),
});

export default function ManagerPlansPage() {
  const client = useQueryClient();
  const catalog = useQuery({ queryKey: ['manager-plan-catalog'], queryFn: getManagerPlanCatalog });
  const limits = useQuery({ queryKey: ['manager-quota-limits'], queryFn: getManagerQuotaLimits });
  const [draft, setDraft] = useState<ApiRow | null>(null);
  const [quotas, setQuotas] = useState<ManagerPlanQuota[]>([]);
  const [error, setError] = useState('');

  const refresh = () => client.invalidateQueries({ queryKey: ['manager-plan-catalog'] });
  const save = useMutation({
    mutationFn: () => saveManagerPlan(str(draft?.id), planInput(draft ?? {}), quotas, limits.data),
    onSuccess: async () => {
      await refresh();
      setDraft(null);
    },
    onError: () => void refresh(),
  });
  const toggle = useMutation({
    mutationFn: (plan: ApiRow) => saveManagerPlan(str(plan.id), planInput(plan, plan.is_active === false), toQuotas(plan), limits.data),
    onSettled: () => void refresh(),
  });

  const edit = (plan: ApiRow) => {
    setDraft(plan);
    setError('');
    save.reset();
    setQuotas(toQuotas(plan));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!limits.data) return;
    const invalid =
      draft && isTopupTier(draft)
        ? Number.isSafeInteger(num(draft.token_amount)) && num(draft.token_amount) >= 1
          ? null
          : 'Số token của gói nạp phải là số nguyên lớn hơn 0.'
        : validateManagerPlanQuotas(quotas, limits.data);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError('');
    save.mutate();
  };

  const plans: ApiRow[] = catalog.data ?? [];
  const selling = plans.filter((p) => p.is_active !== false).length;
  const topupCount = plans.filter(isTopupTier).length;
  const draftTopup = !!draft && isTopupTier(draft);

  return (
    <main className="space-y-10 pb-10">
      <ManagerHead
        crumbs={['Quản lý', 'Gói dịch vụ']}
        title="Gói đăng ký và hạn mức"
        intro="Quản lý giá, ngân sách token và số lượt gọi AI theo gói. Lượt gọi tính các yêu cầu AI thành công hoặc đang xử lý, không tính yêu cầu đã hủy."
      >
        <Link to="/manager/subscribers" className={inkLink}>
          Theo dõi đăng ký của người dùng
        </Link>
        <button
          type="button"
          disabled={!limits.data}
          className={pillPrimary}
          onClick={() =>
            edit({
              tier_code: '',
              display_name: '',
              price_monthly: 0,
              currency: 'VND',
              is_active: true,
              quotas: [
                { feature_code: 'AI_TOTAL_TOKENS', quota_value: 0, quota_period: 'MONTHLY' },
                { feature_code: 'API_CALLS_TOTAL', quota_value: 0, quota_period: 'MONTHLY' },
              ],
            })
          }
        >
          <Plus size={15} /> Thêm gói
        </button>
      </ManagerHead>

      {(catalog.error || limits.error) && <Note tone="danger">{catalog.error?.message || limits.error?.message}</Note>}
      {toggle.error && <Note tone="danger">{toggle.error.message}</Note>}

      <section>
        <ManagerSection title="Các gói hiện có" meta={catalog.data ? `${selling} / ${plans.length} gói đang bán · ${plans.length - topupCount} gói thuê bao · ${topupCount} gói nạp token` : undefined} />
        {catalog.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải gói…</p>}
        {catalog.data && plans.length === 0 && <p className="py-6 text-[13px] text-slate-500">Chưa có gói nào.</p>}
        <div className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const active = plan.is_active !== false;
            const topup = isTopupTier(plan);
            const q = toQuotas(plan);
            const tokens = q.find((x) => x.featureCode === 'AI_TOTAL_TOKENS');
            const calls = q.find((x) => x.featureCode === 'API_CALLS_TOTAL');
            const period = tokens?.quotaPeriod || calls?.quotaPeriod || q[0]?.quotaPeriod || 'MONTHLY';
            return (
              <article
                key={str(plan.id) || i}
                className={`flex flex-col py-6 sm:px-7 ${i % 3 === 0 ? 'lg:pl-0' : 'lg:border-l lg:border-border'} ${i % 3 === 2 ? 'lg:pr-0' : ''} ${
                  i > 0 ? 'border-t border-border sm:border-t-0' : ''
                } ${!active ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[12px] tracking-[0.08em] text-slate-500">
                    {str(plan.tier_code)}
                    {topup && <span className="ml-2 font-sans tracking-normal">· Gói nạp token</span>}
                  </span>
                  <span className="text-[12px]">
                    <DotStatus label={active ? 'Đang bán' : 'Ngừng bán'} tone={active ? 'brand' : 'muted'} />
                  </span>
                </div>
                <h3 className="mt-3 text-[20px] text-ink">{str(plan.display_name) || '—'}</h3>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-[clamp(2.25rem,3.6vw,2.75rem)] font-light leading-none tracking-[-0.02em] tabular-nums text-ink">
                    {num(plan.price_monthly).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[13px] text-slate-500">
                    <span className="underline">đ</span> {topup ? '/ lần nạp' : '/ tháng'}
                  </span>
                </p>
                <dl className="mt-5 border-t border-border text-sm">
                  {(topup
                    ? [
                        ['Loại gói', 'Nạp token một lần'],
                        ['Tiền tệ', str(plan.currency) || 'VND'],
                        ['Số token nhận', `${num(plan.token_amount).toLocaleString('vi-VN')} token`],
                      ]
                    : [
                    ['Chu kỳ', periodLabel(period)],
                    ['Tiền tệ', str(plan.currency) || 'VND'],
                    [
                      'Token và lượt gọi',
                      tokens || calls
                        ? [tokens && `${tokens.quotaValue.toLocaleString('vi-VN')} token`, calls && `${calls.quotaValue.toLocaleString('vi-VN')} lượt`].filter(Boolean).join(' · ')
                        : '',
                    ],
                  ]).map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className={value ? 'text-right text-ink' : 'text-slate-400'}>{value || 'Xem trong chi tiết'}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex items-center gap-5">
                  <button type="button" className={inkLink} onClick={() => edit(plan)}>
                    Xem và chỉnh sửa
                  </button>
                  <button type="button" className={active ? dangerTextLink : inkLink} disabled={!limits.data || toggle.isPending} onClick={() => toggle.mutate(plan)}>
                    {active ? 'Ngừng bán' : 'Mở bán lại'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div>
          <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Giới hạn của tài khoản Manager</h2>
          <p className="mt-2 text-[15px] leading-7 text-slate-600">
            Khi tạo hoặc sửa gói, ngân sách token và lượt gọi của mỗi tính năng không được vượt các mức trần này. Mức trần lấy từ quyền của tài khoản Manager.
          </p>
          <Link to="/manager/support" className={`${inkLink} mt-3 inline-block`}>
            Đề nghị Admin nâng trần
          </Link>
        </div>
        <dl className="self-start border-t border-ink">
          {[
            ['Token tối đa mỗi tính năng', limits.data ? limits.data.maxTokenQuota.toLocaleString('vi-VN') : '—', true],
            ['Lượt gọi tối đa mỗi tính năng', limits.data ? limits.data.maxApiQuota.toLocaleString('vi-VN') : '—', true],
            ['Chu kỳ được phép', limits.data ? limits.data.allowedPeriods.map(periodLabel).join(' · ') : '—', false],
          ].map(([label, value, big]) => (
            <div key={String(label)} className="flex items-baseline justify-between gap-4 border-b border-border py-4">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className={big ? 'text-[22px] font-light tabular-nums text-ink' : 'text-sm text-ink'}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {draft && (
        <Modal
          eyebrow={draft.id ? 'Chỉnh sửa gói' : 'Gói mới'}
          title={str(draft.display_name) || 'Tạo gói'}
          width="max-w-3xl"
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className={outlineButton} onClick={() => setDraft(null)}>
                Đóng
              </button>
              <button type="submit" form="plan-form" className={primaryButton} disabled={save.isPending || !limits.data}>
                {save.isPending ? 'Đang lưu…' : draftTopup ? 'Lưu gói nạp token' : 'Lưu gói và hạn mức'}
              </button>
            </>
          }
        >
          <form id="plan-form" className="space-y-7" onSubmit={submit}>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <label className={fieldLabel}>
                Mã gói
                <input required maxLength={30} readOnly={!!draft.id} className={underlineInput} value={str(draft.tier_code)} onChange={(e) => setDraft({ ...draft, tier_code: e.target.value })} />
              </label>
              <label className={fieldLabel}>
                Tên gói
                <input required maxLength={100} className={underlineInput} value={str(draft.display_name)} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
              </label>
              <label className={fieldLabel}>
                {draftTopup ? 'Giá mỗi lần nạp (VND)' : 'Giá tháng (VND)'}
                <input type="number" required min={0} step={1} className={underlineInput} value={num(draft.price_monthly)} onChange={(e) => setDraft({ ...draft, price_monthly: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-ink">
                <input type="checkbox" className="accent-brand" checked={draft.is_active !== false} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
                Đang bán
              </label>
              {draftTopup && (
                <label className={fieldLabel}>
                  Số token nhận
                  <input type="number" required min={1} step={1} className={underlineInput} value={num(draft.token_amount)} onChange={(e) => setDraft({ ...draft, token_amount: Number(e.target.value) })} />
                </label>
              )}
            </div>

            {draftTopup ? (
              <p className="text-[13px] text-slate-500">Gói nạp token cộng thẳng số token vào tài khoản, không có hạn mức theo tính năng.</p>
            ) : (
            <div>
              <h4 className="border-b border-ink pb-2 text-[15px] font-medium text-ink">Token và lượt gọi AI theo tính năng</h4>
              {quotas.map((quota, index) => (
                <div key={quota.featureCode} className="grid items-end gap-x-6 gap-y-2 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                  <span className="text-sm text-ink">
                    <span className="font-mono text-[13px]">{quota.featureCode}</span>
                    <span className="block text-[12px] text-slate-500">{quota.featureCode.startsWith('API_CALLS_') ? 'Số lượt gọi AI' : 'Số token'}</span>
                  </span>
                  <input
                    aria-label={`Giới hạn ${quota.featureCode}`}
                    type="number"
                    required
                    min={0}
                    max={quota.featureCode.startsWith('API_CALLS_') ? limits.data?.maxApiQuota : limits.data?.maxTokenQuota}
                    step={1}
                    className={underlineInput}
                    value={quota.quotaValue}
                    onChange={(e) => setQuotas(quotas.map((item, at) => (at === index ? { ...item, quotaValue: Number(e.target.value) } : item)))}
                  />
                  <select
                    aria-label={`Chu kỳ ${quota.featureCode}`}
                    className={underlineSelect}
                    value={quota.quotaPeriod}
                    onChange={(e) => setQuotas(quotas.map((item, at) => (at === index ? { ...item, quotaPeriod: e.target.value } : item)))}
                  >
                    {limits.data?.allowedPeriods.map((period) => (
                      <option key={period} value={period}>
                        {periodLabel(period)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <select
                aria-label="Thêm tính năng giới hạn"
                className={`${underlineSelect} mt-3 max-w-sm`}
                value=""
                onChange={(e) => {
                  if (e.target.value) setQuotas([...quotas, { featureCode: e.target.value, quotaValue: 0, quotaPeriod: limits.data?.allowedPeriods[0] || 'MONTHLY' }]);
                }}
              >
                <option value="">+ Thêm hạn mức tính năng…</option>
                {limits.data?.allowedFeatureCodes
                  .filter((code) => !quotas.some((quota) => quota.featureCode === code))
                  .map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
              </select>
            </div>
            )}
            {(error || save.error) && <Note tone="danger">{error || save.error?.message}</Note>}
          </form>
        </Modal>
      )}
    </main>
  );
}
