import { useState } from 'react';
import { Check, Loader2, SpellCheck } from 'lucide-react';
import { authErrorMessage } from '../../../services/authService';
import { proofreadApplication, type ProofreadIssue } from '../../../services/applicationService';
import type { ApplicationLanguage } from '../../../types/domain';

/** AI chỉ soát lỗi chính tả/ngữ pháp và gợi ý sửa; người dùng tự quyết áp dụng từng gợi ý. */
export function ProofreadPanel({
  text,
  language,
  vi,
  onApply,
  disabled,
}: {
  text: string;
  language: ApplicationLanguage;
  vi: boolean;
  onApply: (original: string, suggestion: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<ProofreadIssue[] | null>(null);
  const [raw, setRaw] = useState<string | undefined>();
  const [applied, setApplied] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checkedText, setCheckedText] = useState('');

  const run = async () => {
    setBusy(true);
    setError(null);
    setApplied([]);
    try {
      const result = await proofreadApplication(text, language);
      setIssues(result.issues);
      setRaw(result.raw);
      setCheckedText(text);
    } catch (err) {
      setError(authErrorMessage(err, vi ? 'Không kiểm tra được thư.' : 'Could not check the letter.'));
    } finally {
      setBusy(false);
    }
  };

  const pending = (issues ?? []).filter((i) => !applied.includes(i.original) && text.includes(i.original));
  const stale = issues !== null && checkedText !== text && pending.length === 0 && applied.length === 0;

  return (
    <section className="mt-6 rounded-2xl border border-border p-5" aria-label={vi ? 'Kiểm tra chính tả' : 'Proofreading'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-medium text-ink">
            <SpellCheck size={16} aria-hidden="true" />
            {vi ? 'AI kiểm tra chính tả & ngữ pháp' : 'AI spelling & grammar check'}
          </h3>
          <p className="mt-1 text-[13px] text-slate-600">
            {vi
              ? 'AI chỉ chỉ ra lỗi và gợi ý sửa, không viết lại thư. Bạn chọn áp dụng từng gợi ý.'
              : 'AI only points out mistakes and suggests fixes; it never rewrites your letter.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || disabled || text.trim().length < 20}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink px-5 text-sm text-ink transition-colors hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {busy ? (vi ? 'Đang kiểm tra…' : 'Checking…') : issues ? (vi ? 'Kiểm tra lại' : 'Check again') : vi ? 'Kiểm tra chính tả' : 'Check spelling'}
        </button>
      </div>
      {text.trim().length < 20 && <p className="mt-3 text-[13px] text-slate-500">{vi ? 'Viết ít nhất vài câu rồi kiểm tra.' : 'Write a few sentences first.'}</p>}
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
      {issues && !busy && (
        <div className="mt-4">
          {raw ? (
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-700">{raw}</p>
          ) : pending.length === 0 ? (
            <p className="flex items-center gap-2 text-[13px] text-brand">
              <Check size={14} aria-hidden="true" />
              {applied.length
                ? vi ? `Đã áp dụng ${applied.length} gợi ý.` : `Applied ${applied.length} suggestions.`
                : stale
                  ? vi ? 'Thư đã thay đổi, bấm Kiểm tra lại.' : 'The letter changed; check again.'
                  : vi ? 'Không phát hiện lỗi chính tả hay ngữ pháp.' : 'No spelling or grammar mistakes found.'}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-slate-600">{vi ? `${pending.length} gợi ý sửa` : `${pending.length} suggestions`}</p>
                <button
                  type="button"
                  onClick={() => {
                    pending.forEach((i) => onApply(i.original, i.suggestion));
                    setApplied((prev) => [...prev, ...pending.map((i) => i.original)]);
                  }}
                  className="text-[13px] text-brand underline underline-offset-4"
                >
                  {vi ? 'Áp dụng tất cả' : 'Apply all'}
                </button>
              </div>
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {pending.map((issue) => (
                  <li key={issue.original} className="flex flex-wrap items-start justify-between gap-3 py-3 text-[14px]">
                    <div className="min-w-0 flex-1">
                      <p>
                        <span className="text-danger line-through decoration-1">{issue.original}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="text-brand">{issue.suggestion}</span>
                      </p>
                      {issue.reason && <p className="mt-1 text-[12px] text-slate-500">{issue.reason}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onApply(issue.original, issue.suggestion);
                        setApplied((prev) => [...prev, issue.original]);
                      }}
                      className="shrink-0 text-[13px] text-ink underline underline-offset-4 hover:text-brand"
                    >
                      {vi ? 'Áp dụng' : 'Apply'}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
