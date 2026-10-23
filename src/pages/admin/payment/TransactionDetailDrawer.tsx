import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';
import { InfoRow, SubHead, dangerLink, primaryButton, textLink } from '../../../components/admin/AdminKit';
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, paymentStatusTone, transactionTitle } from './TransactionLedgerTab';

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdminPaymentTransaction | null;
  onApprove?: (orderId: string) => Promise<void>;
  onOpenRefund?: (transaction: AdminPaymentTransaction) => void;
  onViewInvoice?: (transaction: AdminPaymentTransaction) => void;
}

const TYPE_LABEL: Record<string, string> = {
  TOKEN_TOPUP: 'Nạp token',
  ENTERPRISE_CONTRACT: 'Hợp đồng doanh nghiệp',
  SUBSCRIPTION_RENEW: 'Gia hạn gói',
  SUBSCRIPTION_NEW: 'Đăng ký gói mới',
};

const money = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  isOpen,
  onClose,
  transaction,
  onApprove,
  onOpenRefund,
  onViewInvoice,
}) => {
  const [isApproving, setIsApproving] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove(transaction.id);
    } finally {
      setIsApproving(false);
    }
  };

  const tx = transaction;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-xl flex-col bg-canvas"
      >
        {/* Header */}
        <div className="border-b border-ink px-6 pb-5 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <p className="text-[13px] text-brand">
              {TYPE_LABEL[tx.transactionType] ?? tx.transactionType} · {tx.orderCode}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mr-2 -mt-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
          <h3 className="mt-3 text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-tight tracking-[-0.02em] text-ink">
            {transactionTitle(tx)}.
            <span className="block tabular-nums text-brand">{money(tx.finalAmountVND)}</span>
          </h3>
          <p className="mt-3 text-[13px] text-slate-600">
            <span className={paymentStatusTone(tx.status)}>{PAYMENT_STATUS_LABEL[tx.status] ?? tx.status}</span>
            {' · '}
            {tx.candidateName} · {tx.createdAt}
          </p>
          {tx.status === 'pending' && onApprove && (
            <button type="button" onClick={handleApprove} disabled={isApproving} className={`${primaryButton} mt-5`}>
              {isApproving ? 'Đang duyệt…' : 'Duyệt đơn & xuất hoá đơn'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-9 overflow-y-auto px-6 py-7 sm:px-8">
          {tx.status === 'refunded' && (
            <div className="border-l-2 border-danger py-1 pl-4 text-[13px] leading-6">
              <p className="text-danger">Đã hoàn tiền lúc {tx.refundedAt}</p>
              <p className="text-slate-600">Lý do: {tx.refundReason}</p>
            </div>
          )}

          <section>
            <SubHead title="01  Khách hàng" />
            <dl>
              <InfoRow label="Họ và tên">{tx.candidateName}</InfoRow>
              <InfoRow label="Email">{tx.candidateEmail}</InfoRow>
              {tx.candidatePhone && <InfoRow label="Số điện thoại">{tx.candidatePhone}</InfoRow>}
              {tx.customerCompany && <InfoRow label="Doanh nghiệp">{tx.customerCompany}</InfoRow>}
              {tx.customerTaxCode && <InfoRow label="Mã số thuế">{tx.customerTaxCode}</InfoRow>}
            </dl>
          </section>

          <section>
            <SubHead title="02  Gói & chi phí" />
            <dl>
              <InfoRow label="Gói / sản phẩm">{tx.planName}</InfoRow>
              <InfoRow label="Chu kỳ">{tx.billingCycle === 'yearly' ? 'Hàng năm (12 tháng)' : 'Hàng tháng'}</InfoRow>
              <InfoRow label="Giá niêm yết">{money(tx.amountVND)}</InfoRow>
              {tx.discountAmountVND > 0 && (
                <InfoRow label={`Khuyến mại${tx.voucherCode ? ` · ${tx.voucherCode}` : ''}`} tone="brand">
                  −{money(tx.discountAmountVND)}
                </InfoRow>
              )}
              <InfoRow label="Thực thu (gồm 8% VAT)">
                <span className="text-[17px] tabular-nums">{money(tx.finalAmountVND)}</span>
              </InfoRow>
            </dl>
          </section>

          <section>
            <SubHead title="03  Cổng thanh toán" />
            <dl>
              <InfoRow label="Cổng">{METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod}</InfoRow>
              {tx.gatewayRefId && <InfoRow label="Mã đối tác">{tx.gatewayRefId}</InfoRow>}
              {tx.bankAccountRef && <InfoRow label="Tài khoản thụ hưởng">{tx.bankAccountRef}</InfoRow>}
              <InfoRow label="Tạo đơn">{tx.createdAt}</InfoRow>
              {tx.completedAt && <InfoRow label="Quyết toán">{tx.completedAt}</InfoRow>}
              {tx.ipAddress && <InfoRow label="IP người mua">{tx.ipAddress}</InfoRow>}
            </dl>
          </section>

          <section>
            <SubHead
              title="04  Hoá đơn VAT"
              action={
                tx.vatInvoiceNumber && onViewInvoice ? (
                  <button type="button" onClick={() => onViewInvoice(tx)} className={`${textLink} text-[13px]`}>
                    Xem & in
                  </button>
                ) : undefined
              }
            />
            {tx.vatInvoiceNumber ? (
              <dl>
                <InfoRow label="Số hoá đơn">{tx.vatInvoiceNumber}</InfoRow>
                <InfoRow label="Trạng thái">{tx.vatInvoiceStatus || 'Đã phát hành'}</InfoRow>
              </dl>
            ) : (
              <p className="border-b border-border py-3.5 text-[13px] text-slate-500">
                Chưa có hoá đơn. Hệ thống tự xuất khi giao dịch thành công.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-6 border-t border-border px-6 py-4 sm:px-8">
          <span>
            {tx.status === 'success' && onOpenRefund && (
              <button type="button" onClick={() => onOpenRefund(tx)} className={dangerLink}>
                Hoàn tiền giao dịch
              </button>
            )}
          </span>
          <button type="button" onClick={onClose} className={`${textLink} text-slate-600`}>
            Đóng
          </button>
        </div>
      </aside>
    </div>
  );
};
