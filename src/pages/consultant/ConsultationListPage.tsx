import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, FileText, PanelRight, UserRound, X } from 'lucide-react';
import { ErrorState } from '../../components/ui';
import { Initials, PRIORITY_LABEL, STATUS_LABEL, formatDateTime, statusTone } from '../../components/consultation/ConsultantKit';
import {
  ChatFrame,
  Composer,
  ConversationItem,
  FilterTabs,
  InfoRow,
  InfoSection,
  MessageStream,
  SearchField,
  relativeTime,
} from '../../components/consultation/chat/ChatKit';
import {
  getConsultantInbox,
  getConsultationRequestById,
  markThreadRead,
  sendConsultationMessage,
  updateConsultationStatus,
} from '../../services/consultationService';
import type { ConsultationRequest } from '../../types/consultation';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    title: 'Hội thoại',
    search: 'Tìm ứng viên, chủ đề hoặc tin nhắn',
    filters: { ALL: 'Tất cả', UNREAD: 'Chưa đọc', CHAT: 'Chat', REQUEST: 'Yêu cầu', CLOSED: 'Đã đóng' },
    loading: 'Đang tải hội thoại…',
    emptyList: 'Chưa có hội thoại nào được phân công cho bạn.',
    emptyFilter: 'Không có hội thoại phù hợp.',
    you: 'Bạn',
    noMessage: 'Chưa có tin nhắn',
    chat: 'Chat trực tiếp',
    request: 'Yêu cầu tư vấn',
    pickTitle: 'Chọn một hội thoại',
    pickDesc: 'Tin nhắn của ứng viên được phân công cho bạn sẽ hiện ở cột bên trái.',
    emptyThread: 'Chưa có tin nhắn. Hãy chào ứng viên và hỏi điều họ cần.',
    placeholder: 'Nhắn cho ứng viên…',
    send: 'Gửi',
    closed: 'Cuộc tư vấn đã đóng. Không thể gửi thêm tin nhắn.',
    pinned: 'Yêu cầu của ứng viên',
    more: 'Xem thêm',
    less: 'Thu gọn',
    back: 'Quay lại danh sách',
    info: 'Thông tin',
    hideInfo: 'Ẩn thông tin',
    fullDetail: 'Hồ sơ yêu cầu',
    analysis: 'Phân tích',
    close: 'Đóng cuộc tư vấn',
    closeConfirm: 'Đóng cuộc tư vấn này? Ứng viên sẽ không nhắn thêm được.',
    sections: { request: 'Về cuộc tư vấn', candidate: 'Ứng viên', timeline: 'Tiến trình', files: 'Tệp và liên kết' },
    rows: {
      kind: 'Hình thức',
      topic: 'Chủ đề',
      priority: 'Ưu tiên',
      slot: 'Giờ mong muốn',
      sent: 'Gửi lúc',
      status: 'Trạng thái',
      email: 'Email',
      phone: 'Điện thoại',
      location: 'Khu vực',
      current: 'Hiện tại',
      target: 'Mục tiêu',
      exp: 'Kinh nghiệm',
    },
    skills: 'Kỹ năng',
    noFiles: 'Ứng viên chưa đính kèm CV hay liên kết.',
    attachedCv: 'CV đính kèm',
    candidate: 'Ứng viên',
    quick: [
      'Chào bạn, mình là cố vấn phụ trách. Mình đã xem hồ sơ của bạn.',
      'Bạn gửi giúp mình JD của vị trí bạn đang nhắm tới nhé.',
      'Mình sẽ gửi nhận xét chi tiết về CV cho bạn trong hôm nay.',
      'Bạn còn câu hỏi nào khác không?',
    ],
  },
  en: {
    title: 'Conversations',
    search: 'Search candidates, topics or messages',
    filters: { ALL: 'All', UNREAD: 'Unread', CHAT: 'Chat', REQUEST: 'Requests', CLOSED: 'Closed' },
    loading: 'Loading conversations…',
    emptyList: 'No conversations have been assigned to you yet.',
    emptyFilter: 'No matching conversations.',
    you: 'You',
    noMessage: 'No messages yet',
    chat: 'Direct chat',
    request: 'Consultation request',
    pickTitle: 'Pick a conversation',
    pickDesc: 'Messages from candidates assigned to you appear in the left column.',
    emptyThread: 'No messages yet. Say hello and ask what they need.',
    placeholder: 'Message the candidate…',
    send: 'Send',
    closed: 'This consultation is closed. No more messages can be sent.',
    pinned: 'Candidate request',
    more: 'Show more',
    less: 'Show less',
    back: 'Back to list',
    info: 'Details',
    hideInfo: 'Hide details',
    fullDetail: 'Request file',
    analysis: 'Analysis',
    close: 'Close consultation',
    closeConfirm: 'Close this consultation? The candidate will not be able to reply.',
    sections: { request: 'About this consultation', candidate: 'Candidate', timeline: 'Timeline', files: 'Files and links' },
    rows: {
      kind: 'Type',
      topic: 'Topic',
      priority: 'Priority',
      slot: 'Preferred time',
      sent: 'Sent',
      status: 'Status',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      current: 'Current',
      target: 'Target',
      exp: 'Experience',
    },
    skills: 'Skills',
    noFiles: 'No CV or links attached.',
    attachedCv: 'Attached CV',
    candidate: 'Candidate',
    quick: [
      "Hi, I'm your consultant. I've gone through your profile.",
      'Could you send me the JD of the role you are aiming for?',
      "I'll send detailed CV feedback later today.",
      'Anything else you would like to ask?',
    ],
  },
};

type Filter = keyof typeof copy.vi.filters;
type Copy = typeof copy.vi;

const ME = 'CAREER_CONSULTANT' as const;
const isClosed = (r: ConsultationRequest) => r.status === 'COMPLETED' || r.status === 'CANCELLED';
const unreadOf = (r: ConsultationRequest) => r.messages.filter((m) => m.senderRole !== ME && !m.readAt).length;
const lastActivity = (r: ConsultationRequest) => r.messages[r.messages.length - 1]?.timestamp ?? r.requestedAt;
const nameOf = (r: ConsultationRequest, c: Copy) => r.candidate.name || `${c.candidate} #${r.id.slice(0, 6)}`;

export default function ConsultationListPage() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('c') ?? '';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showInfo, setShowInfo] = useState(true);

  const inbox = useQuery({ queryKey: ['consultant-inbox'], queryFn: getConsultantInbox, refetchInterval: 20_000 });
  const threads = useMemo(
    () => [...(inbox.data ?? [])].sort((a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime()),
    [inbox.data],
  );

  // Khung chat đang mở được làm mới mỗi 5 giây (backend có SSE nhưng EventSource không gửi được header Authorization).
  const active = useQuery({
    queryKey: ['consultant-thread', selectedId],
    queryFn: () => getConsultationRequestById(selectedId),
    enabled: !!selectedId,
    refetchInterval: 5_000,
    placeholderData: () => threads.find((t) => t.id === selectedId),
  });
  const thread = active.data ?? null;

  // Mở hội thoại thì đánh dấu đã đọc tin của ứng viên.
  const unreadInThread = thread ? unreadOf(thread) : 0;
  useEffect(() => {
    if (!thread || unreadInThread === 0) return;
    void markThreadRead(thread, ME).then((n) => {
      if (n) void queryClient.invalidateQueries({ queryKey: ['consultant-inbox'] });
    });
  }, [thread?.id, unreadInThread]);

  const syncThread = (updated: ConsultationRequest) => {
    queryClient.setQueryData(['consultant-thread', updated.id], updated);
    queryClient.setQueryData<ConsultationRequest[]>(['consultant-inbox'], (prev = []) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
  };

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendConsultationMessage(selectedId, text),
    onSuccess: (message) => {
      if (thread) syncThread({ ...thread, messages: [...thread.messages, message] });
    },
  });
  const closeMutation = useMutation({
    mutationFn: () => updateConsultationStatus(selectedId, 'COMPLETED'),
    onSuccess: (updated) => {
      syncThread(updated);
      void queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
    },
  });

  const counts = {
    ALL: threads.length,
    UNREAD: threads.filter((t) => unreadOf(t) > 0).length,
    CHAT: threads.filter((t) => t.channel === 'CHAT' && !isClosed(t)).length,
    REQUEST: threads.filter((t) => t.channel !== 'CHAT' && !isClosed(t)).length,
    CLOSED: threads.filter(isClosed).length,
  };

  const q = search.trim().toLowerCase();
  const visible = threads
    .filter((t) => {
      if (filter === 'UNREAD') return unreadOf(t) > 0;
      if (filter === 'CHAT') return t.channel === 'CHAT' && !isClosed(t);
      if (filter === 'REQUEST') return t.channel !== 'CHAT' && !isClosed(t);
      if (filter === 'CLOSED') return isClosed(t);
      return true;
    })
    .filter(
      (t) =>
        !q ||
        [t.candidate.name, t.topicLabel, t.candidate.targetRole, t.messages[t.messages.length - 1]?.content ?? ''].some((v) =>
          v.toLowerCase().includes(q),
        ),
    );

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('c', id);
    else next.delete('c');
    setParams(next, { replace: !id });
  };

  return (
    <ChatFrame>
      {/* 1 — Danh sách hội thoại */}
      <section
        aria-label={c.title}
        className={`w-full shrink-0 flex-col border-r border-border md:flex md:w-[20rem] xl:w-[22rem] ${selectedId ? 'hidden' : 'flex'}`}
      >
        <div className="px-5 pt-5">
          <h1 className="flex items-baseline justify-between text-[1.625rem] font-normal tracking-[-0.02em] text-ink">
            {c.title}
            <span className="text-[13px] tabular-nums tracking-normal text-slate-500">{threads.length}</span>
          </h1>
          <div className="mt-3">
            <SearchField value={search} onChange={setSearch} placeholder={c.search} />
          </div>
          <div className="mt-2">
            <FilterTabs
              value={filter}
              onChange={setFilter}
              options={(Object.keys(c.filters) as Filter[]).map((f) => ({
                value: f,
                label: c.filters[f],
                count: f === 'ALL' ? undefined : counts[f],
              }))}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {inbox.isLoading ? (
            <p className="px-5 py-6 text-sm text-slate-500">{c.loading}</p>
          ) : inbox.isError ? (
            <div className="p-5">
              <ErrorState message={(inbox.error as Error).message} />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">{threads.length ? c.emptyFilter : c.emptyList}</p>
          ) : (
            <ul>
              {visible.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const preview = last ? `${last.senderRole === ME ? `${c.you}: ` : ''}${last.content}` : c.noMessage;
                return (
                  <ConversationItem
                    key={t.id}
                    name={nameOf(t, c)}
                    title={nameOf(t, c)}
                    preview={preview}
                    time={relativeTime(lastActivity(t), isVietnamese)}
                    unread={unreadOf(t)}
                    active={t.id === selectedId}
                    muted={isClosed(t)}
                    tag={`${t.channel === 'CHAT' ? c.chat : t.topicLabel}${isClosed(t) ? ` · ${STATUS_LABEL[lang][t.status]}` : ''}`}
                    onClick={() => select(t.id)}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* 2 — Khung chat */}
      <section className={`min-w-0 flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}>
        {!thread ? (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <p className="text-[clamp(1.5rem,2.4vw,2rem)] font-normal tracking-[-0.02em] text-ink">{c.pickTitle}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{c.pickDesc}</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => select('')}
                className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-surface md:hidden"
                aria-label={c.back}
              >
                <ArrowLeft size={18} />
              </button>
              <Initials name={nameOf(thread, c)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] text-ink">{nameOf(thread, c)}</p>
                <p className="truncate text-[13px] text-slate-500">
                  {thread.channel === 'CHAT' ? c.chat : thread.topicLabel}
                  <span className="mx-1.5">·</span>
                  <span className={statusTone(thread.status)}>{STATUS_LABEL[lang][thread.status]}</span>
                </p>
              </div>
              <Link
                to={`/consultant/consultations/${thread.id}`}
                className="hidden items-center gap-1.5 text-[13px] text-slate-700 hover:text-ink sm:inline-flex"
              >
                <FileText size={15} aria-hidden="true" />
                {c.fullDetail}
              </Link>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-pressed={showInfo}
                title={showInfo ? c.hideInfo : c.info}
                aria-label={showInfo ? c.hideInfo : c.info}
                className={`hidden h-9 w-9 place-items-center rounded-full transition-colors lg:grid ${
                  showInfo ? 'bg-ink text-white' : 'text-slate-700 hover:bg-surface'
                }`}
              >
                <PanelRight size={17} />
              </button>
            </header>

            {thread.channel !== 'CHAT' && thread.targetGoal && <PinnedGoal text={thread.targetGoal} c={c} />}

            <MessageStream messages={thread.messages} mineRole={ME} vi={isVietnamese} youLabel={c.you} empty={c.emptyThread} />

            <Composer
              key={thread.id}
              autoFocusKey={thread.id}
              onSend={(text) => sendMutation.mutateAsync(text)}
              sending={sendMutation.isPending}
              disabled={isClosed(thread)}
              disabledText={c.closed}
              placeholder={c.placeholder}
              sendLabel={c.send}
              quickReplies={thread.messages.some((m) => m.senderRole === ME) ? c.quick.slice(1) : c.quick}
              error={sendMutation.error?.message}
            />
          </>
        )}
      </section>

      {/* 3 — Thông tin */}
      {thread && showInfo && (
        <aside className="hidden w-[20rem] shrink-0 overflow-y-auto border-l border-border px-6 py-5 lg:block xl:w-[22rem]">
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowInfo(false)} className="text-slate-500 hover:text-ink" aria-label={c.hideInfo}>
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col items-center text-center">
            <Initials name={nameOf(thread, c)} size="lg" />
            <p className="mt-3 text-lg text-ink">{nameOf(thread, c)}</p>
            <p className="text-[13px] text-slate-500">{thread.candidate.targetRole || thread.candidate.currentTitle || c.candidate}</p>
            <div className="mt-5 flex gap-8">
              <Link
                to={`/consultant/consultations/${thread.id}`}
                className="group flex flex-col items-center gap-1.5 text-[12px] text-slate-600"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition-colors group-hover:border-ink group-hover:text-ink">
                  <FileText size={16} />
                </span>
                {c.fullDetail}
              </Link>
              {thread.candidate.id && (
                <Link
                  to={`/consultant/candidates/${thread.candidate.id}`}
                  className="group flex flex-col items-center gap-1.5 text-[12px] text-slate-600"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 transition-colors group-hover:border-ink group-hover:text-ink">
                    <UserRound size={16} />
                  </span>
                  {c.analysis}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-ink">
            <InfoSection title={c.sections.request} defaultOpen>
              <InfoRow label={c.rows.kind}>{thread.channel === 'CHAT' ? c.chat : c.request}</InfoRow>
              {(thread.channel !== 'CHAT' || thread.topicLabel.includes(' · ')) && (
                <InfoRow label={c.rows.topic}>{thread.topicLabel.split(' · ').pop()}</InfoRow>
              )}
              <InfoRow label={c.rows.priority}>{PRIORITY_LABEL[lang][thread.priority]}</InfoRow>
              {thread.channel !== 'CHAT' && <InfoRow label={c.rows.slot}>{formatDateTime(thread.meeting.scheduledAt, locale)}</InfoRow>}
              <InfoRow label={c.rows.sent}>{formatDateTime(thread.requestedAt, locale)}</InfoRow>
              <InfoRow label={c.rows.status}>
                <span className={statusTone(thread.status)}>{STATUS_LABEL[lang][thread.status]}</span>
              </InfoRow>
              {!isClosed(thread) && (
                <button
                  type="button"
                  disabled={closeMutation.isPending}
                  onClick={() => window.confirm(c.closeConfirm) && closeMutation.mutate()}
                  className="mt-3 border-b border-current pb-px text-[13px] text-danger disabled:opacity-40"
                >
                  {c.close}
                </button>
              )}
              {closeMutation.error && <p className="mt-2 text-[12px] text-danger">{closeMutation.error.message}</p>}
            </InfoSection>

            <InfoSection title={c.sections.candidate}>
              <InfoRow label={c.rows.email}>{thread.candidate.email}</InfoRow>
              <InfoRow label={c.rows.phone}>{thread.candidate.phone}</InfoRow>
              <InfoRow label={c.rows.location}>{thread.candidate.location}</InfoRow>
              <InfoRow label={c.rows.current}>{thread.candidate.currentTitle}</InfoRow>
              <InfoRow label={c.rows.target}>{thread.candidate.targetRole}</InfoRow>
              <InfoRow label={c.rows.exp}>{thread.candidate.experienceLevel}</InfoRow>
              {thread.candidate.topSkills.length > 0 && (
                <>
                  <p className="mt-3 text-[12px] text-slate-500">{c.skills}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    {thread.candidate.topSkills.map((s) => (
                      <span key={s} className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[12px] text-slate-700">
                        {s}
                      </span>
                    ))}
                  </p>
                </>
              )}
            </InfoSection>

            <InfoSection title={c.sections.timeline}>
              <ol className="space-y-3">
                {thread.timeline.map((e) => (
                  <li key={e.id} className="flex gap-3 text-[13px]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    <span>
                      <span className="block text-ink">{e.title}</span>
                      <span className="block text-[12px] text-slate-500">{formatDateTime(e.timestamp, locale)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </InfoSection>

            <InfoSection title={c.sections.files}>
              {!thread.candidate.attachedResumeName && !thread.candidate.github && !thread.candidate.linkedIn ? (
                <p className="text-[13px] text-slate-500">{c.noFiles}</p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {thread.candidate.attachedResumeName && (
                    <li>
                      <span className="text-slate-500">{c.attachedCv}: </span>
                      <Link
                        to={`/consultant/consultations/${thread.id}`}
                        className="text-ink underline underline-offset-4 hover:text-brand"
                      >
                        {thread.candidate.attachedResumeName}
                      </Link>
                    </li>
                  )}
                  {[thread.candidate.github, thread.candidate.linkedIn].filter(Boolean).map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 break-all text-ink underline underline-offset-4 hover:text-brand"
                      >
                        {url} <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </InfoSection>
          </div>
        </aside>
      )}
    </ChatFrame>
  );
}

function PinnedGoal({ text, c }: { text: string; c: Copy }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 140;
  return (
    <div className="flex items-start gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-6">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-slate-500">{c.pinned}</p>
        <p className={`whitespace-pre-line text-[13px] leading-5 text-ink ${open ? '' : 'line-clamp-2'}`}>{text}</p>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-[12px] text-slate-600 underline underline-offset-4 hover:text-ink"
        >
          {open ? c.less : c.more}
        </button>
      )}
    </div>
  );
}
