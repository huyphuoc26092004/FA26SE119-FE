import React, { useState } from 'react';
import { X, RotateCcw, ShieldAlert } from 'lucide-react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AdminPaymentTransaction | null;
  onConfirmRefund: (orderId: string, reason: string) => Promise<void>;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirmRefund,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(
    'Khách hàng yêu cầu hủy dịch vụ và hoàn tiền trong vòng 24h.'
  );
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const presets = [
    'Khách hàng yêu cầu hủy dịch vụ và hoàn tiền trong vòng 24h.',
    'Khách hàng thao tác chuyển nhầm gói cước / trùng lặp thanh toán.',
    'Sự cố kỹ thuật cổng thanh toán trừ tiền nhưng không kích hoạt gói.',
    'Chính sách bảo đảm chất lượng dịch vụ đặc biệt từ CSKH.',
    'Khác (nhập chi tiết phía dưới)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedPreset.startsWith('Khác')
      ? customNote.trim() || 'Hoàn tiền theo thỏa thuận hỗ trợ khách hàng'
      : `${selectedPreset} ${customNote ? `(${customNote.trim()})` : ''}`.trim();

    setIsSubmitting(true);
    try {
      await onConfirmRefund(transaction.id, finalReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Xác nhận hoàn tiền giao dịch</h3>
              <p className="text-[11px] text-rose-600">Đơn hàng: {transaction.orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target transaction summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-bold text-slate-900">{transaction.candidateName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Gói / Dịch vụ:</span>
              <span className="font-medium text-slate-800">{transaction.planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cổng thanh toán:</span>
              <span className="font-bold uppercase text-slate-700">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
              <span className="font-semibold text-slate-700">Số tiền hoàn trả:</span>
              <span className="font-black text-rose-600 text-base">
                {transaction.finalAmountVND.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Hệ thống sẽ chuyển trạng thái giao dịch sang <strong>Đã hoàn tiền (Refunded)</strong>.
              Nếu giao dịch đã xuất Hóa đơn điện tử VAT, hóa đơn đó sẽ tự động được đánh dấu{' '}
              <strong>HỦY</strong> để đảm bảo tính hợp lệ theo quy định kế toán.
            </p>
          </div>

          {/* Preset reasons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Lý do hoàn tiền (Lưu vết kiểm toán & kê khai thuế)
            </label>
            <div className="space-y-1.5">
              {presets.map((preset) => (
                <label
                  key={preset}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedPreset === preset
                      ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="refundReason"
                    value={preset}
                    checked={selectedPreset === preset}
                    onChange={() => setSelectedPreset(preset)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{preset}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú bổ sung (Tùy chọn)
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Nhập thông tin biên nhận ngân hàng, số ticket CSKH hoặc tài khoản nhận hoàn..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs shadow-rose-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
