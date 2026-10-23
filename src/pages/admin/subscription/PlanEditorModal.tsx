import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AdminSubscriptionPlan, PlanStatus } from '../../../types/subscriptionManagement';
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

function Field({ label, hint, children, className = '' }: { label: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={fieldLabel}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

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

  const limitFields: [string, string, (v: string) => void, string][] = [
    ['Trích xuất CV ATS', cvParsingLimit, setCvParsingLimit, '3 hoặc unlimited'],
    ['Đối sánh CV – việc', cvJobFitLimit, setCvJobFitLimit, '5 hoặc unlimited'],
    ['Hỏi trợ lý AI', aiAssistantQueriesLimit, setAiAssistantQueriesLimit, '15 hoặc unlimited'],
    ['Tạo thư ứng tuyển', coverLetterGenLimit, setCoverLetterGenLimit, '5 hoặc unlimited'],
    ['Phỏng vấn STAR', mockInterviewLimit, setMockInterviewLimit, '1 hoặc unlimited'],
  ];

  return (
    <Modal
      eyebrow={isEdit ? 'Chỉnh sửa gói cước' : 'Gói cước mới'}
      title={isEdit ? `${initialPlan?.name}.` : 'Tạo gói cước.'}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`${textLink} text-slate-600`}>
            Huỷ
          </button>
          <button type="submit" form="plan-editor-form" disabled={isSubmitting} className={primaryButton}>
            {isSubmitting ? 'Đang lưu…' : isEdit ? 'Cập nhật gói' : 'Tạo gói'}
          </button>
        </>
      }
    >
      <form id="plan-editor-form" onSubmit={handleSubmit} className="space-y-10">
        {error && <p className="border-l-2 border-danger pl-4 text-[13px] text-danger">{error}</p>}

        <section>
          <SubHead title="01  Thông tin chung" />
          <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
            <Field label={<>Tên gói <span className="text-danger">*</span></>}>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Chuyên nghiệp Pro" className={underlineInput} />
            </Field>
            <Field label="Nhãn hiển thị">
              <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Phổ biến nhất, Đặc quyền VIP" className={underlineInput} />
            </Field>
            <Field label="Mô tả ngắn" className="md:col-span-2">
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Gói dành cho ai và giá trị chính" className={`${underlineInput} resize-none`} />
            </Field>
            <Field label="Trạng thái phát hành" className="md:col-span-2">
              <select value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)} className={underlineSelect}>
                <option value="ACTIVE">Đang bán · người dùng có thể mua</option>
                <option value="DRAFT">Bản nháp · thử nghiệm nội bộ</option>
                <option value="ARCHIVED">Lưu trữ · ẩn khỏi bảng giá</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
            <CheckBox checked={highlight} onChange={setHighlight} label="Gói nổi bật" description="Đánh dấu “Đề xuất” trên bảng giá" />
            <CheckBox checked={prioritySupport} onChange={setPrioritySupport} label="Hỗ trợ ưu tiên 24/7" />
          </div>
        </section>

        <section>
          <SubHead title="02  Giá bán & token" />
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <Field label="Giá tháng (VNĐ)" hint={`${monthlyPriceVND.toLocaleString('vi-VN')}đ / tháng`}>
              <input type="number" min="0" step="1000" value={monthlyPriceVND} onChange={(e) => setMonthlyPriceVND(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
            <Field label="Giá năm (VNĐ)" hint={`${yearlyPriceVND.toLocaleString('vi-VN')}đ / năm`}>
              <input type="number" min="0" step="10000" value={yearlyPriceVND} onChange={(e) => setYearlyPriceVND(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
            <Field label="Token mỗi tháng" hint={`${tokenMonthlyQuota.toLocaleString('vi-VN')} token`}>
              <input type="number" min="1000" step="5000" value={tokenMonthlyQuota} onChange={(e) => setTokenMonthlyQuota(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
          </div>
        </section>

        <section>
          <SubHead title="03  Giới hạn tính năng" action={<span className="text-[13px] text-slate-500">Nhập số hoặc “unlimited”</span>} />
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            {limitFields.map(([label, value, set, ph]) => (
              <Field key={label} label={label}>
                <input type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={ph} className={underlineInput} />
              </Field>
            ))}
            <Field label="Giảm giá tư vấn 1-1 (%)">
              <input type="number" min="0" max="100" value={consultantDiscountPercent} onChange={(e) => setConsultantDiscountPercent(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
          </div>
        </section>

        <section>
          <SubHead title="04  API & mô hình" />
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Field label="Giới hạn RPM (request / phút)">
              <input type="number" min="1" value={apiRateLimitRPM} onChange={(e) => setApiRateLimitRPM(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
            <Field label="Giới hạn TPM (token / phút)">
              <input type="number" min="1000" step="5000" value={apiRateLimitTPM} onChange={(e) => setApiRateLimitTPM(Number(e.target.value))} className={`${underlineInput} tabular-nums`} />
            </Field>
          </div>
          <p className={`${fieldLabel} mt-6`}>Mô hình được phép dùng (giữ ít nhất 1)</p>
          <div className="mt-1 grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
            {AVAILABLE_MODELS.map((m) => (
              <CheckBox key={m.id} checked={supportedModels.includes(m.id)} onChange={() => handleToggleModel(m.id)} label={m.name} />
            ))}
          </div>
        </section>

        <section>
          <SubHead title="05  Quyền lợi hiển thị" action={<span className="text-[13px] text-slate-500">{features.length} mục</span>} />
          <ol>
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-baseline gap-4 border-b border-border py-3 text-[15px]">
                <span className="w-6 shrink-0 text-xs tabular-nums text-slate-500">{String(idx + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 text-ink">{feat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  aria-label={`Xoá quyền lợi ${feat}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-danger"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-end gap-6">
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
              placeholder="Thêm quyền lợi, ví dụ: Không giới hạn lưu trữ CV"
              className={`${underlineInput} flex-1`}
            />
            <button type="button" onClick={handleAddFeature} disabled={!newFeatureText.trim()} className={`${textLink} mb-2.5 text-ink`}>
              Thêm
            </button>
          </div>
        </section>
      </form>
    </Modal>
  );
};
