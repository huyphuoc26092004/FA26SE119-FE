import React, { useState } from 'react';
import type { GrantUserTokensPayload } from '../../../types/subscriptionManagement';
import {
  Modal,
  Note,
  RadioRow,
  fieldLabel,
  primaryButton,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';

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

  const grantTypes: { value: typeof grantType; label: string; description: string }[] = [
    { value: 'BONUS_TOKENS', label: 'Cộng token thưởng', description: 'Thêm token ngoài hạn mức, có thời hạn.' },
    { value: 'CUSTOM_QUOTA', label: 'Đặt hạn mức tháng riêng', description: 'Thay hạn mức của gói bằng con số mới.' },
    { value: 'RESET_USAGE', label: 'Đưa lượt dùng về 0', description: 'Làm mới hạn mức của tháng hiện tại.' },
  ];

  return (
    <Modal
      eyebrow="Token & hạn mức"
      title="Cấp token cho người dùng."
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
            Huỷ
          </button>
          <button type="submit" form="grant-token-form" disabled={isSubmitting} className={primaryButton}>
            {isSubmitting ? 'Đang xử lý…' : 'Xác nhận cấp'}
          </button>
        </>
      }
    >
      <form id="grant-token-form" onSubmit={handleSubmit} className="space-y-7">
        {error && <p className="border-l-2 border-danger pl-4 text-[13px] text-danger">{error}</p>}

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>
              Người nhận <span className="text-danger">*</span>
            </span>
            <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Alex Morgan" className={underlineInput} />
          </label>
          <label className="block">
            <span className={fieldLabel}>
              Email tài khoản <span className="text-danger">*</span>
            </span>
            <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="candidate@example.com" className={underlineInput} />
          </label>
        </div>

        <fieldset>
          <legend className={`${fieldLabel} mb-1`}>Hình thức</legend>
          <div className="border-t border-border">
            {grantTypes.map((g) => (
              <RadioRow
                key={g.value}
                name="grantType"
                checked={grantType === g.value}
                onChange={() => setGrantType(g.value)}
                label={g.label}
                description={g.description}
              />
            ))}
          </div>
        </fieldset>

        {grantType !== 'RESET_USAGE' ? (
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>{grantType === 'BONUS_TOKENS' ? 'Số token cộng thêm' : 'Hạn mức tháng mới'}</span>
              <input type="number" min="1000" step="5000" required value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
              <span className="mt-1 block text-xs text-slate-500">{amount.toLocaleString('vi-VN')} token</span>
            </label>
            <label className="block">
              <span className={fieldLabel}>Hiệu lực</span>
              <select value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))} className={underlineSelect}>
                <option value={7}>7 ngày</option>
                <option value={30}>30 ngày</option>
                <option value={90}>90 ngày</option>
                <option value={365}>1 năm</option>
                <option value={0}>Không hết hạn</option>
              </select>
            </label>
          </div>
        ) : (
          <Note>
            Số token đã dùng trong tháng của người dùng sẽ về <span className="text-ink">0</span>, họ được dùng lại trọn hạn mức gói.
          </Note>
        )}

        <label className="block">
          <span className={fieldLabel}>
            Lý do (lưu nhật ký kiểm toán) <span className="text-danger">*</span>
          </span>
          <textarea rows={3} required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Đền bù, thưởng ứng viên hoặc chiến dịch chăm sóc" className={`${underlineInput} resize-none`} />
        </label>

        <p className="text-xs text-slate-500">Thao tác được ghi vào nhật ký hệ thống dưới tên tài khoản quản trị của bạn.</p>
      </form>
    </Modal>
  );
};
