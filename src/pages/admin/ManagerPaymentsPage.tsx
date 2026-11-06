import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPaymentTransactions } from '../../services/paymentManagementService';
import { PaymentReportsTab } from './payment/PaymentReportsTab';

export default function ManagerPaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const query = useQuery({ queryKey: ['manager-payments'], queryFn: () => getAdminPaymentTransactions(), refetchInterval: 30_000 });
  const shown = (query.data ?? []).filter((item) =>
    (status === 'ALL' || item.status === status) &&
    [item.orderCode, item.candidateName, item.candidateEmail, item.planName].join(' ').toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="space-y-8">
      <h1 className="text-3xl font-medium">Lịch sử thanh toán</h1>
      <p className="text-sm text-slate-600">Theo dõi tối đa 100 đơn thanh toán mới nhất và xử lý báo cáo sự cố.</p>
      <div className="flex flex-wrap gap-4">
        <input aria-label="Tìm giao dịch" className="rounded-lg border border-border px-3 py-2" placeholder="Mã đơn, người thanh toán, gói…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Trạng thái thanh toán" className="rounded-lg border border-border px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          {[...new Set((query.data ?? []).map((item) => item.status))].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {query.isPending && <p>Đang tải giao dịch…</p>}
      {query.error && <p role="alert" className="text-danger">{query.error.message}</p>}
      {query.isSuccess && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Mã đơn', 'Người thanh toán', 'Gói dịch vụ', 'Số tiền', 'Trạng thái', 'Thời gian'].map((label) => <th key={label} className="border-b border-border p-3">{label}</th>)}</tr></thead><tbody>
        {shown.map((item) => <tr key={item.id}><td className="border-b border-border p-3">{item.orderCode}</td><td className="border-b border-border p-3">{item.candidateName}<span className="block text-xs text-slate-500">{item.candidateEmail}</span></td><td className="border-b border-border p-3">{item.planName}</td><td className="whitespace-nowrap border-b border-border p-3">{item.amountVND.toLocaleString('vi-VN')} đ</td><td className="border-b border-border p-3">{item.status}</td><td className="border-b border-border p-3">{item.createdAt}</td></tr>)}
        {!shown.length && <tr><td colSpan={6} className="p-5 text-slate-500">Không có giao dịch phù hợp.</td></tr>}
      </tbody></table></div>}
      <PaymentReportsTab />
    </main>
  );
}
