import { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Sparkles,
  ArrowRight,
  FileText,
  Briefcase,
} from 'lucide-react';
import type { AiChatMessage } from '../../../types/domain';
import { MarkdownMessage } from './MarkdownMessage';
import { useTranslation } from '../../../i18n';

interface AssistantMessageItemProps {
  message: AiChatMessage;
  onSendPrompt: (prompt: string) => void;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}

export function AssistantMessageItem({
  message,
  onSendPrompt,
  onFeedback,
}: AssistantMessageItemProps) {
  const { isVietnamese, t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end max-w-3xl ml-auto">
        <div className="flex flex-col items-end space-y-1">
          {message.contextSnapshot && (message.contextSnapshot.cvName || message.contextSnapshot.jobTitle) && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              {message.contextSnapshot.cvName && (
                <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  <FileText size={9} /> {message.contextSnapshot.cvName}
                </span>
              )}
              {message.contextSnapshot.jobTitle && (
                <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                  <Briefcase size={9} /> {message.contextSnapshot.jobTitle}
                </span>
              )}
            </div>
          )}

          <div className="rounded-2xl rounded-tr-xs bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm text-white shadow-sm leading-relaxed max-w-xl">
            <p className="whitespace-pre-line">{message.content}</p>
          </div>

          <span className="text-[10px] text-slate-400 pr-1">{message.timestamp}</span>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
          <User size={15} />
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex items-start gap-3 max-w-3xl mr-auto">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-blue-500/20">
        <Bot size={18} />
      </div>

      <div className="flex-1 space-y-3">
        <div className="rounded-3xl rounded-tl-xs border border-slate-200/90 bg-white p-5 shadow-xs">
          {/* Main Markdown Body */}
          <MarkdownMessage content={message.content} />

          {/* Highlights pills */}
          {message.highlights && message.highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {message.highlights.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100"
                >
                  <Sparkles size={11} className="text-blue-500" />
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Tips Callout */}
          {message.tips && message.tips.length > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3 text-xs text-amber-900">
              <p className="flex items-center gap-1.5 font-bold mb-1.5 text-amber-900">
                <Lightbulb size={14} className="text-amber-600" />
                {isVietnamese ? 'Lời khuyên từ Trợ lý AI:' : 'AI Key Pro-Tips:'}
              </p>
              <ul className="space-y-1 pl-4 list-disc text-amber-800">
                {message.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Suggestions Chips */}
          {message.actionSuggestions && message.actionSuggestions.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('assistant.suggestedQuestions')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.actionSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendPrompt(item.prompt)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 active:scale-95 transition cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={11} className="text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Actions Footer (Copy, Like, Dislike, Timestamp) */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              title={copied ? t('assistant.copied') : t('assistant.copy')}
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-semibold">{t('assistant.copied')}</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span className="text-[11px]">{t('assistant.copy')}</span>
                </>
              )}
            </button>

            <button
              onClick={() => onFeedback(message.id, 'like')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition cursor-pointer ${
                message.feedback === 'like'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={t('assistant.helpful')}
            >
              <ThumbsUp size={12} />
            </button>

            <button
              onClick={() => onFeedback(message.id, 'dislike')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition cursor-pointer ${
                message.feedback === 'dislike'
                  ? 'bg-red-50 text-red-600 font-semibold'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={t('assistant.unhelpful')}
            >
              <ThumbsDown size={12} />
            </button>
          </div>

          <span className="text-[10px]">{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
}
