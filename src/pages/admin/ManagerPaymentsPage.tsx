import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getManagerPayments, getManagerPayment, getManagerInvoices, getManagerInvoice, safeInvoiceUrl } from '../../services/managerService';
import { num, obj, str, type ApiRow } from '../../services/candidateMappers';
import { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { InfoRow, Modal, Note, SectionHead, brandLink, underlineInput, underlineSelect } from '../../components/admin/AdminKit';
import { PaymentReportsTab } from './payment/PaymentReportsTab';
import { TimeTag } from '../../components/ui/Tag';

const STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Đang chờ', tone: 'text-orange-600' },
  COMPLETED: { label: 'Đã thanh toán', tone: 'text-brand' },
  PAID: { label: 'Đã thanh toán', tone: 'text-brand' },
  ISSUED: { label: 'Đã phát hành', tone: 'text-brand' },
  FAILED: { label: 'Thất bại', tone: 'text-danger' },
  CANCELLED: { label: 'Đã huỷ', tone: 'text-slate-500' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'text-slate-500' },
  VOID: { label: 'Đã huỷ', tone: 'text-slate-500' },
};

const ORDER_TYPE: Record<string, string> = {
  CONSULTATION: 'Tư vấn',
  SUBSCRIPTION: 'Gói dịch vụ',
  TOKEN_TOPUP: 'Nạp token',
  TOPUP: 'Nạp token',
};

const ORDER_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'];

const money = (row: ApiRow, key: string) => `${num(row[key]).toLocaleString('vi-VN')} ${str(row.currency) || 'VND'}`;
const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8).toUpperCase()}…` : id || '—');

function Status({ value }: { value: unknown }) {
  const key = str(value).toUpperCase();
  const info = STATUS[key];
  return <span className={info?.tone ?? 'text-slate-600'}>{info?.label ?? (key || '—')}</span>;
}

type Column = { label: string; align?: 'right'; render: (row: ApiRow) => ReactNode };

/** Bảng kiểu đường kẻ: dòng tiêu đề kẻ đậm, các dòng kẻ mảnh, bấm cả dòng để xem chi tiết. */
function LineTable({ rows, columns, onOpen, empty }: { rows: ApiRow[]; columns: Column[]; onOpen: (row: ApiRow) => void; empty: string }) {
  if (!rows.length) return <p className="border-b border-border py-8 text-center text-[13px] text-slate-500">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink text-[13px] text-slate-500">
            {columns.map((c) => (
              <th key={c.label} className={`py-2.5 pr-5 font-normal ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
            <th className="py-2.5 font-normal" aria-label="Chi tiết" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={str(row.id) || i} onClick={() => onOpen(row)} className="cursor-pointer border-b border-border align-top transition-colors hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.label} className={`py-3.5 pr-5 text-ink ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                  {c.render(row)}
                </td>
              ))}
              <td className="py-3.5 text-right">
                <span className={brandLink}>Xem</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  return (
    <main className="space-y-12 pb-10">
      <header>
        <h1 className="text-3xl font-medium text-ink">Thanh toán và hóa đơn</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Theo dõi đơn, trạng thái xử lý, hóa đơn và báo cáo sự cố. Chuyển trang để xem các giao dịch cũ hơn.
        </p>
      </header>

      {/* 01 · Đơn thanh toán */}
      <section className="space-y-5">
        <SectionHead index="01" title="Đơn thanh toán" meta={payments.data ? `${payments.data.length} đơn trên trang này` : undefined} />
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,22rem)_minmax(0,14rem)]">
          <input
            aria-label="Tìm đơn thanh toán"
            className={underlineInput}
            placeholder="Tìm theo email hoặc mã đơn…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPaymentOffset(0);
            }}
          />
          <select
            aria-label="Trạng thái đơn"
            className={underlineSelect}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPaymentOffset(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS[value]?.label ?? value}
              </option>
            ))}
          </select>
        </div>
        {payments.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải thanh toán…</p>}
        {payments.error && <Note tone="danger">{payments.error.message}</Note>}
        {payments.data && (
          <LineTable
            rows={payments.data}
            onOpen={(row) => setSelectedOrder(str(row.id))}
            empty="Không có đơn thanh toán phù hợp."
            columns={[
              { label: 'Mã đơn', render: (row) => <span className="font-mono text-[13px] text-slate-600" title={str(row.id)}>{shortId(str(row.id))}</span> },
              {
                label: 'Người thanh toán',
                render: (row) => (
                  <>
                    <span className="block">{str(row.payer_name) || '—'}</span>
                    <span className="block text-[13px] text-slate-500">{str(row.payer_email)}</span>
                  </>
                ),
              },
              { label: 'Loại đơn', render: (row) => ORDER_TYPE[str(row.order_type)] ?? (str(row.order_type) || '—') },
              { label: 'Số tiền', align: 'right', render: (row) => money(row, 'amount') },
              { label: 'Trạng thái', render: (row) => <Status value={row.status} /> },
              { label: 'Ngày tạo', render: (row) => <TimeTag icon="calendar" tone="muted">{operationalDate(row.created_at)}</TimeTag> },
            ]}
          />
        )}
        <OperationalPagination offset={paymentOffset} count={payments.data?.length ?? 0} busy={payments.isFetching} onChange={setPaymentOffset} />
      </section>

      {/* 02 · Hóa đơn */}
      <section className="space-y-5">
        <SectionHead index="02" title="Hóa đơn" meta={invoices.data ? `${invoices.data.length} hóa đơn trên trang này` : undefined} />
        {invoices.isPending && <p className="py-6 text-[13px] text-slate-500">Đang tải hóa đơn…</p>}
        {invoices.error && <Note tone="danger">{invoices.error.message}</Note>}
        {invoices.data && (
          <LineTable
            rows={invoices.data}
            onOpen={(row) => setSelectedInvoice(str(row.id))}
            empty="Chưa có hóa đơn nào."
            columns={[
              { label: 'Số hóa đơn', render: (row) => <span className="font-mono text-[13px]">{str(row.invoice_number) || '—'}</span> },
              { label: 'Người nhận', render: (row) => str(row.payer_email) || '—' },
              { label: 'Tổng tiền', align: 'right', render: (row) => money(row, 'total_amount') },
              { label: 'Trạng thái', render: (row) => <Status value={row.status} /> },
              { label: 'Phát hành', render: (row) => <TimeTag icon="calendar" tone="muted">{operationalDate(row.issued_at)}</TimeTag> },
            ]}
          />
        )}
        <OperationalPagination offset={invoiceOffset} count={invoices.data?.length ?? 0} busy={invoices.isFetching} onChange={setInvoiceOffset} />
      </section>

      {/* 03 · Báo cáo sự cố */}
      <section className="space-y-5">
        <SectionHead index="03" title="Báo cáo sự cố thanh toán" />
        <PaymentReportsTab />
      </section>

      {selectedOrder && (
        <Modal eyebrow="Đơn thanh toán" title={shortId(selectedOrder)} width="max-w-3xl" onClose={() => setSelectedOrder('')}>
          {order.isPending && <p className="text-[13px] text-slate-500">Đang tải chi tiết…</p>}
          {order.error && <Note tone="danger">{order.error.message}</Note>}
          {order.data && (
            <div className="space-y-8">
              <dl>
                <InfoRow label="Mã đơn">
                  <span className="break-all font-mono text-[13px]">{str(order.data.id)}</span>
                </InfoRow>
                <InfoRow label="Người thanh toán">{str(order.data.payer_email) || '—'}</InfoRow>
                <InfoRow label="Trạng thái">
                  <Status value={order.data.status} />
                </InfoRow>
                <InfoRow label="Cổng thanh toán">{str(order.data.payment_provider) || '—'}</InfoRow>
                <InfoRow label="Số tiền">{money(order.data, 'amount')}</InfoRow>
                <InfoRow label="Hoàn tất">{operationalDate(order.data.completed_at)}</InfoRow>
              </dl>
              {Object.keys(obj(order.data.invoice)).length > 0 && <InvoiceDetail row={obj(order.data.invoice)} />}
            </div>
          )}
        </Modal>
      )}

      {selectedInvoice && (
        <Modal eyebrow="Hóa đơn" title={str(invoice.data?.invoice_number) || 'Chi tiết hóa đơn'} width="max-w-3xl" onClose={() => setSelectedInvoice('')}>
          {invoice.isPending && <p className="text-[13px] text-slate-500">Đang tải chi tiết hóa đơn…</p>}
          {invoice.error && <Note tone="danger">{invoice.error.message}</Note>}
          {invoice.data && <InvoiceDetail row={invoice.data} bare />}
        </Modal>
      )}
    </main>
  );
}

function InvoiceDetail({ row, bare = false }: { row: ApiRow; bare?: boolean }) {
  const url = safeInvoiceUrl(row.invoice_url);
  const amount = (key: string) => `${num(row[key]).toLocaleString('vi-VN')} ${str(row.currency) || 'VND'}`;
  return (
    <section className="space-y-4">
      {!bare && <h4 className="text-[15px] font-medium text-ink">Hóa đơn {str(row.invoice_number)}</h4>}
      <dl className="border-t border-border">
        <InfoRow label="Trạng thái">
          <Status value={row.status} />
        </InfoRow>
        <InfoRow label="Người nhận">{str(row.payer_email) || '—'}</InfoRow>
        <InfoRow label="Trước thuế">{amount('subtotal')}</InfoRow>
        <InfoRow label="Thuế">{amount('tax_amount')}</InfoRow>
        <InfoRow label="Tổng tiền">{amount('total_amount')}</InfoRow>
        <InfoRow label="Ngày phát hành">{operationalDate(row.issued_at)}</InfoRow>
      </dl>
      {url ? (
        <a className={brandLink} href={url} target="_blank" rel="noopener noreferrer">
          Mở hóa đơn
        </a>
      ) : (
        <p className="text-[13px] text-slate-500">Chưa có liên kết hóa đơn để mở.</p>
      )}
    </section>
  );
}
