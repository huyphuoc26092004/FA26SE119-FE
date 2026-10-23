import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import ConsultationAdviceBuilder from '../../components/consultation/ConsultationAdviceBuilder';
import {
  Avatar,
  Headline,
  Modal,
  PriorityText,
  SectionHead,
  SubHead,
  Toast,
  formatDateTime,
  pad2,
  primaryButton,
  textLink,
} from '../../components/consultation/ConsultantKit';
import {
  getConsultationRequestById,
  updateConsultationStatus,
  saveConsultantPrivateNotes,
  saveConsultationAdvice,
  sendConsultationMessage,
} from '../../services/consultationService';
import {
  mockAlexAdvice,
  mockDucAdvice,
  generateMockConsultationAdvice,
} from '../../mocks/data/consultations';
import type {
  ConsultationStatus,
  ConsultationAdvicePillars,
} from '../../types/consultation';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    back: 'Danh sách yêu cầu',
    requested: 'Gửi ngày',
    headline: {
      PENDING: 'Đang chờ bạn tiếp nhận.',
      SCHEDULED: (d: string) => `Đã hẹn ${d}.`,
      IN_PROGRESS: 'Phiên tư vấn đang diễn ra.',
      COMPLETED: 'Đã hoàn tất tư vấn.',
      CANCELLED: 'Yêu cầu đã huỷ.',
    },
    accept: 'Tiếp nhận & xác nhận lịch',
    start: 'Bắt đầu phiên tư vấn',
    finish: 'Hoàn tất & gửi kế hoạch',
    join: 'Vào phòng họp',
    cancel: 'Huỷ buổi tư vấn',
    cancelConfirm: 'Bạn có chắc muốn huỷ yêu cầu tư vấn này không?',
    steps: ['Tiếp nhận', 'Xếp lịch', 'Tư vấn', 'Hoàn tất'],
    stepDone: 'Đã xong',
    stepNow: 'Đang ở bước này',
    stepLater: 'Sắp tới',
    cancelledNote: 'Yêu cầu này đã bị huỷ, quy trình dừng lại.',
    request: 'Nội dung yêu cầu',
    goal: 'Mục tiêu',
    notes: 'Ứng viên mô tả',
    questions: 'Câu hỏi ứng viên muốn được giải đáp',
    obstacles: 'Khó khăn hiện tại',
    privateTitle: 'Ghi chú riêng',
    privateMeta: 'chỉ bạn thấy',
    rubric: 'Đánh giá sơ bộ (1–10)',
    rubricItems: {
      cvQuality: 'Chất lượng CV',
      technicalDepth: 'Chiều sâu kỹ thuật',
      communication: 'Giao tiếp',
      marketReadiness: 'Sẵn sàng thị trường',
    },
    notesPlaceholder: 'Nhận xét sơ bộ về phong thái, kỹ năng, kiến trúc… chỉ hiển thị cho bạn.',
    saveNotes: 'Lưu ghi chú',
    advice: 'Lời khuyên cho ứng viên',
    messages: 'Trao đổi với ứng viên',
    messagesMeta: (n: number) => `${n} tin nhắn`,
    noMessages: 'Chưa có tin nhắn. Hãy gửi lời chào mở đầu tới ứng viên.',
    you: 'Bạn',
    messagePlaceholder: 'Nhắn hoặc dặn dò thêm cho ứng viên…',
    send: 'Gửi',
    rating: 'Ứng viên đánh giá',
    candidate: 'Ứng viên',
    email: 'Email',
    phone: 'Điện thoại',
    location: 'Nơi ở',
    experience: 'Kinh nghiệm',
    years: (n: number) => `${n} năm · `,
    skills: 'Kỹ năng nổi bật',
    attachedCv: 'CV đính kèm',
    viewCv: 'Xem CV',
    analysis: 'Mở hồ sơ & phân tích đầy đủ',
    meeting: 'Phòng họp',
    time: 'Thời gian',
    duration: 'Thời lượng',
    minutes: 'phút',
    platform: 'Nền tảng',
    link: 'Đường dẫn',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    timeline: 'Tiến trình',
    by: 'bởi',
    cvTitle: 'CV của ứng viên',
    cvSummary: 'Mục tiêu nghề nghiệp',
    cvSummaryFallback:
      'Kỹ sư phần mềm tận tụy với hơn 4 năm kinh nghiệm phát triển các hệ thống web quy mô lớn, hướng đến vị trí Senior / Tech Lead.',
    cvSkills: 'Kỹ năng chuyên môn',
    cvReview: 'Nhận xét nhanh về CV',
    cvGood: 'Định dạng một cột đạt chuẩn ATS, phông chữ chuẩn hoá.',
    cvFix: 'Cần bổ sung số liệu % tác động trong phần kinh nghiệm làm việc.',
    close: 'Đóng',
    statusUpdated: (s: string) => `Đã chuyển trạng thái sang “${s}”.`,
    statusName: {
      PENDING: 'Chờ tiếp nhận',
      SCHEDULED: 'Đã xếp lịch',
      IN_PROGRESS: 'Đang tư vấn',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã huỷ',
    } as Record<ConsultationStatus, string>,
    backToList: 'Quay lại danh sách yêu cầu',
  },
  en: {
    back: 'Request list',
    requested: 'Sent',
    headline: {
      PENDING: 'Waiting for you to accept.',
      SCHEDULED: (d: string) => `Booked for ${d}.`,
      IN_PROGRESS: 'Session in progress.',
      COMPLETED: 'Consultation completed.',
      CANCELLED: 'Request cancelled.',
    },
    accept: 'Accept & confirm time',
    start: 'Start session',
    finish: 'Complete & send plan',
    join: 'Join meeting',
    cancel: 'Cancel session',
    cancelConfirm: 'Are you sure you want to cancel this consultation?',
    steps: ['Accept', 'Schedule', 'Consult', 'Complete'],
    stepDone: 'Done',
    stepNow: 'Current step',
    stepLater: 'Later',
    cancelledNote: 'This request was cancelled; the flow has stopped.',
    request: 'Request',
    goal: 'Goal',
    notes: 'Candidate notes',
    questions: 'Questions the candidate wants answered',
    obstacles: 'Current obstacles',
    privateTitle: 'Private notes',
    privateMeta: 'only you see this',
    rubric: 'Quick evaluation (1–10)',
    rubricItems: {
      cvQuality: 'CV quality',
      technicalDepth: 'Technical depth',
      communication: 'Communication',
      marketReadiness: 'Market readiness',
    },
    notesPlaceholder: 'First impressions on presence, skills, architecture… visible only to you.',
    saveNotes: 'Save notes',
    advice: 'Advice for the candidate',
    messages: 'Messages',
    messagesMeta: (n: number) => `${n} messages`,
    noMessages: 'No messages yet. Say hello to the candidate.',
    you: 'You',
    messagePlaceholder: 'Write to the candidate…',
    send: 'Send',
    rating: 'Candidate rating',
    candidate: 'Candidate',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    experience: 'Experience',
    years: (n: number) => `${n} yrs · `,
    skills: 'Top skills',
    attachedCv: 'Attached CV',
    viewCv: 'View CV',
    analysis: 'Open full profile & analysis',
    meeting: 'Meeting room',
    time: 'Time',
    duration: 'Duration',
    minutes: 'min',
    platform: 'Platform',
    link: 'Link',
    copy: 'Copy',
    copied: 'Copied',
    timeline: 'Timeline',
    by: 'by',
    cvTitle: 'Candidate CV',
    cvSummary: 'Professional summary',
    cvSummaryFallback:
      'Dedicated software engineer with 4+ years building large-scale web systems, aiming for Senior / Tech Lead.',
    cvSkills: 'Core skills',
    cvReview: 'Quick CV notes',
    cvGood: 'Single-column layout is ATS friendly with standard fonts.',
    cvFix: 'Add quantified impact (%) to the work experience bullets.',
    close: 'Close',
    statusUpdated: (s: string) => `Status changed to “${s}”.`,
    statusName: {
      PENDING: 'Awaiting review',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In session',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    } as Record<ConsultationStatus, string>,
    backToList: 'Back to request list',
  },
};

type RubricKey = 'cvQuality' | 'technicalDepth' | 'communication' | 'marketReadiness';
const RUBRIC_KEYS: RubricKey[] = ['cvQuality', 'technicalDepth', 'communication', 'marketReadiness'];

export default function ConsultationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Consultant private notes form state
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [rubric, setRubric] = useState({
    cvQuality: 8,
    technicalDepth: 8,
    communication: 8,
    marketReadiness: 8,
  });

  // Discussion message input
  const [messageContent, setMessageContent] = useState('');
  const [adviceData, setAdviceData] = useState<ConsultationAdvicePillars | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['consultation-detail', id],
    queryFn: () => getConsultationRequestById(id || ''),
    enabled: !!id,
  });

  // Sync state once request is loaded
  if (request && !notesInitialized) {
    setPrivateNotes(request.consultantPrivateNotes || '');
    if (request.evaluationRubric) {
      setRubric(request.evaluationRubric);
    }
    setNotesInitialized(true);
  }

  if (request && !adviceData) {
    if (request.feedback?.advice) {
      setAdviceData(request.feedback.advice);
    } else if (request.candidate.id === '1') {
      setAdviceData(mockAlexAdvice);
    } else if (request.candidate.id === 'c-102') {
      setAdviceData(mockDucAdvice);
    } else {
      setAdviceData(
        generateMockConsultationAdvice(request.candidate.name, request.candidate.targetRole, request.topic)
      );
    }
  }

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: ConsultationStatus; note?: string }) =>
      updateConsultationStatus(id!, status, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      showToast(c.statusUpdated(c.statusName[updated.status]));
    },
  });

  // Save notes mutation
  const notesMutation = useMutation({
    mutationFn: () => saveConsultantPrivateNotes(id!, privateNotes, rubric),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      showToast(t('consultation.notesSavedSuccess'));
    },
  });

  // Save consultation advice mutation across 4 pillars
  const adviceMutation = useMutation({
    mutationFn: (newAdvice: ConsultationAdvicePillars) => saveConsultationAdvice(id!, newAdvice),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      showToast(t('consultation.adviceSavedSuccess'));
    },
  });

  // Send message mutation
  const messageMutation = useMutation({
    mutationFn: (content: string) => sendConsultationMessage(id!, content, 'CAREER_CONSULTANT'),
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['consultation-detail', id] });
    },
  });

  const handleCopyLink = () => {
    if (request?.meeting.meetingUrl) {
      navigator.clipboard.writeText(request.meeting.meetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !request) {
    return (
      <div className="py-12 text-center">
        <ErrorState />
        <button
          type="button"
          onClick={() => navigate('/consultant/consultations')}
          className={`${textLink} mt-6 text-ink`}
        >
          {c.backToList}
        </button>
      </div>
    );
  }

  const status = request.status;
  const isOpen = status !== 'CANCELLED' && status !== 'COMPLETED';
  const live = status === 'SCHEDULED' || status === 'IN_PROGRESS';
  const scheduledLabel = formatDateTime(request.meeting.scheduledAt, locale);
  const line2 =
    status === 'SCHEDULED' ? c.headline.SCHEDULED(scheduledLabel) : c.headline[status as Exclude<ConsultationStatus, 'SCHEDULED'>];

  // 0 = accept, 1 = schedule, 2 = consult, 3 = complete
  const currentStep =
    status === 'PENDING' ? 0 : status === 'SCHEDULED' ? 2 : status === 'IN_PROGRESS' ? 2 : status === 'COMPLETED' ? 4 : -1;

  const sendMessage = () => {
    if (messageContent.trim()) messageMutation.mutate(messageContent);
  };

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      <Toast message={toastMessage} />

      {/* Back + meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <Link
          to="/consultant/consultations"
          className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} />
          {c.back}
        </Link>
        <span className="tabular-nums text-slate-400">
          {request.id} · {c.requested} {new Date(request.requestedAt).toLocaleDateString(locale)}
        </span>
      </div>

      {/* Headline */}
      <Headline
        eyebrow={
          <span className="flex flex-wrap items-center gap-x-2">
            <span>{request.topicLabel}</span>
            {request.priority !== 'NORMAL' && (
              <>
                <span className="text-slate-400">·</span>
                <PriorityText priority={request.priority} lang={lang} />
              </>
            )}
          </span>
        }
        line1={`${request.candidate.name}.`}
        line2={<span className={status === 'CANCELLED' ? 'text-slate-400' : ''}>{line2}</span>}
        intro={
          <>
            {request.candidate.currentTitle} <span className="text-slate-400">→</span>{' '}
            <span className="text-ink">{request.candidate.targetRole}</span>
          </>
        }
        aside={<Avatar src={request.candidate.avatar} name={request.candidate.name} size="lg" />}
      >
        {status === 'PENDING' && (
          <button
            type="button"
            onClick={() =>
              statusMutation.mutate({ status: 'SCHEDULED', note: 'Chuyên gia đã duyệt lịch tư vấn.' })
            }
            disabled={statusMutation.isPending}
            className={primaryButton}
          >
            <Check size={16} />
            {c.accept}
          </button>
        )}
        {status === 'SCHEDULED' && (
          <button
            type="button"
            onClick={() =>
              statusMutation.mutate({ status: 'IN_PROGRESS', note: 'Bắt đầu phòng tư vấn trực tuyến.' })
            }
            disabled={statusMutation.isPending}
            className={primaryButton}
          >
            {c.start}
            <ArrowRight size={16} />
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <button
            type="button"
            onClick={() => statusMutation.mutate({ status: 'COMPLETED', note: 'Hoàn tất phiên tư vấn.' })}
            disabled={statusMutation.isPending}
            className={primaryButton}
          >
            <Check size={16} />
            {c.finish}
          </button>
        )}
        {live && (
          <a href={request.meeting.meetingUrl} target="_blank" rel="noreferrer" className={`${textLink} text-brand`}>
            {c.join}
            <ExternalLink size={13} />
          </a>
        )}
        {isOpen && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(c.cancelConfirm)) {
                statusMutation.mutate({ status: 'CANCELLED', note: 'Chuyên gia đã hủy lịch tư vấn.' });
              }
            }}
            disabled={statusMutation.isPending}
            className={`${textLink} text-slate-500 hover:text-danger`}
          >
            {c.cancel}
          </button>
        )}
      </Headline>

      {/* Workflow steps */}
      {status === 'CANCELLED' ? (
        <p className="mt-10 border-y border-border py-4 text-sm text-slate-500">{c.cancelledNote}</p>
      ) : (
        <ol className="mt-10 grid grid-cols-2 border-t border-ink sm:grid-cols-4">
          {c.steps.map((label, i) => {
            const done = i < currentStep;
            const now = i === currentStep;
            return (
              <li
                key={label}
                className={`border-b border-border py-4 pr-4 ${now ? 'shadow-[inset_0_2px_0_var(--color-brand)]' : ''}`}
              >
                <span className="text-xs tabular-nums text-slate-400">{pad2(i + 1)}</span>
                <p className={`mt-1 text-[15px] ${now ? 'text-brand' : done ? 'text-ink' : 'text-slate-400'}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-500">{done ? c.stepDone : now ? c.stepNow : c.stepLater}</p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-[clamp(2.5rem,5vw,4rem)] grid gap-x-[clamp(2rem,4vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        {/* Main workspace */}
        <div className="min-w-0 space-y-14">
          {/* 01 Request */}
          <section>
            <SectionHead index="01" title={c.request} />
            <div className="divide-y divide-border">
              <div className="grid gap-2 py-5 md:grid-cols-[11rem_minmax(0,1fr)]">
                <p className="text-[13px] text-slate-500">{c.goal}</p>
                <p className="text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-8 text-ink">{request.targetGoal}</p>
              </div>
              <div className="grid gap-2 py-5 md:grid-cols-[11rem_minmax(0,1fr)]">
                <p className="text-[13px] text-slate-500">{c.notes}</p>
                <p className="text-[15px] leading-7 text-slate-700">{request.candidateNotes}</p>
              </div>
              {request.candidateQuestions.length > 0 && (
                <div className="grid gap-2 py-5 md:grid-cols-[11rem_minmax(0,1fr)]">
                  <p className="text-[13px] text-slate-500">{c.questions}</p>
                  <ol className="space-y-3">
                    {request.candidateQuestions.map((q, idx) => (
                      <li key={idx} className="flex gap-3 text-[15px] leading-7 text-ink">
                        <span className="pt-1 text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {request.currentObstacles && (
                <div className="grid gap-2 py-5 md:grid-cols-[11rem_minmax(0,1fr)]">
                  <p className="text-[13px] text-slate-500">{c.obstacles}</p>
                  <p className="border-l-2 border-amber-400 pl-4 text-[15px] leading-7 text-slate-700">
                    {request.currentObstacles}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 02 Private notes */}
          <section>
            <SectionHead index="02" title={c.privateTitle} meta={c.privateMeta} />
            <p className="mt-5 text-[13px] text-slate-500">{c.rubric}</p>
            <div className="mt-2 grid gap-x-10 sm:grid-cols-2">
              {RUBRIC_KEYS.map((key) => (
                <label key={key} className="block border-b border-border py-3.5">
                  <span className="flex items-baseline justify-between text-sm">
                    <span className="text-slate-700">{c.rubricItems[key]}</span>
                    <span className="tabular-nums text-ink">
                      {rubric[key]}
                      <span className="text-slate-400">/10</span>
                    </span>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rubric[key]}
                    onChange={(e) => setRubric({ ...rubric, [key]: Number(e.target.value) })}
                    className="mt-2 w-full cursor-pointer"
                  />
                </label>
              ))}
            </div>
            <textarea
              rows={4}
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder={c.notesPlaceholder}
              className="mt-6 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] leading-7 text-ink outline-none placeholder:text-slate-400 focus:border-brand"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => notesMutation.mutate()}
                disabled={notesMutation.isPending}
                className={`${textLink} text-ink`}
              >
                {c.saveNotes}
              </button>
            </div>
          </section>

          {/* 03 Advice */}
          <section>
            <SectionHead index="03" title={c.advice} />
            <div className="pt-6">
              {adviceData && (
                <ConsultationAdviceBuilder
                  initialAdvice={adviceData}
                  candidateName={request.candidate.name}
                  candidateRole={request.candidate.targetRole}
                  topic={request.topic}
                  onSave={async (newAdv) => {
                    setAdviceData(newAdv);
                    await adviceMutation.mutateAsync(newAdv);
                  }}
                  isSaving={adviceMutation.isPending}
                />
              )}
            </div>
          </section>

          {/* 04 Messages */}
          <section>
            <SectionHead index="04" title={c.messages} meta={c.messagesMeta(request.messages.length)} />
            <div className="max-h-[28rem] overflow-y-auto">
              {request.messages.length === 0 ? (
                <p className="border-b border-border py-8 text-sm text-slate-500">{c.noMessages}</p>
              ) : (
                <ul>
                  {request.messages.map((msg) => {
                    const isConsultant = msg.senderRole === 'CAREER_CONSULTANT';
                    return (
                      <li key={msg.id} className="grid gap-1 border-b border-border py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                        <p className="text-[13px]">
                          <span className={isConsultant ? 'text-brand' : 'text-ink'}>
                            {isConsultant ? c.you : msg.senderName}
                          </span>
                          <span className="ml-2 tabular-nums text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        <p className="text-[15px] leading-7 text-slate-700">{msg.content}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-4 flex items-end gap-4">
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageContent.trim()) {
                    e.preventDefault();
                    messageMutation.mutate(messageContent);
                  }
                }}
                placeholder={c.messagePlaceholder}
                className="min-w-0 flex-1 border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400 focus:border-brand"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!messageContent.trim() || messageMutation.isPending}
                className="inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-sm text-white transition-colors hover:bg-brand-800 disabled:bg-slate-300"
              >
                {c.send}
              </button>
            </div>
          </section>

          {/* 05 Candidate rating */}
          {request.ratingByCandidate && (
            <section>
              <SectionHead
                index="05"
                title={c.rating}
                action={<span className="text-sm tabular-nums text-brand">{request.ratingByCandidate.stars}/5</span>}
              />
              <p className="mt-5 text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-8 text-ink">
                “{request.ratingByCandidate.comment}”
              </p>
              <p className="mt-2 text-[13px] tabular-nums text-slate-400">
                {new Date(request.ratingByCandidate.createdAt).toLocaleDateString(locale)}
              </p>
            </section>
          )}
        </div>

        {/* Aside */}
        <aside className="min-w-0 space-y-12 lg:sticky lg:top-6 lg:self-start">
          {/* Candidate */}
          <section>
            <SubHead title={c.candidate} action={<span className="text-[13px] text-slate-500">{request.candidate.experienceLevel}</span>} />
            <dl className="text-sm">
              {[
                [c.email, request.candidate.email],
                [c.phone, request.candidate.phone],
                [c.location, request.candidate.location],
                [c.experience, `${c.years(request.candidate.yearsOfExperience)}${request.candidate.currentTitle}`],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="truncate text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] text-slate-500">{c.skills}</p>
            <p className="mt-1 text-sm leading-6 text-ink">{request.candidate.topSkills.join(' · ')}</p>
            {request.candidate.bio && (
              <p className="mt-4 border-l-2 border-border pl-3 text-sm leading-6 text-slate-600">
                {request.candidate.bio}
              </p>
            )}
            {request.candidate.attachedResumeName && (
              <div className="mt-5 flex items-center justify-between gap-4 border-y border-border py-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-slate-500">{c.attachedCv}</p>
                  <p className="truncate text-sm text-ink">{request.candidate.attachedResumeName}</p>
                  {request.candidate.attachedResumeScore && (
                    <p className="text-xs tabular-nums text-brand">ATS {request.candidate.attachedResumeScore}/100</p>
                  )}
                </div>
                <button type="button" onClick={() => setShowResumeModal(true)} className={`${textLink} shrink-0 text-ink`}>
                  {c.viewCv}
                </button>
              </div>
            )}
            <Link to={`/consultant/candidates/${request.candidate.id}`} className={`${textLink} mt-5 text-brand`}>
              {c.analysis}
              <ArrowRight size={14} />
            </Link>
          </section>

          {/* Meeting */}
          <section>
            <SubHead title={c.meeting} />
            <dl className="text-sm">
              {[
                [c.time, new Date(request.meeting.scheduledAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
                [c.duration, `${request.meeting.durationMinutes} ${c.minutes}`],
                [c.platform, request.meeting.platform],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="tabular-nums text-ink">{value}</dd>
                </div>
              ))}
              <div className="border-b border-border py-2.5">
                <dt className="text-slate-500">{c.link}</dt>
                <dd className="mt-1 truncate font-mono text-[13px] text-brand">{request.meeting.meetingUrl}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href={request.meeting.meetingUrl} target="_blank" rel="noreferrer" className={`${textLink} text-ink`}>
                {c.join}
                <ExternalLink size={13} />
              </a>
              <button type="button" onClick={handleCopyLink} className={`${textLink} text-slate-600`}>
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                {copiedLink ? c.copied : c.copy}
              </button>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <SubHead title={c.timeline} />
            <ol className="relative mt-4 space-y-5 border-l border-border pl-5">
              {request.timeline.map((event, i) => (
                <li key={event.id} className="relative">
                  <span
                    className={`absolute -left-[1.5625rem] top-1.5 h-2 w-2 rounded-full ${
                      i === request.timeline.length - 1 ? 'bg-brand' : 'bg-slate-400'
                    }`}
                    aria-hidden
                  />
                  <p className="text-sm text-ink">{event.title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{event.description}</p>
                  <p className="mt-1 text-xs tabular-nums text-slate-400">
                    {new Date(event.timestamp).toLocaleString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    · {c.by} {event.actor}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      {/* Resume preview */}
      {showResumeModal && (
        <Modal
          eyebrow={c.cvTitle}
          title={request.candidate.attachedResumeName || t('consultation.viewModalResumeTitle')}
          onClose={() => setShowResumeModal(false)}
          footer={
            <button type="button" onClick={() => setShowResumeModal(false)} className={primaryButton}>
              {c.close}
            </button>
          }
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-lg text-ink">{request.candidate.name}</p>
              <p className="text-sm text-slate-600">{request.candidate.currentTitle}</p>
            </div>
            <p className="text-right">
              <span className="block text-[clamp(1.75rem,3vw,2.25rem)] leading-none tabular-nums text-ink">
                {request.candidate.attachedResumeScore}
              </span>
              <span className="text-xs text-slate-500">ATS / 100</span>
            </p>
          </div>
          <div className="divide-y divide-border">
            <div className="py-4">
              <p className="text-[13px] text-slate-500">01 · {c.cvSummary}</p>
              <p className="mt-1.5 text-[15px] leading-7 text-slate-700">
                {request.candidate.bio || c.cvSummaryFallback}
              </p>
            </div>
            <div className="py-4">
              <p className="text-[13px] text-slate-500">02 · {c.cvSkills}</p>
              <p className="mt-1.5 text-[15px] leading-7 text-ink">{request.candidate.topSkills.join(' · ')}</p>
            </div>
            <div className="py-4">
              <p className="text-[13px] text-slate-500">03 · {c.cvReview}</p>
              <ul className="mt-2 space-y-2 text-sm leading-6">
                <li className="flex gap-2.5 text-slate-700">
                  <Check size={15} className="mt-1 shrink-0 text-brand" />
                  {c.cvGood}
                </li>
                <li className="flex gap-2.5 text-slate-700">
                  <span className="mt-2.5 h-px w-3 shrink-0 bg-amber-500" aria-hidden />
                  {c.cvFix}
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
