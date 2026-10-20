import React, { useState } from 'react';
import { X, Check, Zap, AlertCircle, RefreshCw, PlusCircle, UserCheck } from 'lucide-react';
import type { GrantUserTokensPayload } from '../../../types/subscriptionManagement';

interface UserTokenGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: (payload: GrantUserTokensPayload) => Promise<void>;
  preselectedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const UserTokenGrantModal: React.FC<UserTokenGrantModalProps> = ({
  isOpen,
  onClose,
  onGrant,
  preselectedUser,
}) => {
  const [userId] = useState(preselectedUser?.id || 'usr-custom');
  const [userName, setUserName] = useState(preselectedUser?.name || 'Alex Morgan');
  const [userEmail, setUserEmail] = useState(preselectedUser?.email || 'candidate@example.com');
  const [grantType, setGrantType] = useState<'BONUS_TOKENS' | 'CUSTOM_QUOTA' | 'RESET_USAGE'>(
    'BONUS_TOKENS'
  );
  const [amount, setAmount] = useState<number>(50000);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [reason, setReason] = useState(
    'Cấp bù token hỗ trợ trải nghiệm thử nghiệm tính năng Luyện phỏng vấn STAR.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Vui lòng nhập đầy đủ tên và email người nhận');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do phê duyệt / kiểm toán');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onGrant({
        userId,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        type: grantType,
        amount: Number(amount),
        reason: reason.trim(),
        expiresInDays: grantType === 'RESET_USAGE' ? undefined : expiresInDays,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cấp phát token';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Cấp phát Token & Hạn ngạch tùy chỉnh
              </h2>
              <p className="text-xs text-slate-500">
                Thưởng token đền bù, nâng hạn mức VIP hoặc làm mới hạn ngạch người dùng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên ứng viên / Người dùng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Grant Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hình thức cấp phát
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGrantType('BONUS_TOKENS')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${
                  grantType === 'BONUS_TOKENS'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PlusCircle size={16} className="text-amber-600" />
                <span>+ Token Thưởng</span>
              </button>

              <button
                type="button"
                onClick={() => setGrantType('CUSTOM_QUOTA')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${
                  grantType === 'CUSTOM_QUOTA'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap size={16} className="text-blue-600" />
                <span>Hạn mức tháng</span>
              </button>

              <button
                type="button"
                onClick={() => setGrantType('RESET_USAGE')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${
                  grantType === 'RESET_USAGE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RefreshCw size={16} className="text-emerald-600" />
                <span>Reset về 0</span>
              </button>
            </div>
          </div>

          {/* Amount (if not reset) */}
          {grantType !== 'RESET_USAGE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {grantType === 'BONUS_TOKENS' ? 'Số lượng Token cộng thêm' : 'Hạn mức tháng mới'}
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden font-bold text-amber-700"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {amount.toLocaleString()} Tokens
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hiệu lực cấp phát
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value={7}>7 ngày (Khẩn cấp)</option>
                  <option value={30}>30 ngày (1 tháng)</option>
                  <option value={90}>90 ngày (1 quý)</option>
                  <option value={365}>1 năm</option>
                  <option value={0}>Vĩnh viễn không hết hạn</option>
                </select>
              </div>
            </div>
          )}

          {grantType === 'RESET_USAGE' && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              Thao tác này sẽ xóa sạch số lượng Token đã tiêu thụ trong tháng hiện tại của người dùng về <strong>0 Tokens</strong>, cho phép họ tiếp tục sử dụng trọn vẹn toàn bộ hạn mức gói.
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do cấp phát (Lưu vết nhật ký kiểm toán) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ghi rõ lý do đền bù, thưởng ứng viên VIP hoặc chiến dịch chăm sóc..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <UserCheck size={14} className="text-slate-400 shrink-0" />
            <span>Thao tác sẽ được ghi lại trong Audit Log hệ thống dưới tên tài khoản Quản trị viên.</span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <Check size={15} />
                <span>Xác nhận cấp Token</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
