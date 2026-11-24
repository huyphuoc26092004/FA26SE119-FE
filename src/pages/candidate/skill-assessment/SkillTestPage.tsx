import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, X } from 'lucide-react';
import {
  SKILL_PASS_SCORE,
  getJdAssessment,
  saveJdAssessmentAnswer,
  submitJdAssessment,
  type JdAssessment,
} from '../../../services/skillPathService';
import { useTranslation } from '../../../i18n';
import { Loading } from '../../../components/ui';
import { AssessmentResult, ErrorLine, skillPathCopy, type Copy } from '../SkillAssessmentPage';

const copy = {
  vi: {
    exit: 'Thoát',
    exitHint: 'Câu trả lời đã được lưu. Thời gian vẫn tiếp tục chạy.',
    kicker: 'Bài đánh giá kỹ năng',
    resultKicker: 'Kết quả bài đánh giá',
    untitled: 'Bài đánh giá theo JD',
    remaining: 'Còn lại',
    saved: 'Đã lưu',
    saving: 'Đang lưu',
    keys: 'Phím A–D để chọn đáp án, ← → để chuyển câu.',
    navigator: 'Danh sách câu hỏi',
    legendDone: 'Đã trả lời',
    legendTodo: 'Chưa trả lời',
    confirmTitle: 'Nộp bài?',
    confirmAll: 'Bạn đã trả lời tất cả câu hỏi. Sau khi nộp sẽ không sửa được nữa.',
    confirmMissing: (n: number) => `Bạn còn ${n} câu chưa trả lời. Câu bỏ trống được tính là sai.`,
    keepGoing: 'Làm tiếp',
    back: 'Về trang đánh giá',
    buildPath: 'Lập lộ trình học',
    newTest: 'Làm bài mới',
    notFound: 'Không tìm thấy bài đánh giá này.',
  },
  en: {
    exit: 'Exit',
    exitHint: 'Your answers are saved. The timer keeps running.',
    kicker: 'Skill assessment',
    resultKicker: 'Assessment result',
    untitled: 'JD assessment',
    remaining: 'Left',
    saved: 'Saved',
    saving: 'Saving',
    keys: 'Press A–D to answer, ← → to move between questions.',
    navigator: 'Questions',
    legendDone: 'Answered',
    legendTodo: 'Not answered',
    confirmTitle: 'Submit the test?',
    confirmAll: 'Every question is answered. You cannot change answers after submitting.',
    confirmMissing: (n: number) => `${n} questions are still unanswered. Blank answers count as wrong.`,
    keepGoing: 'Keep going',
    back: 'Back to assessment',
    buildPath: 'Build learning path',
    newTest: 'Take a new one',
    notFound: 'This assessment was not found.',
  },
};
type TestCopy = typeof copy.vi;

const actionButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#256b42] px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1c5534] disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
const outlineButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-400 px-5 py-2.5 text-sm text-ink transition-colors duration-150 hover:border-ink disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Đường dẫn quay về trang đánh giá, giữ đúng công việc và CV của bài. */
function assessmentHref(session: JdAssessment | undefined, hash = '') {
  if (!session) return `/candidate/skill-assessment${hash}`;
  const params = new URLSearchParams({ cvId: session.resumeId || 'none' });
  if (session.jobId) params.set('jobId', session.jobId);
  else params.set('pastedSessionId', session.id);
  return `/candidate/skill-assessment?${params}${hash}`;
}

function TopBar({ session, t, timer }: { session?: JdAssessment; t: TestCopy; timer?: { remaining: number; total: number } }) {
  const done = session?.status === 'completed';
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-[72rem] items-center gap-4 px-4 py-3 sm:px-8">
        <Link to={assessmentHref(session)} title={done ? undefined : t.exitHint} className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-slate-600 transition-colors hover:text-ink">
          <X size={15} aria-hidden="true" />
          {t.exit}
        </Link>
        <div className="min-w-0 flex-1 border-l border-border pl-4">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{done ? t.resultKicker : t.kicker}</p>
          <p className="truncate text-[15px] text-ink">{session?.jobTitle || t.untitled}</p>
        </div>
        {timer && (
          <div
            role="timer"
            aria-label={t.remaining}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[15px] tabular-nums ${
              timer.remaining <= 60 ? 'border-danger text-danger' : 'border-border text-ink'
            }`}
          >
            <Clock size={15} aria-hidden="true" />
            {formatTime(timer.remaining)}
            <span className="hidden text-[12px] text-slate-500 sm:inline">/ {formatTime(timer.total)}</span>
          </div>
        )}
      </div>
    </header>
  );
}

function ConfirmSubmit({ missing, t, c, submitting, onCancel, onConfirm }: { missing: number; t: TestCopy; c: Copy; submitting: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, submitting]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-4 sm:items-center" onClick={() => !submitting && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="submit-title" className="text-xl font-normal text-ink">{t.confirmTitle}</h2>
        <p className={`mt-2 text-[15px] leading-7 ${missing ? 'text-danger' : 'text-slate-700'}`}>{missing ? t.confirmMissing(missing) : t.confirmAll}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className={outlineButton}>
            {t.keepGoing}
          </button>
          <button type="button" onClick={onConfirm} disabled={submitting} className={actionButton} autoFocus>
            {submitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {submitting ? c.submitting : c.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

function TestRunner({ session, c, t, onSubmit, submitting, submitError }: { session: JdAssessment; c: Copy; t: TestCopy; onSubmit: () => void; submitting: boolean; submitError: unknown }) {
  const [index, setIndex] = useState(() => Math.max(0, session.questions.findIndex((q) => !session.answers[q.id])));
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(Date.now);
  const didAutoSubmit = useRef(false);
  const deadline = Date.parse(session.expiresAt);
  const timed = Number.isFinite(deadline);
  const remaining = timed ? Math.max(0, Math.ceil((deadline - now) / 1000)) : session.timeLimitSeconds;
  const expired = timed && remaining === 0;

  const save = useMutation({
    mutationFn: ({ questionId, optionId }: { questionId: string; optionId: string }) => saveJdAssessmentAnswer(session.id, questionId, optionId),
    // Hiện lựa chọn ngay, trả lại lựa chọn cũ nếu lưu lỗi.
    onMutate: ({ questionId, optionId }) => {
      const previous = answers[questionId];
      setAnswers((a) => ({ ...a, [questionId]: optionId }));
      return { questionId, previous };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      setAnswers((a) => {
        const next = { ...a };
        if (ctx.previous) next[ctx.questionId] = ctx.previous;
        else delete next[ctx.questionId];
        return next;
      });
    },
  });
  const saving = save.isPending;
  const locked = expired || submitting;

  useEffect(() => {
    if (!timed || expired) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [timed, expired]);
  useEffect(() => {
    if (!expired || saving || submitting || didAutoSubmit.current) return;
    didAutoSubmit.current = true;
    setConfirming(false);
    onSubmit();
  }, [expired, saving, submitting, onSubmit]);

  const questions = session.questions;
  const current = questions[index];
  const answered = questions.filter((q) => answers[q.id]).length;
  const last = index === questions.length - 1;

  const choose = useCallback(
    (optionId: string) => {
      if (!current || locked || (timed && Date.now() >= deadline)) return;
      if (answers[current.id] === optionId) return;
      save.mutate({ questionId: current.id, optionId });
    },
    [current, locked, timed, deadline, answers, save],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirming || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(questions.length - 1, i + 1));
      else {
        const key = e.key.toUpperCase();
        const byLetter = current?.options.find((o) => o.id.toUpperCase() === key);
        const byNumber = /^[1-9]$/.test(key) ? current?.options[Number(key) - 1] : undefined;
        const option = byLetter ?? byNumber;
        if (option) choose(option.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming, current, questions.length, choose]);

  if (!current) return null;
  const progress = Math.round((answered / questions.length) * 100);

  return (
    <>
      <TopBar session={session} t={t} timer={timed ? { remaining, total: session.timeLimitSeconds } : undefined} />
      <div className="h-[3px] w-full bg-slate-200" aria-hidden="true">
        <div className="h-full bg-[#256b42] transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <main className="mx-auto grid w-full max-w-[72rem] flex-1 gap-x-12 gap-y-10 px-4 pb-32 pt-[clamp(2rem,5vw,3.5rem)] sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section aria-live="polite" className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-3 text-[13px] text-slate-600">
            <span className="tabular-nums text-ink">{c.question(index + 1, questions.length)}</span>
            {current.topic && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] text-brand">{current.topic}</span>}
          </p>
          <h1 className="mt-4 max-w-[46rem] text-[clamp(1.25rem,2.1vw,1.75rem)] font-normal leading-[1.5] tracking-[-0.01em] text-ink">{current.text}</h1>

          <div role="radiogroup" aria-label={current.text} className="mt-8 grid max-w-[46rem] gap-3">
            {current.options.map((option) => {
              const selected = answers[current.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={locked}
                  onClick={() => choose(option.id)}
                  className={`group flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition-colors duration-150 cursor-pointer disabled:cursor-default sm:px-5 ${
                    selected ? 'border-brand bg-brand-50' : 'border-border bg-surface hover:border-slate-400'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] ${
                      selected ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-600 group-hover:border-ink'
                    }`}
                  >
                    {selected ? <Check size={15} /> : option.id}
                  </span>
                  <span className={`pt-1 text-[16px] leading-7 ${selected ? 'text-ink' : 'text-slate-700'}`}>{option.text}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 flex min-h-5 flex-wrap items-center gap-x-4 text-[12px] text-slate-500">
            {saving ? (
              <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" aria-hidden="true" />{t.saving}</span>
            ) : answers[current.id] ? (
              <span className="inline-flex items-center gap-1.5 text-brand"><Check size={12} aria-hidden="true" />{t.saved}</span>
            ) : null}
            <span className="hidden sm:inline">{t.keys}</span>
          </p>
          {expired && <p role="status" className="mt-3 text-[13px] text-slate-700">{c.timeExpired}</p>}
          <ErrorLine error={save.error ?? submitError} c={c} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <p className="text-[13px] text-ink">{t.navigator}</p>
            <p className="text-[13px] tabular-nums text-slate-600">{c.answered(answered, questions.length)}</p>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${c.question(i + 1, questions.length)}${answers[q.id] ? ` · ${t.legendDone}` : ''}`}
                aria-current={i === index ? 'step' : undefined}
                className={`h-10 rounded-lg border text-[13px] tabular-nums transition-colors cursor-pointer ${
                  i === index
                    ? 'border-ink bg-ink text-white'
                    : answers[q.id]
                      ? 'border-brand bg-brand-50 text-brand'
                      : 'border-border bg-surface text-slate-500 hover:border-ink'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-brand bg-brand-50" />{t.legendDone}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface" />{t.legendTodo}</span>
          </div>
          <button type="button" onClick={() => setConfirming(true)} disabled={locked || saving} className={`${actionButton} mt-6 hidden w-full lg:inline-flex`}>
            {submitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {submitting ? c.submitting : c.submit}
          </button>
        </aside>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className={outlineButton}>
            <ArrowLeft size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{c.prev}</span>
          </button>
          <p className="text-[13px] tabular-nums text-slate-600">{index + 1} / {questions.length}</p>
          {last ? (
            <button type="button" onClick={() => setConfirming(true)} disabled={locked || saving} className={actionButton}>
              {submitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {submitting ? c.submitting : c.submit}
            </button>
          ) : (
            <button type="button" onClick={() => setIndex((i) => i + 1)} className={actionButton}>
              {c.next}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>

      {confirming && (
        <ConfirmSubmit
          missing={questions.length - answered}
          t={t}
          c={c}
          submitting={submitting}
          onCancel={() => setConfirming(false)}
          onConfirm={onSubmit}
        />
      )}
    </>
  );
}

function ResultView({ session, c, t, vi }: { session: JdAssessment; c: Copy; t: TestCopy; vi: boolean }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const passed = session.score >= SKILL_PASS_SCORE;
  return (
    <>
      <TopBar session={session} t={t} />
      <main className="mx-auto w-full max-w-[60rem] flex-1 px-4 pb-16 pt-[clamp(2rem,5vw,3.5rem)] sm:px-8">
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.2] tracking-[-0.02em] text-ink">
          {passed ? c.passedLine : c.missingPoints(SKILL_PASS_SCORE - session.score)}.
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-ink pb-6">
          <Link to={assessmentHref(session, '#step-3')} className={actionButton}>
            {t.buildPath}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link to={assessmentHref(session, '#step-2')} className={outlineButton}>
            {t.back}
          </Link>
          <button
            type="button"
            onClick={() => setReviewOpen((o) => !o)}
            aria-expanded={reviewOpen}
            className="ml-auto border-b border-current pb-px text-sm text-brand transition-colors hover:text-ink cursor-pointer"
          >
            {reviewOpen ? c.hideReview : c.review}
          </button>
        </div>
        <AssessmentResult session={session} c={c} vi={vi} reviewOpen={reviewOpen} />
      </main>
    </>
  );
}

/** Trang làm bài đánh giá kỹ năng, tách khỏi trang chính để tập trung; sau khi nộp hiện kết quả ngay tại đây. */
export default function SkillTestPage() {
  const { sessionId = '' } = useParams();
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? skillPathCopy.vi : skillPathCopy.en;
  const t = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const key = ['jdAssessment', 'session', sessionId];
  const query = useQuery({ queryKey: key, queryFn: () => getJdAssessment(sessionId), enabled: !!sessionId, staleTime: Infinity });

  const submit = useMutation({
    mutationFn: () => submitJdAssessment(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessment'], predicate: (q) => q.queryKey[1] !== 'session' });
      if (data.jobId) queryClient.setQueryData(['jdAssessment', data.jobId, data.resumeId || ''], data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessments'] });
      // Nộp bài làm lộ trình cũ hết hiệu lực ở backend.
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      navigate(assessmentHref(data, '#step-2'), { replace: true });
    },
  });
  const { mutate: submitMutate } = submit;
  const onSubmit = useCallback(() => submitMutate(), [submitMutate]);

  const session = query.data;
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {query.isPending ? (
        <>
          <TopBar t={t} />
          <div className="mx-auto w-full max-w-[72rem] px-4 py-16 sm:px-8"><Loading /></div>
        </>
      ) : query.isError || !session ? (
        <>
          <TopBar t={t} />
          <div className="mx-auto w-full max-w-[72rem] px-4 py-16 sm:px-8">
            <p className="text-[15px] text-ink">{t.notFound}</p>
            <ErrorLine error={query.error} c={c} />
            <button type="button" onClick={() => navigate('/candidate/skill-assessment')} className={`${outlineButton} mt-6`}>
              {t.back}
            </button>
          </div>
        </>
      ) : session.status === 'completed' ? (
        <ResultView key={`r-${session.id}`} session={session} c={c} t={t} vi={isVietnamese} />
      ) : (
        <TestRunner key={session.id} session={session} c={c} t={t} onSubmit={onSubmit} submitting={submit.isPending} submitError={submit.error} />
      )}
    </div>
  );
}
