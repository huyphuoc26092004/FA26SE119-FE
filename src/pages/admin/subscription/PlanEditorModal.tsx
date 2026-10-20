import React, { useState } from 'react';
import { X, Check, AlertCircle, Plus, Trash2, Sparkles, CreditCard, Layers, ShieldCheck, Zap } from 'lucide-react';
import type { AdminSubscriptionPlan, PlanStatus } from '../../../types/subscriptionManagement';

interface PlanEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<AdminSubscriptionPlan>) => Promise<void>;
  initialPlan?: AdminSubscriptionPlan | null;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Nhanh & Tối ưu)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Lập luận sâu & Đa ngữ cảnh)' },
  { id: 'text-embedding-004', name: 'Text Embedding 004 (Vector ngữ nghĩa)' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o (Dự phòng)' },
];

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPlan,
}) => {
  const isEdit = Boolean(initialPlan);

  const [name, setName] = useState(initialPlan?.name || '');
  const [badge, setBadge] = useState(initialPlan?.badge || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [monthlyPriceVND, setMonthlyPriceVND] = useState<number>(initialPlan?.monthlyPriceVND ?? 199000);
  const [yearlyPriceVND, setYearlyPriceVND] = useState<number>(initialPlan?.yearlyPriceVND ?? 1890000);
  const [tokenMonthlyQuota, setTokenMonthlyQuota] = useState<number>(initialPlan?.tokenMonthlyQuota ?? 250000);
  const [cvParsingLimit, setCvParsingLimit] = useState<string>(
    initialPlan?.cvParsingLimit === 'unlimited' ? 'unlimited' : String(initialPlan?.cvParsingLimit ?? 10)
  );
  const [cvJobFitLimit, setCvJobFitLimit] = useState<string>(
    initialPlan?.cvJobFitLimit === 'unlimited' ? 'unlimited' : String(initialPlan?.cvJobFitLimit ?? 20)
  );
  const [aiAssistantQueriesLimit, setAiAssistantQueriesLimit] = useState<string>(
    initialPlan?.aiAssistantQueriesLimit === 'unlimited'
      ? 'unlimited'
      : String(initialPlan?.aiAssistantQueriesLimit ?? 50)
  );
  const [coverLetterGenLimit, setCoverLetterGenLimit] = useState<string>(
    initialPlan?.coverLetterGenLimit === 'unlimited'
      ? 'unlimited'
      : String(initialPlan?.coverLetterGenLimit ?? 10)
  );
  const [mockInterviewLimit, setMockInterviewLimit] = useState<string>(
    initialPlan?.mockInterviewLimit === 'unlimited'
      ? 'unlimited'
      : String(initialPlan?.mockInterviewLimit ?? 3)
  );
  const [consultantDiscountPercent, setConsultantDiscountPercent] = useState<number>(
    initialPlan?.consultantDiscountPercent ?? 15
  );
  const [apiRateLimitRPM, setApiRateLimitRPM] = useState<number>(initialPlan?.apiRateLimitRPM ?? 30);
  const [apiRateLimitTPM, setApiRateLimitTPM] = useState<number>(initialPlan?.apiRateLimitTPM ?? 150000);
  const [supportedModels, setSupportedModels] = useState<string[]>(
    initialPlan?.supportedModels ?? ['gemini-1.5-flash', 'gemini-1.5-pro']
  );
  const [prioritySupport, setPrioritySupport] = useState<boolean>(initialPlan?.prioritySupport ?? false);
  const [highlight, setHighlight] = useState<boolean>(initialPlan?.highlight ?? false);
  const [status, setStatus] = useState<PlanStatus>(initialPlan?.status ?? 'ACTIVE');
  const [features, setFeatures] = useState<string[]>(
    initialPlan?.features ?? [
      '250,000 AI Tokens / tháng',
      'Không giới hạn phân tích ATS CV',
      'Trợ lý AI sự nghiệp thông minh',
    ]
  );
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleModel = (modelId: string) => {
    if (supportedModels.includes(modelId)) {
      if (supportedModels.length === 1) return; // Keep at least one
      setSupportedModels(supportedModels.filter((m) => m !== modelId));
    } else {
      setSupportedModels([...supportedModels, modelId]);
    }
  };

  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFeatures([...features, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên gói cước');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        badge: badge.trim() || undefined,
        description: description.trim(),
        monthlyPriceVND: Number(monthlyPriceVND),
        yearlyPriceVND: Number(yearlyPriceVND),
        tokenMonthlyQuota: Number(tokenMonthlyQuota),
        cvParsingLimit: cvParsingLimit === 'unlimited' ? 'unlimited' : Number(cvParsingLimit),
        cvJobFitLimit: cvJobFitLimit === 'unlimited' ? 'unlimited' : Number(cvJobFitLimit),
        aiAssistantQueriesLimit:
          aiAssistantQueriesLimit === 'unlimited' ? 'unlimited' : Number(aiAssistantQueriesLimit),
        coverLetterGenLimit:
          coverLetterGenLimit === 'unlimited' ? 'unlimited' : Number(coverLetterGenLimit),
        mockInterviewLimit:
          mockInterviewLimit === 'unlimited' ? 'unlimited' : Number(mockInterviewLimit),
        consultantDiscountPercent: Number(consultantDiscountPercent),
        apiRateLimitRPM: Number(apiRateLimitRPM),
        apiRateLimitTPM: Number(apiRateLimitTPM),
        supportedModels,
        prioritySupport,
        highlight,
        status,
        features: features.filter((f) => f.trim().length > 0),
        sortOrder: initialPlan?.sortOrder ?? 99,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu gói cước';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-sm">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Chỉnh sửa gói cước: ${initialPlan?.name}` : 'Tạo gói cước mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Cấu hình giá bán, hạn mức Token và chính sách API cho người dùng
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Basic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers size={14} />
              Thông tin chung gói dịch vụ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên gói cước <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chuyên nghiệp Pro"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Huy hiệu / Nhãn Badge (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ví dụ: Phổ biến nhất ⭐, Đặc quyền VIP 👑"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả ngắn gọn
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tóm tắt đối tượng phù hợp và giá trị cốt lõi của gói..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trạng thái phát hành
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlanStatus)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE - Người dùng có thể mua)</option>
                  <option value="DRAFT">Bản nháp (DRAFT - Đang thử nghiệm nội bộ)</option>
                  <option value="ARCHIVED">Lưu trữ (ARCHIVED - Ẩn khỏi bảng giá)</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Gói nổi bật (Highlight Card)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={prioritySupport}
                    onChange={(e) => setPrioritySupport(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Hỗ trợ VIP 24/7 ưu tiên</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Pricing & Tokens */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} />
              Giá bán & Định mức Token tháng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá tháng (VND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyPriceVND}
                  onChange={(e) => setMonthlyPriceVND(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {monthlyPriceVND.toLocaleString('vi-VN')} đ / tháng
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá năm (VND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={yearlyPriceVND}
                  onChange={(e) => setYearlyPriceVND(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {yearlyPriceVND.toLocaleString('vi-VN')} đ / năm
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn mức Token tháng
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={tokenMonthlyQuota}
                  onChange={(e) => setTokenMonthlyQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden font-bold text-blue-700"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {tokenMonthlyQuota.toLocaleString()} AI Tokens
                </span>
              </div>
            </div>
          </div>

          {/* 3. Feature Limits */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Giới hạn lượt dùng tính năng cốt lõi (Nhập số hoặc "unlimited")
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trích xuất CV ATS
                </label>
                <input
                  type="text"
                  value={cvParsingLimit}
                  onChange={(e) => setCvParsingLimit(e.target.value)}
                  placeholder="3 hoặc unlimited"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Đối sánh CV–Job Fit
                </label>
                <input
                  type="text"
                  value={cvJobFitLimit}
                  onChange={(e) => setCvJobFitLimit(e.target.value)}
                  placeholder="5 hoặc unlimited"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Hỏi đáp Trợ lý AI
                </label>
                <input
                  type="text"
                  value={aiAssistantQueriesLimit}
                  onChange={(e) => setAiAssistantQueriesLimit(e.target.value)}
                  placeholder="15 hoặc unlimited"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tạo Thư ứng tuyển
                </label>
                <input
                  type="text"
                  value={coverLetterGenLimit}
                  onChange={(e) => setCoverLetterGenLimit(e.target.value)}
                  placeholder="5 hoặc unlimited"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phỏng vấn STAR
                </label>
                <input
                  type="text"
                  value={mockInterviewLimit}
                  onChange={(e) => setMockInterviewLimit(e.target.value)}
                  placeholder="1 hoặc unlimited"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Giảm giá Tư vấn 1-on-1 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={consultantDiscountPercent}
                  onChange={(e) => setConsultantDiscountPercent(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 4. API & AI Models Allocation */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} />
              Chính sách API Rate Limits & Quyền truy cập mô hình
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới hạn RPM (Requests Per Minute)
                </label>
                <input
                  type="number"
                  min="1"
                  value={apiRateLimitRPM}
                  onChange={(e) => setApiRateLimitRPM(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới hạn TPM (Tokens Per Minute)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={apiRateLimitTPM}
                  onChange={(e) => setApiRateLimitTPM(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Các mô hình AI được phép kích hoạt cho gói này:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map((m) => {
                  const isChecked = supportedModels.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      onClick={() => handleToggleModel(m.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none text-xs ${
                        isChecked
                          ? 'border-blue-300 bg-blue-50/60 font-semibold text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{m.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Features Checklist */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles size={14} />
              Danh sách quyền lợi hiển thị trên thẻ (Features Checklist)
            </h3>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Nhập quyền lợi mới (Ví dụ: Không giới hạn lưu trữ CV chuẩn ATS)..."
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                Thêm
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <Check size={15} />
                <span>{isEdit ? 'Cập nhật gói cước' : 'Tạo gói cước ngay'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
