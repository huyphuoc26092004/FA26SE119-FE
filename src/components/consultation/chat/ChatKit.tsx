/**
 * Khung chat tư vấn dùng chung cho ứng viên và cố vấn: danh sách hội thoại,
 * dòng tin nhắn, ô soạn tin và các mục thu gọn ở cột thông tin.
 * Phong cách tối giản của dự án: nền canvas, đường kẻ 1px, một màu nhấn xanh đậm.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, ChevronDown, Search, X } from 'lucide-react';
import type { ConsultationMessage } from '../../../types/consultation';
import { Initials, pad2 } from '../ConsultantKit';

// ─── Thời gian ──────────────────────────────────────────────────────────────

export function relativeTime(iso: string, vi: boolean) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const min = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (min < 1) return vi ? 'vừa xong' : 'now';
  if (min < 60) return vi ? `${min} phút` : `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return vi ? `${h} giờ` : `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return vi ? `${d} ngày` : `${d}d`;
  return new Date(iso).toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' });
}

const dayKey = (iso: string) => new Date(iso).toDateString();
const clock = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

function dayLabel(iso: string, vi: boolean) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return vi ? 'Hôm nay' : 'Today';
  if (d.toDateString() === yesterday.toDateString()) return vi ? 'Hôm qua' : 'Yesterday';
  return d.toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

// ─── Khung ──────────────────────────────────────────────────────────────────

/** Khung chat cao bằng màn hình; trên mobile chỉ hiện một cột tuỳ `view`. */
export function ChatFrame({
  children,
  height = 'h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-5rem)]',
}: {
  children: ReactNode;
  height?: string;
}) {
  return (
    <div className={`flex min-h-[34rem] overflow-hidden border border-border bg-canvas ${height}`}>
      {children}
    </div>
  );
}

// ─── Cột hội thoại ──────────────────────────────────────────────────────────

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2 border-b border-slate-300 py-2 focus-within:border-ink">
      <Search size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-slate-500 hover:text-ink" aria-label="Xoá">
          <X size={14} />
        </button>
      )}
    </label>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-x-5 overflow-x-auto border-b border-border">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`-mb-px shrink-0 border-b-2 py-2.5 text-[13px] transition-colors ${
              active ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            {o.label}
            {o.count !== undefined && o.count > 0 && (
              <span className={`ml-1.5 tabular-nums ${active ? 'text-brand' : 'text-slate-400'}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ConversationItem({
  name,
  title,
  preview,
  time,
  unread,
  active,
  muted,
  tag,
  onClick,
}: {
  name: string;
  title: string;
  preview: string;
  time: string;
  unread: number;
  active: boolean;
  muted?: boolean;
  tag?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'true' : undefined}
        className={`relative flex w-full gap-3 border-b border-border px-5 py-4 text-left transition-colors ${
          active ? 'bg-surface' : 'hover:bg-surface/60'
        }`}
      >
        {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand" aria-hidden="true" />}
        <span className="relative">
          <Initials name={name || '?'} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-brand" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={`truncate text-[15px] ${unread ? 'font-medium text-ink' : muted ? 'text-slate-500' : 'text-ink'}`}>
              {title}
            </span>
            <span className="shrink-0 text-[12px] tabular-nums text-slate-500">{time}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className={`truncate text-[13px] ${unread ? 'text-ink' : 'text-slate-500'}`}>{preview}</span>
            {unread > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-ink px-1.5 text-[11px] leading-[18px] tabular-nums text-white">{unread}</span>
            )}
          </span>
          {tag && <span className="mt-1 block truncate text-[12px] text-brand">{tag}</span>}
        </span>
      </button>
    </li>
  );
}

// ─── Khung tin nhắn ─────────────────────────────────────────────────────────

/** Tin nhắn nhóm theo ngày; tin liên tiếp cùng người gửi được gộp, bên mình nằm bên phải. */
export function MessageStream({
  messages,
  mineRole,
  vi,
  empty,
  youLabel,
}: {
  messages: ConsultationMessage[];
  mineRole: ConsultationMessage['senderRole'];
  vi: boolean;
  empty: ReactNode;
  youLabel: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1]?.id;

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [last]);

  if (messages.length === 0) {
    return <div className="grid flex-1 place-items-center px-6 text-center text-sm text-slate-500">{empty}</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-[clamp(1rem,3vw,2.5rem)] py-6" aria-live="polite">
      <ol className="mx-auto max-w-[46rem]">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const mine = m.senderRole === mineRole;
          const newDay = !prev || dayKey(prev.timestamp) !== dayKey(m.timestamp);
          const firstOfGroup = newDay || prev.senderId !== m.senderId;
          const lastOfGroup = !next || next.senderId !== m.senderId || dayKey(next.timestamp) !== dayKey(m.timestamp);
          return (
            <li key={m.id}>
              {newDay && (
                <p className={`flex items-center gap-4 text-[12px] text-slate-500 ${i === 0 ? 'mb-2' : 'mb-2 mt-8'}`}>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  {dayLabel(m.timestamp, vi)}
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </p>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${firstOfGroup ? 'mt-4' : 'mt-1'}`}>
                <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {firstOfGroup && (
                    <span className="mb-1 px-1 text-[12px] text-slate-500">
                      <span className={mine ? 'text-ink' : 'text-brand'}>{mine ? youLabel : m.senderName || '—'}</span>
                      <span className="mx-1.5">·</span>
                      {clock(m.timestamp)}
                    </span>
                  )}
                  <p
                    title={clock(m.timestamp)}
                    className={`whitespace-pre-line break-words px-4 py-2.5 text-[15px] leading-6 ${
                      mine
                        ? `bg-ink text-white ${lastOfGroup ? 'rounded-[20px] rounded-br-md' : 'rounded-[20px]'}`
                        : `border border-border bg-surface text-ink ${lastOfGroup ? 'rounded-[20px] rounded-bl-md' : 'rounded-[20px]'}`
                    }`}
                  >
                    {m.content}
                  </p>
                  {mine && lastOfGroup && i === messages.length - 1 && (
                    <span className="mt-1 px-1 text-[11px] text-slate-500">
                      {m.readAt ? (vi ? 'Đã xem' : 'Seen') : vi ? 'Đã gửi' : 'Sent'}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
    </div>
  );
}

/** Ô soạn tin: Enter để gửi, Shift+Enter xuống dòng, tự giãn chiều cao. */
export function Composer({
  onSend,
  sending,
  disabled,
  disabledText,
  placeholder,
  sendLabel,
  quickReplies,
  error,
  autoFocusKey,
}: {
  onSend: (text: string) => Promise<unknown> | void;
  sending: boolean;
  disabled?: boolean;
  disabledText?: string;
  placeholder: string;
  sendLabel: string;
  quickReplies?: string[];
  error?: string;
  autoFocusKey?: string;
}) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText('');
    if (autoFocusKey) ref.current?.focus({ preventScroll: true });
  }, [autoFocusKey]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  if (disabled) {
    return <p className="border-t border-border px-6 py-4 text-center text-[13px] text-slate-500">{disabledText}</p>;
  }

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    try {
      await onSend(value);
      setText('');
    } catch {
      /* lỗi hiện qua `error` */
    }
  };

  return (
    <div className="border-t border-border px-[clamp(1rem,3vw,2.5rem)] pb-4 pt-3">
      {quickReplies && quickReplies.length > 0 && (
        <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setText(q);
                ref.current?.focus();
              }}
              className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-[12px] text-slate-700 transition-colors hover:border-ink hover:text-ink"
            >
              {q.length > 42 ? `${q.slice(0, 40)}…` : q}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-end gap-3 rounded-[24px] border border-slate-300 bg-surface py-1.5 pl-4 pr-1.5 focus-within:border-ink"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={placeholder}
            className="block w-full resize-none bg-transparent py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-slate-400"
          />
        </label>
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label={sendLabel}
          title={sendLabel}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800 disabled:bg-slate-300"
        >
          <ArrowUp size={17} aria-hidden="true" />
        </button>
      </form>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

// ─── Cột thông tin ──────────────────────────────────────────────────────────

export function InfoSection({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-1.5 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="break-words text-ink">{children || '—'}</span>
    </div>
  );
}
