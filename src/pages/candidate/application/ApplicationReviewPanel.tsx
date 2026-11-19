import { useState } from 'react';
import { FileSearch, Loader2 } from 'lucide-react';
import { authErrorMessage } from '../../../services/authService';
import { reviewApplication } from '../../../services/applicationService';
import type { ApplicationLanguage } from '../../../types/domain';

export function ApplicationReviewPanel({ text, language, vi, disabled }: {
  text: string;
  language: ApplicationLanguage;
  vi: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; language: ApplicationLanguage; feedback: string }>();
  const [error, setError] = useState<string>();
  const stale = result && (result.text !== text || result.language !== language);
  const title = vi ? 'AI đánh giá thư ứng tuyển' : 'AI application review';

  const run = async () => {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      const feedback = await reviewApplication(text, language);
      setResult({ text, language, feedback });
    } catch (err) {
      setError(authErrorMessage(err, vi ? 'Không đánh giá được thư.' : 'Could not review the draft.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border p-5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-ink">
            <FileSearch size={16} aria-hidden="true" />
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            {vi ? 'AI đọc bản nháp hiện tại và gợi ý cải thiện nội dung, bố cục và cách diễn đạt.'
              : 'AI reads the current draft and suggests improvements to content, structure, and wording.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || disabled || !text.trim()}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink px-5 text-sm text-ink transition-colors hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {busy ? (vi ? 'Đang đánh giá…' : 'Reviewing…')
            : result ? (vi ? 'Đánh giá lại' : 'Review again') : (vi ? 'Đánh giá thư' : 'Review draft')}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
      <div aria-live="polite">
        {stale && <p className="mt-3 text-[13px] text-slate-600">
          {vi ? 'Bản nháp đã thay đổi. Bấm Đánh giá lại để xem góp ý mới.' : 'The draft has changed. Review it again for updated feedback.'}
        </p>}
        {result && !stale && <p className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 text-[14px] leading-6 text-slate-700">
          {result.feedback}
        </p>}
      </div>
    </section>
  );
}
