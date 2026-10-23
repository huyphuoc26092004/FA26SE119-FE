import React, { useState } from 'react';
import type { ApiKeyItem, CreateApiKeyPayload } from '../../../types/subscriptionManagement';
import {
  Modal,
  Note,
  fieldLabel,
  primaryButton,
  smallPrimary,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateApiKeyPayload) => Promise<ApiKeyItem>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('dev@careerpilot.io');
  const [tier, setTier] = useState('Pro Tier');
  const [rpm, setRpm] = useState(60);
  const [tpm, setTpm] = useState(500000);

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên ứng dụng hoặc dịch vụ');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: name.trim(),
        ownerEmail: ownerEmail.trim(),
        tier,
        rpm: Number(rpm),
        tpm: Number(tpm),
      });
      // Mock generated raw secret token
      setGeneratedKey(`cp_live_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo API Key';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal
      eyebrow="Khoá API"
      title={generatedKey ? 'Khoá đã được tạo.' : 'Tạo khoá API mới.'}
      onClose={onClose}
      width="max-w-lg"
      footer={
        generatedKey ? (
          <button type="button" onClick={onClose} className={primaryButton}>
            Đã lưu, đóng lại
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
              Huỷ
            </button>
            <button type="submit" form="api-key-form" disabled={isSubmitting} className={primaryButton}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo khoá'}
            </button>
          </>
        )
      }
    >
      {generatedKey ? (
        <div className="space-y-6">
          <Note tone="warning">Khoá chỉ hiện nguyên bản một lần. Hãy lưu vào kho bí mật ngay bây giờ.</Note>
          <div>
            <p className={fieldLabel}>Secret token</p>
            <div className="mt-1 flex items-end gap-4">
              <input type="text" readOnly value={generatedKey} onFocus={(e) => e.currentTarget.select()} className={`${underlineInput} flex-1 font-mono text-sm`} />
              <button type="button" onClick={handleCopy} className={smallPrimary}>
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form id="api-key-form" onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="border-l-2 border-danger pl-4 text-[13px] text-danger">{error}</p>}
          <label className="block">
            <span className={fieldLabel}>
              Tên ứng dụng / mục đích <span className="text-danger">*</span>
            </span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="TopCV Webhook Integration" className={underlineInput} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Email kỹ sư phụ trách</span>
            <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="dev@partner.com" className={underlineInput} />
          </label>
          <div className="grid grid-cols-2 gap-x-8">
            <label className="block">
              <span className={fieldLabel}>Cấp bậc</span>
              <select
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value);
                  if (e.target.value === 'Enterprise Tier') {
                    setRpm(120);
                    setTpm(1000000);
                  } else if (e.target.value === 'Pro Tier') {
                    setRpm(60);
                    setTpm(500000);
                  } else {
                    setRpm(30);
                    setTpm(150000);
                  }
                }}
                className={underlineSelect}
              >
                <option value="Standard Tier">Standard · 30 RPM</option>
                <option value="Pro Tier">Pro · 60 RPM</option>
                <option value="Enterprise Tier">Enterprise · 120 RPM</option>
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>Giới hạn RPM</span>
              <input type="number" min="5" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </label>
          </div>
          <p className="text-[13px] text-slate-500">TPM đi kèm: {tpm.toLocaleString('vi-VN')} token / phút.</p>
        </form>
      )}
    </Modal>
  );
};
