import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Modal, Note, UnderlineTabs, underlineInput } from '../../components/admin/AdminKit';
import { DotStatus, Initials, ManagerHead, PagerRow, SummaryRow, inkLink, tdCell, thCell, vnd } from '../../components/manager/ManagerUi';
import { getManagerPlanCatalog, getManagerSubscription, getManagerSubscriptions } from '../../services/managerService';
import { num, rows, str, type ApiRow } from '../../services/candidateMappers';

type Tab = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED';
const DAY = 86_400_000;

const STATUS: Record<string, { label: string; tone: 'brand' | 'orange' | 'danger' | 'muted' | 'ink' }> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'brand' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'muted' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
};
const statusOf = (value: unknown) => STATUS[str(value).toUpperCase()] ?? { label: str(value) || '—', tone: 'muted' as const };

const daysLeft = (value: unknown) => {
  const time = new Date(str(value)).getTime();
  return Number.isNaN(time) ? null : Math.ceil((time - Date.now()) / DAY);
};
const isExpiring = (row: ApiRow) => {
  const left = daysLeft(row.expires_at);
  return str(row.status).toUpperCase() === 'ACTIVE' && left !== null && left >= 0 && left <= 30;
};
const vnDay = (value: unknown) =>
  new Date(str(value)).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
const vnTime = (value: unknown) =>
  new Date(str(value)).toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
const sameMonth = (value: unknown) => {
  const d = new Date(str(value));
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export default function ManagerSubscribersPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('ALL');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ApiRow | null>(null);

  // Trạng thái lọc phía client để số đếm trên tab luôn đủ; tìm kiếm vẫn gửi lên máy chủ.
  const list = useQuery({ queryKey: ['manager-subscriptions', search, '', offset], queryFn: () => getManagerSubscriptions(search, '', offset) });
  const catalog = useQuery({ queryKey: ['manager-plan-catalog'], queryFn: getManagerPlanCatalog });
  const detail = useQuery({ queryKey: ['manager-subscription', str(selected?.id)], queryFn: () => getManagerSubscription(str(selected?.id)), enabled: !!selected });

  const all = useMemo(() => list.data ?? [], [list.data]);
  const priceOf = useMemo(() => {
    const map = new Map<string, number>();
    for (const plan of (catalog.data ?? []) as ApiRow[]) {
      for (const key of [plan.display_name, plan.tier_code, plan.name]) if (str(key)) map.set(str(key).toLowerCase(), num(plan.price_monthly));
    }
    return (row: ApiRow) => {
      if (row.price_monthly !== undefined && row.price_monthly !== null) return num(row.price_monthly);
      const hit = map.get(str(row.tier_name).toLowerCase()) ?? map.get(str(row.tier_code).toLowerCase());
      return hit ?? null;
    };
  }, [catalog.data]);

  const active = all.filter((r) => str(r.status).toUpperCase() === 'ACTIVE');
  const expiring = all.filter(isExpiring).sort((a, b) => str(a.expires_at).localeCompare(str(b.expires_at)));
  const expired = all.filter((r) => str(r.status).toUpperCase() === 'EXPIRED');
  const cancelled = all.filter((r) => str(r.status).toUpperCase() === 'CANCELLED');
  const endedThisMonth = [...expired, ...cancelled].filter((r) => sameMonth(r.expires_at || r.updated_at)).length;
  const tierCount = active.reduce<Record<string, number>>((acc, r) => {
    const name = str(r.tier_name) || '—';
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const tierNames = Array.from(new Set([...((catalog.data ?? []) as ApiRow[]).filter((p) => num(p.price_monthly) > 0).sort((a, b) => num(b.price_monthly) - num(a.price_monthly)).map((p) => str(p.display_name)).filter(Boolean), ...Object.keys(tierCount)]));
  const recurring = active.reduce((sum, r) => sum + (priceOf(r) ?? 0), 0);

  const shown = { ALL: all, ACTIVE: active, EXPIRING: expiring, EXPIRED: expired, CANCELLED: cancelled }[tab];

  return (
    <main className="space-y-10">
      <ManagerHead
        crumbs={['Quản lý', 'Đăng ký người dùng']}
        title="Gói đăng ký của người dùng"
        aside={
          <Link to="/manager/subscriptions" className={inkLink}>
            Cấu hình gói và hạn mức →
          </Link>
        }
      />

        <SummaryRow
          items={[
            {
              label: 'Đăng ký đang hoạt động',
              value: active.length,
              detail: tierNames.length ? tierNames.map((n) => `${n} ${tierCount[n] ?? 0}`).join(' · ') : 'Chưa có gói',
            },
            { label: 'Doanh thu định kỳ', value: vnd(recurring), detail: 'Mỗi tháng, từ gói trả phí', tone: 'brand' },
            {
              label: 'Hết hạn trong 30 ngày',
              value: expiring.length,
              detail: expiring[0] ? `${str(expiring[0].tier_name)} · ${vnDay(expiring[0].expires_at)}` : 'Không có',
              tone: expiring.length ? 'orange' : 'ink',
            },
            { label: 'Đã hết hạn hoặc hủy', value: endedThisMonth, detail: 'Trong tháng này' },
          ]}
        />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <UnderlineTabs<Tab>
            label="Lọc đăng ký"
            className="min-w-0 flex-1"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'ALL', label: 'Tất cả', count: all.length },
              { value: 'ACTIVE', label: 'Đang hoạt động', count: active.length },
              { value: 'EXPIRING', label: 'Sắp hết hạn', count: expiring.length },
              { value: 'EXPIRED', label: 'Đã hết hạn', count: expired.length },
              { value: 'CANCELLED', label: 'Đã hủy', count: cancelled.length },
            ]}
          />
          <input
            aria-label="Tìm người đăng ký"
            className={`${underlineInput} w-full sm:w-64`}
            placeholder="Tìm theo email hoặc tên"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>

        {list.isPending && <p className="text-sm text-slate-500">Đang tải đăng ký…</p>}
        {list.error && (
          <p role="alert" className="text-sm text-danger">
            {list.error.message}
          </p>
        )}
        {list.data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={thCell}>Người dùng</th>
                  <th className={thCell}>Gói</th>
                  <th className={thCell}>Trạng thái</th>
                  <th className={thCell}>Hết hạn</th>
                  <th className={`${thCell} text-right`}>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((row) => {
                  const status = statusOf(row.status);
                  const price = priceOf(row);
                  const left = daysLeft(row.expires_at);
                  const isActive = str(row.status).toUpperCase() === 'ACTIVE';
                  return (
                    <tr key={str(row.id)}>
                      <td className={tdCell}>
                        <span className="flex items-center gap-3">
                          <Initials name={str(row.full_name) || str(row.email)} />
                          <span className="min-w-0">
                            <span className="block font-medium">{str(row.full_name) || '—'}</span>
                            <span className="block truncate text-[12px] text-slate-500">{str(row.email)}</span>
                          </span>
                        </span>
                      </td>
                      <td className={tdCell}>
                        <span className="block font-medium">{str(row.tier_name) || '—'}</span>
                        {price !== null && <span className="block text-[12px] text-slate-500">{price > 0 ? `${vnd(price)} / tháng` : 'Miễn phí'}</span>}
                      </td>
                      <td className={tdCell}>
                        <DotStatus label={status.label} tone={status.tone} />
                      </td>
                      <td className={tdCell}>
                        {str(row.expires_at) ? (
                          <>
                            <span className="block tabular-nums">
                              {vnDay(row.expires_at)} · {vnTime(row.expires_at)}
                            </span>
                            {isActive && left !== null && left >= 0 && (
                              <span className={`block text-[12px] ${left <= 30 ? 'text-orange-600' : 'text-slate-500'}`}>Còn {left} ngày</span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">Không thời hạn</span>
                        )}
                      </td>
                      <td className={`${tdCell} pr-0 text-right`}>
                        <button type="button" className={inkLink} onClick={() => setSelected(row)}>
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      Không có đăng ký nào trong mục này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <PagerRow summary={`${shown.length} đăng ký`} offset={offset} count={all.length} busy={list.isFetching} onChange={setOffset} />
      </section>

      {selected && (
        <Modal eyebrow="Đăng ký" title={str(selected.full_name) || str(selected.email)} onClose={() => setSelected(null)}>
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-b border-border pb-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[12px] text-slate-500">Email</dt>
                <dd className="mt-1 truncate">{str(selected.email) || '—'}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-slate-500">Gói</dt>
                <dd className="mt-1">{str(selected.tier_name) || '—'}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-slate-500">Trạng thái</dt>
                <dd className="mt-1">
                  <DotStatus {...statusOf(selected.status)} />
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-slate-500">Hết hạn</dt>
                <dd className="mt-1 tabular-nums">{str(selected.expires_at) ? vnDay(selected.expires_at) : '—'}</dd>
              </div>
            </dl>
            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">Hạn mức của đăng ký</h3>
              {detail.isPending && <p className="pt-3 text-sm text-slate-500">Đang tải chi tiết…</p>}
              {detail.error && (
                <p role="alert" className="pt-3 text-sm text-danger">
                  {detail.error.message}
                </p>
              )}
              {detail.data &&
                (rows(detail.data.quotas).length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className={thCell}>Tính năng</th>
                        <th className={thCell}>Giới hạn</th>
                        <th className={thCell}>Chu kỳ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows(detail.data.quotas).map((q) => (
                        <tr key={`${str(q.feature_code)}-${str(q.quota_period)}`}>
                          <td className={`${tdCell} font-mono text-[12px]`}>{str(q.feature_code)}</td>
                          <td className={`${tdCell} tabular-nums`}>{num(q.quota_value).toLocaleString('vi-VN')}</td>
                          <td className={tdCell}>{str(q.quota_period)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="pt-3">
                    <Note>Gói này chưa cấu hình hạn mức.</Note>
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
