import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { VatInvoiceItem } from '../../../types/paymentManagement';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VatInvoiceItem | null;
  onConfirmCancel: (invoiceId: string, reason: string) => Promise<void>;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(
    'Hủy dịch vụ và hoàn trả toàn bộ tiền cho khách hàng.'
  );
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const presets = [
    'Hủy dịch vụ và hoàn trả toàn bộ tiền cho khách hàng.',
    'Sai sót thông tin định danh người mua / Mã số thuế (MST).',
    'Sai đơn giá / tỷ lệ thuế suất GTGT cần lập hóa đơn mới.',
    'Trùng lặp số hóa đơn với giao dịch trước đó.',
    'Khác (nhập chi tiết lý do)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason.startsWith('Khác')
      ? customNote.trim() || 'Hủy hóa đơn theo biên bản thỏa thuận hai bên'
      : `${selectedReason} ${customNote ? `(${customNote.trim()})` : ''}`.trim();

    setIsSubmitting(true);
    try {
      await onConfirmCancel(invoice.id, finalReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/70">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Hủy / Thu hồi Hóa đơn điện tử VAT</h3>
              <p className="text-[11px] text-rose-600">
                Số HĐ: {invoice.invoiceNumber} · Ký hiệu: {invoice.invoiceSeries}
              </p>
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
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              Theo Thông tư 78/2021/TT-BTC, việc hủy hóa đơn điện tử đã phát hành yêu cầu lưu vết lý do
              kê khai và thông báo tới Cơ quan Thuế (Mẫu 04/SS-HĐĐT). Vui lòng xác nhận lý do chính xác.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-bold text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nội dung:</span>
              <span className="font-medium text-slate-800">{invoice.itemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng thanh toán:</span>
              <span className="font-bold text-rose-600">{invoice.totalAmountVND.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Lý do hủy hóa đơn (Lưu hồ sơ thuế)
            </label>
            <div className="space-y-1.5">
              {presets.map((preset) => (
                <label
                  key={preset}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === preset
                      ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={preset}
                    checked={selectedReason === preset}
                    onChange={() => setSelectedReason(preset)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{preset}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ghi chú bổ sung (Mã số biên bản thỏa thuận nếu có)
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Nhập số biên bản hủy HĐĐT hoặc chi tiết thỏa thuận..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

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
              <AlertTriangle size={14} />
              <span>{isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy Hóa đơn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
