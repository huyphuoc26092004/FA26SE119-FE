import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Lightbulb,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Input } from '../ui';
import { useTranslation } from '../../i18n';
import { guestAssistantReplies, type AiAssistantResponse } from './guestTrialData';

interface Message {
  role: 'USER' | 'ASSISTANT';
  text: string;
  tips?: string[];
  timestamp: string;
}

interface GuestAiChatTabProps {
  onOpenSaveModal?: () => void;
}

export function GuestAiChatTab({ onOpenSaveModal }: GuestAiChatTabProps) {
  const { isVietnamese } = useTranslation();

  const MAX_GUEST_QUOTA = 3;
  const [quotaRemaining, setQuotaRemaining] = useState<number>(3);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ASSISTANT',
      text: isVietnamese
        ? 'Xin chào bạn! Tôi là Trợ lý AI Nghề nghiệp của CareerPilot. Bạn đang ở chế độ Dùng Thử Dành Cho Khách (Guest Trial) với 3 câu hỏi tư vấn miễn phí. Bạn có thể hỏi tôi về định hướng nghề nghiệp, cách viết CV hoặc mẹo phỏng vấn.'
        : 'Welcome! I am your AI Career Assistant from CareerPilot. You are currently in Guest Trial Mode with 3 complimentary queries. Ask me anything about career roadmap, CV optimization, or interview tips.',
      tips: isVietnamese
        ? ['Tối ưu hoá CV chuẩn ATS', 'Xu hướng tuyển dụng ngành công nghệ', 'Kỹ năng phỏng vấn thực chiến']
        : ['ATS CV Optimization', 'Tech Hiring Trends', 'Interview Strategy'],
      timestamp: '12:00',
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

  const handleSend = async (textToSend = input, promptKey?: string) => {
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

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 800));

    let replyData: AiAssistantResponse = guestAssistantReplies.default;
    const lower = currentText.toLowerCase();

    if (promptKey && guestAssistantReplies[promptKey]) {
      replyData = guestAssistantReplies[promptKey];
    } else if (lower.includes('ats') || lower.includes('cv') || lower.includes('hồ sơ')) {
      replyData = guestAssistantReplies.ats;
    } else if (lower.includes('frontend') || lower.includes('react') || lower.includes('kỹ năng')) {
      replyData = guestAssistantReplies.frontend;
    } else if (lower.includes('yếu') || lower.includes('phỏng vấn') || lower.includes('weakness')) {
      replyData = guestAssistantReplies.weakness;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'ASSISTANT',
        text: replyData.answer,
        tips: replyData.tips,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setTyping(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro & Quota Header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-brand-50/80 border border-brand-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-semibold text-brand-800">
              <Lightbulb size={13} className="text-brand-600" />
              {isVietnamese ? 'Trò Chuyện Giới Hạn Với Trợ Lý AI' : 'Limited AI Assistant Chat Trial'}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-medium text-slate-900 md:text-xl">
            {isVietnamese
              ? 'Tư vấn nghề nghiệp thông minh không cần đăng nhập'
              : 'Smart career consultation without signing in'}
          </h3>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {isVietnamese
              ? 'Mỗi khách dùng thử được trải nghiệm tối đa 3 câu hỏi phản hồi nhanh từ AI để giải quyết thắc mắc tìm việc.'
              : 'Each guest gets up to 3 quick AI consultation queries to answer immediate career questions.'}
          </p>
        </div>

        {/* Quota Counter Badge */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-xs border border-slate-200">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">
              {isVietnamese ? 'Lượt hỏi miễn phí còn lại' : 'Free queries left'}
            </p>
            <p className="text-base font-semibold text-slate-900">
              <span
                className={
                  quotaRemaining > 1
                    ? 'text-brand-600'
                    : quotaRemaining === 1
                    ? 'text-amber-600'
                    : 'text-red-500'
                }
              >
                {quotaRemaining}
              </span>{' '}
              / {MAX_GUEST_QUOTA}
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((step) => {
              const active = step <= quotaRemaining;
              return (
                <div
                  key={step}
                  className={`h-7 w-2 rounded-full transition-all ${
                    active ? 'bg-brand-600' : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <Card className="p-0 overflow-hidden shadow-xs border-slate-200/90">
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-xs">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {isVietnamese ? 'CareerPilot AI Coach' : 'CareerPilot AI Coach'}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                {isVietnamese ? 'Đang trực tuyến · Phiên thử nghiệm' : 'Online · Guest Session'}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
            {isVietnamese ? 'Chế độ Khách (Giới hạn)' : 'Guest Mode (Limited)'}
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex h-[380px] flex-col gap-4 overflow-y-auto p-5 bg-canvas">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'USER' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-medium ${
                  msg.role === 'USER'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-brand-600 border border-brand-100 shadow-xs'
                }`}
              >
                {msg.role === 'USER' ? <User size={15} /> : <MessageSquare size={16} />}
              </div>

              <div className="space-y-1.5">
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed sm:text-sm ${
                    msg.role === 'USER'
                      ? 'bg-brand-600 text-white shadow-xs rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Optional AI tips pill list */}
                  {msg.tips && msg.tips.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1.5">
                        <Lightbulb size={12} className="text-amber-500" />
                        {isVietnamese ? 'Gợi ý cốt lõi từ AI:' : 'AI Key Recommendations:'}
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {msg.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 size={13} className="text-brand-600 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <p
                  className={`text-[10px] text-slate-400 ${
                    msg.role === 'USER' ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-3 max-w-[80%]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-brand-600 border border-brand-100 shadow-xs">
                <MessageSquare size={16} />
              </div>
              <div className="rounded-2xl bg-surface border border-slate-200/80 px-4 py-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                  <span className="h-2 w-2 rounded-full bg-brand-600 [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-brand-600 [animation-delay:0.4s]" />
                </span>
                <span>
                  {isVietnamese ? 'Trợ lý đang suy nghĩ...' : 'Assistant is thinking...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quota Exhausted Banner */}
        {quotaRemaining <= 0 && (
          <div className="bg-brand-600 p-4 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/20 p-2 text-white">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">
                    {isVietnamese
                      ? 'Bạn đã trải nghiệm hết 3 câu hỏi dùng thử miễn phí!'
                      : 'You have used all 3 free trial queries!'}
                  </h4>
                  <p className="mt-0.5 text-xs text-brand-100">
                    {isVietnamese
                      ? 'Đăng ký tài khoản miễn phí hoặc đăng nhập bằng tài khoản Demo để mở khoá trò chuyện không giới hạn.'
                      : 'Create a free account or sign in with Demo accounts to unlock unlimited consultations.'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="bg-surface text-brand-700 hover:bg-brand-50 text-xs font-medium whitespace-nowrap shadow-sm"
                onClick={onOpenSaveModal}
              >
                {isVietnamese ? 'Mở Khoá Đầy Đủ Ngay' : 'Unlock Full Access'}
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        {quotaRemaining > 0 && (
          <div className="border-t border-slate-100 bg-surface p-3">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">
              {isVietnamese ? 'Gợi ý câu hỏi phổ biến:' : 'Suggested career prompts:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSend(p.text, p.key)}
                  disabled={typing}
                  className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-700 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Lightbulb size={11} className="text-brand-600" />
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-surface p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex gap-2"
          >
            <label className="flex-1 relative">
              <span className="sr-only">Your message</span>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  quotaRemaining > 0
                    ? isVietnamese
                      ? 'Nhập câu hỏi nghề nghiệp của bạn (còn ' + quotaRemaining + ' lượt dùng thử)...'
                      : 'Type your career question (' + quotaRemaining + ' trial queries left)...'
                    : isVietnamese
                    ? 'Đã hết lượt dùng thử. Đăng ký để tiếp tục trò chuyện!'
                    : 'Trial quota reached. Sign up to continue chatting!'
                }
                disabled={quotaRemaining <= 0 || typing}
                className="pr-10 text-xs sm:text-sm"
              />
              {quotaRemaining <= 0 && (
                <Lock size={16} className="absolute right-3 top-3 text-slate-400" />
              )}
            </label>
            <Button
              type="submit"
              disabled={typing || !input.trim() || quotaRemaining <= 0}
              className="px-4"
              aria-label="Send"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
