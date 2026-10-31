import type {
  ApplicationIssueCategory,
  ApplicationReviewIssue,
  ApplicationReviewResult,
  ApplicationReviewScore,
} from '../../../types/domain';
import { useTranslation } from '../../../i18n';

export type IssueState = 'open' | 'applied' | 'dismissed';

interface ApplicationReviewPanelProps {
  review?: ApplicationReviewResult;
  /** Score summary from an earlier check of a saved letter (issues are not kept). */
  previousScore?: ApplicationReviewScore;
  isChecking: boolean;
  /** The letter changed after the last check. */
  isStale: boolean;
  error?: string | null;
  issueStates: Record<string, IssueState>;
  /** Whether the issue's original text is still in the letter. */
  canApply: (issue: ApplicationReviewIssue) => boolean;
  onApply: (issue: ApplicationReviewIssue) => void;
  onDismiss: (issue: ApplicationReviewIssue) => void;
  onLocate: (issue: ApplicationReviewIssue) => void;
  onRecheck: () => void;
}

const copy = {
  vi: {
    idleTitle: 'Chưa kiểm tra',
    idleText: 'Viết xong thư, bấm “Kiểm tra thư”. Thư sẽ được soát theo 5 tiêu chí dưới đây và bạn nhận về từng chỗ cần sửa kèm câu gợi ý.',
    criteria: [
      ['Độ khớp công việc', 'Thư có nối kinh nghiệm thật trong CV với yêu cầu của tin tuyển dụng không.'],
      ['Rõ ràng', 'Câu ngắn gọn, mỗi đoạn một ý, người đọc hiểu ngay bạn muốn gì.'],
      ['Văn phong', 'Lịch sự, chuyên nghiệp, hợp với công ty và vị trí.'],
      ['Chính tả & ngữ pháp', 'Lỗi chính tả, dấu câu, ngữ pháp trong ngôn ngữ của thư.'],
      ['Bố cục', 'Lời chào, mở đầu, thân thư, kết thư và ký tên; email cần tiêu đề rõ.'],
    ],
    checking: 'Đang đọc và soát thư…',
    checkingSteps: ['Đối chiếu với tin tuyển dụng', 'Đối chiếu với CV đã chọn', 'Soát chính tả và văn phong', 'Viết gợi ý sửa'],
    checkingNote: 'Có thể mất một đến vài phút.',
    score: 'Điểm thư',
    verdict: (n: number): string =>
      n >= 85 ? 'Sẵn sàng để gửi.' : n >= 70 ? 'Khá tốt, sửa vài chỗ là ổn.' : n >= 50 ? 'Cần chỉnh thêm trước khi gửi.' : 'Nên viết lại một số phần.',
    stale: 'Bạn đã sửa thư sau lần kiểm tra này.',
    recheck: 'Kiểm tra lại',
    previous: (n: number) => `Lần kiểm tra trước: ${n}/100.`,
    previousHint: 'Gợi ý chi tiết không được lưu lại. Bấm “Kiểm tra thư” để xem lại.',
    bars: { relevance: 'Độ khớp công việc', clarity: 'Rõ ràng', tone: 'Văn phong', language: 'Chính tả & ngữ pháp', structure: 'Bố cục' },
    issuesTitle: 'Cần sửa',
    issuesCount: (open: number, total: number) => `${open}/${total} chưa xử lý`,
    noIssues: 'Không tìm thấy lỗi đáng kể nào.',
    allDone: 'Bạn đã xử lý hết các gợi ý. Kiểm tra lại để cập nhật điểm.',
    original: 'Trong thư',
    suggestion: 'Nên sửa thành',
    add: 'Nên thêm',
    apply: 'Áp dụng',
    applied: 'Đã áp dụng',
    dismiss: 'Bỏ qua',
    dismissed: 'Đã bỏ qua',
    undoDismiss: 'Hiện lại',
    locate: 'Xem trong thư',
    copySuggestion: 'Chép gợi ý',
    notFound: 'Đoạn này không còn trong thư.',
    strengths: 'Điểm tốt',
    keywords: 'Từ khoá nên nhắc đến (CV của bạn có)',
    severity: { HIGH: 'Quan trọng', MEDIUM: 'Nên sửa', LOW: 'Nhỏ' },
    categories: {
      SPELLING: 'Chính tả',
      GRAMMAR: 'Ngữ pháp',
      TONE: 'Văn phong',
      CLARITY: 'Rõ ràng',
      RELEVANCE: 'Độ khớp',
      STRUCTURE: 'Bố cục',
      FACT: 'Không có trong CV',
      LENGTH: 'Độ dài',
    } as Record<ApplicationIssueCategory, string>,
    note: 'Gợi ý chỉ dựa trên CV và tin tuyển dụng bạn chọn. Hãy đọc lại trước khi áp dụng.',
  },
  en: {
    idleTitle: 'Not checked yet',
    idleText: 'When your letter is ready, press “Check letter”. It is reviewed on the five criteria below and you get each fix with a suggested rewrite.',
    criteria: [
      ['Job relevance', 'Does the letter link real experience from your CV to the job requirements.'],
      ['Clarity', 'Short sentences, one idea per paragraph, the ask is obvious.'],
      ['Tone', 'Polite and professional, suited to the company and role.'],
      ['Spelling & grammar', 'Spelling, punctuation and grammar in the letter’s language.'],
      ['Structure', 'Greeting, opening, body, closing and sign-off; emails need a clear subject.'],
    ],
    checking: 'Reading and checking your letter…',
    checkingSteps: ['Comparing with the job post', 'Comparing with the selected CV', 'Checking spelling and tone', 'Writing suggestions'],
    checkingNote: 'This can take a minute or two.',
    score: 'Letter score',
    verdict: (n: number): string =>
      n >= 85 ? 'Ready to send.' : n >= 70 ? 'Good, a few fixes left.' : n >= 50 ? 'Needs more work before sending.' : 'Consider rewriting some parts.',
    stale: 'You edited the letter after this check.',
    recheck: 'Check again',
    previous: (n: number) => `Previous check: ${n}/100.`,
    previousHint: 'Detailed suggestions are not saved. Press “Check letter” to see them again.',
    bars: { relevance: 'Job relevance', clarity: 'Clarity', tone: 'Tone', language: 'Spelling & grammar', structure: 'Structure' },
    issuesTitle: 'To fix',
    issuesCount: (open: number, total: number) => `${open}/${total} open`,
    noIssues: 'No significant issues found.',
    allDone: 'You handled every suggestion. Check again to update the score.',
    original: 'In your letter',
    suggestion: 'Change to',
    add: 'Add',
    apply: 'Apply',
    applied: 'Applied',
    dismiss: 'Dismiss',
    dismissed: 'Dismissed',
    undoDismiss: 'Show again',
    locate: 'Show in letter',
    copySuggestion: 'Copy suggestion',
    notFound: 'This text is no longer in the letter.',
    strengths: 'What works',
    keywords: 'Keywords worth mentioning (your CV supports them)',
    severity: { HIGH: 'Important', MEDIUM: 'Should fix', LOW: 'Minor' },
    categories: {
      SPELLING: 'Spelling',
      GRAMMAR: 'Grammar',
      TONE: 'Tone',
      CLARITY: 'Clarity',
      RELEVANCE: 'Relevance',
      STRUCTURE: 'Structure',
      FACT: 'Not in CV',
      LENGTH: 'Length',
    } as Record<ApplicationIssueCategory, string>,
    note: 'Suggestions only use the CV and job you selected. Read them before applying.',
  },
};

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-[13px] transition-colors duration-150 hover:text-brand disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

const severityDot: Record<string, string> = {
  HIGH: 'bg-red-700',
  MEDIUM: 'bg-amber-600',
  LOW: 'bg-slate-400',
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-px w-full bg-border">
        <div className="h-[3px] -translate-y-px bg-brand" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function IssueRow({
  issue,
  index,
  state,
  applicable,
  c,
  onApply,
  onDismiss,
  onLocate,
}: {
  issue: ApplicationReviewIssue;
  index: number;
  state: IssueState;
  applicable: boolean;
  c: typeof copy.vi;
  onApply: () => void;
  onDismiss: () => void;
  onLocate: () => void;
}) {
  const missing = issue.location === 'MISSING' || !issue.original;
  const done = state !== 'open';

  return (
    <li className={`border-b border-border py-4 ${done ? 'opacity-55' : ''}`}>
      <div className="flex items-baseline gap-3">
        <span className="pt-px text-xs tabular-nums text-slate-500">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-600">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${severityDot[issue.severity]}`} aria-hidden="true" />
            <span className="text-ink">{c.severity[issue.severity]}</span>
            <span className="text-slate-400">·</span>
            <span>{c.categories[issue.category]}</span>
            {state === 'applied' && <span className="text-brand">· {c.applied}</span>}
            {state === 'dismissed' && <span>· {c.dismissed}</span>}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-ink">{issue.explanation}</p>

          {!missing && (
            <p className="mt-2 text-[13px] leading-6">
              <span className="text-slate-500">{c.original}: </span>
              <span className={`text-slate-700 ${state === 'applied' ? '' : 'line-through decoration-red-700/60'}`}>
                {issue.original}
              </span>
            </p>
          )}
          {issue.suggestion && (
            <p className="mt-1 text-[13px] leading-6">
              <span className="text-slate-500">{missing ? c.add : c.suggestion}: </span>
              <span className="text-brand">{issue.suggestion}</span>
            </p>
          )}

          {!done && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              {!missing && applicable && issue.suggestion && (
                <button
                  type="button"
                  onClick={onApply}
                  className="inline-flex min-h-8 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-800 cursor-pointer"
                >
                  {c.apply}
                </button>
              )}
              {!missing && applicable && (
                <button type="button" onClick={onLocate} className={`${textLink} text-ink`}>
                  {c.locate}
                </button>
              )}
              {missing && issue.suggestion && (
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(issue.suggestion)}
                  className={`${textLink} text-ink`}
                >
                  {c.copySuggestion}
                </button>
              )}
              <button type="button" onClick={onDismiss} className={`${textLink} text-slate-600`}>
                {c.dismiss}
              </button>
              {!missing && !applicable && <span className="text-[12px] text-slate-500">{c.notFound}</span>}
            </div>
          )}
          {state === 'dismissed' && (
            <button type="button" onClick={onDismiss} className={`${textLink} mt-2 text-slate-600`}>
              {c.undoDismiss}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Right-hand panel: what the check looks at, progress while checking, then score and fixes. */
export function ApplicationReviewPanel({
  review,
  previousScore,
  isChecking,
  isStale,
  error,
  issueStates,
  canApply,
  onApply,
  onDismiss,
  onLocate,
  onRecheck,
}: ApplicationReviewPanelProps) {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;

  if (isChecking) {
    return (
      <div className="pt-6" role="status" aria-live="polite">
        <p className="text-[15px] text-ink">{c.checking}</p>
        <div className="mt-4 h-px w-full overflow-hidden bg-border">
          <div className="h-[3px] w-1/3 -translate-y-px animate-[app-check_1.4s_ease-in-out_infinite] bg-brand" />
        </div>
        <ol className="mt-5">
          {c.checkingSteps.map((step, i) => (
            <li key={step} className="flex gap-3 border-b border-border py-3 text-sm text-slate-600">
              <span className="text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px] text-slate-500">{c.checkingNote}</p>
        <style>{'@keyframes app-check{0%{transform:translate(-100%,-1px)}100%{transform:translate(300%,-1px)}}'}</style>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="pt-6">
        {error && <p className="mb-5 border-l-2 border-red-700 pl-3 text-sm leading-6 text-red-800">{error}</p>}
        {previousScore && previousScore.overallScore > 0 ? (
          <div className="mb-6">
            <p className="text-[15px] text-ink">{c.previous(previousScore.overallScore)}</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">{c.previousHint}</p>
          </div>
        ) : (
          <>
            <p className="text-[15px] text-ink">{c.idleTitle}</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">{c.idleText}</p>
          </>
        )}
        <ol className="mt-5">
          {c.criteria.map(([name, desc], i) => (
            <li key={name} className="flex gap-3 border-b border-border py-3">
              <span className="pt-0.5 text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="block text-sm text-ink">{name}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-slate-600">{desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const openCount = review.issues.filter((i) => (issueStates[i.id] ?? 'open') === 'open').length;
  const bars = (Object.keys(c.bars) as (keyof typeof c.bars)[]).map((key) => ({
    label: c.bars[key],
    value: review.scores[key],
  }));

  return (
    <div className="pt-6">
      {error && <p className="mb-5 border-l-2 border-red-700 pl-3 text-sm leading-6 text-red-800">{error}</p>}

      {/* Score */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-slate-600">{c.score}</p>
          <p className="mt-1 flex items-baseline text-ink">
            <span className="text-[clamp(3rem,5vw,4.25rem)] font-normal leading-none tracking-[-0.04em] tabular-nums">
              {review.overallScore}
            </span>
            <span className="ml-1 text-lg text-slate-500">/100</span>
          </p>
          <p className="mt-2 text-sm text-brand">{c.verdict(review.overallScore)}</p>
        </div>
      </div>

      {isStale && (
        <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-amber-600 pl-3 text-[13px] leading-6 text-slate-700">
          {c.stale}
          <button type="button" onClick={onRecheck} className={`${textLink} text-ink`}>
            {c.recheck}
          </button>
        </p>
      )}

      {review.summary && <p className="mt-5 text-sm leading-7 text-slate-700">{review.summary}</p>}

      <div className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {bars.map((b) => (
          <ScoreBar key={b.label} label={b.label} value={b.value} />
        ))}
      </div>

      {/* Issues */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2">
          <h3 className="text-[15px] font-medium text-ink">{c.issuesTitle}</h3>
          {review.issues.length > 0 && (
            <span className="text-[12px] tabular-nums text-slate-600">{c.issuesCount(openCount, review.issues.length)}</span>
          )}
        </div>
        {review.issues.length === 0 ? (
          <p className="py-4 text-sm text-slate-600">{c.noIssues}</p>
        ) : (
          <>
            <ul>
              {review.issues.map((issue, i) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  index={i}
                  state={issueStates[issue.id] ?? 'open'}
                  applicable={canApply(issue)}
                  c={c}
                  onApply={() => onApply(issue)}
                  onDismiss={() => onDismiss(issue)}
                  onLocate={() => onLocate(issue)}
                />
              ))}
            </ul>
            {openCount === 0 && <p className="pt-3 text-[13px] text-brand">{c.allDone}</p>}
          </>
        )}
      </div>

      {/* Strengths */}
      {review.strengths.length > 0 && (
        <div className="mt-8">
          <h3 className="border-b border-ink pb-2 text-[15px] font-medium text-ink">{c.strengths}</h3>
          <ul>
            {review.strengths.map((s, i) => (
              <li key={i} className="flex gap-3 border-b border-border py-3 text-sm leading-6 text-slate-700">
                <span className="pt-px text-xs tabular-nums text-brand">{String(i + 1).padStart(2, '0')}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.missingKeywords.length > 0 && (
        <p className="mt-6 text-sm leading-7">
          <span className="block text-[13px] text-slate-600">{c.keywords}</span>
          {review.missingKeywords.map((kw, i) => (
            <span key={kw}>
              <span className="text-brand">{kw}</span>
              {i < review.missingKeywords.length - 1 && <span className="text-slate-400"> · </span>}
            </span>
          ))}
        </p>
      )}

      <p className="mt-6 text-[12px] leading-5 text-slate-500">{c.note}</p>
    </div>
  );
}
