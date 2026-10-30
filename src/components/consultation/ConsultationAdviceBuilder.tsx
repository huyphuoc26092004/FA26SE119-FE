import { useState, type ReactNode } from 'react';
import { Check, Copy, Plus, X } from 'lucide-react';
import type {
  ConsultationAdvicePillars,
  ConsultationTopic,
  StarBulletImprovement,
} from '../../types/consultation';
import { generateAiConsultationAdviceDraft } from '../../services/consultationService';
import { useTranslation } from '../../i18n';
import {
  Modal,
  Toast,
  UnderlineTabs,
  fieldLabel,
  pad2,
  primaryButton,
  smallPrimary,
  textLink,
  underlineInput,
} from './ConsultantKit';

interface ConsultationAdviceBuilderProps {
  initialAdvice: ConsultationAdvicePillars;
  candidateName: string;
  candidateRole: string;
  topic?: ConsultationTopic;
  /** Cuộc tư vấn đang mở và CV của ứng viên, cần để AI đánh giá CV làm bản nháp. */
  consultationId?: string;
  resumeId?: string;
  onSave?: (advice: ConsultationAdvicePillars) => void | Promise<void>;
  isSaving?: boolean;
  readOnly?: boolean;
}

type Pillar = 'cv' | 'career' | 'salary' | 'interview';

const copy = {
  vi: {
    intro: 'Bốn nhóm lời khuyên gửi cho ứng viên: CV, định hướng, lương và phỏng vấn. Chỉnh từng mục rồi lưu một lần.',
    draft: 'Gợi ý bản nháp',
    copy: 'Sao chép',
    preview: 'Xem & in phiếu',
    save: 'Lưu lời khuyên',
    saving: 'Đang lưu…',
    pillars: { cv: 'CV & ATS', career: 'Định hướng', salary: 'Lương & đàm phán', interview: 'Phỏng vấn' },
    draftDone: 'AI đã đánh giá CV và điền bản nháp phần CV & ATS.',
    add: 'Thêm',
    remove: 'Xoá',
    empty: 'Chưa có mục nào.',
    cvSummary: 'Đánh giá tổng thể CV',
    star: 'Viết lại thành tựu theo STAR',
    starHint: 'Chuyển gạch đầu dòng mô tả nhiệm vụ thành kết quả đo lường được (Situation, Task, Action, Result).',
    addStar: 'Thêm cặp viết lại',
    before: 'Trước',
    after: 'Sau (STAR)',
    keywords: 'Từ khoá cần bổ sung',
    keywordPlaceholder: 'Thêm từ khoá…',
    formatting: 'Bố cục & định dạng',
    cvActions: 'Việc cần làm với CV',
    cvActionPlaceholder: 'Thêm đầu việc cải thiện CV…',
    positioning: 'Định vị năng lực',
    currentLevel: 'Cấp bậc hiện tại',
    targetLevel: 'Cấp bậc mục tiêu',
    strategy: 'Chiến lược định vị hồ sơ',
    shortTerm: 'Ngắn hạn (1–3 tháng)',
    shortPlaceholder: 'Thêm cột mốc ngắn hạn…',
    longTerm: 'Trung & dài hạn (6–12 tháng)',
    longPlaceholder: 'Thêm cột mốc dài hạn…',
    branding: 'Thương hiệu cá nhân',
    brandingPlaceholder: 'Thêm khuyến nghị…',
    range: 'Khoảng lương khuyến nghị',
    rangeHint: 'Dựa trên dữ liệu thị trường công nghệ và năng lực thực tế của ứng viên.',
    min: 'Mức sàn',
    target: 'Mục tiêu',
    max: 'Mức trần',
    tactics: 'Chiến thuật thương lượng',
    tacticsPlaceholder: 'Thêm chiến thuật…',
    perks: 'Đòn bẩy gói tổng thể',
    perksPlaceholder: 'Thêm quyền lợi…',
    script: 'Kịch bản phản hồi mẫu',
    copyScript: 'Sao chép kịch bản',
    copiedScript: 'Đã sao chép',
    readiness: 'Mức sẵn sàng phỏng vấn',
    readinessHint: 'Tư duy kỹ thuật, phản xạ tình huống và phong thái giao tiếp.',
    behavioral: 'Câu hỏi hành vi',
    behavioralPlaceholder: 'Thêm mẹo…',
    technical: 'Phỏng vấn kỹ thuật & live-coding',
    technicalPlaceholder: 'Thêm lưu ý…',
    reverse: 'Câu nên hỏi lại nhà tuyển dụng',
    reversePlaceholder: 'Thêm câu hỏi…',
    pitfalls: 'Điều cần tránh',
    pitfallsPlaceholder: 'Thêm lỗi cần tránh…',
    starModal: 'Thêm cặp viết lại STAR',
    starBefore: 'Mô tả ban đầu trong CV *',
    starBeforePh: 'VD: Phát triển các component React cho hệ thống thanh toán…',
    starAfter: 'Viết lại theo STAR, có số liệu *',
    starAfterPh:
      'VD: Tái cấu trúc 18+ component bằng React 19, giảm 45% thời gian render và tăng 18.5% tỉ lệ hoàn tất đơn…',
    starNote: 'Ghi chú (không bắt buộc)',
    starNotePh: 'VD: Nhấn mạnh kết quả kinh doanh thay vì chỉ việc kỹ thuật.',
    cancel: 'Huỷ',
    addToReport: 'Thêm vào phiếu',
    report: 'Phiếu tư vấn sự nghiệp',
    print: 'In / xuất PDF',
    close: 'Đóng',
    consultant: 'Cố vấn',
    date: 'Ngày lập',
    candidate: 'Ứng viên',
    role: 'Vị trí mục tiêu',
    r1: 'Cải thiện CV & ATS',
    r2: 'Định hướng nghề nghiệp',
    r3: 'Lương & đàm phán',
    r4: (n: number) => `Phỏng vấn · sẵn sàng ${n}/10`,
    positioningLabel: 'Định vị',
    reverseLabel: 'Hỏi lại NTD',
  },
  en: {
    intro: 'Four groups of advice for the candidate: CV, direction, salary and interview. Edit each part, then save once.',
    draft: 'Suggest a draft',
    copy: 'Copy',
    preview: 'Preview & print',
    save: 'Save advice',
    saving: 'Saving…',
    pillars: { cv: 'CV & ATS', career: 'Direction', salary: 'Salary', interview: 'Interview' },
    draftDone: 'AI reviewed the CV and drafted the CV & ATS part.',
    add: 'Add',
    remove: 'Remove',
    empty: 'Nothing here yet.',
    cvSummary: 'Overall CV assessment',
    star: 'STAR rewrites',
    starHint: 'Turn task-style bullets into measurable results (Situation, Task, Action, Result).',
    addStar: 'Add a rewrite',
    before: 'Before',
    after: 'After (STAR)',
    keywords: 'Keywords to add',
    keywordPlaceholder: 'Add keyword…',
    formatting: 'Layout & formatting',
    cvActions: 'CV action items',
    cvActionPlaceholder: 'Add a CV task…',
    positioning: 'Positioning',
    currentLevel: 'Current level',
    targetLevel: 'Target level',
    strategy: 'Positioning strategy',
    shortTerm: 'Short term (1–3 months)',
    shortPlaceholder: 'Add a milestone…',
    longTerm: 'Mid & long term (6–12 months)',
    longPlaceholder: 'Add a milestone…',
    branding: 'Personal brand',
    brandingPlaceholder: 'Add a recommendation…',
    range: 'Recommended range',
    rangeHint: 'Based on tech market data and the candidate’s actual level.',
    min: 'Floor',
    target: 'Target',
    max: 'Ceiling',
    tactics: 'Negotiation tactics',
    tacticsPlaceholder: 'Add a tactic…',
    perks: 'Package levers',
    perksPlaceholder: 'Add a perk…',
    script: 'Sample reply script',
    copyScript: 'Copy script',
    copiedScript: 'Copied',
    readiness: 'Interview readiness',
    readinessHint: 'Technical thinking, situational reflexes and communication.',
    behavioral: 'Behavioral questions',
    behavioralPlaceholder: 'Add a tip…',
    technical: 'Technical & live coding',
    technicalPlaceholder: 'Add a note…',
    reverse: 'Questions to ask the employer',
    reversePlaceholder: 'Add a question…',
    pitfalls: 'Pitfalls to avoid',
    pitfallsPlaceholder: 'Add a pitfall…',
    starModal: 'Add a STAR rewrite',
    starBefore: 'Original CV line *',
    starBeforePh: 'E.g. Built React components for the payment system…',
    starAfter: 'STAR rewrite with numbers *',
    starAfterPh: 'E.g. Refactored 18+ components in React 19, cutting render time 45% and lifting checkout completion 18.5%…',
    starNote: 'Note (optional)',
    starNotePh: 'E.g. Stress business results, not just technical work.',
    cancel: 'Cancel',
    addToReport: 'Add to report',
    report: 'Career consultation report',
    print: 'Print / PDF',
    close: 'Close',
    consultant: 'Consultant',
    date: 'Date',
    candidate: 'Candidate',
    role: 'Target role',
    r1: 'CV & ATS',
    r2: 'Career direction',
    r3: 'Salary & negotiation',
    r4: (n: number) => `Interview · readiness ${n}/10`,
    positioningLabel: 'Positioning',
    reverseLabel: 'Ask the employer',
  },
};

// ─── Small editing pieces ───────────────────────────────────────────────────

function Block({ title, hint, action, children }: { title: ReactNode; hint?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-2">
        <h4 className="text-[15px] font-medium text-ink">{title}</h4>
        {action}
      </div>
      {hint && <p className="mt-2 text-[13px] leading-5 text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

/** Numbered divider rows with remove links and an underlined add field. */
function ListEditor({
  items,
  onChange,
  placeholder,
  readOnly,
  addLabel,
  removeLabel,
  emptyLabel,
  marker = 'number',
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  readOnly: boolean;
  addLabel: string;
  removeLabel: string;
  emptyLabel: string;
  marker?: 'number' | 'dash' | 'warn';
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft('');
  };
  return (
    <>
      {items.length === 0 ? (
        <p className="border-b border-border py-3 text-[13px] text-slate-400">{emptyLabel}</p>
      ) : (
        <ol>
          {items.map((item, idx) => (
            <li key={idx} className="group flex items-start gap-3 border-b border-border py-2.5">
              {marker === 'number' ? (
                <span className="w-5 shrink-0 pt-0.5 text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</span>
              ) : (
                <span
                  className={`mt-[0.7rem] h-px w-3 shrink-0 ${marker === 'warn' ? 'bg-danger' : 'bg-slate-400'}`}
                  aria-hidden
                />
              )}
              <span className="min-w-0 flex-1 text-sm leading-6 text-ink">{item}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, i) => i !== idx))}
                  className="shrink-0 pt-0.5 text-xs text-slate-400 transition-colors hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  {removeLabel}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <div className="mt-1 flex items-end gap-4">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className={`${underlineInput} border-slate-200 text-sm`}
          />
          <button type="button" onClick={add} disabled={!draft.trim()} className={`${textLink} mb-2 shrink-0 text-ink`}>
            <Plus size={13} />
            {addLabel}
          </button>
        </div>
      )}
    </>
  );
}

const textareaClass =
  'mt-2 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] leading-7 text-ink outline-none placeholder:text-slate-400 focus:border-brand disabled:text-slate-600';

export default function ConsultationAdviceBuilder({
  initialAdvice,
  candidateName,
  candidateRole,
  consultationId,
  resumeId,
  onSave,
  isSaving = false,
  readOnly = false,
}: ConsultationAdviceBuilderProps) {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;

  const [activePillar, setActivePillar] = useState<Pillar>('cv');
  const [advice, setAdvice] = useState<ConsultationAdvicePillars>(initialAdvice);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // New STAR form modal state
  const [showNewStarModal, setShowNewStarModal] = useState(false);
  const [starBefore, setStarBefore] = useState('');
  const [starAfter, setStarAfter] = useState('');
  const [starNote, setStarNote] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Generate AI Draft
  const [drafting, setDrafting] = useState(false);
  const handleGenerateAiDraft = async () => {
    setDrafting(true);
    try {
      setAdvice(await generateAiConsultationAdviceDraft(consultationId ?? '', resumeId ?? '', advice));
      triggerToast(c.draftDone);
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : c.draftDone);
    } finally {
      setDrafting(false);
    }
  };

  // Copy Full Advice Summary to Clipboard
  const handleCopyAdviceSummary = () => {
    const text = `
=== PHIẾU LỜI KHUYÊN TƯ VẤN SỰ NGHIỆP - CAREERPILOT ===
Ứng viên: ${candidateName} | Vị trí mục tiêu: ${candidateRole}
Cố vấn phụ trách: ${advice.consultantName || 'Taylor Lee'}
Thời gian: ${new Date(advice.lastUpdated || Date.now()).toLocaleDateString()}

1. CẢI THIỆN CV & ATS:
- Đánh giá: ${advice.cvAdvice.summary}
- Từ khóa ATS cần bổ sung: ${advice.cvAdvice.missingKeywordsToInject.join(', ')}
- Hành động trọng tâm:
${advice.cvAdvice.actionItems.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}

2. ĐỊNH HƯỚNG NGHỀ NGHIỆP:
- Định vị: ${advice.careerAdvice.currentLevel} -> ${advice.careerAdvice.targetLevel}
- Tóm tắt chiến lược: ${advice.careerAdvice.recommendedPositioning}
- Lộ trình 1-3 tháng:
${advice.careerAdvice.shortTermRoadmap.map((r) => `  * ${r}`).join('\n')}

3. TƯ VẤN MỨC LƯƠNG & ĐÀM PHÁN:
- Dải lương khuyến nghị: ${advice.salaryAdvice.minSalary.toLocaleString()} - ${advice.salaryAdvice.targetSalary.toLocaleString()} - ${advice.salaryAdvice.maxSalary.toLocaleString()} ${advice.salaryAdvice.currency}
- Phân vị thị trường: ${advice.salaryAdvice.marketPercentile}
- Chiến lược deal:
${advice.salaryAdvice.negotiationTactics.map((n) => `  - ${n}`).join('\n')}

4. KỸ NĂNG PHỎNG VẤN:
- Điểm sẵn sàng: ${advice.interviewAdvice.overallReadiness}/10
- Lưu ý phỏng vấn kỹ thuật:
${advice.interviewAdvice.technicalTips.map((tip) => `  + ${tip}`).join('\n')}
- Câu hỏi nên hỏi ngược lại NTD:
${advice.interviewAdvice.reverseQuestions.map((q) => `  ? ${q}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    triggerToast(t('consultation.adviceCopiedSuccess'));
  };

  // Save handler
  const handleSave = async () => {
    if (onSave) {
      await onSave(advice);
    }
    triggerToast(t('consultation.adviceSavedSuccess'));
  };

  // Star add
  const handleAddStar = () => {
    if (starBefore.trim() && starAfter.trim()) {
      const newStar: StarBulletImprovement = {
        id: `star-${Date.now()}`,
        before: starBefore.trim(),
        afterStar: starAfter.trim(),
        note: starNote.trim() || undefined,
      };
      setAdvice({
        ...advice,
        cvAdvice: {
          ...advice.cvAdvice,
          starImprovements: [...advice.cvAdvice.starImprovements, newStar],
        },
      });
      setStarBefore('');
      setStarAfter('');
      setStarNote('');
      setShowNewStarModal(false);
    }
  };

  const handleRemoveStar = (id: string) => {
    setAdvice({
      ...advice,
      cvAdvice: {
        ...advice.cvAdvice,
        starImprovements: advice.cvAdvice.starImprovements.filter((s) => s.id !== id),
      },
    });
  };

  // Field updaters
  const setCv = (patch: Partial<ConsultationAdvicePillars['cvAdvice']>) =>
    setAdvice({ ...advice, cvAdvice: { ...advice.cvAdvice, ...patch } });
  const setCareer = (patch: Partial<ConsultationAdvicePillars['careerAdvice']>) =>
    setAdvice({ ...advice, careerAdvice: { ...advice.careerAdvice, ...patch } });
  const setSalary = (patch: Partial<ConsultationAdvicePillars['salaryAdvice']>) =>
    setAdvice({ ...advice, salaryAdvice: { ...advice.salaryAdvice, ...patch } });
  const setInterview = (patch: Partial<ConsultationAdvicePillars['interviewAdvice']>) =>
    setAdvice({ ...advice, interviewAdvice: { ...advice.interviewAdvice, ...patch } });

  const listProps = { readOnly, addLabel: c.add, removeLabel: c.remove, emptyLabel: c.empty };
  const sal = advice.salaryAdvice;
  const span = Math.max(1, sal.maxSalary - sal.minSalary);
  const targetPos = Math.max(0, Math.min(100, ((sal.targetSalary - sal.minSalary) / span) * 100));

  return (
    <div>
      <Toast message={toastMsg} />

      {/* Intro + actions */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <p className="max-w-xl text-[15px] leading-7 text-slate-600">{c.intro}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {!readOnly && (
            <button type="button" onClick={() => void handleGenerateAiDraft()} disabled={drafting} className={`${textLink} text-slate-700`}>
              {c.draft}
            </button>
          )}
          <button type="button" onClick={handleCopyAdviceSummary} className={`${textLink} text-slate-700`}>
            {c.copy}
          </button>
          <button type="button" onClick={() => setShowReportModal(true)} className={`${textLink} text-slate-700`}>
            {c.preview}
          </button>
          {!readOnly && (
            <button type="button" onClick={handleSave} disabled={isSaving} className={smallPrimary}>
              {isSaving ? c.saving : c.save}
            </button>
          )}
        </div>
      </div>

      {/* Pillar tabs */}
      <div className="mt-6">
        <UnderlineTabs<Pillar>
          value={activePillar}
          onChange={setActivePillar}
          tabs={[
            {
              value: 'cv',
              label: `01 ${c.pillars.cv}`,
            },
            {
              value: 'career',
              label: `02 ${c.pillars.career}`,
            },
            {
              value: 'salary',
              label: `03 ${c.pillars.salary}`,
            },
            {
              value: 'interview',
              label: `04 ${c.pillars.interview}`,
            },
          ]}
        />
      </div>

      <div className="mt-8 space-y-10">
        {/* ── CV ─────────────────────────────────────────────── */}
        {activePillar === 'cv' && (
          <>
            <Block title={c.cvSummary}>
              <textarea
                rows={3}
                value={advice.cvAdvice.summary}
                disabled={readOnly}
                onChange={(e) => setCv({ summary: e.target.value })}
                className={textareaClass}
              />
            </Block>

            <Block
              title={c.star}
              hint={c.starHint}
              action={
                !readOnly && (
                  <button type="button" onClick={() => setShowNewStarModal(true)} className={`${textLink} text-ink`}>
                    <Plus size={13} />
                    {c.addStar}
                  </button>
                )
              }
            >
              {advice.cvAdvice.starImprovements.length === 0 ? (
                <p className="border-b border-border py-3 text-[13px] text-slate-400">{c.empty}</p>
              ) : (
                <ol>
                  {advice.cvAdvice.starImprovements.map((star, idx) => (
                    <li key={star.id} className="border-b border-border py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-xs tabular-nums text-slate-400">#{idx + 1}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStar(star.id)}
                            className="text-xs text-slate-400 transition-colors hover:text-danger"
                          >
                            {c.remove}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 grid gap-x-8 gap-y-3 md:grid-cols-2">
                        <div>
                          <p className="text-[13px] text-slate-500">{c.before}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500 line-through decoration-slate-300">
                            {star.before}
                          </p>
                        </div>
                        <div className="md:border-l md:border-border md:pl-8">
                          <p className="text-[13px] text-brand">{c.after}</p>
                          <p className="mt-1 text-sm leading-6 text-ink">{star.afterStar}</p>
                        </div>
                      </div>
                      {star.note && <p className="mt-3 text-[13px] leading-5 text-slate-600">— {star.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </Block>

            <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              <Block title={c.keywords}>
                <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border py-3">
                  {advice.cvAdvice.missingKeywordsToInject.length === 0 && (
                    <span className="text-[13px] text-slate-400">{c.empty}</span>
                  )}
                  {advice.cvAdvice.missingKeywordsToInject.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-sm text-ink">
                      {kw}
                      {!readOnly && (
                        <button
                          type="button"
                          aria-label={`${c.remove} ${kw}`}
                          onClick={() =>
                            setCv({
                              missingKeywordsToInject: advice.cvAdvice.missingKeywordsToInject.filter(
                                (_, idx) => idx !== i,
                              ),
                            })
                          }
                          className="text-slate-400 transition-colors hover:text-danger"
                        >
                          <X size={12} />
                        </button>
                      )}
                      {i < advice.cvAdvice.missingKeywordsToInject.length - 1 && (
                        <span className="ml-3 text-slate-300">·</span>
                      )}
                    </span>
                  ))}
                </div>
                {!readOnly && (
                  <KeywordAdder
                    placeholder={c.keywordPlaceholder}
                    addLabel={c.add}
                    onAdd={(kw) =>
                      setCv({ missingKeywordsToInject: [...advice.cvAdvice.missingKeywordsToInject, kw] })
                    }
                  />
                )}
              </Block>

              <Block title={c.formatting}>
                <ul>
                  {advice.cvAdvice.formattingTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 border-b border-border py-2.5 text-sm leading-6 text-ink">
                      <Check size={14} className="mt-1 shrink-0 text-brand" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>

            <Block title={c.cvActions}>
              <ListEditor
                {...listProps}
                items={advice.cvAdvice.actionItems}
                onChange={(actionItems) => setCv({ actionItems })}
                placeholder={c.cvActionPlaceholder}
              />
            </Block>
          </>
        )}

        {/* ── Career ─────────────────────────────────────────── */}
        {activePillar === 'career' && (
          <>
            <Block title={c.positioning}>
              <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                <label className="block">
                  <span className={fieldLabel}>{c.currentLevel}</span>
                  <input
                    type="text"
                    value={advice.careerAdvice.currentLevel}
                    disabled={readOnly}
                    onChange={(e) => setCareer({ currentLevel: e.target.value })}
                    className={underlineInput}
                  />
                </label>
                <span className="hidden pb-3 text-slate-400 sm:block">→</span>
                <label className="block">
                  <span className={fieldLabel}>{c.targetLevel}</span>
                  <input
                    type="text"
                    value={advice.careerAdvice.targetLevel}
                    disabled={readOnly}
                    onChange={(e) => setCareer({ targetLevel: e.target.value })}
                    className={`${underlineInput} text-brand`}
                  />
                </label>
              </div>
              <label className="mt-5 block">
                <span className={fieldLabel}>{c.strategy}</span>
                <textarea
                  rows={3}
                  value={advice.careerAdvice.recommendedPositioning}
                  disabled={readOnly}
                  onChange={(e) => setCareer({ recommendedPositioning: e.target.value })}
                  className={textareaClass}
                />
              </label>
            </Block>

            <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              <Block title={c.shortTerm}>
                <ListEditor
                  {...listProps}
                  items={advice.careerAdvice.shortTermRoadmap}
                  onChange={(shortTermRoadmap) => setCareer({ shortTermRoadmap })}
                  placeholder={c.shortPlaceholder}
                />
              </Block>
              <Block title={c.longTerm}>
                <ListEditor
                  {...listProps}
                  items={advice.careerAdvice.longTermRoadmap}
                  onChange={(longTermRoadmap) => setCareer({ longTermRoadmap })}
                  placeholder={c.longPlaceholder}
                />
              </Block>
            </div>

            <Block title={c.branding}>
              <ListEditor
                {...listProps}
                marker="dash"
                items={advice.careerAdvice.strategicRecommendations}
                onChange={(strategicRecommendations) => setCareer({ strategicRecommendations })}
                placeholder={c.brandingPlaceholder}
              />
            </Block>
          </>
        )}

        {/* ── Salary ─────────────────────────────────────────── */}
        {activePillar === 'salary' && (
          <>
            <Block
              title={c.range}
              hint={c.rangeHint}
              action={<span className="text-[13px] text-brand">{sal.marketPercentile}</span>}
            >
              <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                {(
                  [
                    ['minSalary', c.min],
                    ['targetSalary', c.target],
                    ['maxSalary', c.max],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className={`${fieldLabel} ${key === 'targetSalary' ? '!text-brand' : ''}`}>{label}</span>
                    <span className="flex items-baseline gap-2 border-b border-slate-300 focus-within:border-brand">
                      <input
                        type="number"
                        value={sal[key]}
                        disabled={readOnly}
                        onChange={(e) => setSalary({ [key]: Number(e.target.value) } as Partial<typeof sal>)}
                        className={`w-full min-w-0 border-0 bg-transparent px-0 py-2 text-[clamp(1.25rem,2vw,1.625rem)] tabular-nums outline-none ${
                          key === 'targetSalary' ? 'text-brand' : 'text-ink'
                        }`}
                      />
                      <span className="shrink-0 text-xs text-slate-500">{sal.currency}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <div className="relative h-[3px] w-full bg-slate-200">
                  <div className="absolute inset-y-0 left-0 bg-brand-200" style={{ width: '100%' }} />
                  <span
                    className="absolute -top-[5px] h-[13px] w-[3px] -translate-x-1/2 bg-brand"
                    style={{ left: `${targetPos}%` }}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-500">
                  <span>{sal.minSalary.toLocaleString()}</span>
                  <span className="text-brand">{sal.targetSalary.toLocaleString()}</span>
                  <span>{sal.maxSalary.toLocaleString()}</span>
                </div>
              </div>
            </Block>

            <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              <Block title={c.tactics}>
                <ListEditor
                  {...listProps}
                  items={sal.negotiationTactics}
                  onChange={(negotiationTactics) => setSalary({ negotiationTactics })}
                  placeholder={c.tacticsPlaceholder}
                />
              </Block>
              <Block title={c.perks}>
                <ListEditor
                  {...listProps}
                  marker="dash"
                  items={sal.compensationPackageTips}
                  onChange={(compensationPackageTips) => setSalary({ compensationPackageTips })}
                  placeholder={c.perksPlaceholder}
                />
              </Block>
            </div>

            {sal.sampleScript && (
              <Block
                title={c.script}
                action={
                  <button
                    type="button"
                    onClick={() => {
                      if (sal.sampleScript) {
                        navigator.clipboard.writeText(sal.sampleScript);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2000);
                      }
                    }}
                    className={`${textLink} text-[13px] text-slate-600`}
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    {copiedScript ? c.copiedScript : c.copyScript}
                  </button>
                }
              >
                <textarea
                  rows={3}
                  value={sal.sampleScript}
                  disabled={readOnly}
                  onChange={(e) => setSalary({ sampleScript: e.target.value })}
                  className="mt-3 w-full resize-y border-0 border-l-2 border-brand bg-transparent py-1 pl-4 pr-0 text-[15px] leading-7 text-slate-700 outline-none disabled:text-slate-600"
                />
              </Block>
            )}
          </>
        )}

        {/* ── Interview ──────────────────────────────────────── */}
        {activePillar === 'interview' && (
          <>
            <Block title={c.readiness} hint={c.readinessHint}>
              <div className="mt-4 flex items-center gap-6">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={advice.interviewAdvice.overallReadiness}
                  disabled={readOnly}
                  onChange={(e) => setInterview({ overallReadiness: Number(e.target.value) })}
                  className="w-full max-w-sm cursor-pointer"
                />
                <span className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none tabular-nums text-ink">
                  {advice.interviewAdvice.overallReadiness}
                  <span className="text-sm text-slate-400">/10</span>
                </span>
              </div>
            </Block>

            <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
              <Block title={c.behavioral}>
                <ListEditor
                  {...listProps}
                  items={advice.interviewAdvice.behavioralTips}
                  onChange={(behavioralTips) => setInterview({ behavioralTips })}
                  placeholder={c.behavioralPlaceholder}
                />
              </Block>
              <Block title={c.technical}>
                <ListEditor
                  {...listProps}
                  items={advice.interviewAdvice.technicalTips}
                  onChange={(technicalTips) => setInterview({ technicalTips })}
                  placeholder={c.technicalPlaceholder}
                />
              </Block>
              <Block title={c.reverse}>
                <ListEditor
                  {...listProps}
                  marker="dash"
                  items={advice.interviewAdvice.reverseQuestions}
                  onChange={(reverseQuestions) => setInterview({ reverseQuestions })}
                  placeholder={c.reversePlaceholder}
                />
              </Block>
              <Block title={c.pitfalls}>
                <ListEditor
                  {...listProps}
                  marker="warn"
                  items={advice.interviewAdvice.pitfallsToAvoid}
                  onChange={(pitfallsToAvoid) => setInterview({ pitfallsToAvoid })}
                  placeholder={c.pitfallsPlaceholder}
                />
              </Block>
            </div>
          </>
        )}
      </div>

      {/* Add STAR */}
      {showNewStarModal && (
        <Modal
          title={c.starModal}
          width="max-w-lg"
          onClose={() => setShowNewStarModal(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowNewStarModal(false)} className={`${textLink} text-slate-600`}>
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={handleAddStar}
                disabled={!starBefore.trim() || !starAfter.trim()}
                className={primaryButton}
              >
                {c.addToReport}
              </button>
            </>
          }
        >
          <div className="space-y-6">
            <label className="block">
              <span className={fieldLabel}>{c.starBefore}</span>
              <textarea
                rows={2}
                value={starBefore}
                onChange={(e) => setStarBefore(e.target.value)}
                placeholder={c.starBeforePh}
                className={textareaClass}
              />
            </label>
            <label className="block">
              <span className={`${fieldLabel} !text-brand`}>{c.starAfter}</span>
              <textarea
                rows={3}
                value={starAfter}
                onChange={(e) => setStarAfter(e.target.value)}
                placeholder={c.starAfterPh}
                className={textareaClass}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.starNote}</span>
              <input
                type="text"
                value={starNote}
                onChange={(e) => setStarNote(e.target.value)}
                placeholder={c.starNotePh}
                className={underlineInput}
              />
            </label>
          </div>
        </Modal>
      )}

      {/* Report preview */}
      {showReportModal && (
        <Modal
          width="max-w-3xl"
          eyebrow={t('consultation.reportPreviewTitle')}
          title={c.report}
          onClose={() => setShowReportModal(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowReportModal(false)} className={`${textLink} text-slate-600`}>
                {c.close}
              </button>
              <button type="button" onClick={() => window.print()} className={primaryButton}>
                {c.print}
              </button>
            </>
          }
        >
          <div className="space-y-8 text-ink">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-4">
              <div>
                <p className="text-sm tracking-[0.08em] text-brand">CAREERPILOT</p>
                <p className="text-[13px] text-slate-500">{c.report}</p>
              </div>
              <div className="text-right text-[13px] text-slate-600">
                <p>
                  {c.consultant}: <span className="text-ink">{advice.consultantName || 'Taylor Lee'}</span>
                </p>
                <p>
                  {c.date}: {new Date(advice.lastUpdated || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-[13px] text-slate-500">{c.candidate}</dt>
                <dd className="text-lg">{candidateName}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-slate-500">{c.role}</dt>
                <dd className="text-lg text-brand">{candidateRole}</dd>
              </div>
            </dl>

            <section>
              <h4 className="flex items-baseline gap-3 border-b border-border pb-2 text-[17px]">
                <span className="text-xs tabular-nums text-slate-400">01</span>
                {c.r1}
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-700">{advice.cvAdvice.summary}</p>
              <ul className="mt-2">
                {advice.cvAdvice.starImprovements.map((star, idx) => (
                  <li key={idx} className="border-b border-border py-2.5 text-sm leading-6">
                    <p className="text-slate-400 line-through">{star.before}</p>
                    <p className="text-ink">{star.afterStar}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="flex items-baseline gap-3 border-b border-border pb-2 text-[17px]">
                <span className="text-xs tabular-nums text-slate-400">02</span>
                {c.r2}
              </h4>
              <p className="mt-3 text-sm">
                {c.positioningLabel}: {advice.careerAdvice.currentLevel} → {advice.careerAdvice.targetLevel}
              </p>
              <p className="mt-1 text-sm leading-7 text-slate-700">{advice.careerAdvice.recommendedPositioning}</p>
              <div className="mt-3 grid gap-6 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-[13px] text-slate-500">{c.shortTerm}</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    {advice.careerAdvice.shortTermRoadmap.map((item, i) => (
                      <li key={i}>— {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">{c.longTerm}</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    {advice.careerAdvice.longTermRoadmap.map((item, i) => (
                      <li key={i}>— {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h4 className="flex items-baseline gap-3 border-b border-border pb-2 text-[17px]">
                <span className="text-xs tabular-nums text-slate-400">03</span>
                {c.r3}
              </h4>
              <p className="mt-3 text-sm tabular-nums">
                {sal.minSalary.toLocaleString()} – <span className="text-brand">{sal.targetSalary.toLocaleString()}</span> –{' '}
                {sal.maxSalary.toLocaleString()} {sal.currency}
                <span className="ml-3 text-[13px] text-slate-500">{sal.marketPercentile}</span>
              </p>
              {sal.sampleScript && (
                <p className="mt-3 border-l-2 border-brand pl-4 text-sm leading-7 text-slate-700">“{sal.sampleScript}”</p>
              )}
            </section>

            <section>
              <h4 className="flex items-baseline gap-3 border-b border-border pb-2 text-[17px]">
                <span className="text-xs tabular-nums text-slate-400">04</span>
                {c.r4(advice.interviewAdvice.overallReadiness)}
              </h4>
              <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                {advice.interviewAdvice.technicalTips.map((tip, i) => (
                  <li key={i}>— {tip}</li>
                ))}
                {advice.interviewAdvice.reverseQuestions.map((q, i) => (
                  <li key={`q-${i}`}>
                    — <span className="text-ink">{c.reverseLabel}:</span> {q}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

function KeywordAdder({
  placeholder,
  addLabel,
  onAdd,
}: {
  placeholder: string;
  addLabel: string;
  onAdd: (keyword: string) => void;
}) {
  const [newKeyword, setNewKeyword] = useState('');
  const add = () => {
    if (!newKeyword.trim()) return;
    onAdd(newKeyword.trim());
    setNewKeyword('');
  };
  return (
    <div className="mt-1 flex items-end gap-4">
      <input
        type="text"
        value={newKeyword}
        onChange={(e) => setNewKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        className={`${underlineInput} border-slate-200 text-sm`}
      />
      <button type="button" onClick={add} disabled={!newKeyword.trim()} className={`${textLink} mb-2 shrink-0 text-ink`}>
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  );
}
