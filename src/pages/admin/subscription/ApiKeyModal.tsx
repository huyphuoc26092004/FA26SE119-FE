import React, { useState } from 'react';
import { X, Check, Key, Copy, AlertCircle, ShieldCheck } from 'lucide-react';
import type { ApiKeyItem, CreateApiKeyPayload } from '../../../types/subscriptionManagement';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Khởi tạo API Key mới</h2>
              <p className="text-xs text-slate-500">
                Ủy quyền truy cập Token Service & Rate Limits cho đối tác
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

        {/* Form or Result */}
        {generatedKey ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <ShieldCheck size={18} />
                <span>API Key đã được khởi tạo thành công!</span>
              </div>
              <p>
                Đây là lần duy nhất mã khóa bảo mật này được hiển thị nguyên bản. Vui lòng sao lưu vào kho lưu trữ bí mật (Secret Vault) ngay bây giờ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Secret Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedKey}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Đã sao lưu & Đóng hộp thoại
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên ứng dụng / Mục đích sử dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: TopCV Webhook Integration"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email quản trị viên / Kỹ sư phụ trách
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="dev@partner.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cấp bậc gói (Tier)
                </label>
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="Standard Tier">Standard (30 RPM)</option>
                  <option value="Pro Tier">Pro (60 RPM)</option>
                  <option value="Enterprise Tier">Enterprise (120 RPM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới hạn RPM
                </label>
                <input
                  type="number"
                  min="5"
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang sinh khóa...</span>
                ) : (
                  <>
                    <Key size={14} />
                    <span>Tạo API Key</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
