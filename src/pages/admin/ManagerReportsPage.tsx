import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Note, fieldLabel, underlineInput, underlineSelect } from '../../components/admin/AdminKit';
import { ManagerHead, ManagerSection, ShareBar, StatGroup, inkLink, tdCell, thCell, vnd } from '../../components/manager/ManagerUi';
import { getManagerAnalytics, getManagerDashboard, getManagerQuotaLimits, getManagerUsage } from '../../services/managerService';
import { num, obj, rows, str } from '../../services/candidateMappers';

const PAGE_SIZE = 20;
const vnToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const daysAgo = (n: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() - n * 86_400_000));
const dmy = (value: unknown) => str(value).slice(0, 10).split('-').reverse().join('/');
const fmt = (value: unknown) => num(value).toLocaleString('vi-VN');
const usd = (value: unknown) => `$${num(value).toFixed(2)}`;

type Preset = '7d' | 'month' | '30d' | 'custom';
const PRESETS: { value: Exclude<Preset, 'custom'>; label: string; range: () => [string, string] }[] = [
  { value: '7d', label: '7 ngày', range: () => [daysAgo(6), vnToday()] },
  { value: 'month', label: 'Tháng này', range: () => [`${vnToday().slice(0, 8)}01`, vnToday()] },
  { value: '30d', label: '30 ngày', range: () => [daysAgo(29), vnToday()] },
];

const QUICK_LINKS = [
  ['subscriptions', 'Gói và hạn mức'],
  ['payments', 'Thanh toán'],
  ['consultants', 'Chất lượng tư vấn'],
  ['crawl-reports', 'Thu thập việc làm'],
  ['support', 'Phiếu hỗ trợ'],
];

export default function ManagerReportsPage({ analytics = false }: { analytics?: boolean }) {
  const [preset, setPreset] = useState<Preset>('month');
  const [from, setFrom] = useState(() => `${vnToday().slice(0, 8)}01`);
  const [to, setTo] = useState(vnToday);
  const [feature, setFeature] = useState('');
  const [usageOffset, setUsageOffset] = useState(0);
  const validRange = !!from && !!to && from <= to && (Date.parse(to) - Date.parse(from)) / 86_400_000 <= 365;

  const dashboard = useQuery({ queryKey: ['manager-dashboard'], queryFn: getManagerDashboard, refetchInterval: 60_000 });
  const report = useQuery({ queryKey: ['manager-analytics', from, to], queryFn: () => getManagerAnalytics(from, to), enabled: validRange });
  const usage = useQuery({ queryKey: ['manager-usage', from, to, feature, usageOffset], queryFn: () => getManagerUsage(from, to, feature, usageOffset), enabled: validRange });
  const limits = useQuery({ queryKey: ['manager-quota-limits'], queryFn: getManagerQuotaLimits, staleTime: 300_000 });

  const overview = obj(dashboard.data);
  const services = obj(overview.service_metrics);
  const monthly = obj(overview.aiUsage);
  const days = rows(report.data?.usage_by_day);
  const revenue = rows(report.data?.revenue_by_day);
  const consultations = obj(report.data?.consultations);
  const maxTokens = Math.max(1, ...days.map((r) => num(r.total_tokens)));
  const usageRows = useMemo(() => usage.data ?? [], [usage.data]);
  const usageTotal = Math.max(1, usageRows.reduce((sum, r) => sum + num(r.total_tokens), 0));
  const features = useMemo(() => {
    const set = new Set(limits.data?.allowedFeatureCodes ?? []);
    for (const r of usageRows) if (str(r.feature_code)) set.add(str(r.feature_code));
    return [...set].sort();
  }, [limits.data, usageRows]);

  const applyPreset = (value: Exclude<Preset, 'custom'>) => {
    const [f, t] = PRESETS.find((p) => p.value === value)!.range();
    setPreset(value);
    setFrom(f);
    setTo(t);
    setUsageOffset(0);
  };

  return (
    <main className="space-y-10 pb-10">
      <ManagerHead
        crumbs={analytics ? ['Vận hành & báo cáo', 'Phân tích'] : ['Chung', 'Bảng điều khiển']}
        title={analytics ? 'Phân tích vận hành' : 'Bảng điều khiển'}
        intro="Dữ liệu vận hành thực tế. Mốc ngày tính theo giờ Việt Nam (UTC+7)."
        aside={
          <>
            <label className={`${fieldLabel} w-40`}>
              Từ ngày
              <input type="date" required className={underlineInput} value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); setUsageOffset(0); }} />
            </label>
            <label className={`${fieldLabel} w-40`}>
              Đến ngày
              <input type="date" required className={underlineInput} value={to} min={from} onChange={(e) => { setTo(e.target.value); setPreset('custom'); setUsageOffset(0); }} />
            </label>
            <div className="flex gap-1.5 pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={preset === p.value}
                  onClick={() => applyPreset(p.value)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                    preset === p.value ? 'bg-ink font-medium text-white' : 'border border-slate-300 text-slate-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        }
      />

      {dashboard.error && <Note tone="danger">{dashboard.error.message}</Note>}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,2.5fr)]">
        <StatGroup
          label="Nền tảng"
          items={[
            { label: 'Người dùng', value: num(overview.users) },
            { label: 'Gói đang hoạt động', value: num(overview.activeSubscriptions) },
            { label: 'Tư vấn viên', value: num(services.active_consultants) },
            { label: 'Phiếu hỗ trợ đang mở', value: num(overview.openSupportTickets) },
            { label: 'Báo cáo thanh toán đang mở', value: num(services.open_payment_reports) },
          ]}
        />
        <StatGroup
          label="Lịch tư vấn"
          items={[
            { label: 'Đang chờ', value: num(services.pending_bookings) },
            { label: 'Đã tiếp nhận', value: num(services.accepted_bookings) },
            { label: 'Đã hoàn tất', value: num(services.completed_bookings) },
          ]}
        />
        <StatGroup
          label="AI tháng này"
          tone="brand"
          items={[
            { label: 'Lượt gọi', value: num(monthly.requests) },
            { label: 'Token', value: num(monthly.total_tokens) },
          ]}
        />
      </div>

      <nav aria-label="Đi tới" className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
        <span className="text-[13px] text-slate-500">Đi tới:</span>
        {QUICK_LINKS.map(([path, label]) => (
          <Link key={path} to={`/manager/${path}`} className={`${inkLink} inline-flex items-center gap-1`}>
            {label} <ArrowRight size={13} aria-hidden="true" />
          </Link>
        ))}
      </nav>

      {!validRange && <Note tone="danger">Chọn khoảng ngày hợp lệ, tối đa 366 ngày.</Note>}
      {validRange && report.error && <Note tone="danger">{report.error.message}</Note>}

      {validRange && (
        <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* AI theo ngày */}
          <section>
            <ManagerSection title="Sử dụng AI theo ngày" meta={report.data ? `${days.length} ngày có dữ liệu` : undefined} />
            {report.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải báo cáo…</p>}
            {report.data && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={thCell}>Ngày</th>
                      <th className={`${thCell} text-right`}>Lượt gọi</th>
                      <th className={thCell}>Token</th>
                      <th className={`${thCell} pr-0 text-right`}>Chi phí ước tính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-[13px] text-slate-500">Không có lượt gọi AI trong khoảng này.</td>
                      </tr>
                    )}
                    {days.map((r) => (
                      <tr key={str(r.day)} className="border-b border-border">
                        <td className={`${tdCell} tabular-nums`}>{dmy(r.day)}</td>
                        <td className={`${tdCell} text-right tabular-nums`}>{fmt(r.requests)}</td>
                        <td className={tdCell}>
                          <span className="flex items-center gap-4">
                            <span className="w-16 shrink-0 tabular-nums">{fmt(r.total_tokens)}</span>
                            <ShareBar value={(num(r.total_tokens) / maxTokens) * 100} />
                          </span>
                        </td>
                        <td className={`${tdCell} pr-0 text-right tabular-nums text-slate-500`}>{usd(r.estimated_cost)}</td>
                      </tr>
                    ))}
                    {days.length > 0 && (
                      <tr className="border-b border-border font-medium">
                        <td className={tdCell}>Tổng</td>
                        <td className={`${tdCell} text-right tabular-nums`}>{fmt(days.reduce((s, r) => s + num(r.requests), 0))}</td>
                        <td className={`${tdCell} tabular-nums`}>{fmt(days.reduce((s, r) => s + num(r.total_tokens), 0))}</td>
                        <td className={`${tdCell} pr-0 text-right tabular-nums`}>{usd(days.reduce((s, r) => s + num(r.estimated_cost), 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-12">
            {/* Doanh thu */}
            <section>
              <ManagerSection title="Doanh thu theo ngày" meta="VND" />
              {report.data && (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className={thCell}>Ngày</th>
                      <th className={`${thCell} text-right`}>Đã thanh toán</th>
                      <th className={`${thCell} pr-0 text-right`}>Số đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-[13px] text-slate-500">Chưa có thanh toán hoàn tất trong khoảng này.</td>
                      </tr>
                    )}
                    {revenue.map((r, i) => (
                      <tr key={`${str(r.day)}-${i}`} className="border-b border-border">
                        <td className={`${tdCell} tabular-nums`}>{dmy(r.day)}</td>
                        <td className={`${tdCell} text-right tabular-nums`}>{vnd(r.amount)}</td>
                        <td className={`${tdCell} pr-0 text-right tabular-nums`}>{fmt(r.orders)}</td>
                      </tr>
                    ))}
                    {revenue.length > 0 && (
                      <tr className="border-b border-border font-medium">
                        <td className={tdCell}>Tổng trong kỳ</td>
                        <td className={`${tdCell} text-right tabular-nums text-brand`}>{vnd(revenue.reduce((s, r) => s + num(r.amount), 0))}</td>
                        <td className={`${tdCell} pr-0 text-right tabular-nums`}>{fmt(revenue.reduce((s, r) => s + num(r.orders), 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </section>

            {/* Tư vấn trong kỳ */}
            <section>
              <ManagerSection
                title="Dịch vụ tư vấn trong kỳ"
                meta={
                  <Link to="/manager/consultants" className={inkLink}>
                    Chất lượng tư vấn
                  </Link>
                }
              />
              {report.data && (
                <>
                  <dl className="grid grid-cols-4 border-b border-border">
                    {[
                      ['bookings', 'Số lịch', 'text-ink'],
                      ['completed', 'Hoàn tất', 'text-ink'],
                      ['cancelled', 'Đã hủy', 'text-ink'],
                      ['declined', 'Từ chối', 'text-danger'],
                    ].map(([key, label, tone]) => (
                      <div key={key} className="py-4">
                        <dt className="text-[12px] text-slate-500">{label}</dt>
                        <dd className={`mt-1.5 text-[26px] font-light leading-none tabular-nums ${num(consultations[key]) === 0 ? 'text-slate-300' : tone}`}>
                          {fmt(consultations[key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-baseline justify-between border-b border-border py-3.5 text-sm">
                    <span className="text-slate-600">Đánh giá trung bình / 5</span>
                    <span className={consultations.average_rating == null ? 'text-slate-400' : 'text-ink'}>
                      {consultations.average_rating == null ? 'Chưa có đánh giá' : num(consultations.average_rating).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Token theo người dùng */}
      {validRange && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3">
            <div>
              <h2 className="text-[clamp(1.125rem,1.7vw,1.375rem)] font-normal tracking-[-0.01em] text-ink">Token và dịch vụ theo người dùng</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">Chi phí AI là ước tính từ nhật ký dịch vụ.</p>
            </div>
            <label className={`${fieldLabel} w-60`}>
              Tính năng
              <select className={underlineSelect} value={feature} onChange={(e) => { setFeature(e.target.value); setUsageOffset(0); }}>
                <option value="">Tất cả tính năng</option>
                {features.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {usage.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải mức sử dụng…</p>}
          {usage.error && <Note tone="danger">{usage.error.message}</Note>}
          {usage.data && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className={thCell}>Người dùng</th>
                    <th className={thCell}>Tính năng</th>
                    <th className={`${thCell} text-right`}>Lượt gọi</th>
                    <th className={`${thCell} text-right`}>Token</th>
                    <th className={`${thCell} w-[30%] pr-0`}>Tỷ trọng token</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-[13px] text-slate-500">Không có dữ liệu sử dụng phù hợp.</td>
                    </tr>
                  )}
                  {usageRows.map((r, i) => {
                    const share = (num(r.total_tokens) / usageTotal) * 100;
                    return (
                      <tr key={`${str(r.email)}-${str(r.feature_code)}-${i}`} className="border-b border-border">
                        <td className={`${tdCell} max-w-[18rem] truncate`}>{str(r.email) || '—'}</td>
                        <td className={`${tdCell} font-mono text-[12px] text-slate-600`}>{str(r.feature_code) || '—'}</td>
                        <td className={`${tdCell} text-right tabular-nums`}>{fmt(r.requests)}</td>
                        <td className={`${tdCell} text-right tabular-nums`}>{fmt(r.total_tokens)}</td>
                        <td className={`${tdCell} pr-0`}>
                          <span className="flex items-center gap-4">
                            <ShareBar value={share} />
                            <span className="w-12 shrink-0 text-right text-[12px] tabular-nums text-slate-500">{share.toFixed(1)}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-[13px] text-slate-500">
            <span>{usageRows.length} nhóm sử dụng</span>
            <span className="flex items-center gap-5">
              <button type="button" className="inline-flex items-center gap-1 hover:text-ink disabled:opacity-40" disabled={usageOffset === 0 || usage.isFetching} onClick={() => setUsageOffset(Math.max(0, usageOffset - PAGE_SIZE))}>
                <ArrowLeft size={13} /> Trang trước
              </button>
              <span className="text-ink">Trang {Math.floor(usageOffset / PAGE_SIZE) + 1}</span>
              <button type="button" className="inline-flex items-center gap-1 hover:text-ink disabled:opacity-40" disabled={usageRows.length < PAGE_SIZE || usage.isFetching} onClick={() => setUsageOffset(usageOffset + PAGE_SIZE)}>
                Trang tiếp <ArrowRight size={13} />
              </button>
            </span>
          </div>
        </section>
      )}
    </main>
  );
}
