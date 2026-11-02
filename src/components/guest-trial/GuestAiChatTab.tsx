import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, Lock, MessageSquare, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { askGuestAssistant, guestErrorMessage } from '../../services/guestService';

interface Message {
  role: 'USER' | 'ASSISTANT';
  text: string;
  tips?: string[];
  error?: boolean;
  timestamp: string;
}

interface GuestAiChatWidgetProps {
  onOpenSaveModal?: () => void;
}

// Floating chat: a launcher pinned to the bottom-right corner that opens a compact panel
// (a full-screen sheet on small screens). Chat state lives here, so it survives closing the panel.
export function GuestAiChatWidget({ onOpenSaveModal }: GuestAiChatWidgetProps) {
  const { isVietnamese } = useTranslation();

  const MAX_GUEST_QUOTA = 3;
  const [quotaRemaining, setQuotaRemaining] = useState<number>(3);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);

  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ASSISTANT',
      text: isVietnamese
        ? 'Xin chào! Mình là trợ lý nghề nghiệp của CCV, trả lời bằng AI thật của hệ thống. Bạn có 3 câu hỏi miễn phí trong phiên dùng thử: hỏi về định hướng nghề, cách viết CV hay chuẩn bị phỏng vấn đều được.'
        : 'Hi! I am the CCV career assistant, answering with the system’s real AI. You have 3 free questions in this trial: ask about career direction, CV writing or interview prep.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const suggestedPrompts = isVietnamese
    ? [
        {
          key: 'ats',
          text: 'Làm thế nào để viết CV chuẩn ATS vượt qua vòng lọc tuyển dụng?',
        },
        {
          key: 'frontend',
          text: 'Những kỹ năng quan trọng nhất của Frontend Developer năm 2026?',
        },
        {
          key: 'weakness',
          text: 'Cách trả lời câu hỏi: Điểm yếu lớn nhất của bạn là gì?',
        },
      ]
    : [
        {
          key: 'ats',
          text: 'How can I optimize my resume to pass ATS filters?',
        },
        {
          key: 'frontend',
          text: 'What are the top essential skills for Frontend Engineers in 2026?',
        },
        {
          key: 'weakness',
          text: 'How should I answer: What is your greatest weakness?',
        },
      ];

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || typing || quotaRemaining <= 0) return;

    const currentText = textToSend;
    setInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        role: 'USER',
        text: currentText,
        timestamp: now,
      },
    ]);

    setQuotaRemaining((prev) => prev - 1);
    setTyping(true);

    // Câu trả lời do AI thật của hệ thống tạo (API /guest/assistant), không còn là câu soạn sẵn.
    let reply: Message;
    try {
      const answer = await askGuestAssistant(currentText);
      reply = {
        role: 'ASSISTANT',
        text: answer.trim() || (isVietnamese ? 'Trợ lý chưa có câu trả lời. Bạn thử hỏi lại nhé.' : 'No answer yet. Please ask again.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (error) {
      // Lỗi thì trả lại lượt đã trừ.
      setQuotaRemaining((prev) => Math.min(MAX_GUEST_QUOTA, prev + 1));
      reply = {
        role: 'ASSISTANT',
        text: guestErrorMessage(error, isVietnamese),
        error: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    setMessages((prev) => [...prev, reply]);
    setTyping(false);
  };

  const closePanel = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  // Keep the newest message in view; long replies are shown from their first line.
  useEffect(() => {
    if (!open) return;
    const el = streamRef.current;
    if (!el) return;
    const last = el.lastElementChild as HTMLElement | null;
    el.scrollTop = typing || !last ? el.scrollHeight : last.offsetTop - 20;
  }, [messages, typing, open]);

  // Focus the input when the panel opens; Escape closes it.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const quotaBars = (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`h-1 w-4 rounded-full ${step <= quotaRemaining ? 'bg-brand' : 'bg-slate-300'}`}
        />
      ))}
    </span>
  );

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={isVietnamese ? 'Trò chuyện với trợ lý nghề nghiệp' : 'Chat with the career assistant'}
          className="fixed inset-0 z-40 flex flex-col bg-surface sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(40rem,calc(100dvh-8rem))] sm:w-[clamp(22rem,26vw,27rem)] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border sm:shadow-[0_24px_60px_-28px_rgba(23,32,28,0.35)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-5">
            <div className="min-w-0">
              <p className="text-base font-medium text-ink">
                {isVietnamese ? 'Trợ lý nghề nghiệp' : 'Career assistant'}
              </p>
              <div className="mt-1.5 flex items-center gap-2.5 text-xs text-slate-600">
                {quotaBars}
                <span>
                  {isVietnamese
                    ? `Phiên dùng thử · còn ${quotaRemaining}/${MAX_GUEST_QUOTA} lượt`
                    : `Guest session · ${quotaRemaining}/${MAX_GUEST_QUOTA} left`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
              aria-label={isVietnamese ? 'Đóng khung chat' : 'Close chat'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Message stream */}
          <div ref={streamRef} className="relative flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {messages.map((msg, i) =>
              msg.role === 'USER' ? (
                <div key={i} className="flex flex-col items-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-white">
                    {msg.text}
                  </p>
                  <span className="mt-1.5 text-xs text-slate-500">{msg.timestamp}</span>
                </div>
              ) : (
                <div key={i} className="pr-4">
                  <p className="text-xs text-slate-500">
                    <span className="text-brand">{isVietnamese ? 'Trợ lý' : 'Assistant'}</span>
                    <span className="mx-1.5">·</span>
                    {msg.timestamp}
                  </p>
                  <p className={`mt-1.5 whitespace-pre-line text-sm leading-relaxed ${msg.error ? 'text-danger' : 'text-slate-800'}`}>
                    {msg.text}
                  </p>
                  {msg.tips && msg.tips.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs text-slate-500">{isVietnamese ? 'Ý chính' : 'Key points'}</p>
                      <ol className="mt-1.5 space-y-1">
                        {msg.tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2.5 text-sm text-slate-700">
                            <span className="w-5 shrink-0 text-xs leading-6 tabular-nums text-brand">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:0.4s]" />
                </span>
                {isVietnamese ? 'Trợ lý đang trả lời' : 'Assistant is replying'}
              </div>
            )}
          </div>

          {/* Quota exhausted */}
          {quotaRemaining <= 0 && (
            <div className="border-t border-border px-5 py-4">
              <p className="text-sm font-medium text-ink">
                {isVietnamese ? 'Bạn đã dùng hết 3 câu hỏi thử' : 'You have used all 3 free questions'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {isVietnamese
                  ? 'Tạo tài khoản miễn phí hoặc đăng nhập bằng tài khoản Demo để trò chuyện không giới hạn.'
                  : 'Create a free account or sign in with a demo account to keep chatting.'}
              </p>
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                {isVietnamese ? 'Mở khoá đầy đủ' : 'Unlock full access'}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Suggested prompts */}
          {quotaRemaining > 0 && (
            <div className="border-t border-border pt-3">
              <p className="px-5 text-xs text-slate-500">
                {isVietnamese ? 'Thử hỏi' : 'Try asking'}
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleSend(p.text)}
                    disabled={typing}
                    className="w-56 shrink-0 rounded-2xl border border-border px-3.5 py-2 text-left text-xs leading-snug text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <label className="relative flex items-center">
              <span className="sr-only">{isVietnamese ? 'Tin nhắn của bạn' : 'Your message'}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  quotaRemaining > 0
                    ? isVietnamese
                      ? 'Nhập câu hỏi nghề nghiệp...'
                      : 'Ask a career question...'
                    : isVietnamese
                    ? 'Đã hết lượt dùng thử'
                    : 'Trial limit reached'
                }
                disabled={quotaRemaining <= 0 || typing}
                className="min-h-11 w-full rounded-full border border-slate-300 bg-surface pl-4 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-slate-500 focus-visible:border-brand disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {quotaRemaining <= 0 ? (
                <Lock size={16} className="absolute right-4 text-slate-400" aria-hidden="true" />
              ) : (
                <button
                  type="submit"
                  disabled={typing || !input.trim()}
                  className="absolute right-1.5 grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800 disabled:opacity-30"
                  aria-label={isVietnamese ? 'Gửi' : 'Send'}
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </label>
          </form>
        </div>
      )}

      {/* Launcher: hidden on small screens while the full-screen sheet is open */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-label={
          open
            ? isVietnamese
              ? 'Đóng khung chat'
              : 'Close chat'
            : isVietnamese
            ? 'Mở trò chuyện với trợ lý'
            : 'Open assistant chat'
        }
        className={`fixed bottom-6 right-6 z-40 h-14 items-center gap-3 rounded-full bg-ink text-white shadow-[0_12px_32px_-12px_rgba(23,32,28,0.5)] transition-colors hover:bg-brand-800 ${
          open ? 'hidden w-14 justify-center sm:flex' : 'flex pl-5 pr-6'
        }`}
      >
        {open ? (
          <X size={20} />
        ) : (
          <>
            <MessageSquare size={18} aria-hidden="true" />
            <span className="text-sm font-medium">{isVietnamese ? 'Hỏi trợ lý' : 'Ask the assistant'}</span>
            <span className="text-xs tabular-nums text-white/60">
              {quotaRemaining}/{MAX_GUEST_QUOTA}
            </span>
          </>
        )}
      </button>
    </>
  );
}
