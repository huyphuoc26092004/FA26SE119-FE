import React from 'react';
import {
  X,
  Printer,
} from 'lucide-react';
import type { PaymentTransaction } from '../../../types/domain';
import { useTranslation } from '../../../i18n';

interface InvoiceReceiptModalProps {
  transaction: PaymentTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { isVietnamese, t } = useTranslation();

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'vietqr':
        return 'Chuyển khoản VietQR';
      case 'momo':
        return 'Ví điện tử MoMo';
      case 'vnpay':
        return 'Cổng VNPAY-QR';
      case 'credit_card':
        return 'Thẻ Quốc tế (Visa/Master)';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 animate-fade-in overflow-y-auto print:p-0 print:bg-surface">
      <div className="relative w-full max-w-2xl my-8 bg-surface dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col print:border-none print:shadow-none">
        {/* Top bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {t.subscriptionPage.viewInvoice}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {transaction.orderCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>{isVietnamese ? 'In hóa đơn' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 space-y-6 text-neutral-900 dark:text-neutral-100 bg-surface dark:bg-neutral-900">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-medium text-xs">
                  CP
                </div>
                <h3 className="text-lg font-semibold tracking-tight">CAREERPILOT AI JSC</h3>
              </div>
              <p className="text-xs text-neutral-500">Mã số thuế: 0317894562</p>
              <p className="text-xs text-neutral-500">Tòa nhà Innovation Hub, Phố Duy Tân, Cầu Giấy, Hà Nội</p>
              <p className="text-xs text-neutral-500">Hotline: 1900 6868 · billing@careerpilot.ai</p>
            </div>

            {/* Stamp / Status */}
            <div className="text-right flex flex-col items-end">
              <span className="px-3.5 py-1 text-xs font-semibold tracking-widest text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md rotate-[-3deg] uppercase shadow-sm">
                {t.subscriptionPage.invoicePaidBadge}
              </span>
              <p className="mt-2 text-xs font-mono text-neutral-500">HDDT-{transaction.orderCode}</p>
              <p className="text-[11px] text-neutral-400">
                {transaction.completedAt || transaction.createdAt}
              </p>
            </div>
          </div>

          {/* Customer & Transaction Info */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">
                {t.subscriptionPage.customerInfo}
              </span>
              <div className="font-semibold text-sm">{transaction.candidateName}</div>
              <div className="text-neutral-500">{transaction.candidateEmail}</div>
              <div className="text-neutral-500">Mã KH: CAND-{transaction.id.slice(-6).toUpperCase()}</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">
                Chi tiết thanh toán
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t.subscriptionPage.orderCode}:</span>
                <span className="font-mono font-medium">{transaction.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t.subscriptionPage.paymentMethod}:</span>
                <span className="font-medium">{getMethodLabel(transaction.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t.subscriptionPage.status}:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {transaction.status === 'success' ? 'Đã quyết toán' : transaction.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">STT</th>
                  <th className="py-2.5 px-3">Dịch vụ / Gói thuê bao</th>
                  <th className="py-2.5 px-3">Kỳ hạn</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 text-right">Giảm trừ</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr>
                  <td className="py-3 px-3 font-medium">1</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Gói thuê bao AI: {transaction.planName}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Cung cấp quyền truy cập tính năng AI Career Intelligence & ATS Matching
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {transaction.billingCycle === 'yearly' ? '12 Tháng (Năm)' : '01 Tháng'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {transaction.amountVND.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600">
                    {transaction.discountAmountVND > 0
                      ? `-${transaction.discountAmountVND.toLocaleString('vi-VN')} ₫`
                      : '0 ₫'}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                    {transaction.finalAmountVND.toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Cộng tiền hàng:</span>
                <span>{transaction.amountVND.toLocaleString('vi-VN')} ₫</span>
              </div>
              {transaction.discountAmountVND > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Khuyến mãi ({transaction.voucherCode || 'Ưu đãi'}):</span>
                  <span>-{transaction.discountAmountVND.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Thuế GTGT (VAT 8%):</span>
                <span>Đã bao gồm trong giá</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700 font-medium text-sm">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-base">
                  {transaction.finalAmountVND.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Legal / Electronic note */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 text-center">
            <p>Hóa đơn điện tử được khởi tạo và truyền dữ liệu theo quy định Nghị định 123/2020/NĐ-CP của Chính Phủ.</p>
            <p className="mt-0.5">Tra cứu hóa đơn gốc tại: https://tracuu.careerpilot.ai/invoice?id={transaction.orderCode}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {t.subscriptionPage.close}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.subscriptionPage.printInvoice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
