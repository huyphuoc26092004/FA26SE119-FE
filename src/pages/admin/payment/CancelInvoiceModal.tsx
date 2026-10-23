import React, { useState } from 'react';
import type { VatInvoiceItem } from '../../../types/paymentManagement';
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
    <Modal
      eyebrow={`HĐ ${invoice.invoiceNumber} · Ký hiệu ${invoice.invoiceSeries}`}
      title="Huỷ hoá đơn điện tử."
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
            Quay lại
          </button>
          <button type="submit" form="cancel-invoice-form" disabled={isSubmitting} className={dangerButton}>
            {isSubmitting ? 'Đang huỷ…' : 'Xác nhận huỷ hoá đơn'}
          </button>
        </>
      }
    >
      <form id="cancel-invoice-form" onSubmit={handleSubmit} className="space-y-7">
        <Note tone="warning">
          Theo Thông tư 78/2021/TT-BTC, huỷ hoá đơn đã phát hành phải lưu lý do và thông báo cho cơ quan thuế
          (Mẫu 04/SS-HĐĐT).
        </Note>

        <dl className="border-t border-border">
          <InfoRow label="Khách hàng">{invoice.customerName}</InfoRow>
          <InfoRow label="Nội dung">{invoice.itemName}</InfoRow>
          <InfoRow label="Tổng thanh toán" tone="danger">
            {invoice.totalAmountVND.toLocaleString('vi-VN')}đ
          </InfoRow>
        </dl>

        <fieldset>
          <legend className={`${fieldLabel} mb-1`}>Lý do huỷ (lưu hồ sơ thuế)</legend>
          <div className="border-t border-border">
            {presets.map((preset) => (
              <RadioRow
                key={preset}
                name="cancelReason"
                checked={selectedReason === preset}
                onChange={() => setSelectedReason(preset)}
                label={preset}
              />
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={fieldLabel}>Ghi chú bổ sung (số biên bản nếu có)</span>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Số biên bản huỷ hoặc chi tiết thoả thuận"
            rows={2}
            className={`${underlineInput} resize-none`}
          />
        </label>
      </form>
    </Modal>
  );
};
