import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getManagerPayments, getManagerPayment, getManagerInvoices, getManagerInvoice, safeInvoiceUrl } from '../../services/managerService';
import { num, obj, str, type ApiRow } from '../../services/candidateMappers';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { PaymentReportsTab } from './payment/PaymentReportsTab';

export default function ManagerPaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [paymentOffset, setPaymentOffset] = useState(0);
  const [invoiceOffset, setInvoiceOffset] = useState(0);
  const payments = useQuery({ queryKey: ['manager-payments', search, status, paymentOffset], queryFn: () => getManagerPayments(search, status, paymentOffset), refetchInterval: 30_000 });
  const order = useQuery({ queryKey: ['manager-payment', selectedOrder], queryFn: () => getManagerPayment(selectedOrder), enabled: !!selectedOrder });
  const invoices = useQuery({ queryKey: ['manager-invoices', invoiceOffset], queryFn: () => getManagerInvoices(invoiceOffset), refetchInterval: 30_000 });
  const invoice = useQuery({ queryKey: ['manager-invoice', selectedInvoice], queryFn: () => getManagerInvoice(selectedInvoice), enabled: !!selectedInvoice });
  const money = (row: ApiRow, key: string) => `${num(row[key]).toLocaleString('vi-VN')} ${str(row.currency)}`;
  return <main className="space-y-8"><header><h1 className="text-3xl font-medium">Thanh toán và hóa đơn</h1><p className="mt-3 text-sm text-slate-600">Theo dõi đơn, trạng thái xử lý, hóa đơn và báo cáo sự cố. Chuyển trang để xem các giao dịch cũ hơn.</p></header>
    <div className="flex flex-wrap gap-3"><input aria-label="Tìm đơn thanh toán" className="rounded-lg border border-border px-3 py-2" placeholder="Email hoặc mã đơn…" value={search} onChange={(event) => { setSearch(event.target.value); setPaymentOffset(0); }} />
      <select aria-label="Trạng thái đơn" className="rounded-lg border border-border px-3 py-2" value={status} onChange={(event) => { setStatus(event.target.value); setPaymentOffset(0); }}><option value="">Tất cả trạng thái</option>{['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].map((value) => <option key={value}>{value}</option>)}</select></div>
    {payments.isPending && <p>Đang tải thanh toán…</p>}{payments.error && <p role="alert" className="text-danger">{payments.error.message}</p>}
    {payments.data && <OperationalTable rows={payments.data} onSelect={(row) => setSelectedOrder(str(row.id))} columns={[
      { key: 'id', label: 'Mã đơn' }, { key: 'payer_name', label: 'Người thanh toán' }, { key: 'payer_email', label: 'Email' }, { key: 'order_type', label: 'Loại đơn' },
      { key: 'amount', label: 'Số tiền', render: (row) => money(row, 'amount') }, { key: 'status', label: 'Trạng thái' }, { key: 'created_at', label: 'Ngày tạo', render: (row) => operationalDate(row.created_at) },
    ]} />}
    <OperationalPagination offset={paymentOffset} count={payments.data?.length ?? 0} busy={payments.isFetching} onChange={setPaymentOffset} />
    {selectedOrder && <section className="space-y-3"><h2 className="text-xl font-medium">Chi tiết đơn thanh toán</h2>{order.isPending && <p>Đang tải chi tiết…</p>}{order.error && <p role="alert" className="text-danger">{order.error.message}</p>}
      {order.data && <><dl className="grid gap-3 rounded-xl border border-border p-5 sm:grid-cols-2">{[
        ['Mã đơn', str(order.data.id)], ['Người thanh toán', str(order.data.payer_email)], ['Trạng thái', str(order.data.status)], ['Cổng thanh toán', str(order.data.payment_provider)], ['Số tiền', money(order.data, 'amount')], ['Hoàn tất', operationalDate(order.data.completed_at)],
      ].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm">{value || '—'}</dd></div>)}</dl>
        {Object.keys(obj(order.data.invoice)).length > 0 && <InvoiceDetail row={obj(order.data.invoice)} />}</>}
    </section>}
    <section className="space-y-4"><h2 className="text-xl font-medium">Hóa đơn</h2>{invoices.isPending && <p>Đang tải hóa đơn…</p>}{invoices.error && <p role="alert" className="text-danger">{invoices.error.message}</p>}
      {invoices.data && <OperationalTable rows={invoices.data} onSelect={(row) => setSelectedInvoice(str(row.id))} columns={[
        { key: 'invoice_number', label: 'Số hóa đơn' }, { key: 'payer_email', label: 'Người nhận' }, { key: 'total_amount', label: 'Tổng tiền', render: (row) => money(row, 'total_amount') }, { key: 'status', label: 'Trạng thái' }, { key: 'issued_at', label: 'Phát hành', render: (row) => operationalDate(row.issued_at) },
      ]} />}
      <OperationalPagination offset={invoiceOffset} count={invoices.data?.length ?? 0} busy={invoices.isFetching} onChange={setInvoiceOffset} />
      {invoice.isPending && selectedInvoice && <p>Đang tải chi tiết hóa đơn…</p>}{invoice.error && <p role="alert" className="text-danger">{invoice.error.message}</p>}{invoice.data && <InvoiceDetail row={invoice.data} />}
    </section>
    <PaymentReportsTab />
  </main>;
}

function InvoiceDetail({ row }: { row: ApiRow }) {
  const url = safeInvoiceUrl(row.invoice_url);
  return <section className="space-y-4 rounded-xl border border-border p-5"><h3 className="font-medium">Hóa đơn {str(row.invoice_number)}</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{[
    ['Trạng thái', str(row.status)], ['Người nhận', str(row.payer_email)], ['Trước thuế', `${num(row.subtotal).toLocaleString('vi-VN')} ${str(row.currency)}`], ['Thuế', `${num(row.tax_amount).toLocaleString('vi-VN')} ${str(row.currency)}`], ['Tổng tiền', `${num(row.total_amount).toLocaleString('vi-VN')} ${str(row.currency)}`], ['Ngày phát hành', operationalDate(row.issued_at)],
  ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1">{value || '—'}</dd></div>)}</dl>
    {url ? <a className="inline-block text-sm text-brand underline" href={url} target="_blank" rel="noopener noreferrer">Mở hóa đơn</a> : <p className="text-sm text-slate-500">Chưa có liên kết hóa đơn để mở.</p>}
  </section>;
}
