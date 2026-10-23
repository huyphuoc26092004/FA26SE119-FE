import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { PaymentTransaction } from '../../../types/subscription';
import { smallPrimary } from '../../../components/admin/AdminKit';
import { METHOD_LABEL } from '../payment/TransactionLedgerTab';

interface TransactionInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
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

export const TransactionInvoiceModal: React.FC<TransactionInvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatPercent = 8;
  const netAmount = Math.round(transaction.finalAmountVND / (1 + vatPercent / 100));
  const vatAmount = transaction.finalAmountVND - netAmount;
  const issuedAt = transaction.completedAt || transaction.createdAt;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col bg-canvas sm:rounded-panel"
      >
        <div className="flex items-center justify-between gap-6 border-b border-border px-6 py-4 print:hidden sm:px-8">
          <p className="text-[13px] text-brand">Hoá đơn điện tử hợp lệ</p>
          <div className="flex items-center gap-x-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 text-ink sm:px-10 print:p-0">
          <header className="grid gap-6 border-b border-ink pb-6 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-xl tracking-[-0.01em]">
                CareerPilot <span className="text-brand">AI</span>
              </p>
              <p className="mt-2 text-[13px]">CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                MST 0318924819 · careerpilot.io
                <br />
                Toà nhà FPT Tower, Lô E2a-7, Đường D1, TP. Thủ Đức, TP. Hồ Chí Minh
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[13px] text-slate-500">Hoá đơn giá trị gia tăng</p>
              <p className="mt-1 text-[clamp(1.5rem,2.6vw,2rem)] leading-none tabular-nums">{transaction.orderCode}</p>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">
                Ký hiệu 1C26TTA · Số 008412
                <br />
                Ngày phát hành {issuedAt}
              </p>
            </div>
          </header>

          <section className="grid gap-6 border-b border-border py-6 text-[13px] leading-6 sm:grid-cols-2">
            <div>
              <p className="text-slate-500">Khách hàng</p>
              <p className="text-[15px]">{transaction.candidateName}</p>
              <p className="text-slate-600">{transaction.candidateEmail}</p>
            </div>
            <div>
              <p className="text-slate-500">Thanh toán</p>
              <p>{METHOD_LABEL[transaction.paymentMethod] ?? transaction.paymentMethod}</p>
              <p className="text-brand">Đã quyết toán</p>
            </div>
          </section>

          <section className="pt-6">
            <div className="hidden grid-cols-[2rem_minmax(0,1fr)_5rem_8rem] gap-x-4 border-b border-border pb-2 text-xs text-slate-500 sm:grid">
              <span>STT</span>
              <span>Dịch vụ</span>
              <span className="text-center">Chu kỳ</span>
              <span className="text-right">Thành tiền</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-border py-3 text-[13px] sm:grid-cols-[2rem_minmax(0,1fr)_5rem_8rem]">
              <span className="hidden text-slate-500 sm:block">1</span>
              <span className="min-w-0">
                <span className="block text-[15px]">Gói dịch vụ AI: {transaction.planName}</span>
                <span className="block text-slate-500">Trợ lý sự nghiệp, phân tích CV chuẩn ATS và đối sánh việc làm</span>
              </span>
              <span className="hidden text-center text-slate-600 sm:block">{transaction.billingCycle === 'yearly' ? '1 năm' : '1 tháng'}</span>
              <span className="text-right tabular-nums">{money(transaction.amountVND)}</span>
            </div>
            {transaction.discountAmountVND > 0 && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-border py-3 text-[13px] sm:grid-cols-[2rem_minmax(0,1fr)_5rem_8rem]">
                <span className="hidden text-slate-500 sm:block">2</span>
                <span className="text-brand sm:col-span-2">Chiết khấu · {transaction.voucherCode || 'Ưu đãi chu kỳ'}</span>
                <span className="text-right tabular-nums text-brand">−{money(transaction.discountAmountVND)}</span>
              </div>
            )}
          </section>

          <section className="grid gap-8 pt-6 sm:grid-cols-[minmax(0,1fr)_16rem]">
            <p className="text-[13px] leading-6 text-slate-600">
              Tra cứu tại <span className="text-ink">hoadon.careerpilot.io</span>
              <br />
              với mã <span className="text-brand">{transaction.orderCode}</span>
            </p>
            <div>
              <Line label="Cộng tiền dịch vụ">{money(netAmount)}</Line>
              <Line label={`Thuế GTGT ${vatPercent}%`}>{money(vatAmount)}</Line>
              <Line label="Tổng thanh toán" strong>
                {money(transaction.finalAmountVND)}
              </Line>
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-ink pt-5 text-[13px]">
            <span className="text-brand">Ký số bởi CareerPilot AI JSC · {issuedAt}</span>
            <span className="font-mono text-xs text-slate-500">SHA-256 8a9f…3c7e</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
