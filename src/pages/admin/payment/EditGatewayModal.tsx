import React, { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import type { PaymentGatewayConfig } from '../../../types/paymentManagement';

interface EditGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: PaymentGatewayConfig | null;
  onSave: (gatewayId: PaymentGatewayConfig['gatewayId'], patch: Partial<PaymentGatewayConfig>) => Promise<void>;
}

export const EditGatewayModal: React.FC<EditGatewayModalProps> = ({
  isOpen,
  onClose,
  gateway,
  onSave,
}) => {
  const [status, setStatus] = useState<PaymentGatewayConfig['status']>('ACTIVE');
  const [feePercent, setFeePercent] = useState<number>(0);
  const [fixedFeeVND, setFixedFeeVND] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (gateway) {
      setStatus(gateway.status);
      setFeePercent(gateway.feePercent);
      setFixedFeeVND(gateway.fixedFeeVND);
      setAccountNumber(gateway.accountNumber || '');
      setAccountName(gateway.accountName || '');
      setBankName(gateway.bankName || '');
      setMerchantId(gateway.merchantId || '');
      setWebhookUrl(gateway.webhookUrl || '');
      setTestMode(gateway.testMode);
      setNotes(gateway.notes || '');
    }
  }, [gateway]);

  if (!isOpen || !gateway) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(gateway.gatewayId, {
        status,
        feePercent,
        fixedFeeVND,
        accountNumber: accountNumber.trim() || undefined,
        accountName: accountName.trim() || undefined,
        bankName: bankName.trim() || undefined,
        merchantId: merchantId.trim() || undefined,
        webhookUrl: webhookUrl.trim() || undefined,
        testMode,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Cấu hình Cổng thanh toán</h3>
              <p className="text-[11px] text-slate-500">{gateway.name}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Trạng thái hoạt động
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentGatewayConfig['status'])}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
                <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
                <option value="TESTING">Môi trường kiểm thử (TESTING)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Chế độ Test (Sandbox / Staging)
              </label>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
                <span className="text-xs text-slate-600 font-medium">
                  {testMode ? 'Bật Sandbox Test' : 'Chạy thật (Production)'}
                </span>
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phí % trên mỗi giao dịch (%)
              </label>
              <input
                type="number"
                step={0.1}
                min={0}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phí cố định mỗi giao dịch (VNĐ)
              </label>
              <input
                type="number"
                step={500}
                min={0}
                value={fixedFeeVND}
                onChange={(e) => setFixedFeeVND(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Account/Bank specifics */}
          {gateway.gatewayId === 'vietqr' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">
                Thông tin Tài khoản Ngân hàng nhận tiền Napas 24/7
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên ngân hàng & Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên chủ tài khoản thụ hưởng
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Merchant ID & Webhook */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Merchant ID / Terminal ID / API Partner Code
              </label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Webhook IPN URL (Callback xử lý tự động)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ghi chú hướng dẫn khách hàng & kế toán
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình cổng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
