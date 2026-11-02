/**
 * Chat trực tiếp với cố vấn (phía ứng viên): cột hội thoại bên trái, khung chat bên phải.
 * Mọi cuộc tư vấn đều có tin nhắn, nên danh sách gồm cả chat trực tiếp lẫn yêu cầu tư vấn.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Initials, STATUS_LABEL, statusTone } from '../../../components/consultation/ConsultantKit';
import {
  ChatFrame,
  Composer,
  ConversationItem,
  FilterTabs,
  MessageStream,
  SearchField,
  relativeTime,
} from '../../../components/consultation/chat/ChatKit';
import {
  CONSULTATION_TOPIC_LABELS,
  DEFAULT_CONSULTANT,
  getMyConsultation,
  sendCandidateMessage,
  startDirectChat,
} from '../../../services/candidateConsultationService';
import { markThreadRead } from '../../../services/consultationService';
import type { ConsultationRequest, ConsultationTopic } from '../../../types/consultation';

const copy = {
  vi: {
    title: 'Tin nhắn',
    newChat: 'Cuộc trò chuyện mới',
    search: 'Tìm trong hội thoại',
    filters: { ALL: 'Tất cả', UNREAD: 'Chưa đọc', OPEN: 'Đang mở', CLOSED: 'Đã đóng' },
    empty: 'Bạn chưa có cuộc trò chuyện nào.',
    emptyFilter: 'Không có hội thoại phù hợp.',
    you: 'Bạn',
    noMessage: 'Chưa có tin nhắn',
    chat: 'Chat trực tiếp',
    waitingName: 'Đang chờ cố vấn',
    startTitle: 'Nhắn cho cố vấn.',
    startLine: 'Hỏi ngắn, trả lời thật.',
    startDesc:
      'Viết điều bạn đang băn khoăn. Quản trị viên sẽ ghép bạn với một cố vấn phù hợp, cố vấn trả lời ngay trong khung chat này.',
    topic: 'Chủ đề (không bắt buộc)',
    anyTopic: 'Chưa rõ',
    firstPlaceholder: 'VD: Em học năm cuối, nên apply Frontend hay Fullstack ạ?',
    start: 'Bắt đầu trò chuyện',
    starting: 'Đang gửi…',
    waiting: 'Đang chờ cố vấn tham gia. Thường trong vòng 24 giờ, bạn vẫn có thể nhắn thêm.',
    emptyThread: 'Chưa có tin nhắn. Bạn có thể gửi thêm thông tin cho cố vấn.',
    placeholder: 'Nhắn cho cố vấn…',
    send: 'Gửi',
    closed: 'Cuộc trò chuyện đã đóng. Hãy mở cuộc trò chuyện mới nếu cần.',
    back: 'Quay lại danh sách',
    consultant: 'Cố vấn',
  },
  en: {
    title: 'Messages',
    newChat: 'New conversation',
    search: 'Search conversations',
    filters: { ALL: 'All', UNREAD: 'Unread', OPEN: 'Open', CLOSED: 'Closed' },
    empty: 'You have no conversations yet.',
    emptyFilter: 'No matching conversations.',
    you: 'You',
    noMessage: 'No messages yet',
    chat: 'Direct chat',
    waitingName: 'Waiting for an advisor',
    startTitle: 'Message an advisor.',
    startLine: 'Short questions, real answers.',
    startDesc: 'Write what is on your mind. An admin pairs you with a fitting advisor, who replies right here.',
    topic: 'Topic (optional)',
    anyTopic: 'Not sure',
    firstPlaceholder: 'e.g. I am in my final year. Should I apply for Frontend or Fullstack?',
    start: 'Start the conversation',
    starting: 'Sending…',
    waiting: 'Waiting for an advisor to join, usually within 24 hours. You can keep writing.',
    emptyThread: 'No messages yet. Send your advisor more context.',
    placeholder: 'Message your advisor…',
    send: 'Send',
    closed: 'This conversation is closed. Start a new one if you need to.',
    back: 'Back to list',
    consultant: 'Advisor',
  },
};

type Filter = keyof typeof copy.vi.filters;
const ME = 'CANDIDATE' as const;
const TOPICS = Object.keys(CONSULTATION_TOPIC_LABELS) as ConsultationTopic[];
const isClosed = (r: ConsultationRequest) => r.status === 'COMPLETED' || r.status === 'CANCELLED';
const unreadOf = (r: ConsultationRequest) => r.messages.filter((m) => m.senderRole !== ME && !m.readAt).length;
const lastActivity = (r: ConsultationRequest) => r.messages[r.messages.length - 1]?.timestamp ?? r.requestedAt;

export default function CandidateChat({
  threads,
  listKey,
  selectedId,
  onSelect,
  vi,
}: {
  threads: ConsultationRequest[];
  listKey: readonly unknown[];
  /** '' = màn hình bắt đầu cuộc trò chuyện mới. */
  selectedId: string;
  onSelect: (id: string) => void;
  vi: boolean;
}) {
  const c = vi ? copy.vi : copy.en;
  const lang = vi ? 'vi' : 'en';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [topic, setTopic] = useState<ConsultationTopic | ''>('');
  const [first, setFirst] = useState('');
  const [mobileList, setMobileList] = useState(!selectedId);

  const sorted = [...threads].sort((a, b) => new Date(lastActivity(b)).getTime() - new Date(lastActivity(a)).getTime());

  const active = useQuery({
    queryKey: ['my-consultation', selectedId],
    queryFn: () => getMyConsultation(selectedId),
    enabled: !!selectedId,
    refetchInterval: 5_000,
    placeholderData: () => threads.find((t) => t.id === selectedId),
  });
  const thread = selectedId ? (active.data ?? null) : null;

  const sync = (updated: ConsultationRequest) => {
    queryClient.setQueryData(['my-consultation', updated.id], updated);
    queryClient.setQueryData<ConsultationRequest[]>(listKey, (prev = []) =>
      prev.some((t) => t.id === updated.id) ? prev.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...prev],
    );
  };

  const unreadInThread = thread ? unreadOf(thread) : 0;
  useEffect(() => {
    if (!thread || unreadInThread === 0) return;
    void markThreadRead(thread, ME).then((n) => {
      if (n) void queryClient.invalidateQueries({ queryKey: listKey });
    });
  }, [thread?.id, unreadInThread]);

  const startMutation = useMutation({
    mutationFn: () => startDirectChat(first, topic || undefined),
    onSuccess: (created) => {
      sync(created);
      setFirst('');
      setTopic('');
      void queryClient.invalidateQueries({ queryKey: ['consultations'] });
      onSelect(created.id);
    },
  });
  const sendMutation = useMutation({
    mutationFn: (text: string) => sendCandidateMessage(selectedId, text),
    onSuccess: sync,
  });

  const q = search.trim().toLowerCase();
  const visible = sorted
    .filter((t) => (filter === 'UNREAD' ? unreadOf(t) > 0 : filter === 'OPEN' ? !isClosed(t) : filter === 'CLOSED' ? isClosed(t) : true))
    .filter((t) => !q || [t.topicLabel, t.consultantName, t.messages[t.messages.length - 1]?.content ?? ''].some((v) => v.toLowerCase().includes(q)));

  const advisorName = (t: ConsultationRequest) => (t.status === 'PENDING' ? c.waitingName : t.consultantName || DEFAULT_CONSULTANT.name);
  const titleOf = (t: ConsultationRequest) => (t.channel === 'CHAT' ? c.chat : t.topicLabel);
  const open = (id: string) => {
    setMobileList(false);
    onSelect(id);
  };

  return (
    <ChatFrame height="h-[min(48rem,calc(100dvh-6rem))]">
      {/* Danh sách */}
      <section className={`w-full shrink-0 flex-col border-r border-border md:flex md:w-[19rem] xl:w-[21rem] ${mobileList ? 'flex' : 'hidden'}`}>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.5rem] font-normal tracking-[-0.02em] text-ink">{c.title}</h2>
            <button
              type="button"
              onClick={() => open('')}
              title={c.newChat}
              aria-label={c.newChat}
              className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
                selectedId ? 'border border-slate-300 text-ink hover:border-ink' : 'bg-ink text-white'
              }`}
            >
              <Plus size={17} />
            </button>
          </div>
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
                count: f === 'UNREAD' ? sorted.filter((t) => unreadOf(t) > 0).length : undefined,
              }))}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">{threads.length ? c.emptyFilter : c.empty}</p>
          ) : (
            <ul>
              {visible.map((t) => {
                const last = t.messages[t.messages.length - 1];
                return (
                  <ConversationItem
                    key={t.id}
                    name={t.status === 'PENDING' ? 'CCV' : advisorName(t)}
                    title={titleOf(t)}
                    preview={last ? `${last.senderRole === ME ? `${c.you}: ` : ''}${last.content}` : c.noMessage}
                    time={relativeTime(lastActivity(t), vi)}
                    unread={unreadOf(t)}
                    active={t.id === selectedId}
                    muted={isClosed(t)}
                    tag={`${advisorName(t)} · ${STATUS_LABEL[lang][t.status]}`}
                    onClick={() => open(t.id)}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Khung chat hoặc màn hình bắt đầu */}
      <section className={`min-w-0 flex-1 flex-col md:flex ${mobileList ? 'hidden' : 'flex'}`}>
        {!thread ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <button
              type="button"
              onClick={() => setMobileList(true)}
              className="m-3 inline-flex items-center gap-1.5 self-start text-[13px] text-slate-600 md:hidden"
            >
              <ArrowLeft size={15} /> {c.back}
            </button>
            <form
              className="mx-auto my-auto w-full max-w-[36rem] px-6 py-10"
              onSubmit={(e) => {
                e.preventDefault();
                if (first.trim() && !startMutation.isPending) startMutation.mutate();
              }}
            >
              <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                {c.startTitle}
                <span className="block text-brand">{c.startLine}</span>
              </p>
              <p className="mt-4 text-[15px] leading-7 text-slate-600">{c.startDesc}</p>

              <p className="mt-7 text-[13px] text-slate-600">{c.topic}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['', ...TOPICS] as const).map((t) => (
                  <button
                    key={t || 'any'}
                    type="button"
                    onClick={() => setTopic(t)}
                    aria-pressed={topic === t}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                      topic === t ? 'border-ink bg-ink text-white' : 'border-slate-300 text-slate-700 hover:border-ink'
                    }`}
                  >
                    {t ? CONSULTATION_TOPIC_LABELS[t][lang] : c.anyTopic}
                  </button>
                ))}
              </div>

              <textarea
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                rows={4}
                placeholder={c.firstPlaceholder}
                className="mt-6 block w-full resize-y border-0 border-b border-ink bg-transparent px-0 py-2 text-[16px] leading-7 text-ink outline-none placeholder:text-slate-400 focus-visible:border-brand"
              />
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={!first.trim() || startMutation.isPending}
                  className="inline-flex min-h-11 items-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:bg-slate-400"
                >
                  {startMutation.isPending ? c.starting : c.start}
                  {!startMutation.isPending && <ArrowRight size={16} aria-hidden="true" />}
                </button>
                {startMutation.error && <p className="text-[13px] text-danger">{startMutation.error.message}</p>}
              </div>
            </form>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setMobileList(true)}
                className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-surface md:hidden"
                aria-label={c.back}
              >
                <ArrowLeft size={18} />
              </button>
              <Initials name={thread.status === 'PENDING' ? 'CCV' : advisorName(thread)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] text-ink">{advisorName(thread)}</p>
                <p className="truncate text-[13px] text-slate-500">
                  {titleOf(thread)}
                  <span className="mx-1.5">·</span>
                  <span className={statusTone(thread.status)}>{STATUS_LABEL[lang][thread.status]}</span>
                </p>
              </div>
            </header>
            {thread.status === 'PENDING' && (
              <p className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 text-[13px] text-slate-700 sm:px-6">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                {c.waiting}
              </p>
            )}
            <MessageStream messages={thread.messages} mineRole={ME} vi={vi} youLabel={c.you} empty={c.emptyThread} />
            <Composer
              key={thread.id}
              autoFocusKey={thread.id}
              onSend={(text) => sendMutation.mutateAsync(text)}
              sending={sendMutation.isPending}
              disabled={isClosed(thread)}
              disabledText={c.closed}
              placeholder={c.placeholder}
              sendLabel={c.send}
              error={sendMutation.error?.message}
            />
          </>
        )}
      </section>
    </ChatFrame>
  );
}
