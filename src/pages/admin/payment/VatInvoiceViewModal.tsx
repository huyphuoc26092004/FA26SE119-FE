import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { VatInvoiceItem } from '../../../types/paymentManagement';
import { brandLink, dangerLink, smallPrimary } from '../../../components/admin/AdminKit';

interface VatInvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VatInvoiceItem | null;
  onSendEmail?: (invoiceId: string) => Promise<void>;
  onCancelInvoice?: (invoice: VatInvoiceItem) => void;
}

const money = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

function Line({ label, children, strong }: { label: React.ReactNode; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-2.5 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right tabular-nums ${strong ? 'text-[15px] font-medium text-ink' : 'text-ink'}`}>{children}</span>
    </div>
  );
}

export const VatInvoiceViewModal: React.FC<VatInvoiceViewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSendEmail,
  onCancelInvoice,
}) => {
  const [isSending, setIsSending] = React.useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setIsSending(true);
    try {
      await onSendEmail(invoice.id);
      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const isCancelled = invoice.status === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col bg-canvas sm:rounded-panel"
      >
        {/* Toolbar (hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-6 py-4 print:hidden sm:px-8">
          <p className={`text-[13px] ${isCancelled ? 'text-danger' : 'text-brand'}`}>
            {isCancelled ? 'Hoá đơn đã huỷ' : 'Hoá đơn điện tử hợp lệ · NĐ 123/2020/NĐ-CP'}
            {emailSentSuccess && <span className="ml-3 text-ink">Đã gửi email cho khách.</span>}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {!isCancelled && onSendEmail && (
              <button type="button" onClick={handleSendEmail} disabled={isSending} className={`${brandLink} text-[13px]`}>
                {isSending ? 'Đang gửi…' : 'Gửi lại email'}
              </button>
            )}
            {!isCancelled && onCancelInvoice && (
              <button type="button" onClick={() => onCancelInvoice(invoice)} className={`${dangerLink} text-[13px]`}>
                Huỷ hoá đơn
              </button>
            )}
            <button type="button" onClick={handlePrint} className={smallPrimary}>
              In hoá đơn
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable sheet */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 text-ink sm:px-10 print:p-0">
          {isCancelled && (
            <div className="mb-8 border-l-2 border-danger py-1 pl-4 text-[13px] leading-6">
              <p className="text-danger">Hoá đơn đã bị huỷ / thu hồi</p>
              <p className="text-slate-600">
                Lý do: {invoice.cancelledReason || 'Điều chỉnh giao dịch hoặc hoàn tiền dịch vụ theo yêu cầu.'}
              </p>
            </div>
          )}

          {/* Seller + invoice number */}
          <header className="grid gap-6 border-b border-ink pb-6 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-xl tracking-[-0.01em]">
                CareerPilot <span className="text-brand">AI</span>
              </p>
              <p className="mt-2 text-[13px] text-ink">CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                MST 0318924819
                <br />
                Toà nhà FPT Tower, Lô E2a-7, Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh
                <br />
                (+84) 28 7300 8899 · careerpilot.io
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[13px] text-slate-500">Hoá đơn giá trị gia tăng</p>
              <p className={`mt-1 text-[clamp(1.75rem,3vw,2.25rem)] leading-none tabular-nums ${isCancelled ? 'text-slate-400 line-through' : ''}`}>
                Số {invoice.invoiceNumber}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">
                Ký hiệu {invoice.invoiceSeries}
                <br />
                Mã tra cứu {invoice.lookupCode}
                <br />
                Ngày phát hành {invoice.issuedAt}
              </p>
            </div>
          </header>

          {/* Buyer */}
          <section className="grid gap-6 border-b border-border py-6 text-[13px] leading-6 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Người mua</p>
              <p className="text-[15px] text-ink">{invoice.customerName}</p>
              {invoice.customerCompany && <p>{invoice.customerCompany}</p>}
              {invoice.customerTaxCode && <p className="text-slate-600">MST {invoice.customerTaxCode}</p>}
            </div>
            <div>
              <p className="text-slate-500">Liên hệ & thanh toán</p>
              <p>{invoice.customerEmail}</p>
              {invoice.customerPhone && <p className="text-slate-600">{invoice.customerPhone}</p>}
              {invoice.customerAddress && <p className="text-slate-600">{invoice.customerAddress}</p>}
              <p className="text-slate-600">
                {invoice.paymentMethod}
                {invoice.orderCode && ` · Đơn ${invoice.orderCode}`}
              </p>
            </div>
          </section>

          {/* Line item */}
          <section className="pt-6">
            <div className="hidden grid-cols-[2rem_minmax(0,1fr)_4rem_4rem_8rem] gap-x-4 border-b border-border pb-2 text-xs text-slate-500 sm:grid">
              <span>STT</span>
              <span>Hàng hoá, dịch vụ</span>
              <span className="text-center">ĐVT</span>
              <span className="text-center">SL</span>
              <span className="text-right">Thành tiền</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-border py-3 text-[13px] sm:grid-cols-[2rem_minmax(0,1fr)_4rem_4rem_8rem]">
              <span className="hidden text-slate-500 sm:block">1</span>
              <span className="min-w-0">
                <span className="block text-[15px]">{invoice.itemName}</span>
                {invoice.itemDescription && <span className="block text-slate-500">{invoice.itemDescription}</span>}
                <span className="block text-slate-500 sm:hidden">1 gói</span>
              </span>
              <span className="hidden text-center text-slate-600 sm:block">Gói</span>
              <span className="hidden text-center text-slate-600 sm:block">1</span>
              <span className="text-right tabular-nums">{money(invoice.subtotalVND)}</span>
            </div>
          </section>

          {/* Totals + lookup */}
          <section className="grid gap-8 pt-6 sm:grid-cols-[minmax(0,1fr)_18rem]">
            <p className="text-[13px] leading-6 text-slate-600">
              Tra cứu hoá đơn tại <span className="text-ink">hoadon.careerpilot.io</span>
              <br />
              Mã tra cứu <span className="text-brand">{invoice.lookupCode}</span>
            </p>
            <div>
              <Line label="Cộng tiền dịch vụ">{money(invoice.subtotalVND)}</Line>
              <Line label={`Thuế GTGT ${invoice.vatRatePercent}%`}>{money(invoice.vatAmountVND)}</Line>
              <Line label="Tổng thanh toán" strong>
                {money(invoice.totalAmountVND)}
              </Line>
              <p className="mt-2 text-right text-xs text-slate-500">Đã gồm thuế GTGT theo NĐ 123/2020/NĐ-CP</p>
            </div>
          </section>

          {/* Signatures */}
          <section className="mt-10 grid gap-6 border-t border-ink pt-6 text-[13px] leading-6 sm:grid-cols-2">
            <div className="text-slate-600">
              <p className="text-ink">Người mua hàng</p>
              <p>Ký, ghi rõ họ tên (hoặc xác thực điện tử)</p>
              <p className="mt-3 text-slate-500">Đã thanh toán trực tuyến qua {invoice.paymentMethod.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-brand">Chữ ký số hợp lệ</p>
              <p>Ký bởi {invoice.signedBy}</p>
              <p className="text-slate-600">Thời gian ký {invoice.issuedAt}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{invoice.digitalSignatureHash}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
