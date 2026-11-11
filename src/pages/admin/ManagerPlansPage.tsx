import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import OperationalTable from '../../components/admin/OperationalTable';
import { getManagerPlanCatalog, getManagerQuotaLimits, saveManagerPlan, validateManagerPlanQuotas, type ManagerPlanQuota } from '../../services/managerService';
import { num, rows, str, type ApiRow } from '../../services/candidateMappers';

const field = 'mt-1 w-full rounded-lg border border-border px-3 py-2';
export default function ManagerPlansPage() {
  const client = useQueryClient();
  const catalog = useQuery({ queryKey: ['manager-plan-catalog'], queryFn: getManagerPlanCatalog });
  const limits = useQuery({ queryKey: ['manager-quota-limits'], queryFn: getManagerQuotaLimits });
  const [draft, setDraft] = useState<ApiRow | null>(null);
  const [quotas, setQuotas] = useState<ManagerPlanQuota[]>([]);
  const [error, setError] = useState('');
  const save = useMutation({ mutationFn: () => saveManagerPlan(str(draft?.id), {
    tierCode: str(draft?.tier_code), displayName: str(draft?.display_name), priceMonthly: num(draft?.price_monthly), currency: str(draft?.currency) || 'VND', active: draft?.is_active !== false,
  }, quotas, limits.data), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['manager-plan-catalog'] }); setDraft(null); },
  onError: () => { void client.invalidateQueries({ queryKey: ['manager-plan-catalog'] }); } });
  const edit = (plan: ApiRow) => {
    setDraft(plan); setError(''); save.reset();
    setQuotas(rows(plan.quotas).map((row) => ({ featureCode: str(row.feature_code || row.featureCode), quotaValue: num(row.quota_value ?? row.quotaValue), quotaPeriod: str(row.quota_period || row.quotaPeriod) })));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!limits.data) return;
    const invalid = validateManagerPlanQuotas(quotas, limits.data);
    if (invalid) { setError(invalid); return; }
    setError(''); save.mutate();
  };
  return <main className="space-y-6"><h1 className="text-3xl font-medium">Gói đăng ký và hạn mức sử dụng</h1>
    <p className="text-sm leading-6 text-slate-600">Quản lý giá, ngân sách token và số lượt gọi AI theo gói. Giới hạn điều chỉnh được lấy từ quyền của tài khoản Manager. Lượt gọi tính các yêu cầu AI thành công hoặc đang xử lý, không tính yêu cầu đã hủy.</p>
    <Link to="/manager/subscribers" className="text-brand underline">Theo dõi đăng ký của người dùng</Link>
    {catalog.isPending && <p>Đang tải gói…</p>}{(catalog.error || limits.error) && <p role="alert" className="text-danger">{catalog.error?.message || limits.error?.message}</p>}
    {limits.data && <p className="text-sm">Tối đa {limits.data.maxTokenQuota.toLocaleString('vi-VN')} token và {limits.data.maxApiQuota.toLocaleString('vi-VN')} lượt mỗi tính năng. Chu kỳ: {limits.data.allowedPeriods.join(', ')}.</p>}
    <button type="button" disabled={!limits.data} className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-40" onClick={() => edit({ tier_code: '', display_name: '', price_monthly: 0, currency: 'VND', is_active: true, quotas: [{ feature_code: 'AI_TOTAL_TOKENS', quota_value: 0, quota_period: 'MONTHLY' }, { feature_code: 'API_CALLS_TOTAL', quota_value: 0, quota_period: 'MONTHLY' }] })}>Thêm gói</button>
    {catalog.data && <OperationalTable rows={catalog.data} onSelect={edit} columns={[{ key: 'tier_code', label: 'Mã gói' }, { key: 'display_name', label: 'Tên gói' }, { key: 'price_monthly', label: 'Giá tháng' }, { key: 'currency', label: 'Tiền tệ' }, { key: 'is_active', label: 'Đang bán', render: (row) => row.is_active ? 'Có' : 'Không' }]} />}
    {draft && <form className="space-y-5 rounded-xl border border-border p-5" onSubmit={submit}><h2 className="text-xl font-medium">{draft.id ? 'Chỉnh sửa gói' : 'Tạo gói'}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{[['tier_code', 'Mã gói'], ['display_name', 'Tên gói']].map(([key, label]) => <label key={key} className="text-sm">{label}<input required maxLength={key === 'tier_code' ? 30 : 100} readOnly={key === 'tier_code' && !!draft.id} className={field} value={str(draft[key])} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
        <label className="text-sm">Giá tháng (VND)<input type="number" required min={0} step={1} className={field} value={num(draft.price_monthly)} onChange={(event) => setDraft({ ...draft, price_monthly: Number(event.target.value) })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active !== false} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} />Đang bán</label></div>
      <h3 className="font-medium">Token và lượt gọi AI theo tính năng</h3>
      {quotas.map((quota, index) => <div key={quota.featureCode} className="grid items-center gap-3 sm:grid-cols-[1fr_10rem_10rem]"><span className="text-sm">{quota.featureCode}<span className="block text-xs text-slate-500">{quota.featureCode.startsWith('API_CALLS_') ? 'Số lượt gọi AI' : 'Số token'}</span></span>
        <input aria-label={`Giới hạn ${quota.featureCode}`} type="number" required min={0} max={quota.featureCode.startsWith('API_CALLS_') ? limits.data?.maxApiQuota : limits.data?.maxTokenQuota} step={1} className={field} value={quota.quotaValue} onChange={(event) => setQuotas(quotas.map((item, at) => at === index ? { ...item, quotaValue: Number(event.target.value) } : item))} />
        <select aria-label={`Chu kỳ ${quota.featureCode}`} className={field} value={quota.quotaPeriod} onChange={(event) => setQuotas(quotas.map((item, at) => at === index ? { ...item, quotaPeriod: event.target.value } : item))}>{limits.data?.allowedPeriods.map((period) => <option key={period}>{period}</option>)}</select>
        </div>)}
      <select aria-label="Thêm tính năng giới hạn" className={field} value="" onChange={(event) => { if (event.target.value) setQuotas([...quotas, { featureCode: event.target.value, quotaValue: 0, quotaPeriod: limits.data?.allowedPeriods[0] || 'MONTHLY' }]); }}><option value="">Thêm hạn mức tính năng…</option>{limits.data?.allowedFeatureCodes.filter((code) => !quotas.some((quota) => quota.featureCode === code)).map((code) => <option key={code}>{code}</option>)}</select>
      {(error || save.error) && <p role="alert" className="text-danger">{error || save.error?.message}</p>}
      <div className="flex gap-4"><button className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-40" disabled={save.isPending || !limits.data}>{save.isPending ? 'Đang lưu…' : 'Lưu gói và hạn mức'}</button><button type="button" className="underline" onClick={() => setDraft(null)}>Đóng</button></div>
    </form>}
  </main>;
}
