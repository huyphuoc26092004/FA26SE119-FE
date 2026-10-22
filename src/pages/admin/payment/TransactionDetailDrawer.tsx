import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Receipt,
  User,
  CreditCard,
  Check,
  ExternalLink,
  Tag,
} from 'lucide-react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdminPaymentTransaction | null;
  onApprove?: (orderId: string) => Promise<void>;
  onOpenRefund?: (transaction: AdminPaymentTransaction) => void;
  onViewInvoice?: (transaction: AdminPaymentTransaction) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  isOpen,
  onClose,
  transaction,
  onApprove,
  onOpenRefund,
  onViewInvoice,
}) => {
  const [isApproving, setIsApproving] = React.useState(false);

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

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            Đã thanh toán thành công
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} className="animate-spin" />
            Đang chờ duyệt chuyển khoản
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw size={13} />
            Đã hoàn tiền
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle size={13} />
            Thanh toán thất bại / Hết hạn
          </span>
        );
    }
  };

  const getTypeBadge = () => {
    switch (transaction.transactionType) {
      case 'TOKEN_TOPUP':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            Nạp Token AI
          </span>
        );
      case 'ENTERPRISE_CONTRACT':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            Hợp đồng Doanh nghiệp
          </span>
        );
      case 'SUBSCRIPTION_RENEW':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            Gia hạn gói cước
          </span>
        );
      case 'SUBSCRIPTION_NEW':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
            Đăng ký gói mới
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 animate-fade-in">
      <div className="relative w-full max-w-xl h-full bg-surface shadow-sm flex flex-col overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold text-slate-900">
                {transaction.orderCode}
              </span>
              {getTypeBadge()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã giao dịch nội bộ: <span className="font-mono">{transaction.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Quick Action Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-medium text-slate-400 block mb-1">
                Trạng thái giao dịch
              </span>
              {getStatusBadge()}
            </div>
            {transaction.status === 'pending' && onApprove && (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isApproving ? 'Đang duyệt...' : '1-Click Duyệt đơn & Xuất HĐ'}</span>
              </button>
            )}
          </div>

          {/* Refund Notice if refunded */}
          {transaction.status === 'refunded' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-rose-900">
                <RotateCcw size={14} />
                <span>ĐÃ HOÀN TIỀN VÀO {transaction.refundedAt}</span>
              </div>
              <p className="text-rose-700">Lý do hoàn: {transaction.refundReason}</p>
            </div>
          )}

          {/* Customer / Candidate Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-brand-600" />
              Thông tin khách hàng & Pháp nhân
            </h4>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-medium text-slate-900">{transaction.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{transaction.candidateEmail}</span>
              </div>
              {transaction.candidatePhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-medium text-slate-800">{transaction.candidatePhone}</span>
                </div>
              )}
              {transaction.customerCompany && (
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Doanh nghiệp:</span>
                  <span className="font-medium text-slate-900">{transaction.customerCompany}</span>
                </div>
              )}
              {transaction.customerTaxCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã số thuế (MST):</span>
                  <span className="font-mono font-medium text-brand-700">{transaction.customerTaxCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Purchased Service / Plan */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-brand-600" />
              Gói dịch vụ & Chi phí thanh toán
            </h4>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tên gói / Sản phẩm:</span>
                <span className="font-medium text-slate-900">{transaction.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chu kỳ thanh toán:</span>
                <span className="font-medium text-slate-800">
                  {transaction.billingCycle === 'yearly' ? 'Hàng năm (12 Tháng)' : 'Hàng tháng'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Giá niêm yết (Gộp):</span>
                <span className="font-medium text-slate-700">
                  {transaction.amountVND.toLocaleString('vi-VN')} đ
                </span>
              </div>
              {transaction.discountAmountVND > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Khuyến mại ({transaction.voucherCode || 'Ưu đãi chu kỳ'}):</span>
                  <span className="font-medium">
                    -{transaction.discountAmountVND.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-semibold text-brand-700">
                <span>Số tiền thực thu (Đã gồm 8% VAT):</span>
                <span>{transaction.finalAmountVND.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway & Technical Audit */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={14} className="text-brand-600" />
              Thông tin kỹ thuật cổng thanh toán
            </h4>
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cổng thanh toán:</span>
                <span className="font-medium uppercase text-slate-900">{transaction.paymentMethod}</span>
              </div>
              {transaction.gatewayRefId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã giao dịch đối tác (Gateway Ref):</span>
                  <span className="font-mono text-slate-800 font-medium">{transaction.gatewayRefId}</span>
                </div>
              )}
              {transaction.bankAccountRef && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tài khoản ngân hàng thụ hưởng:</span>
                  <span className="font-medium text-slate-800">{transaction.bankAccountRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian tạo đơn:</span>
                <span className="text-slate-800">{transaction.createdAt}</span>
              </div>
              {transaction.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian quyết toán thành công:</span>
                  <span className="text-slate-800 font-medium">{transaction.completedAt}</span>
                </div>
              )}
              {transaction.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa chỉ IP người mua:</span>
                  <span className="font-mono text-slate-600">{transaction.ipAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* VAT Electronic Invoice Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt size={14} className="text-brand-600" />
              Hóa đơn điện tử GTGT (e-VAT)
            </h4>
            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 text-xs">
              {transaction.vatInvoiceNumber ? (
                <div>
                  <p className="font-medium text-slate-900">
                    Số HĐ: <span className="text-brand-700 font-mono">{transaction.vatInvoiceNumber}</span>
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Trạng thái: <strong>{transaction.vatInvoiceStatus || 'Đã phát hành'}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-500">Chưa liên kết hóa đơn điện tử</p>
                  <p className="text-[11px] text-slate-400">Sẽ tự động xuất khi đơn chuyển sang thành công</p>
                </div>
              )}

              {transaction.vatInvoiceNumber && onViewInvoice && (
                <button
                  onClick={() => onViewInvoice(transaction)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 text-slate-700 font-semibold transition flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <ExternalLink size={13} />
                  <span>Xem & In HĐ</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            {transaction.status === 'success' && onOpenRefund && (
              <button
                onClick={() => onOpenRefund(transaction)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Hoàn tiền giao dịch</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 bg-surface border border-slate-200 hover:bg-slate-100 transition"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
