import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, AlertCircle, Sparkles, Sliders, DollarSign, Shield } from 'lucide-react';
import type {
  AdminAiModel,
  AiProvider,
  AiModelStatus,
  AiFeatureKey,
} from '../../../types/aiManagement';

interface ModelConfigModalProps {
  isOpen: boolean;
  model: AdminAiModel | null;
  allModels: AdminAiModel[];
  onClose: () => void;
  onSave: (model: AdminAiModel) => Promise<void>;
}

const ALL_FEATURES: { key: AiFeatureKey; label: string }[] = [
  { key: 'cv_parsing', label: 'Bóc tách & Đánh giá CV ATS' },
  { key: 'cv_job_fit', label: 'So khớp Ngữ nghĩa CV–Job Fit' },
  { key: 'assistant_chat', label: 'Trợ lý AI Hướng nghiệp Chat' },
  { key: 'cover_letter', label: 'Tạo Cover Letter & Email ứng tuyển' },
  { key: 'mock_interview', label: 'Phỏng vấn Mô phỏng STAR' },
  { key: 'salary_estimation', label: 'Ước tính Lương & Lộ trình Học' },
];

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  model,
  allModels,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AdminAiModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setFormData({ ...model });
    } else {
      // Default template for new model
      setFormData({
        modelId: 'new-custom-model',
        displayName: 'Custom AI Model',
        provider: 'Google Gemini',
        modelFamily: 'Gemini 1.5',
        status: 'STANDBY',
        isPrimary: false,
        fallbackModelId: 'gpt-4o',
        parameters: {
          temperature: 0.5,
          topP: 0.9,
          topK: 40,
          contextWindowTokens: 1000000,
          maxOutputTokens: 4096,
          safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
        pricing: {
          inputPer1mUSD: 1.0,
          outputPer1mUSD: 3.0,
          inputPer1mVND: 25000,
          outputPer1mVND: 75000,
        },
        rateLimits: {
          rpmLimit: 500,
          tpmLimit: 2000000,
          rpdLimit: 10000,
        },
        metrics: {
          avgLatencyMs: 350,
          currentLoadPercent: 10,
          successRatePercent: 100,
          totalRequests24h: 0,
          tokensConsumed24h: 0,
        },
        supportedFeatures: ['assistant_chat'],
        apiKeyMasked: 'AIzaSy••••••••••••••••••••••••••••',
        description: 'Mô hình suy luận mới được cấu hình vào hệ thống.',
        updatedAt: new Date().toLocaleString('vi-VN'),
      });
    }
  }, [model, isOpen]);

  if (!isOpen || !formData) return null;

  const handleToggleFeature = (feat: AiFeatureKey) => {
    const current = formData.supportedFeatures;
    if (current.includes(feat)) {
      setFormData({ ...formData, supportedFeatures: current.filter((f) => f !== feat) });
    } else {
      setFormData({ ...formData, supportedFeatures: [...current, feat] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.modelId.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Tên hiển thị và Mã định danh Model.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
              <Cpu size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {model ? 'Cấu hình Mô hình AI (Inference Parameters)' : 'Thêm Mô hình AI mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Tinh chỉnh tham số suy luận, cửa sổ ngữ cảnh, chi phí token và chiến lược chuyển vùng dự phòng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              <span>1. Thông tin Định danh & Nhà cung cấp</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên hiển thị (Display Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="Ví dụ: Google Gemini 1.5 Pro"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mã định danh (Model ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.modelId}
                  disabled={!!model}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition disabled:bg-slate-100 disabled:text-slate-500 font-mono text-xs"
                  placeholder="gemini-1.5-pro"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nhà cung cấp (Provider)
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value as AiProvider })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-blue-500 outline-none"
                >
                  <option value="Google Gemini">Google Gemini</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Local / Ollama">Local / Ollama</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Trạng thái hoạt động
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AiModelStatus })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-blue-500 outline-none"
                >
                  <option value="HEALTHY">🟢 HEALTHY (Đang hoạt động)</option>
                  <option value="STANDBY">🟡 STANDBY (Chế độ chờ)</option>
                  <option value="DEGRADED">🟠 DEGRADED (Hiệu năng giảm)</option>
                  <option value="MAINTENANCE">🔴 MAINTENANCE (Bảo trì)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mô hình dự phòng (Fallback Model)
                </label>
                <select
                  value={formData.fallbackModelId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fallbackModelId: e.target.value || undefined })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-blue-500 outline-none"
                >
                  <option value="">-- Không sử dụng fallback --</option>
                  {allModels
                    .filter((m) => m.modelId !== formData.modelId)
                    .map((m) => (
                      <option key={m.modelId} value={m.modelId}>
                        {m.displayName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <input
                type="checkbox"
                id="isPrimaryCheckbox"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isPrimaryCheckbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Đặt làm Mô hình Mặc định Chính (Primary Gateway Model) cho tác vụ suy luận cốt lõi
              </label>
            </div>
          </div>

          {/* 2. Inference Parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-500" />
              <span>2. Tham số suy luận (Inference Parameters Tuning)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Temperature */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Temperature (Độ sáng tạo)</span>
                  <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {formData.parameters.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={formData.parameters.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameters: { ...formData.parameters, temperature: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Thấp (0.1 - 0.4): Bóc tách CV, chấm điểm chính xác. Cao (0.7 - 1.2): Sáng tạo văn phong Cover Letter.
                </p>
              </div>

              {/* Top-P */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Top-P (Nucleus Sampling)</span>
                  <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {formData.parameters.topP}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={formData.parameters.topP}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameters: { ...formData.parameters, topP: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Xác suất tích lũy của các tokens được xem xét. Khuyên dùng 0.9 - 0.95 cho tư vấn nghề nghiệp.
                </p>
              </div>

              {/* Context Window */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cửa sổ ngữ cảnh (Context Window Tokens)
                </label>
                <input
                  type="number"
                  value={formData.parameters.contextWindowTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        contextWindowTokens: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-blue-500 outline-none"
                  placeholder="2000000"
                />
              </div>

              {/* Max Output Tokens */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Giới hạn Token đầu ra (Max Output Tokens)
                </label>
                <input
                  type="number"
                  value={formData.parameters.maxOutputTokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        maxOutputTokens: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-blue-500 outline-none"
                  placeholder="8192"
                />
              </div>
            </div>
          </div>

          {/* 3. Pricing & Quotas */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-500" />
              <span>3. Định giá Token & Giới hạn Tải (Rate Limits)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá Input / 1M tokens ($)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.pricing.inputPer1mUSD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        inputPer1mUSD: parseFloat(e.target.value) || 0,
                        inputPer1mVND: Math.round((parseFloat(e.target.value) || 0) * 25000),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá Output / 1M tokens ($)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.pricing.outputPer1mUSD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        outputPer1mUSD: parseFloat(e.target.value) || 0,
                        outputPer1mVND: Math.round((parseFloat(e.target.value) || 0) * 25000),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">RPM Limit (Req/min)</label>
                <input
                  type="number"
                  value={formData.rateLimits.rpmLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rateLimits: {
                        ...formData.rateLimits,
                        rpmLimit: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">TPM Limit (Tokens/min)</label>
                <input
                  type="number"
                  value={formData.rateLimits.tpmLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rateLimits: {
                        ...formData.rateLimits,
                        tpmLimit: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Supported Features */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield size={14} className="text-purple-500" />
              <span>4. Phân công tính năng nghiệp vụ hỗ trợ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_FEATURES.map((feat) => {
                const isSelected = formData.supportedFeatures.includes(feat.key);
                return (
                  <button
                    type="button"
                    key={feat.key}
                    onClick={() => handleToggleFeature(feat.key)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span>{feat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Description */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú kiến trúc & Mô tả ứng dụng
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 outline-none transition"
              placeholder="Mô tả mục đích sử dụng mô hình trong hệ thống..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'Đang lưu cấu hình...' : 'Lưu cấu hình mô hình'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
