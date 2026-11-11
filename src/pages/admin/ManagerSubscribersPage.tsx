import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { getManagerSubscriptions, getManagerSubscription } from '../../services/managerService';
import { rows, str } from '../../services/candidateMappers';

export default function ManagerSubscribersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState('');
  const [offset, setOffset] = useState(0);
  const list = useQuery({ queryKey: ['manager-subscriptions', search, status, offset], queryFn: () => getManagerSubscriptions(search, status, offset) });
  const detail = useQuery({ queryKey: ['manager-subscription', selected], queryFn: () => getManagerSubscription(selected), enabled: !!selected });
  return <main className="space-y-6"><h1 className="text-3xl font-medium">Gói đăng ký của người dùng</h1>
    <Link to="/manager/subscriptions" className="text-brand underline">Cấu hình gói và hạn mức</Link>
    <div className="flex flex-wrap gap-3"><input aria-label="Tìm người đăng ký" className="rounded-lg border border-border px-3 py-2" placeholder="Email hoặc tên…" value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} />
      <select aria-label="Trạng thái đăng ký" className="rounded-lg border border-border px-3 py-2" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="">Tất cả trạng thái</option>{['ACTIVE', 'EXPIRED', 'CANCELLED'].map((value) => <option key={value}>{value}</option>)}</select></div>
    {list.isPending && <p>Đang tải đăng ký…</p>}{list.error && <p role="alert" className="text-danger">{list.error.message}</p>}
    {list.data && <OperationalTable rows={list.data} onSelect={(row) => setSelected(str(row.id))} columns={[
      { key: 'full_name', label: 'Người dùng' }, { key: 'email', label: 'Email' }, { key: 'tier_name', label: 'Gói' }, { key: 'status', label: 'Trạng thái' },
      { key: 'expires_at', label: 'Hết hạn', render: (row) => operationalDate(row.expires_at) },
    ]} />}
    <OperationalPagination offset={offset} count={list.data?.length ?? 0} busy={list.isFetching} onChange={setOffset} />
    {selected && <section className="space-y-3"><h2 className="text-xl font-medium">Hạn mức của đăng ký</h2>{detail.isPending && <p>Đang tải chi tiết…</p>}{detail.error && <p role="alert" className="text-danger">{detail.error.message}</p>}
      {detail.data && <OperationalTable rows={rows(detail.data.quotas)} columns={[{ key: 'feature_code', label: 'Tính năng' }, { key: 'quota_value', label: 'Giới hạn' }, { key: 'quota_period', label: 'Chu kỳ' }]} />}
    </section>}
  </main>;
}
