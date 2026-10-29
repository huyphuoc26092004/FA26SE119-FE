import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { suggestCvText, type CvSuggestParams } from '../../../services/assistantService';
import { authErrorMessage } from '../../../services/authService';
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
export function AiSuggest({ params, onApply, lang }: { params: () => CvSuggestParams; onApply: (text: string) => void; lang: Lang }) {
  const c = copy[lang];
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string }>({ status: 'idle' });

  const run = async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'done', text: await suggestCvText(params()) });
    } catch (error) {
      setState({ status: 'error', text: authErrorMessage(error, c.aiError) });
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
