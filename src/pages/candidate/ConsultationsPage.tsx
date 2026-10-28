import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { getCandidateProfile, getResumes } from '../../services/candidateService';
import {
  CONSULTATION_TOPIC_LABELS,
  DEFAULT_CONSULTANT,
  cancelConsultationRequest,
  createConsultationRequest,
  getMyConsultations,
  rateConsultation,
  sendCandidateMessage,
} from '../../services/candidateConsultationService';
import type {
  ConsultationPriority,
  ConsultationRequest,
  ConsultationStatus,
  ConsultationTopic,
} from '../../types/consultation';

const copy = {
  vi: {
    eyebrow: 'Tư vấn nghề nghiệp',
    line1: 'Trò chuyện với cố vấn thật.',
    line2: 'Một người, đồng hành cùng bạn.',
    intro:
      'Sau khi AI phân tích, bạn có thể đặt lịch với cố vấn của hệ thống để được góp ý trực tiếp về CV, định hướng và phỏng vấn.',
    quickMessage: 'Nhắn nhanh với cố vấn',
    seeGap: 'Xem khoảng trống kỹ năng trước',
    formTitle: 'Yêu cầu tư vấn',
    topic: 'Chủ đề cần tư vấn',
    cv: 'CV muốn cố vấn xem',
    noCv: 'Chưa có CV nào.',
    createCv: 'Tạo CV',
    noCvOption: 'Không gửi CV',
    priority: 'Mức độ ưu tiên',
    priorities: { NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp' } as Record<ConsultationPriority, string>,
    slot: 'Khung giờ mong muốn',
    goal: 'Bạn cần cố vấn giúp điều gì?',
    goalPlaceholder: 'VD: Tôi muốn chuyển từ Frontend lên Tech Lead, cần góp ý về CV và lộ trình 12 tháng.',
    submit: 'Gửi yêu cầu tư vấn',
    sending: 'Đang gửi…',
    hintEmpty: 'Hãy mô tả ngắn điều bạn cần tư vấn.',
    hintReady: 'Cố vấn sẽ xác nhận lịch trong vòng 24 giờ.',
    sent: (id: string) => `Đã gửi yêu cầu ${id}. Bạn có thể theo dõi ở mục 02 bên dưới.`,
    listTitle: 'Yêu cầu của bạn',
    listEmpty: 'Bạn chưa gửi yêu cầu tư vấn nào.',
    loading: 'Đang tải…',
    sentOn: 'Gửi',
    status: {
      PENDING: 'Chờ tiếp nhận',
      SCHEDULED: 'Đã xếp lịch',
      IN_PROGRESS: 'Đang tư vấn',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã huỷ',
    } as Record<ConsultationStatus, string>,
    details: 'Chi tiết',
    hide: 'Thu gọn',
    meeting: 'Lịch hẹn',
    proposed: 'Đề xuất',
    confirmed: 'Đã xác nhận',
    joinMeet: 'Vào phòng họp',
    yourNote: 'Bạn đã viết',
    attachedCv: 'CV đính kèm',
    timeline: 'Tiến trình',
    messages: 'Trao đổi với cố vấn',
    noMessages: 'Chưa có tin nhắn. Bạn có thể gửi thêm thông tin cho cố vấn tại đây.',
    you: 'Bạn',
    messagePlaceholder: 'Nhắn cho cố vấn…',
    send: 'Gửi',
    cancel: 'Huỷ yêu cầu',
    cancelConfirm: 'Huỷ yêu cầu tư vấn này?',
    feedback: 'Nhận xét của cố vấn',
    actions: 'Việc cần làm',
    rateTitle: 'Đánh giá buổi tư vấn',
    rateComment: 'Cảm nhận của bạn (không bắt buộc)',
    rateSubmit: 'Gửi đánh giá',
    rated: (n: number) => `Bạn đã đánh giá ${n}/5`,
    consultant: 'Cố vấn phụ trách',
    online: (h: string) => `Đang trực tuyến · phản hồi trong ${h} giờ`,
    process: 'Quy trình',
    steps: ['Gửi yêu cầu', 'Cố vấn tiếp nhận và xác nhận lịch', 'Tham gia phiên tư vấn qua Google Meet'],
    stepNow: 'Bạn đang ở bước này',
    stepNext: 'Tiếp theo',
    stepLater: 'Sắp tới',
    stepDone: 'Đã xong',
    stats: { total: 'Đã gửi', active: 'Đang xử lý', done: 'Hoàn tất' },
    tonight: 'Tối nay',
    morningTomorrow: 'Sáng mai',
    afternoonTomorrow: 'Chiều mai',
  },
  en: {
    eyebrow: 'Career consultation',
    line1: 'Talk to a real advisor.',
    line2: 'One person, by your side.',
    intro:
      'After the AI analysis, book a session with one of our consultants for direct feedback on your CV, direction and interviews.',
    quickMessage: 'Message your advisor',
    seeGap: 'Check your skill gap first',
    formTitle: 'Request a session',
    topic: 'Topic',
    cv: 'CV to share',
    noCv: 'You have no CV yet.',
    createCv: 'Create a CV',
    noCvOption: 'No CV',
    priority: 'Priority',
    priorities: { NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent' } as Record<ConsultationPriority, string>,
    slot: 'Preferred time',
    goal: 'What do you need help with?',
    goalPlaceholder: 'E.g. I want to move from Frontend to Tech Lead and need feedback on my CV and a 12-month plan.',
    submit: 'Send request',
    sending: 'Sending…',
    hintEmpty: 'Briefly describe what you need.',
    hintReady: 'Your advisor will confirm within 24 hours.',
    sent: (id: string) => `Request ${id} sent. Follow it in section 02 below.`,
    listTitle: 'Your requests',
    listEmpty: 'You have not sent any requests yet.',
    loading: 'Loading…',
    sentOn: 'Sent',
    status: {
      PENDING: 'Awaiting review',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In session',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    } as Record<ConsultationStatus, string>,
    details: 'Details',
    hide: 'Hide',
    meeting: 'Session',
    proposed: 'Proposed',
    confirmed: 'Confirmed',
    joinMeet: 'Join meeting',
    yourNote: 'You wrote',
    attachedCv: 'Attached CV',
    timeline: 'Progress',
    messages: 'Messages with your advisor',
    noMessages: 'No messages yet. Send your advisor more context here.',
    you: 'You',
    messagePlaceholder: 'Message your advisor…',
    send: 'Send',
    cancel: 'Cancel request',
    cancelConfirm: 'Cancel this consultation request?',
    feedback: 'Advisor feedback',
    actions: 'Action items',
    rateTitle: 'Rate the session',
    rateComment: 'Your thoughts (optional)',
    rateSubmit: 'Send rating',
    rated: (n: number) => `You rated it ${n}/5`,
    consultant: 'Your advisor',
    online: (h: string) => `Online · replies within ${h} hours`,
    process: 'How it works',
    steps: ['Send a request', 'Advisor accepts and confirms the time', 'Join the session on Google Meet'],
    stepNow: 'You are here',
    stepNext: 'Next',
    stepLater: 'Later',
    stepDone: 'Done',
    stats: { total: 'Sent', active: 'In progress', done: 'Completed' },
    tonight: 'Tonight',
    morningTomorrow: 'Tomorrow morning',
    afternoonTomorrow: 'Tomorrow afternoon',
  },
};

type Copy = typeof copy.vi;

const TOPICS: ConsultationTopic[] = [
  'CV_REVIEW',
  'CAREER_ORIENTATION',
  'MOCK_INTERVIEW',
  'SALARY_NEGOTIATION',
  'SKILL_ROADMAP',
];
const PRIORITIES: ConsultationPriority[] = ['NORMAL', 'HIGH', 'URGENT'];

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:bg-slate-400 cursor-pointer';
const fieldLabel = 'text-[13px] text-slate-600';

const pad2 = (n: number) => String(n).padStart(2, '0');

function statusTone(status: ConsultationStatus) {
  if (status === 'PENDING') return 'text-warning';
  if (status === 'SCHEDULED' || status === 'IN_PROGRESS') return 'text-brand';
  if (status === 'CANCELLED') return 'text-slate-400';
  return 'text-ink';
}

function formatDay(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

function formatDateTime(iso: string, locale: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}, ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

/** Three upcoming one-hour slots: tonight (if still ahead), tomorrow morning and afternoon, then later days. */
function buildSlots(c: Copy, locale: string) {
  const now = new Date();
  const at = (dayOffset: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const candidates: { date: Date; prefix?: string }[] = [
    { date: at(0, 21), prefix: c.tonight },
    { date: at(1, 9), prefix: c.morningTomorrow },
    { date: at(1, 15), prefix: c.afternoonTomorrow },
    { date: at(2, 10) },
  ];
  return candidates
    .filter((s) => s.date.getTime() - now.getTime() > 60 * 60 * 1000)
    .slice(0, 3)
    .map(({ date, prefix }) => {
      const range = `${pad2(date.getHours())}:00 – ${pad2(date.getHours() + 1)}:00`;
      const label = prefix
        ? `${prefix}, ${range}`
        : `${date.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}, ${range}`;
      return { iso: date.toISOString(), label };
    });
}

// ─── Building blocks ────────────────────────────────────────────────────────

function SectionHead({ index, title, action }: { index: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink pb-3">
      <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
        <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function UnderlineChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="border-b border-border pb-0">
      <legend className={fieldLabel}>{label}</legend>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-x-7">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`-mb-px border-b-2 py-2.5 text-left text-[clamp(0.9375rem,1.1vw,1.0625rem)] transition-colors ${
                active ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ConsultationsPage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const lang = isVietnamese ? 'vi' : 'en';

  const { consultationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const candidateId = useAuthStore((s) => s.user?.id) || '1';

  const { data: profile } = useQuery({ queryKey: ['candidate-profile'], queryFn: getCandidateProfile });
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const listKey = ['my-consultations', candidateId];
  const { data: requests = [], isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => getMyConsultations(candidateId),
  });

  const slots = useMemo(() => buildSlots(c, locale), [c, locale]);

  const [topic, setTopic] = useState<ConsultationTopic>('CV_REVIEW');
  const [resumeId, setResumeId] = useState('');
  const [priority, setPriority] = useState<ConsultationPriority>('NORMAL');
  const [slot, setSlot] = useState(slots[0]?.iso ?? '');
  const [goal, setGoal] = useState('');
  const [sentId, setSentId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(consultationId ?? null);

  const formRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  // Default to the user's default CV once CVs load.
  useEffect(() => {
    if (resumeId || resumes.length === 0) return;
    setResumeId((resumes.find((r) => r.isDefault) ?? resumes[0]).id);
  }, [resumes, resumeId]);

  useEffect(() => {
    if (consultationId) setOpenId(consultationId);
  }, [consultationId]);

  const replaceRequest = (updated: ConsultationRequest) =>
    queryClient.setQueryData<ConsultationRequest[]>(listKey, (prev = []) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );

  const createMutation = useMutation({
    mutationFn: () =>
      createConsultationRequest({
        candidateId,
        profile,
        resume: resumes.find((r) => r.id === resumeId),
        topic,
        priority,
        preferredSlot: slot,
        goal,
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<ConsultationRequest[]>(listKey, (prev = []) => [created, ...prev]);
      void queryClient.invalidateQueries({ queryKey: ['consultations'] });
      setSentId(created.id);
      setOpenId(created.id);
      setGoal('');
    },
  });

  const activeRequests = requests.filter((r) => r.status !== 'CANCELLED' && r.status !== 'COMPLETED');
  const focusRequest =
    requests.find((r) => r.id === openId && r.status !== 'CANCELLED') ?? activeRequests[0] ?? null;

  // Which process step the candidate is on.
  const currentStep = !focusRequest
    ? 0
    : focusRequest.status === 'PENDING'
      ? 1
      : focusRequest.status === 'COMPLETED'
        ? 3
        : 2;

  const quickMessage = () => {
    const target = activeRequests[0];
    if (!target) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      goalRef.current?.focus({ preventScroll: true });
      return;
    }
    setOpenId(target.id);
    requestAnimationFrame(() => {
      const box = document.getElementById(`message-${target.id}`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (box as HTMLTextAreaElement | null)?.focus({ preventScroll: true });
    });
  };

  const toggleOpen = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (consultationId) navigate('/candidate/consultations', { replace: true });
  };

  const canSubmit = goal.trim().length > 0 && !!slot && !createMutation.isPending;

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      {/* Headline */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="mb-3 text-[13px] text-brand">{c.eyebrow}</p>
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.line1}
          <span className="block text-brand">{c.line2}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {c.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
          <button type="button" onClick={quickMessage} className={`${textLink} text-ink`}>
            {c.quickMessage}
          </button>
          <Link to="/candidate/assessment" className={`${textLink} text-slate-600`}>
            {c.seeGap}
          </Link>
        </div>
      </header>

      <div className="mt-[clamp(2.5rem,5vw,4rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="min-w-0">
          {/* 01 — Request form */}
          <section ref={formRef} className="scroll-mt-6">
            <SectionHead index="01" title={c.formTitle} />
            <form
              className="mt-7 space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) createMutation.mutate();
              }}
            >
              <UnderlineChoice
                label={c.topic}
                value={topic}
                onChange={setTopic}
                options={TOPICS.map((t) => ({ value: t, label: CONSULTATION_TOPIC_LABELS[t][lang] }))}
              />

              {resumes.length > 0 ? (
                <UnderlineChoice
                  label={c.cv}
                  value={resumeId}
                  onChange={setResumeId}
                  options={[
                    ...resumes.map((r) => ({ value: r.id, label: r.name })),
                    { value: '', label: c.noCvOption },
                  ]}
                />
              ) : (
                <div className="border-b border-border pb-3">
                  <p className={fieldLabel}>{c.cv}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {c.noCv}{' '}
                    <Link to="/candidate/resumes/create" className={`${textLink} text-ink`}>
                      {c.createCv}
                    </Link>
                  </p>
                </div>
              )}

              <UnderlineChoice
                label={c.priority}
                value={priority}
                onChange={setPriority}
                options={PRIORITIES.map((p) => ({ value: p, label: c.priorities[p] }))}
              />

              <UnderlineChoice
                label={c.slot}
                value={slot}
                onChange={setSlot}
                options={slots.map((s) => ({ value: s.iso, label: s.label }))}
              />

              <label className="block">
                <span className={fieldLabel}>{c.goal}</span>
                <textarea
                  ref={goalRef}
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    if (sentId) setSentId(null);
                  }}
                  rows={4}
                  placeholder={c.goalPlaceholder}
                  className="mt-2 block w-full resize-y border-0 border-b border-ink bg-transparent px-0 py-2 text-[clamp(1rem,1.2vw,1.125rem)] leading-8 text-ink outline-none placeholder:text-slate-400 focus-visible:border-brand"
                />
              </label>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="submit" disabled={!canSubmit} className={primaryButton}>
                  {createMutation.isPending ? c.sending : c.submit}
                  {!createMutation.isPending && <ArrowRight size={16} aria-hidden="true" />}
                </button>
                <p className="text-[13px] text-slate-600" aria-live="polite">
                  {sentId ? (
                    <span className="inline-flex items-center gap-1.5 text-brand">
                      <Check size={14} aria-hidden="true" />
                      {c.sent(sentId)}
                    </span>
                  ) : goal.trim() ? (
                    c.hintReady
                  ) : (
                    c.hintEmpty
                  )}
                </p>
              </div>
            </form>
          </section>

          {/* 02 — My requests */}
          <section ref={listRef} className="mt-[clamp(3rem,6vw,4.5rem)]">
            <SectionHead
              index="02"
              title={c.listTitle}
              action={
                requests.length > 0 ? (
                  <p className="text-[13px] text-slate-600">
                    {c.stats.total} {requests.length} · {c.stats.active} {activeRequests.length} · {c.stats.done}{' '}
                    {requests.filter((r) => r.status === 'COMPLETED').length}
                  </p>
                ) : undefined
              }
            />
            {isLoading ? (
              <p className="py-6 text-sm text-slate-500">{c.loading}</p>
            ) : requests.length === 0 ? (
              <p className="py-6 text-sm text-slate-600">{c.listEmpty}</p>
            ) : (
              <ul>
                {requests.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    open={openId === r.id}
                    onToggle={() => toggleOpen(r.id)}
                    onChange={replaceRequest}
                    c={c}
                    locale={locale}
                    lang={lang}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Aside — advisor + process */}
        <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <p className="text-[13px] text-slate-600">{c.consultant}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-xl text-white">
              {DEFAULT_CONSULTANT.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-lg text-ink">{DEFAULT_CONSULTANT.name}</p>
              <p className="text-sm text-slate-600">{DEFAULT_CONSULTANT.title}</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-7 text-slate-700">
            {isVietnamese ? DEFAULT_CONSULTANT.bio : DEFAULT_CONSULTANT.bioEn}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            {c.online(DEFAULT_CONSULTANT.responseTime)}
          </p>

          <div className="mt-8 border-t border-ink pt-5">
            <p className="text-[13px] text-slate-600">{c.process}</p>
            <ol className="mt-3">
              {c.steps.map((step, idx) => {
                const done = idx < currentStep;
                const now = idx === currentStep;
                return (
                  <li key={step} className="flex gap-4 border-b border-border py-4">
                    <span className={`w-4 shrink-0 text-sm tabular-nums ${done ? 'text-brand' : 'text-slate-500'}`}>
                      {done ? <Check size={14} className="mt-1" aria-label={c.stepDone} /> : idx + 1}
                    </span>
                    <div>
                      <p className={`text-[15px] ${now ? 'text-ink' : done ? 'text-slate-600' : 'text-slate-700'}`}>{step}</p>
                      <p className={`mt-0.5 text-[13px] ${now ? 'text-warning' : 'text-slate-500'}`}>
                        {done ? c.stepDone : now ? c.stepNow : idx === currentStep + 1 ? c.stepNext : c.stepLater}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Request row with inline detail ─────────────────────────────────────────

function RequestRow({
  request: r,
  open,
  onToggle,
  onChange,
  c,
  locale,
  lang,
}: {
  request: ConsultationRequest;
  open: boolean;
  onToggle: () => void;
  onChange: (updated: ConsultationRequest) => void;
  c: Copy;
  locale: string;
  lang: 'vi' | 'en';
}) {
  const [message, setMessage] = useState('');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const messageMutation = useMutation({
    mutationFn: () => sendCandidateMessage(r.id, message),
    onSuccess: (updated) => {
      onChange(updated);
      setMessage('');
    },
  });
  const cancelMutation = useMutation({ mutationFn: () => cancelConsultationRequest(r.id), onSuccess: onChange });
  const rateMutation = useMutation({ mutationFn: () => rateConsultation(r.id, stars, comment), onSuccess: onChange });

  const title = lang === 'en' ? (CONSULTATION_TOPIC_LABELS[r.topic]?.en ?? r.topicLabel) : r.topicLabel;
  const canMessage = r.status !== 'CANCELLED' && r.status !== 'COMPLETED';
  const detailId = `consultation-${r.id}`;

  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={detailId}
        className="group flex w-full items-start justify-between gap-6 py-5 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[clamp(1.0625rem,1.4vw,1.1875rem)] text-ink transition-colors group-hover:text-brand">
            {title}
          </span>
          <span className="mt-1 block text-[13px] text-slate-600">
            #{r.id} · {c.priorities[r.priority]} · {c.sentOn} {formatDay(r.requestedAt, locale)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`block text-sm ${statusTone(r.status)}`}>{c.status[r.status]}</span>
          <span className="mt-1 block text-[13px] text-slate-500">{open ? c.hide : c.details}</span>
        </span>
      </button>

      {open && (
        <div id={detailId} className="grid gap-x-10 gap-y-8 pb-8 md:grid-cols-2">
          {/* Session + note */}
          <div className="space-y-6">
            <div>
              <p className={fieldLabel}>
                {c.meeting} · {r.status === 'PENDING' ? c.proposed : c.confirmed}
              </p>
              <p className="mt-1 text-[15px] text-ink">
                {formatDateTime(r.meeting.scheduledAt, locale)} · {r.meeting.durationMinutes}′ · {r.meeting.platform}
              </p>
              {(r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS') && (
                <a
                  href={r.meeting.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${textLink} mt-2 text-ink`}
                >
                  {c.joinMeet} <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
            </div>

            {r.candidateNotes && (
              <div>
                <p className={fieldLabel}>{c.yourNote}</p>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-slate-700">{r.candidateNotes}</p>
              </div>
            )}

            {r.candidate.attachedResumeName && (
              <div>
                <p className={fieldLabel}>{c.attachedCv}</p>
                <p className="mt-1 text-[15px] text-ink">
                  {r.candidate.attachedResumeName}
                  {r.candidate.attachedResumeScore ? (
                    <span className="text-slate-500"> · {r.candidate.attachedResumeScore}% ATS</span>
                  ) : null}
                </p>
              </div>
            )}

            <div>
              <p className={fieldLabel}>{c.timeline}</p>
              <ol className="mt-2 space-y-3">
                {r.timeline.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    <span>
                      <span className="block text-ink">{event.title}</span>
                      <span className="block text-[13px] text-slate-500">
                        {formatDateTime(event.timestamp, locale)} · {event.actor}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {r.status === 'PENDING' && (
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => window.confirm(c.cancelConfirm) && cancelMutation.mutate()}
                className={`${textLink} text-danger`}
              >
                {c.cancel}
              </button>
            )}
          </div>

          {/* Feedback, rating, messages */}
          <div className="min-w-0 space-y-8">
            {r.feedback && (
              <div>
                <p className={fieldLabel}>{c.feedback}</p>
                <p className="mt-1 text-[15px] leading-7 text-slate-700">{r.feedback.summary}</p>
                {r.feedback.actionChecklist.length > 0 && (
                  <>
                    <p className={`${fieldLabel} mt-4`}>{c.actions}</p>
                    <ol className="mt-1">
                      {r.feedback.actionChecklist.map((item, idx) => (
                        <li key={item.id} className="flex gap-3 border-b border-border py-2.5 text-sm">
                          <span className="w-5 shrink-0 tabular-nums text-brand">{pad2(idx + 1)}</span>
                          <span className={item.completed ? 'text-slate-500 line-through' : 'text-ink'}>{item.task}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}

            {r.status === 'COMPLETED' &&
              (r.ratingByCandidate ? (
                <p className="text-sm text-brand">{c.rated(r.ratingByCandidate.stars)}</p>
              ) : (
                <div>
                  <p className={fieldLabel}>{c.rateTitle}</p>
                  <div role="radiogroup" className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={stars === n}
                        onClick={() => setStars(n)}
                        className={`grid h-10 w-10 place-items-center rounded-full border text-sm transition-colors ${
                          n <= stars ? 'border-ink bg-ink text-white' : 'border-slate-300 text-slate-600 hover:border-ink'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={c.rateComment}
                    className="mt-3 w-full border-0 border-b border-slate-300 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400 focus-visible:border-brand"
                  />
                  <button
                    type="button"
                    disabled={!stars || rateMutation.isPending}
                    onClick={() => rateMutation.mutate()}
                    className={`${textLink} mt-3 text-ink`}
                  >
                    {c.rateSubmit}
                  </button>
                </div>
              ))}

            <div>
              <p className={fieldLabel}>{c.messages}</p>
              {r.messages.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">{c.noMessages}</p>
              ) : (
                <ul className="mt-2 space-y-4">
                  {r.messages.map((m) => {
                    const mine = m.senderRole === 'CANDIDATE';
                    return (
                      <li key={m.id}>
                        <p className="text-[13px] text-slate-500">
                          <span className={mine ? 'text-ink' : 'text-brand'}>{mine ? c.you : m.senderName}</span>
                          <span className="mx-1.5">·</span>
                          {formatDateTime(m.timestamp, locale)}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-slate-700">{m.content}</p>
                      </li>
                    );
                  })}
                </ul>
              )}

              {canMessage && (
                <form
                  className="mt-4 flex items-end gap-3 border-b border-ink"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (message.trim() && !messageMutation.isPending) messageMutation.mutate();
                  }}
                >
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">{c.messagePlaceholder}</span>
                    <textarea
                      id={`message-${r.id}`}
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim() && !messageMutation.isPending) messageMutation.mutate();
                        }
                      }}
                      placeholder={c.messagePlaceholder}
                      className="block max-h-32 w-full resize-none bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!message.trim() || messageMutation.isPending}
                    className="mb-2 text-sm text-ink underline underline-offset-4 transition-colors hover:text-brand disabled:opacity-40"
                  >
                    {c.send}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
