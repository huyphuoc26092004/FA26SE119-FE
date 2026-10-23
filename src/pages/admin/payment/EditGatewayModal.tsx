import React, { useState } from 'react';
import type { PaymentGatewayConfig } from '../../../types/paymentManagement';
import {
  CheckBox,
  Modal,
  SubHead,
  fieldLabel,
  primaryButton,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

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
    <Modal
      eyebrow="Cấu hình cổng thanh toán"
      title={`${gateway.name}.`}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSaving} className={`${textLink} text-slate-600`}>
            Huỷ
          </button>
          <button type="submit" form="edit-gateway-form" disabled={isSaving} className={primaryButton}>
            {isSaving ? 'Đang lưu…' : 'Lưu cấu hình'}
          </button>
        </>
      }
    >
      <form id="edit-gateway-form" onSubmit={handleSubmit} className="space-y-9">
        <section>
          <SubHead title="01  Trạng thái & phí" />
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label="Trạng thái" wide>
              <select value={status} onChange={(e) => setStatus(e.target.value as PaymentGatewayConfig['status'])} className={underlineSelect}>
                <option value="ACTIVE">Hoạt động bình thường</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
                <option value="TESTING">Môi trường kiểm thử</option>
              </select>
            </Field>
            <Field label="Phí mỗi giao dịch (%)">
              <input type="number" step={0.1} min={0} value={feePercent} onChange={(e) => setFeePercent(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
            <Field label="Phí cố định (VNĐ)">
              <input type="number" step={500} min={0} value={fixedFeeVND} onChange={(e) => setFixedFeeVND(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
          </div>
          <div className="mt-4 border-t border-border">
            <CheckBox
              checked={testMode}
              onChange={setTestMode}
              label="Chế độ sandbox"
              description={testMode ? 'Đang chạy môi trường thử, không trừ tiền thật.' : 'Đang chạy thật (production).'}
            />
          </div>
        </section>

        {gateway.gatewayId === 'vietqr' && (
          <section>
            <SubHead title="02  Tài khoản nhận tiền Napas 24/7" />
            <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Số tài khoản">
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={`${underlineInput} tabular-nums`} />
              </Field>
              <Field label="Ngân hàng & chi nhánh">
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className={underlineInput} />
              </Field>
              <Field label="Chủ tài khoản thụ hưởng" wide>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} className={underlineInput} />
              </Field>
            </div>
          </section>
        )}

        <section>
          <SubHead title={gateway.gatewayId === 'vietqr' ? '03  Kết nối' : '02  Kết nối'} />
          <div className="mt-5 space-y-5">
            <Field label="Merchant ID / Terminal ID / Partner code">
              <input type="text" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className={`${underlineInput} font-mono text-sm`} />
            </Field>
            <Field label="Webhook IPN URL">
              <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className={`${underlineInput} font-mono text-sm`} />
            </Field>
            <Field label="Ghi chú cho khách hàng & kế toán">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${underlineInput} resize-none`} />
            </Field>
          </div>
        </section>
      </form>
    </Modal>
  );
};
