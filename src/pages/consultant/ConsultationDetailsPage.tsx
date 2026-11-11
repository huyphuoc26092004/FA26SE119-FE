import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import ConsultationReportEditor from '../../components/consultation/ConsultationReportEditor';
import ConsultationPreparation from '../../components/consultation/ConsultationPreparation';
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
} from '../../services/consultationService';
import type {
  ConsultationStatus,
} from '../../types/consultation';
import { useTranslation } from '../../i18n';
import { listBookings } from '../../services/bookingService';
import { bookingDisplayStatus, ConsultantBookingCard, useBookingClock } from '../../components/consultation/ConsultantBookingManager';
import { bookingPollInterval, googleMeetingUrl } from '../../utils/bookingMeeting';

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

export default function ConsultationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const queryClient = useQueryClient();
  const now = useBookingClock();
  const bookings = useQuery({ queryKey: ['consultation-bookings'], queryFn: listBookings,
    refetchInterval: (query) => bookingPollInterval(query.state.data) });
  const booking = bookings.data?.find(item => item.thread_id === id);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

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

  const handleCopyLink = () => {
    if (request?.meeting.meetingUrl) {
      navigator.clipboard.writeText(request.meeting.meetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading || bookings.isLoading) return <Loading />;
  if (isError || bookings.isError || !request) {
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

  const status: ConsultationStatus = booking ? bookingDisplayStatus(booking, now) : request.status;
  const isOpen = status !== 'CANCELLED' && status !== 'COMPLETED';
  const isBookedSession = !!booking || request.requestType === 'SESSION_BOOKING';
  const canWriteReport = booking ? ['ACCEPTED', 'COMPLETED'].includes(booking.status) && !booking.credit_refunded : !isBookedSession && isOpen;
  const live = status === 'SCHEDULED' || status === 'IN_PROGRESS';
  const scheduledLabel = formatDateTime(booking?.starts_at ?? request.meeting.scheduledAt, locale);
  const line2 =
    status === 'SCHEDULED' ? c.headline.SCHEDULED(scheduledLabel) : c.headline[status as Exclude<ConsultationStatus, 'SCHEDULED'>];

  // 0 = accept, 1 = schedule, 2 = consult, 3 = complete
  const currentStep =
    status === 'PENDING' ? 0 : status === 'SCHEDULED' ? 2 : status === 'IN_PROGRESS' ? 2 : status === 'COMPLETED' ? 4 : -1;


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

      {booking && <div className="mt-6"><ConsultantBookingCard booking={booking} showLinks={false} /></div>}

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
            <span className="text-ink">{booking?.target_role ?? request.candidate.targetRole}</span>
          </>
        }
        aside={<Avatar src={request.candidate.avatar} name={request.candidate.name} size="lg" />}
      >
        {!isBookedSession && status === 'PENDING' && (
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
        {!isBookedSession && status === 'SCHEDULED' && (
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
        {!isBookedSession && status === 'IN_PROGRESS' && (
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
        {!isBookedSession && live && googleMeetingUrl(request.meeting.meetingUrl, 'meet') && (
          <a href={googleMeetingUrl(request.meeting.meetingUrl, 'meet')!} target="_blank" rel="noopener noreferrer" className={`${textLink} text-brand`}>
            {c.join}
            <ExternalLink size={13} />
          </a>
        )}
        {!isBookedSession && isOpen && (
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

          {booking && <ConsultationPreparation booking={booking} />}

          <ConsultationReportEditor key={request.id} consultationId={request.id}
            candidateName={request.candidate.name} candidateRole={booking?.target_role ?? request.candidate.targetRole}
            resumeId={isBookedSession ? booking?.resume_id ?? undefined : request.candidate.attachedResumeId} writable={canWriteReport} />

          {/* 04 Messages */}
          {!isBookedSession && <section>
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
            <p className="mt-3 text-sm text-slate-500">{isVietnamese ? 'Lịch sử chỉ xem lại. Buổi tư vấn đã đặt diễn ra trên Google Meet.' : 'Read-only history. Booked consultations take place on Google Meet.'}</p>
          </section>}

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
            {!isBookedSession && request.candidate.attachedResumeName && (
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
            {!isBookedSession && <Link to={`/consultant/candidates/${request.candidate.id}`} className={`${textLink} mt-5 text-brand`}>
              {c.analysis}
              <ArrowRight size={14} />
            </Link>}
          </section>

          {/* Meeting */}
          <section>
            <SubHead title={c.meeting} />
            <dl className="text-sm">
              {[
                [c.time, scheduledLabel],
                [c.duration, `${booking?.duration_minutes ?? request.meeting.durationMinutes} ${c.minutes}`],
                ...(!isBookedSession && request.meeting.meetingUrl ? [[c.platform, request.meeting.platform]] : []),
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="tabular-nums text-ink">{value}</dd>
                </div>
              ))}
              {!isBookedSession && googleMeetingUrl(request.meeting.meetingUrl, 'meet') && <div className="border-b border-border py-2.5">
                <dt className="text-slate-500">{c.link}</dt>
                <dd className="mt-1 truncate font-mono text-[13px] text-brand">{request.meeting.meetingUrl}</dd>
              </div>}
            </dl>
            {!isBookedSession && googleMeetingUrl(request.meeting.meetingUrl, 'meet') && <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href={googleMeetingUrl(request.meeting.meetingUrl, 'meet')!} target="_blank" rel="noopener noreferrer" className={`${textLink} text-ink`}>
                {c.join}
                <ExternalLink size={13} />
              </a>
              <button type="button" onClick={handleCopyLink} className={`${textLink} text-slate-600`}>
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                {copiedLink ? c.copied : c.copy}
              </button>
            </div>}
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
      {!isBookedSession && showResumeModal && (
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
