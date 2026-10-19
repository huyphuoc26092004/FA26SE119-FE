import { useState } from 'react';
import {
  FileText,
  Compass,
  DollarSign,
  Video,
  Sparkles,
  Save,
  Copy,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Sliders,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
  Check,
} from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import type {
  ConsultationAdvicePillars,
  ConsultationTopic,
  StarBulletImprovement,
} from '../../types/consultation';
import { generateAiConsultationAdviceDraft } from '../../services/consultationService';
import { useTranslation } from '../../i18n';

interface ConsultationAdviceBuilderProps {
  initialAdvice: ConsultationAdvicePillars;
  candidateName: string;
  candidateRole: string;
  topic?: ConsultationTopic;
  onSave?: (advice: ConsultationAdvicePillars) => void | Promise<void>;
  isSaving?: boolean;
  readOnly?: boolean;
}

export default function ConsultationAdviceBuilder({
  initialAdvice,
  candidateName,
  candidateRole,
  topic = 'CV_REVIEW',
  onSave,
  isSaving = false,
  readOnly = false,
}: ConsultationAdviceBuilderProps) {
  const { t, isVietnamese } = useTranslation();

  const [activePillar, setActivePillar] = useState<'cv' | 'career' | 'salary' | 'interview'>('cv');
  const [advice, setAdvice] = useState<ConsultationAdvicePillars>(initialAdvice);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // New item inputs
  const [newKeyword, setNewKeyword] = useState('');
  const [newCvAction, setNewCvAction] = useState('');
  const [newShortTerm, setNewShortTerm] = useState('');
  const [newLongTerm, setNewLongTerm] = useState('');
  const [newStratRec, setNewStratRec] = useState('');
  const [newTactics, setNewTactics] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [newBehavioral, setNewBehavioral] = useState('');
  const [newTechnical, setNewTechnical] = useState('');
  const [newReverseQ, setNewReverseQ] = useState('');
  const [newPitfall, setNewPitfall] = useState('');

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
  const handleGenerateAiDraft = () => {
    const draft = generateAiConsultationAdviceDraft(candidateName, candidateRole, topic);
    setAdvice(draft);
    triggerToast(
      isVietnamese
        ? 'AI đã sinh thành công gợi ý lời khuyên chuẩn chuyên gia cho 4 trụ cột!'
        : 'AI recommendations successfully generated across all 4 pillars!'
    );
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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {t('consultation.adviceBuilderTitle')}
            </h2>
            <Badge tone="blue">4 Pillars</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('consultation.adviceBuilderSubtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <Button
              variant="secondary"
              onClick={handleGenerateAiDraft}
              className="gap-1.5 text-xs py-2 px-3 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              <Sparkles size={14} className="text-purple-600" />
              <span>{t('consultation.aiDraftButton')}</span>
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleCopyAdviceSummary}
            className="gap-1.5 text-xs py-2 px-3"
          >
            <Copy size={14} />
            <span>{t('consultation.copyAdviceButton')}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowReportModal(true)}
            className="gap-1.5 text-xs py-2 px-3"
          >
            <Printer size={14} />
            <span>{t('consultation.previewReportButton')}</span>
          </Button>

          {!readOnly && (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5 text-xs py-2 px-4 shadow-sm"
            >
              <Save size={14} />
              <span>{isSaving ? 'Đang lưu...' : t('consultation.saveAdviceButton')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Pillars Navigation Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Pillar 1: CV */}
        <button
          onClick={() => setActivePillar('cv')}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
            activePillar === 'cv'
              ? 'border-blue-600 bg-blue-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              activePillar === 'cv' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
            }`}
          >
            <FileText size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {t('consultation.pillarCvImprovement')}
            </div>
            <div className="text-[10px] text-slate-500">
              {advice.cvAdvice.starImprovements.length} STAR rewrites • {advice.cvAdvice.missingKeywordsToInject.length} keywords
            </div>
          </div>
        </button>

        {/* Pillar 2: Career Direction */}
        <button
          onClick={() => setActivePillar('career')}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
            activePillar === 'career'
              ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              activePillar === 'career' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            <Compass size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {t('consultation.pillarCareerDirection')}
            </div>
            <div className="text-[10px] text-slate-500">
              Lộ trình 1-12 tháng • Định vị Tech Lead
            </div>
          </div>
        </button>

        {/* Pillar 3: Salary Negotiation */}
        <button
          onClick={() => setActivePillar('salary')}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
            activePillar === 'salary'
              ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              activePillar === 'salary' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <DollarSign size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {t('consultation.pillarSalaryNegotiation')}
            </div>
            <div className="text-[10px] text-slate-500">
              Target: {advice.salaryAdvice.targetSalary.toLocaleString()} {advice.salaryAdvice.currency}
            </div>
          </div>
        </button>

        {/* Pillar 4: Interview Skills */}
        <button
          onClick={() => setActivePillar('interview')}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
            activePillar === 'interview'
              ? 'border-purple-600 bg-purple-50/60 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              activePillar === 'interview' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
            }`}
          >
            <Video size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {t('consultation.pillarInterviewSkills')}
            </div>
            <div className="text-[10px] text-slate-500">
              Readiness: {advice.interviewAdvice.overallReadiness}/10 • Mock prep
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PILLAR 1: CV IMPROVEMENT CONTENT                                         */}
      {/* ========================================================================= */}
      {activePillar === 'cv' && (
        <div className="space-y-6 animate-fade-in">
          {/* Executive Summary Assessment */}
          <Card className="border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              <span>Đánh Giá Tổng Thể CV & Định Vị Hồ Sơ</span>
            </h3>
            <textarea
              rows={3}
              value={advice.cvAdvice.summary}
              disabled={readOnly}
              onChange={(e) =>
                setAdvice({
                  ...advice,
                  cvAdvice: { ...advice.cvAdvice, summary: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-blue-500 leading-relaxed disabled:bg-slate-50"
            />
          </Card>

          {/* STAR Formula Rewrites (Interactive Table / Cards) */}
          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span>{t('consultation.starFormulaTitle')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chuyển hóa các gạch đầu dòng liệt kê nhiệm vụ thông thường sang cấu trúc định lượng kết quả (Situation - Task - Action - Result).
                </p>
              </div>
              {!readOnly && (
                <Button
                  variant="secondary"
                  onClick={() => setShowNewStarModal(true)}
                  className="gap-1.5 text-xs py-1.5 px-3 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Plus size={13} />
                  <span>{t('consultation.addStarItem')}</span>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {advice.cvAdvice.starImprovements.map((star, idx) => (
                <div
                  key={star.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      Ví dụ so sánh #{idx + 1}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveStar(star.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                        title="Xóa ví dụ"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Before */}
                    <div className="rounded-lg bg-red-50/70 border border-red-100 p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 mb-1">
                        <AlertCircle size={13} />
                        <span>{t('consultation.beforeText')}</span>
                      </div>
                      <p className="text-slate-700 italic">"{star.before}"</p>
                    </div>

                    {/* After STAR */}
                    <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>{t('consultation.afterStarText')}</span>
                      </div>
                      <p className="text-emerald-950 font-medium">"{star.afterStar}"</p>
                    </div>
                  </div>

                  {star.note && (
                    <div className="text-[11px] text-blue-700 bg-blue-50/80 rounded-md px-2.5 py-1 flex items-center gap-1.5">
                      <Lightbulb size={12} className="shrink-0" />
                      <span>{star.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Keywords to Inject & Formatting Tips in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Keywords */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <span>{t('consultation.keywordsToInjectTitle')}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {advice.cvAdvice.missingKeywordsToInject.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-800 border border-purple-200"
                  >
                    <span>{kw}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            cvAdvice: {
                              ...advice.cvAdvice,
                              missingKeywordsToInject: advice.cvAdvice.missingKeywordsToInject.filter(
                                (_, idx) => idx !== i
                              ),
                            },
                          })
                        }
                        className="text-purple-500 hover:text-red-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newKeyword.trim()) {
                          setAdvice({
                            ...advice,
                            cvAdvice: {
                              ...advice.cvAdvice,
                              missingKeywordsToInject: [
                                ...advice.cvAdvice.missingKeywordsToInject,
                                newKeyword.trim(),
                              ],
                            },
                          });
                          setNewKeyword('');
                        }
                      }
                    }}
                    placeholder={t('consultation.addKeywordPlaceholder')}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newKeyword.trim()) {
                        setAdvice({
                          ...advice,
                          cvAdvice: {
                            ...advice.cvAdvice,
                            missingKeywordsToInject: [
                              ...advice.cvAdvice.missingKeywordsToInject,
                              newKeyword.trim(),
                            ],
                          },
                        });
                        setNewKeyword('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>

            {/* Formatting Tips */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Sliders size={14} className="text-slate-700" />
                <span>{t('consultation.formattingTipsTitle')}</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {advice.cvAdvice.formattingTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* CV Action Items */}
          <Card className="border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-blue-600" />
              <span>{t('consultation.cvActionItemsTitle')}</span>
            </h3>
            <div className="space-y-1.5 mb-3">
              {advice.cvAdvice.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() =>
                        setAdvice({
                          ...advice,
                          cvAdvice: {
                            ...advice.cvAdvice,
                            actionItems: advice.cvAdvice.actionItems.filter((_, i) => i !== idx),
                          },
                        })
                      }
                      className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCvAction}
                  onChange={(e) => setNewCvAction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newCvAction.trim()) {
                        setAdvice({
                          ...advice,
                          cvAdvice: {
                            ...advice.cvAdvice,
                            actionItems: [...advice.cvAdvice.actionItems, newCvAction.trim()],
                          },
                        });
                        setNewCvAction('');
                      }
                    }
                  }}
                  placeholder="Thêm đầu việc cải thiện CV..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                />
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (newCvAction.trim()) {
                      setAdvice({
                        ...advice,
                        cvAdvice: {
                          ...advice.cvAdvice,
                          actionItems: [...advice.cvAdvice.actionItems, newCvAction.trim()],
                        },
                      });
                      setNewCvAction('');
                    }
                  }}
                >
                  <Plus size={13} />
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 2: CAREER DIRECTION CONTENT                                       */}
      {/* ========================================================================= */}
      {activePillar === 'career' && (
        <div className="space-y-6 animate-fade-in">
          {/* Seniority Positioning */}
          <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Compass size={16} className="text-indigo-600" />
              <span>{t('consultation.careerPositioningTitle')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Cấp bậc hiện tại
                </label>
                <input
                  type="text"
                  value={advice.careerAdvice.currentLevel}
                  disabled={readOnly}
                  onChange={(e) =>
                    setAdvice({
                      ...advice,
                      careerAdvice: { ...advice.careerAdvice, currentLevel: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Cấp bậc mục tiêu khuyến nghị
                </label>
                <input
                  type="text"
                  value={advice.careerAdvice.targetLevel}
                  disabled={readOnly}
                  onChange={(e) =>
                    setAdvice({
                      ...advice,
                      careerAdvice: { ...advice.careerAdvice, targetLevel: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-50 font-semibold text-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Chiến lược định vị hồ sơ chuyên sâu
              </label>
              <textarea
                rows={3}
                value={advice.careerAdvice.recommendedPositioning}
                disabled={readOnly}
                onChange={(e) =>
                  setAdvice({
                    ...advice,
                    careerAdvice: { ...advice.careerAdvice, recommendedPositioning: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-indigo-500 leading-relaxed disabled:bg-slate-50"
              />
            </div>
          </Card>

          {/* Short-term & Long-term Roadmap in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Short-term */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ChevronRight size={14} className="text-indigo-600" />
                <span>{t('consultation.shortTermMilestonesTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.careerAdvice.shortTermRoadmap.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-indigo-50/50 px-2.5 py-1.5 text-xs text-indigo-900 border border-indigo-100"
                  >
                    <span>{item}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            careerAdvice: {
                              ...advice.careerAdvice,
                              shortTermRoadmap: advice.careerAdvice.shortTermRoadmap.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-indigo-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newShortTerm}
                    onChange={(e) => setNewShortTerm(e.target.value)}
                    placeholder="Thêm cột mốc ngắn hạn..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newShortTerm.trim()) {
                        setAdvice({
                          ...advice,
                          careerAdvice: {
                            ...advice.careerAdvice,
                            shortTermRoadmap: [
                              ...advice.careerAdvice.shortTermRoadmap,
                              newShortTerm.trim(),
                            ],
                          },
                        });
                        setNewShortTerm('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>

            {/* Long-term */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ChevronRight size={14} className="text-purple-600" />
                <span>{t('consultation.longTermMilestonesTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.careerAdvice.longTermRoadmap.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-purple-50/50 px-2.5 py-1.5 text-xs text-purple-900 border border-purple-100"
                  >
                    <span>{item}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            careerAdvice: {
                              ...advice.careerAdvice,
                              longTermRoadmap: advice.careerAdvice.longTermRoadmap.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-purple-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLongTerm}
                    onChange={(e) => setNewLongTerm(e.target.value)}
                    placeholder="Thêm cột mốc dài hạn..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newLongTerm.trim()) {
                        setAdvice({
                          ...advice,
                          careerAdvice: {
                            ...advice.careerAdvice,
                            longTermRoadmap: [
                              ...advice.careerAdvice.longTermRoadmap,
                              newLongTerm.trim(),
                            ],
                          },
                        });
                        setNewLongTerm('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Strategic Recommendations / Personal Branding */}
          <Card className="border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-500" />
              <span>{t('consultation.strategicRecommendationsTitle')}</span>
            </h3>
            <div className="space-y-1.5 mb-3">
              {advice.careerAdvice.strategicRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-amber-50/50 px-3 py-2 text-xs text-amber-950 border border-amber-100"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-amber-600 shrink-0" />
                    <span>{rec}</span>
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() =>
                        setAdvice({
                          ...advice,
                          careerAdvice: {
                            ...advice.careerAdvice,
                            strategicRecommendations: advice.careerAdvice.strategicRecommendations.filter(
                              (_, i) => i !== idx
                            ),
                          },
                        })
                      }
                      className="text-amber-500 hover:text-red-600 cursor-pointer p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStratRec}
                  onChange={(e) => setNewStratRec(e.target.value)}
                  placeholder="Thêm khuyến nghị thương hiệu cá nhân..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-amber-500"
                />
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (newStratRec.trim()) {
                      setAdvice({
                        ...advice,
                        careerAdvice: {
                          ...advice.careerAdvice,
                          strategicRecommendations: [
                            ...advice.careerAdvice.strategicRecommendations,
                            newStratRec.trim(),
                          ],
                        },
                      });
                      setNewStratRec('');
                    }
                  }}
                >
                  <Plus size={13} />
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 3: SALARY NEGOTIATION CONTENT                                      */}
      {/* ========================================================================= */}
      {activePillar === 'salary' && (
        <div className="space-y-6 animate-fade-in">
          {/* Salary Spectrum Calculator */}
          <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <span>{t('consultation.salaryRangeTitle')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Định giá dựa trên dữ liệu khảo sát thị trường công nghệ và năng lực thực tế của ứng viên.
                </p>
              </div>
              <Badge tone="green">{advice.salaryAdvice.marketPercentile}</Badge>
            </div>

            {/* Salary inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Min */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('consultation.minSalaryLabel')}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={advice.salaryAdvice.minSalary}
                    disabled={readOnly}
                    onChange={(e) =>
                      setAdvice({
                        ...advice,
                        salaryAdvice: { ...advice.salaryAdvice, minSalary: Number(e.target.value) },
                      })
                    }
                    className="w-full text-base font-bold text-slate-800 outline-none disabled:bg-white"
                  />
                  <span className="text-xs font-bold text-slate-400">
                    {advice.salaryAdvice.currency}
                  </span>
                </div>
              </div>

              {/* Target */}
              <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-3 shadow-xs">
                <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                  {t('consultation.targetSalaryLabel')} ★
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={advice.salaryAdvice.targetSalary}
                    disabled={readOnly}
                    onChange={(e) =>
                      setAdvice({
                        ...advice,
                        salaryAdvice: {
                          ...advice.salaryAdvice,
                          targetSalary: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full text-base font-extrabold text-emerald-900 outline-none bg-transparent"
                  />
                  <span className="text-xs font-bold text-emerald-700">
                    {advice.salaryAdvice.currency}
                  </span>
                </div>
              </div>

              {/* Max */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('consultation.maxSalaryLabel')}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={advice.salaryAdvice.maxSalary}
                    disabled={readOnly}
                    onChange={(e) =>
                      setAdvice({
                        ...advice,
                        salaryAdvice: { ...advice.salaryAdvice, maxSalary: Number(e.target.value) },
                      })
                    }
                    className="w-full text-base font-bold text-slate-800 outline-none disabled:bg-white"
                  />
                  <span className="text-xs font-bold text-slate-400">
                    {advice.salaryAdvice.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Salary Spectrum Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Floor: {advice.salaryAdvice.minSalary.toLocaleString()}</span>
                <span className="text-emerald-700 font-bold">
                  Recommended Target: {advice.salaryAdvice.targetSalary.toLocaleString()}
                </span>
                <span>Ceiling: {advice.salaryAdvice.maxSalary.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </Card>

          {/* Tactics & Perks in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Negotiation Tactics */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>{t('consultation.negotiationTacticsTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.salaryAdvice.negotiationTactics.map((tac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-emerald-50/50 px-2.5 py-1.5 text-xs text-emerald-950 border border-emerald-100"
                  >
                    <span>{tac}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            salaryAdvice: {
                              ...advice.salaryAdvice,
                              negotiationTactics: advice.salaryAdvice.negotiationTactics.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-emerald-500 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTactics}
                    onChange={(e) => setNewTactics(e.target.value)}
                    placeholder="Thêm chiến thuật đàm phán..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newTactics.trim()) {
                        setAdvice({
                          ...advice,
                          salaryAdvice: {
                            ...advice.salaryAdvice,
                            negotiationTactics: [
                              ...advice.salaryAdvice.negotiationTactics,
                              newTactics.trim(),
                            ],
                          },
                        });
                        setNewTactics('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>

            {/* Total Compensation Perks */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Sliders size={14} className="text-slate-700" />
                <span>{t('consultation.packagePerksTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.salaryAdvice.compensationPackageTips.map((perk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 border border-slate-100"
                  >
                    <span>{perk}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            salaryAdvice: {
                              ...advice.salaryAdvice,
                              compensationPackageTips: advice.salaryAdvice.compensationPackageTips.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPerk}
                    onChange={(e) => setNewPerk(e.target.value)}
                    placeholder="Thêm quyền lợi gói tổng thể..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newPerk.trim()) {
                        setAdvice({
                          ...advice,
                          salaryAdvice: {
                            ...advice.salaryAdvice,
                            compensationPackageTips: [
                              ...advice.salaryAdvice.compensationPackageTips,
                              newPerk.trim(),
                            ],
                          },
                        });
                        setNewPerk('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Sample Script with Copy Button */}
          {advice.salaryAdvice.sampleScript && (
            <Card className="border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span>{t('consultation.sampleNegotiationScriptTitle')}</span>
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (advice.salaryAdvice.sampleScript) {
                      navigator.clipboard.writeText(advice.salaryAdvice.sampleScript);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2000);
                    }
                  }}
                  className="text-[11px] py-1 px-2.5 gap-1"
                >
                  {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedScript ? 'Đã sao chép' : 'Sao chép kịch bản'}</span>
                </Button>
              </div>

              <textarea
                rows={3}
                value={advice.salaryAdvice.sampleScript}
                disabled={readOnly}
                onChange={(e) =>
                  setAdvice({
                    ...advice,
                    salaryAdvice: { ...advice.salaryAdvice, sampleScript: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 italic outline-none focus:border-emerald-500 leading-relaxed disabled:bg-white"
              />
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILLAR 4: INTERVIEW SKILLS CONTENT                                       */}
      {/* ========================================================================= */}
      {activePillar === 'interview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Readiness Rating Card */}
          <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Video size={16} className="text-purple-600" />
                  <span>{t('consultation.interviewReadinessScore')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Đánh giá độ sắc bén về tư duy kỹ thuật, phản xạ tình huống và phong thái giao tiếp.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={advice.interviewAdvice.overallReadiness}
                  disabled={readOnly}
                  onChange={(e) =>
                    setAdvice({
                      ...advice,
                      interviewAdvice: {
                        ...advice.interviewAdvice,
                        overallReadiness: Number(e.target.value),
                      },
                    })
                  }
                  className="w-32 accent-purple-600"
                />
                <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-purple-600 text-sm font-extrabold text-white shadow-xs">
                  {advice.interviewAdvice.overallReadiness} / 10
                </span>
              </div>
            </div>
          </Card>

          {/* Behavioral & Technical Tips in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Behavioral Tips */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-blue-600" />
                <span>{t('consultation.behavioralInterviewTips')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.interviewAdvice.behavioralTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-blue-50/60 px-2.5 py-1.5 text-xs text-blue-950 border border-blue-100"
                  >
                    <span>{tip}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            interviewAdvice: {
                              ...advice.interviewAdvice,
                              behavioralTips: advice.interviewAdvice.behavioralTips.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-blue-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBehavioral}
                    onChange={(e) => setNewBehavioral(e.target.value)}
                    placeholder="Thêm mẹo phỏng vấn hành vi..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newBehavioral.trim()) {
                        setAdvice({
                          ...advice,
                          interviewAdvice: {
                            ...advice.interviewAdvice,
                            behavioralTips: [
                              ...advice.interviewAdvice.behavioralTips,
                              newBehavioral.trim(),
                            ],
                          },
                        });
                        setNewBehavioral('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>

            {/* Technical Tips */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-purple-600" />
                <span>{t('consultation.technicalInterviewTips')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.interviewAdvice.technicalTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-purple-50/60 px-2.5 py-1.5 text-xs text-purple-950 border border-purple-100"
                  >
                    <span>{tip}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            interviewAdvice: {
                              ...advice.interviewAdvice,
                              technicalTips: advice.interviewAdvice.technicalTips.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-purple-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTechnical}
                    onChange={(e) => setNewTechnical(e.target.value)}
                    placeholder="Thêm lưu ý phỏng vấn kỹ thuật..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-purple-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newTechnical.trim()) {
                        setAdvice({
                          ...advice,
                          interviewAdvice: {
                            ...advice.interviewAdvice,
                            technicalTips: [
                              ...advice.interviewAdvice.technicalTips,
                              newTechnical.trim(),
                            ],
                          },
                        });
                        setNewTechnical('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Reverse Questions & Red flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reverse Questions */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-600" />
                <span>{t('consultation.reverseQuestionsTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.interviewAdvice.reverseQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-indigo-50/50 px-2.5 py-1.5 text-xs text-indigo-950 border border-indigo-100"
                  >
                    <span>{q}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            interviewAdvice: {
                              ...advice.interviewAdvice,
                              reverseQuestions: advice.interviewAdvice.reverseQuestions.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-indigo-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReverseQ}
                    onChange={(e) => setNewReverseQ(e.target.value)}
                    placeholder="Thêm câu hỏi hỏi lại NTD..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newReverseQ.trim()) {
                        setAdvice({
                          ...advice,
                          interviewAdvice: {
                            ...advice.interviewAdvice,
                            reverseQuestions: [
                              ...advice.interviewAdvice.reverseQuestions,
                              newReverseQ.trim(),
                            ],
                          },
                        });
                        setNewReverseQ('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>

            {/* Pitfalls to Avoid */}
            <Card className="border-slate-200">
              <h3 className="text-xs font-bold text-red-900 mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-red-600" />
                <span>{t('consultation.pitfallsToAvoidTitle')}</span>
              </h3>
              <div className="space-y-1.5 mb-3">
                {advice.interviewAdvice.pitfallsToAvoid.map((pit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-red-50/60 px-2.5 py-1.5 text-xs text-red-950 border border-red-100"
                  >
                    <span>{pit}</span>
                    {!readOnly && (
                      <button
                        onClick={() =>
                          setAdvice({
                            ...advice,
                            interviewAdvice: {
                              ...advice.interviewAdvice,
                              pitfallsToAvoid: advice.interviewAdvice.pitfallsToAvoid.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          })
                        }
                        className="text-red-400 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPitfall}
                    onChange={(e) => setNewPitfall(e.target.value)}
                    placeholder="Thêm lỗi kiêng kỵ cần tránh..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-red-500"
                  />
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (newPitfall.trim()) {
                        setAdvice({
                          ...advice,
                          interviewAdvice: {
                            ...advice.interviewAdvice,
                            pitfallsToAvoid: [
                              ...advice.interviewAdvice.pitfallsToAvoid,
                              newPitfall.trim(),
                            ],
                          },
                        });
                        setNewPitfall('');
                      }
                    }}
                  >
                    <Plus size={13} />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW STAR EXAMPLE                                              */}
      {/* ========================================================================= */}
      {showNewStarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                <span>Thêm Ví Dụ Chuẩn Hóa Theo STAR</span>
              </h3>
              <button
                onClick={() => setShowNewStarModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mô tả ban đầu trong CV (Chưa định lượng) *
                </label>
                <textarea
                  rows={2}
                  value={starBefore}
                  onChange={(e) => setStarBefore(e.target.value)}
                  placeholder="Ví dụ: Phát triển các component React cho hệ thống thanh toán..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 block mb-1">
                  Đề xuất viết lại theo STAR (Có số liệu & % tác động) *
                </label>
                <textarea
                  rows={3}
                  value={starAfter}
                  onChange={(e) => setStarAfter(e.target.value)}
                  placeholder="Ví dụ: Tái cấu trúc 18+ core UI components bằng React 19, giảm 45% thời gian render và nâng tỷ lệ hoàn tất đơn hàng thêm 18.5%..."
                  className="w-full rounded-xl border border-emerald-300 p-2.5 outline-none focus:border-emerald-500 bg-emerald-50/30"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">
                  Ghi chú / Lý do chiến lược (Không bắt buộc)
                </label>
                <input
                  type="text"
                  value={starNote}
                  onChange={(e) => setStarNote(e.target.value)}
                  placeholder="Ví dụ: Nhấn mạnh vào kết quả kinh doanh thay vì chỉ làm việc kỹ thuật."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="secondary" onClick={() => setShowNewStarModal(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleAddStar}
                disabled={!starBefore.trim() || !starAfter.trim()}
              >
                Thêm vào Báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT / PREVIEW OFFICIAL CONSULTATION REPORT                      */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('consultation.reportPreviewTitle')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => window.print()}
                  className="text-xs py-1.5 px-3 gap-1.5"
                >
                  <Printer size={13} />
                  <span>{t('consultation.printReport')}</span>
                </Button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div className="space-y-6 text-slate-800 p-2">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-blue-700">
                    CAREERPILOT INTELLIGENCE
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Hồ Sơ Tư Vấn Sự Nghiệp Chuyên Sâu 360°
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">
                    Cố vấn: {advice.consultantName || 'Taylor Lee'}
                  </div>
                  <div className="text-slate-500">
                    Ngày lập: {new Date(advice.lastUpdated || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Candidate Info Box */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Ứng viên:</span>
                  <span className="font-bold text-slate-900 text-sm">{candidateName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Vị trí mục tiêu:</span>
                  <span className="font-bold text-blue-700 text-sm">{candidateRole}</span>
                </div>
              </div>

              {/* Section 1: CV Improvement */}
              <div>
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>1. Cải thiện CV & Chuẩn hóa ATS</span>
                </h4>
                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  {advice.cvAdvice.summary}
                </p>
                <div className="space-y-2 text-xs">
                  {advice.cvAdvice.starImprovements.map((star, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-2.5 bg-white">
                      <div className="text-red-700 line-through text-[11px] mb-1">
                        ❌ Trước: {star.before}
                      </div>
                      <div className="text-emerald-800 font-bold text-xs">
                        ✅ Sau (STAR): {star.afterStar}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Career Direction */}
              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Compass size={14} />
                  <span>2. Định hướng nghề nghiệp & Lộ trình</span>
                </h4>
                <div className="text-xs font-semibold text-slate-900 mb-2">
                  Định vị: {advice.careerAdvice.currentLevel} → {advice.careerAdvice.targetLevel}
                </div>
                <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                  {advice.careerAdvice.recommendedPositioning}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100">
                    <span className="font-bold text-indigo-900 block mb-1">Ngắn hạn (1-3 tháng):</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {advice.careerAdvice.shortTermRoadmap.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-purple-50/50 p-3 border border-purple-100">
                    <span className="font-bold text-purple-900 block mb-1">Dài hạn (6-12 tháng):</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {advice.careerAdvice.longTermRoadmap.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 3: Salary */}
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign size={14} />
                  <span>3. Mức lương & Chiến lược đàm phán</span>
                </h4>
                <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-200 text-xs flex justify-between items-center mb-2">
                  <span>
                    Dải lương thị trường: <strong>{advice.salaryAdvice.minSalary.toLocaleString()}</strong> –{' '}
                    <strong className="text-emerald-800 text-sm">
                      {advice.salaryAdvice.targetSalary.toLocaleString()}
                    </strong>{' '}
                    – <strong>{advice.salaryAdvice.maxSalary.toLocaleString()} {advice.salaryAdvice.currency}</strong>
                  </span>
                  <Badge tone="green">{advice.salaryAdvice.marketPercentile}</Badge>
                </div>
                {advice.salaryAdvice.sampleScript && (
                  <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    "{advice.salaryAdvice.sampleScript}"
                  </p>
                )}
              </div>

              {/* Section 4: Interview */}
              <div>
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Video size={14} />
                  <span>4. Kỹ năng phỏng vấn (Điểm sẵn sàng: {advice.interviewAdvice.overallReadiness}/10)</span>
                </h4>
                <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                  {advice.interviewAdvice.technicalTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                  {advice.interviewAdvice.reverseQuestions.map((q, i) => (
                    <li key={i}>
                      <strong>Câu hỏi hỏi lại NTD:</strong> {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 print:hidden">
              <Button variant="secondary" onClick={() => setShowReportModal(false)}>
                {t('consultation.closeModal')}
              </Button>
              <Button variant="primary" onClick={() => window.print()} className="gap-1.5">
                <Printer size={14} />
                <span>{t('consultation.printReport')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
