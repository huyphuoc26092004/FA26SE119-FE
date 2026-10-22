import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import type { PaymentTransaction } from '../../../types/subscription';

interface TransactionInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
}

export const TransactionInvoiceModal: React.FC<TransactionInvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatPercent = 8;
  const netAmount = Math.round(transaction.finalAmountVND / (1 + vatPercent / 100));
  const vatAmount = transaction.finalAmountVND - netAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-surface rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hóa đơn điện tử hợp lệ (e-VAT Invoice)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Printer size={14} />
              <span>In hóa đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 overflow-y-auto font-sans text-slate-800 space-y-6 print:p-0">
          {/* Top header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xl font-semibold tracking-tight text-brand-600">
                CareerPilot<span className="text-slate-900">AI</span>
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                CÔNG TY CỔ PHẦN CÔNG NGHỆ TRÍ TUỆ NHÂN TẠO CAREERPILOT
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mã số thuế (MST): <strong>0318924819</strong> · Website: careerpilot.io
              </p>
              <p className="text-[11px] text-slate-400">
                Địa chỉ: Tòa nhà FPT Tower, Lô E2a-7, Đường D1, TP. Thủ Đức, TP. Hồ Chí Minh
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium uppercase bg-brand-50 text-brand-700 mb-1">
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG
              </span>
              <p className="text-xs text-slate-600">
                Mã hóa đơn: <strong className="font-mono text-slate-900">{transaction.orderCode}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ký hiệu: <strong>1C26TTA</strong> · Số: <strong>008412</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Ngày phát hành: <strong>{transaction.completedAt || transaction.createdAt}</strong>
              </p>
            </div>
          </div>

          {/* Buyer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400 block mb-1">
                Đơn vị nhận hóa đơn (Khách hàng)
              </span>
              <p className="font-medium text-slate-900">{transaction.candidateName}</p>
              <p className="text-slate-600 mt-0.5">Email: {transaction.candidateEmail}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-medium tracking-wider text-slate-400 block mb-1">
                Thông tin thanh toán
              </span>
              <p className="font-medium text-slate-700">
                Phương thức: <span className="font-medium uppercase text-slate-900">{transaction.paymentMethod}</span>
              </p>
              <p className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Trạng thái: Đã quyết toán thành công</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Tên hàng hóa, dịch vụ phần mềm AI</th>
                  <th className="py-2.5 px-3 text-center">Chu kỳ</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 text-center text-slate-400 font-medium">1</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    Gói dịch vụ AI: {transaction.planName}
                    <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                      Dịch vụ Trợ lý AI sự nghiệp, phân tích CV chuẩn ATS và đối sánh việc làm
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600 font-medium">
                    {transaction.billingCycle === 'yearly' ? '1 Năm' : '1 Tháng'}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">
                    {transaction.amountVND.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-900">
                    {transaction.amountVND.toLocaleString('vi-VN')} đ
                  </td>
                </tr>

                {transaction.discountAmountVND > 0 && (
                  <tr className="bg-emerald-50/40 text-emerald-800">
                    <td className="py-2.5 px-3 text-center font-medium">2</td>
                    <td className="py-2.5 px-3 font-medium" colSpan={3}>
                      Chiết khấu khuyến mại voucher: <strong>{transaction.voucherCode || 'Ưu đãi chu kỳ'}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      -{transaction.discountAmountVND.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 max-w-sm">
              <QrCode size={36} className="text-slate-800 shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Tra cứu hóa đơn điện tử</p>
                <p>Quét mã QR hoặc truy cập hoadon.careerpilot.io với mã {transaction.orderCode}</p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Cộng tiền dịch vụ:</span>
                <span className="font-medium text-slate-900">{netAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế suất GTGT ({vatPercent}%):</span>
                <span className="font-medium text-slate-900">{vatAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-semibold text-brand-700">
                <span>Tổng tiền thanh toán:</span>
                <span>{transaction.finalAmountVND.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Signature & Digital Stamp */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck size={16} />
              <span>Được ký số điện tử bởi CareerPilot AI JSC vào {transaction.completedAt || transaction.createdAt}</span>
            </div>
            <div className="text-[11px] font-mono">
              SHA-256: 8a9f...3c7e
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
