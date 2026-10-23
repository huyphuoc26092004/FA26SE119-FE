import React, { useState } from 'react';
import type { AdminPaymentTransaction } from '../../../types/paymentManagement';
import {
  InfoRow,
  Modal,
  Note,
  RadioRow,
  dangerButton,
  fieldLabel,
  textLink,
  underlineInput,
} from '../../../components/admin/AdminKit';
import { METHOD_LABEL, transactionTitle } from './TransactionLedgerTab';

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
    <Modal
      eyebrow={`Đơn ${transaction.orderCode}`}
      title="Hoàn tiền giao dịch."
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
            Quay lại
          </button>
          <button type="submit" form="refund-form" disabled={isSubmitting} className={dangerButton}>
            {isSubmitting ? 'Đang hoàn tiền…' : 'Xác nhận hoàn tiền'}
          </button>
        </>
      }
    >
      <form id="refund-form" onSubmit={handleSubmit} className="space-y-7">
        <dl className="border-t border-border">
          <InfoRow label="Khách hàng">{transaction.candidateName}</InfoRow>
          <InfoRow label="Gói / dịch vụ">{transactionTitle(transaction)}</InfoRow>
          <InfoRow label="Cổng thanh toán">{METHOD_LABEL[transaction.paymentMethod] ?? transaction.paymentMethod}</InfoRow>
          <InfoRow label="Số tiền hoàn trả" tone="danger">
            <span className="text-[clamp(1.25rem,2vw,1.5rem)] tabular-nums">
              {transaction.finalAmountVND.toLocaleString('vi-VN')}đ
            </span>
          </InfoRow>
        </dl>

        <Note tone="warning">
          Giao dịch sẽ chuyển sang <span className="text-ink">Đã hoàn tiền</span>. Nếu đã xuất hoá đơn VAT, hoá đơn đó sẽ tự
          động được đánh dấu huỷ để đúng quy định kế toán.
        </Note>

        <fieldset>
          <legend className={`${fieldLabel} mb-1`}>Lý do hoàn tiền (lưu vết kiểm toán)</legend>
          <div className="border-t border-border">
            {presets.map((preset) => (
              <RadioRow
                key={preset}
                name="refundReason"
                checked={selectedPreset === preset}
                onChange={() => setSelectedPreset(preset)}
                label={preset}
              />
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={fieldLabel}>Ghi chú bổ sung</span>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Biên nhận ngân hàng, số ticket CSKH hoặc tài khoản nhận hoàn"
            rows={2}
            className={`${underlineInput} resize-none`}
          />
        </label>
      </form>
    </Modal>
  );
};
