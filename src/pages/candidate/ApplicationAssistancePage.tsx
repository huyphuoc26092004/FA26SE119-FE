import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Mail,
  Send,
  Lightbulb,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  ArrowRight,
  Briefcase,
  User,
  RotateCcw,
  Sliders,
  Check,
  X,
  Languages,
} from 'lucide-react';
import { Button, Card, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import {
  getCandidateProfile,
  getResumes,
  getJobs,
} from '../../mocks/services/mockService';
import {
  getStoredApplications,
  saveApplicationDraft,
  deleteApplicationDraft,
  generateApplicationContent,
  refineApplicationContent,
} from '../../services/applicationService';
import type {
  ApplicationContentType,
  ApplicationDraft,
  ApplicationFocus,
  ApplicationLanguage,
  ApplicationTone,
} from '../../types/domain';
import { ApplicationEditor } from './application/ApplicationEditor';
import { ApplicationReviewPanel } from './application/ApplicationReviewPanel';
import { SavedApplicationsList } from './application/SavedApplicationsList';

export default function ApplicationAssistancePage() {
  const { isVietnamese, t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: getCandidateProfile,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  // Saved drafts state
  const [savedDrafts, setSavedDrafts] = useState<ApplicationDraft[]>(() =>
    getStoredApplications()
  );

  // Active view tab: 'editor' | 'saved'
  const [activeTab, setActiveTab] = useState<'editor' | 'saved'>('editor');

  // Generator form controls
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [contentType, setContentType] = useState<ApplicationContentType>('cover_letter');
  const [tone, setTone] = useState<ApplicationTone>('impactful');
  const [focus, setFocus] = useState<ApplicationFocus>('tech_depth');
  const [language, setLanguage] = useState<ApplicationLanguage>('Vietnamese');
  const [recipientName, setRecipientName] = useState('');

  // Active Draft state
  const [currentDraft, setCurrentDraft] = useState<ApplicationDraft>(() => {
    const list = getStoredApplications();
    return list[0];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const queryJobId = searchParams.get('jobId');
    const queryCvId = searchParams.get('cvId') || searchParams.get('resumeId');

    if (queryJobId) setSelectedJobId(queryJobId);
    if (queryCvId) setSelectedCvId(queryCvId);

    // If query params exist, select or trigger tailored view
    if (queryJobId || queryCvId) {
      setActiveTab('editor');
    }
  }, [searchParams]);

  // Set default selected CV and Job if available
  useEffect(() => {
    if (!selectedCvId && resumes.length > 0) {
      const defaultCv = resumes.find((r) => r.isDefault) || resumes[0];
      setSelectedCvId(defaultCv.id);
    }
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [resumes, jobs, selectedCvId, selectedJobId]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const selectedCv = useMemo(() => {
    return resumes.find((r) => r.id === selectedCvId);
  }, [resumes, selectedCvId]);

  // Handle Generate with AI
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateApplicationContent({
        contentType,
        tone,
        language,
        focus,
        jobId: selectedJob?.id,
        jobTitle: selectedJob?.title,
        company: selectedJob?.company,
        jobDescription: selectedJob?.description,
        jobSkills: selectedJob?.skills,
        cvId: selectedCv?.id,
        cvName: selectedCv?.name,
        candidateName: profile?.name || selectedCv?.fullName,
        candidateRole: selectedCv?.position || profile?.targetPosition,
        candidateSkills: selectedCv?.skills || profile?.skills,
        recipientName: recipientName.trim() || undefined,
      });

      setCurrentDraft(result);
      setToastMessage('Đã tạo thư ứng tuyển thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      // ignore
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quick Refine
  const handleRefine = async (
    action: 'make_shorter' | 'add_metrics' | 'more_confident' | 'translate'
  ) => {
    if (!currentDraft) return;
    setIsRefining(true);
    try {
      const targetLang = currentDraft.language === 'Vietnamese' ? 'English' : 'Vietnamese';
      const result = await refineApplicationContent({
        currentContent: currentDraft.content,
        currentSubject: currentDraft.subject,
        action,
        targetLanguage: targetLang,
        jobTitle: currentDraft.jobTitle,
        company: currentDraft.company,
      });

      setCurrentDraft((prev) => ({
        ...prev,
        content: result.content,
        subject: result.subject || prev.subject,
        language: action === 'translate' ? targetLang : prev.language,
        reviewScore: {
          ...prev.reviewScore,
          overallScore: Math.min(99, prev.reviewScore.overallScore + result.scoreDelta),
          wordCount: result.content.trim().split(/\s+/).length,
        },
      }));

      setToastMessage('Đã tinh chỉnh nội dung theo yêu cầu!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      // ignore
    } finally {
      setIsRefining(false);
    }
  };

  // Save current draft
  const handleSave = () => {
    if (!currentDraft) return;
    const saved = saveApplicationDraft(currentDraft);
    setCurrentDraft(saved);
    setSavedDrafts(getStoredApplications());
    setToastMessage(t('applicationAssistance.savedSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select a draft from saved library
  const handleSelectSavedDraft = (draft: ApplicationDraft) => {
    setCurrentDraft(draft);
    if (draft.jobId) setSelectedJobId(draft.jobId);
    if (draft.cvId) setSelectedCvId(draft.cvId);
    setContentType(draft.contentType);
    setTone(draft.tone);
    setFocus(draft.focus);
    setLanguage(draft.language);
    setActiveTab('editor');
  };

  // Delete a saved draft
  const handleDeleteSavedDraft = (id: string) => {
    deleteApplicationDraft(id);
    const updated = getStoredApplications();
    setSavedDrafts(updated);
    if (currentDraft?.id === id && updated.length > 0) {
      setCurrentDraft(updated[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-sm border border-slate-700 animate-in fade-in max-w-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle
          title={t('applicationAssistance.title')}
          subtitle={t('applicationAssistance.subtitle')}
        />

        {/* Tab switchers */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-surface p-1.5 shadow-2xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Lightbulb size={15} />
            <span>{t('applicationAssistance.createTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FolderArchive size={15} />
            <span>{t('applicationAssistance.savedTab')}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-medium ${
                activeTab === 'saved'
                  ? 'bg-white text-brand-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {savedDrafts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'saved' ? (
        <SavedApplicationsList
          drafts={savedDrafts}
          onSelectDraft={handleSelectSavedDraft}
          onDeleteDraft={handleDeleteSavedDraft}
          onCreateNew={() => setActiveTab('editor')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Column: Generator Controls Card */}
          <div className="space-y-5">
            <Card className="p-5 border border-slate-200/90 bg-surface shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-medium text-slate-900">
                <Sliders size={18} className="text-brand-600" />
                <span>Cấu hình thư ứng tuyển AI</span>
              </div>

              {/* 1. Target Job Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-brand-600" />
                  <span>{t('applicationAssistance.selectJob')}</span>
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-surface transition cursor-pointer"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company} ({job.salary})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. CV Reference Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-brand-600" />
                  <span>{t('applicationAssistance.selectCv')}</span>
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-surface transition cursor-pointer"
                >
                  {resumes.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} ({cv.atsScore}% ATS)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Document Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  {t('applicationAssistance.contentTypeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'cover_letter', label: t('applicationAssistance.coverLetter') },
                    { id: 'application_email', label: t('applicationAssistance.applicationEmail') },
                    { id: 'linkedin_inmail', label: t('applicationAssistance.linkedinInmail') },
                    { id: 'follow_up_email', label: t('applicationAssistance.followUpEmail') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContentType(item.id as ApplicationContentType)}
                      className={`rounded-xl border p-2 text-left text-xs font-semibold transition cursor-pointer ${
                        contentType === item.id
                          ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-2xs'
                          : 'border-slate-200 bg-surface text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Tone & Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  {t('applicationAssistance.toneLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'impactful', label: t('applicationAssistance.toneImpactful') },
                    { id: 'professional', label: t('applicationAssistance.toneProfessional') },
                    { id: 'enthusiastic', label: t('applicationAssistance.toneEnthusiastic') },
                    { id: 'concise', label: t('applicationAssistance.toneConcise') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTone(item.id as ApplicationTone)}
                      className={`rounded-xl border p-2 text-left text-xs font-semibold transition cursor-pointer ${
                        tone === item.id
                          ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-2xs'
                          : 'border-slate-200 bg-surface text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Key Value Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  {t('applicationAssistance.focusLabel')}
                </label>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as ApplicationFocus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-surface transition cursor-pointer"
                >
                  <option value="tech_depth">{t('applicationAssistance.focusTech')}</option>
                  <option value="leadership">{t('applicationAssistance.focusLeadership')}</option>
                  <option value="fast_learner">{t('applicationAssistance.focusFastLearner')}</option>
                  <option value="business_impact">{t('applicationAssistance.focusBusiness')}</option>
                </select>
              </div>

              {/* 6. Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  {t('applicationAssistance.languageLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('Vietnamese')}
                    className={`rounded-xl border p-2 text-center text-xs font-semibold transition cursor-pointer ${
                      language === 'Vietnamese'
                        ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('English')}
                    className={`rounded-xl border p-2 text-center text-xs font-semibold transition cursor-pointer ${
                      language === 'English'
                        ? 'border-brand-500 bg-brand-50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* 7. Recipient Info */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  {t('applicationAssistance.recipientLabel')}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={t('applicationAssistance.recipientPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-brand-500 focus:bg-surface transition"
                />
              </div>

              {/* Generate Button */}
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs py-3 rounded-xl transition mt-2 cursor-pointer"
              >
                <Lightbulb size={16} />
                <span>
                  {isGenerating
                    ? t('applicationAssistance.generating')
                    : t('applicationAssistance.generateButton')}
                </span>
              </Button>
            </Card>

            {/* Quick Context Tip Box */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-xs text-brand-900 space-y-2">
              <p className="font-medium flex items-center gap-1.5">
                <Lightbulb size={14} className="text-brand-600" />
                Mẹo tối ưu tỷ lệ phản hồi:
              </p>
              <p className="text-[11px] leading-relaxed text-brand-800">
                Thư ứng tuyển có đề cập đến các con số thành tích cụ thể (STAR / Google XYZ) và giải quyết trực tiếp bài toán của doanh nghiệp giúp tăng tỷ lệ phản hồi lên <strong>gấp 3 lần</strong> so với thư mẫu chung chung.
              </p>
            </div>
          </div>

          {/* Right Column: AI Review Score Panel + Live Document Editor */}
          <div className="space-y-5">
            {/* AI Review Score & Diagnostics */}
            {currentDraft?.reviewScore && (
              <ApplicationReviewPanel score={currentDraft.reviewScore} />
            )}

            {/* Document Paper Editor Canvas */}
            {currentDraft ? (
              <ApplicationEditor
                draft={currentDraft}
                onChangeContent={(content) =>
                  setCurrentDraft((prev) => ({
                    ...prev,
                    content,
                    isSaved: false,
                    reviewScore: {
                      ...prev.reviewScore,
                      wordCount: content.trim().split(/\s+/).length,
                    },
                  }))
                }
                onChangeSubject={(subject) =>
                  setCurrentDraft((prev) => ({
                    ...prev,
                    subject,
                    isSaved: false,
                  }))
                }
                onRefine={handleRefine}
                isRefining={isRefining}
                onSave={handleSave}
                isSaved={!!currentDraft.isSaved}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-surface p-12 text-center">
                <p className="text-sm text-slate-500">Chưa có văn bản nào được chọn.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
