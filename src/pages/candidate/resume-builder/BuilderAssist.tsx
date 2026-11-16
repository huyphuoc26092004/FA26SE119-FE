import { useRef, useState } from 'react';
import { ChevronDown, List, Sparkles } from 'lucide-react';
import { suggestCvText, type CvSuggestParams } from '../../../services/assistantService';
import { authErrorMessage } from '../../../services/authService';
import { guestErrorMessage } from '../../../services/guestService';
import type { StepTips } from './builderTips';

type Lang = 'vi' | 'en';

const copy = {
  vi: {
    tips: 'Gợi ý cách ghi',
    example: 'Ví dụ',
    checks: 'Cần xem lại',
    allGood: 'Phần này đã ổn.',
    ai: 'Gợi ý bằng AI',
    aiWorking: 'Đang viết gợi ý… có thể mất vài chục giây.',
    aiTitle: 'Gợi ý của AI',
    use: 'Dùng gợi ý này',
    retry: 'Viết lại',
    dismiss: 'Bỏ qua',
    aiNote: 'Đọc lại và sửa cho đúng với bạn trước khi lưu, nhất là các chỗ [số liệu].',
    aiError: 'Không lấy được gợi ý từ AI.',
    aiGenerate: 'Tạo ra với AI',
    bulletTooltip: 'Gạch đầu dòng',
    bulletHint: 'Mỗi dòng là một gạch đầu dòng công việc',
    descLabel: 'Mô tả',
  },
  en: {
    tips: 'Writing tips',
    example: 'Example',
    checks: 'Worth a look',
    allGood: 'This section looks good.',
    ai: 'Suggest with AI',
    aiWorking: 'Writing a suggestion… this can take a few dozen seconds.',
    aiTitle: 'AI suggestion',
    use: 'Use this',
    retry: 'Try again',
    dismiss: 'Dismiss',
    aiNote: 'Review and adjust it before saving, especially any [number] placeholders.',
    aiError: 'Could not get a suggestion from AI.',
    aiGenerate: 'Generate with AI',
    bulletTooltip: 'Bullet list',
    bulletHint: 'Each line is a bullet point',
    descLabel: 'Description',
  },
};

/** Khối gợi ý soạn sẵn + kiểm tra nhanh, đặt dưới tiêu đề mỗi bước. */
export function StepTipsPanel({ tips, checks, lang }: { tips: StepTips; checks: string[]; lang: Lang }) {
  const c = copy[lang];
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border-y border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left text-sm"
      >
        <span className="text-ink">{c.tips}</span>
        <span className="flex items-center gap-3">
          <span className={checks.length ? 'text-warning' : 'text-brand'}>
            {checks.length ? `${checks.length} ${c.checks.toLowerCase()}` : c.allGood}
          </span>
          <ChevronDown size={15} aria-hidden="true" className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="grid gap-6 pb-5 text-sm leading-6 text-slate-600 sm:grid-cols-2">
          <ul className="space-y-2">
            {tips.tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="text-brand">–</span>
                {tip}
              </li>
            ))}
            {tips.example && (
              <li className="border-l border-brand-300 pl-3 text-slate-500">
                <span className="block text-xs uppercase tracking-[0.08em] text-slate-400">{c.example}</span>
                {tips.example}
              </li>
            )}
          </ul>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{c.checks}</p>
            {checks.length ? (
              <ul className="mt-2 space-y-2">
                {checks.map((check) => (
                  <li key={check} className="flex gap-2 text-ink">
                    <span aria-hidden="true" className="text-warning">•</span>
                    {check}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-brand">{c.allGood}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nút "Gợi ý bằng AI" cho một ô văn bản: hỏi trợ lý, hiện bản gợi ý,
 * người dùng bấm "Dùng" thì thay vào ô.
 */
export function AiSuggest({ params, onApply, lang, guest = false }: { params: () => CvSuggestParams; onApply: (text: string) => void; lang: Lang; guest?: boolean }) {
  const c = copy[lang];
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string }>({ status: 'idle' });

  const run = async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'done', text: await suggestCvText(params(), { guest }) });
    } catch (error) {
      setState({ status: 'error', text: guest ? guestErrorMessage(error, lang === 'vi') : authErrorMessage(error, c.aiError) });
    }
  };

  return (
    <div className="mt-2">
      {state.status !== 'done' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={run}
            disabled={state.status === 'loading'}
            className="inline-flex cursor-pointer items-center gap-1 border-b border-current pb-px text-sm text-brand transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            {c.ai}
          </button>
          {state.status === 'loading' && <span className="text-sm text-slate-500">{c.aiWorking}</span>}
          {state.status === 'error' && <span className="whitespace-pre-line text-sm text-danger">{state.text}</span>}
        </div>
      )}
      {state.status === 'done' && state.text && (
        <div className="border-l-2 border-brand bg-brand-50/60 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.08em] text-brand">{c.aiTitle}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink">{state.text}</p>
          <p className="mt-2 text-xs text-slate-500">{c.aiNote}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => {
                onApply(state.text!);
                setState({ status: 'idle' });
              }}
              className="inline-flex min-h-9 cursor-pointer items-center rounded-full bg-ink px-4 text-white hover:bg-brand-800"
            >
              {c.use}
            </button>
            <button type="button" onClick={run} className="cursor-pointer border-b border-current pb-px text-ink hover:text-brand">
              {c.retry}
            </button>
            <button type="button" onClick={() => setState({ status: 'idle' })} className="cursor-pointer text-slate-500 hover:text-ink">
              {c.dismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Trình soạn thảo ô Mô tả kinh nghiệm theo chuẩn Better CV:
 * - Có nút chèn nhanh gạch đầu dòng (bullet) và tự động nối gạch đầu dòng khi Enter.
 * - Tích hợp nút gradient "Tạo ra với AI" trực tiếp ở thanh tiêu đề.
 */
export function ExperienceDescriptionEditor({
  value,
  onChange,
  guest = false,
  lang = 'vi',
  placeholder,
  suggestParams,
}: {
  value?: string;
  onChange: (val: string) => void;
  guest?: boolean;
  lang?: Lang;
  placeholder?: string;
  suggestParams?: () => CvSuggestParams;
}) {
  const c = copy[lang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [aiState, setAiState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string }>({ status: 'idle' });

  const runAi = async () => {
    if (!suggestParams) return;
    setAiState({ status: 'loading' });
    try {
      setAiState({ status: 'done', text: await suggestCvText(suggestParams(), { guest }) });
    } catch (error) {
      setAiState({ status: 'error', text: guest ? guestErrorMessage(error, lang === 'vi') : authErrorMessage(error, c.aiError) });
    }
  };

  const insertBullet = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + '• ';
    const nextVal = before + insertion + after;
    onChange(nextVal);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + insertion.length;
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const text = el.value;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const currentLine = text.substring(lineStart, start);
      const bulletMatch = currentLine.match(/^(\s*[-*•–]\s*)/);
      if (bulletMatch) {
        if (currentLine.trim() === '•' || currentLine.trim() === '-' || currentLine.trim() === '*') {
          e.preventDefault();
          const before = text.substring(0, lineStart);
          const after = text.substring(start);
          onChange(before + after);
          return;
        }
        e.preventDefault();
        const bulletStr = '• ';
        const before = text.substring(0, start);
        const after = text.substring(start);
        onChange(before + '\n' + bulletStr + after);
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = start + 1 + bulletStr.length;
        }, 0);
      }
    }
  };

  return (
    <div className="block">
      <div className="flex items-center justify-between pb-1.5">
        <span className="text-[13px] text-slate-500">{c.descLabel}</span>
        {suggestParams && (
          <button
            type="button"
            onClick={runAi}
            disabled={aiState.status === 'loading'}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
          >
            <Sparkles size={13} className={aiState.status === 'loading' ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{aiState.status === 'loading' ? (lang === 'vi' ? 'Đang tạo…' : 'Generating…') : c.aiGenerate}</span>
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-300 bg-white/70 focus-within:border-ink focus-within:bg-white focus-within:ring-1 focus-within:ring-ink">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50/80 px-2.5 py-1 text-slate-600">
          <button
            type="button"
            title={c.bulletTooltip}
            onClick={insertBullet}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-slate-200 hover:text-ink"
          >
            <List size={15} />
          </button>
          <span className="mx-1 h-3.5 w-px bg-slate-300" />
          <span className="text-[11px] text-slate-400">{c.bulletHint}</span>
        </div>

        <textarea
          ref={textareaRef}
          rows={5}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full resize-y rounded-b-lg border-0 bg-transparent px-3 py-2.5 text-[15px] leading-7 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </div>

      {aiState.status === 'error' && (
        <p className="mt-1 text-xs text-danger">{aiState.text}</p>
      )}

      {aiState.status === 'done' && aiState.text && (
        <div className="mt-2 border-l-2 border-brand bg-brand-50/60 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.08em] text-brand">{c.aiTitle}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink">{aiState.text}</p>
          <p className="mt-2 text-xs text-slate-500">{c.aiNote}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => {
                onChange(aiState.text!);
                setAiState({ status: 'idle' });
              }}
              className="inline-flex min-h-9 cursor-pointer items-center rounded-full bg-ink px-4 text-white hover:bg-brand-800"
            >
              {c.use}
            </button>
            <button type="button" onClick={runAi} className="cursor-pointer border-b border-current pb-px text-ink hover:text-brand">
              {c.retry}
            </button>
            <button type="button" onClick={() => setAiState({ status: 'idle' })} className="cursor-pointer text-slate-500 hover:text-ink">
              {c.dismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
