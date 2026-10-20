import React, { useState } from 'react';
import { X, FileText, Check, AlertCircle, Calculator } from 'lucide-react';
import type { CreateInvoicePayload } from '../../../types/paymentManagement';
import type { PaymentMethodType } from '../../../types/subscription';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload) => Promise<void>;
}

export const ManualInvoiceModal: React.FC<ManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerTaxCode, setCustomerTaxCode] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [itemName, setItemName] = useState('Hợp đồng Dịch vụ AI & Tuyển dụng CareerPilot Enterprise');
  const [amountVND, setAmountVND] = useState<number>(5000000);
  const [vatRatePercent, setVatRatePercent] = useState<number>(8);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('vietqr');
  const [orderCode, setOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Realtime calculations
  const subtotal = Math.round(amountVND / (1 + vatRatePercent / 100));
  const vatAmount = amountVND - subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và email khách hàng.');
      return;
    }
    if (amountVND <= 0) {
      setErrorMsg('Số tiền hóa đơn phải lớn hơn 0 VNĐ.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerCompany: customerCompany.trim() || undefined,
        customerTaxCode: customerTaxCode.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        itemName: itemName.trim(),
        amountVND,
        vatRatePercent,
        paymentMethod,
        orderCode: orderCode.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo hóa đơn.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/60">
          <div className="flex items-center gap-2.5 text-blue-900">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Lập Hóa đơn điện tử VAT mới (Ad-hoc)</h3>
              <p className="text-[11px] text-blue-600">
                Xuất hóa đơn GTGT tuân thủ Thông tư 78/2021/TT-BTC & NĐ 123/2020/NĐ-CP
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer details */}
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              1. Thông tin người mua / Đơn vị nhận hóa đơn
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ tên khách hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email nhận hóa đơn điện tử <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@company.vn"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên Công ty / Đơn vị (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  placeholder="Công ty Cổ phần..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã số thuế Doanh nghiệp (MST)
                </label>
                <input
                  type="text"
                  value={customerTaxCode}
                  onChange={(e) => setCustomerTaxCode(e.target.value)}
                  placeholder="0318xxxxxx"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0908xxxxxx"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mã đơn hàng liên kết (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="CP-PAY-..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Địa chỉ xuất hóa đơn
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Số nhà, Tòa nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items & Pricing */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              2. Nội dung hàng hóa, dịch vụ & Thuế suất
            </span>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên dịch vụ / Hàng hóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tổng tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={amountVND}
                    onChange={(e) => setAmountVND(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thuế suất GTGT
                  </label>
                  <select
                    value={vatRatePercent}
                    onChange={(e) => setVatRatePercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={8}>8% (Dịch vụ CNTT & Phần mềm)</option>
                    <option value={10}>10% (Thuế suất chuẩn)</option>
                    <option value={0}>0% (Không chịu thuế)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="vietqr">VietQR (Chuyển khoản)</option>
                    <option value="momo">Ví MoMo</option>
                    <option value="vnpay">VNPAY-QR</option>
                    <option value="credit_card">Thẻ Quốc tế (Stripe)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tax calculation preview */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 pb-1 border-b border-blue-200/60">
              <Calculator size={14} className="text-blue-600" />
              <span>Bảng tính thuế giá trị gia tăng tự động</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Doanh thu trước thuế (Net Subtotal):</span>
              <span className="font-semibold text-slate-900">{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tiền thuế GTGT ({vatRatePercent}%):</span>
              <span className="font-semibold text-slate-900">{vatAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-blue-200 text-sm font-black text-blue-700">
              <span>Tổng thanh toán đã gồm thuế:</span>
              <span>{amountVND.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Submit actions */}
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'Đang ký số & Lập HĐ...' : 'Ký số & Phát hành Hóa đơn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
