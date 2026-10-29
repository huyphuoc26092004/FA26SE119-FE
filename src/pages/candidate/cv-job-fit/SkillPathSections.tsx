import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import {
  SKILL_PASS_SCORE,
  createLearningPath,
  getLatestJdAssessment,
  getLatestLearningPath,
  setLearningNodeStatus,
  startJdAssessment,
  submitJdAssessment,
  type JdAssessment,
  type LearningPath,
  type LearningPathNode,
} from '../../../services/skillPathService';
import type { LearningResource } from '../../../types/assessment';
import { authErrorMessage } from '../../../services/authService';
import { Loading } from '../../../components/ui';
import { useTranslation } from '../../../i18n';

const copy = {
  vi: {
    testTitle: 'Đánh giá kỹ năng',
    testNote: 'Mười câu hỏi do AI tạo từ JD, gồm kiến thức nền và kỹ năng riêng của vị trí. Kỹ năng dưới 70 điểm sẽ được đưa vào Learning path.',
    testIntro: 'Bạn chưa làm bài đánh giá cho công việc này. Bài làm không bắt buộc, nhưng giúp Learning path biết kỹ năng nào bạn cần luyện thêm chứ không chỉ dựa vào CV.',
    testStart: 'Tạo bài đánh giá',
    testCreating: 'Đang tạo câu hỏi theo JD. Việc này có thể mất vài phút.',
    question: (cur: number, total: number) => `Câu ${cur} / ${total}`,
    prev: 'Câu trước',
    next: 'Câu tiếp',
    submit: 'Nộp bài',
    submitting: 'Đang chấm',
    answered: (n: number, total: number) => `Đã trả lời ${n}/${total}`,
    answerAll: 'Trả lời đủ các câu để nộp bài.',
    resultLabel: 'Điểm bài đánh giá',
    resultLine: (c: number, t: number) => `${c}/${t} câu đúng`,
    passMark: `Mức đạt ${SKILL_PASS_SCORE}`,
    bySkill: 'Theo từng kỹ năng',
    needPractice: 'Cần luyện thêm',
    passed: 'Đạt',
    review: 'Xem lại đáp án',
    hideReview: 'Ẩn đáp án',
    yourAnswer: 'Bạn chọn',
    correctAnswer: 'Đáp án đúng',
    noAnswer: 'Không trả lời',
    retake: 'Làm bài mới',
    doneAt: (d: string) => `Nộp ngày ${d}`,
    nextWeak: (names: string) => `Kỹ năng cần cải thiện: ${names}. Lập Learning path để học đúng các kỹ năng này.`,
    nextAllPass: 'Bạn đạt mọi kỹ năng trong bài. Learning path sẽ chỉ gồm kỹ năng bắt buộc mà CV chưa thể hiện.',
    nextBuild: 'Lập Learning path từ kết quả này',
    nextView: 'Xem Learning path',
    pathTitle: 'Learning path',
    pathNote: 'Lộ trình chỉ gồm kỹ năng bắt buộc của JD mà CV và hồ sơ chưa có, hoặc bài đánh giá dưới 70 điểm.',
    pathIntro: 'Chưa có Learning path cho công việc này.',
    pathMissing: (n: number) => `Theo phân tích ở trên, CV đang thiếu ${n} kỹ năng của JD:`,
    pathUsesTest: 'Lộ trình sẽ dùng cả kết quả bài đánh giá kỹ năng.',
    pathNoTest: 'Bạn có thể làm bài đánh giá ở trên trước để lộ trình chính xác hơn.',
    pathCreate: 'Tạo Learning path',
    pathCreating: 'Đang lập lộ trình học. Việc này có thể mất vài phút.',
    pathRebuild: 'Lập lại theo CV đang chọn',
    outdated: 'CV, hồ sơ hoặc bài đánh giá đã thay đổi sau khi lập lộ trình này.',
    pathEmpty: 'CV đã có đủ kỹ năng bắt buộc của JD. Bạn có thể chuẩn bị phỏng vấn.',
    hours: (h: number) => `${h} giờ`,
    progress: 'Tiến độ',
    totalTime: 'Thời gian ước tính',
    skillsCount: 'Kỹ năng cần học',
    status: { not_started: 'Chưa học', in_progress: 'Đang học', completed: 'Đã xong' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Bài đánh giá dưới 70 điểm', MISSING_EVIDENCE: 'CV chưa có' },
    startNode: 'Bắt đầu học',
    finishNode: 'Đánh dấu đã xong',
    resetNode: 'Bỏ đánh dấu',
    after: (names: string) => `Học sau: ${names}`,
    resources: (n: number) => `Tài liệu (${n})`,
    noResources: 'Chưa có tài liệu trong thư viện cho kỹ năng này.',
    free: 'Miễn phí',
    paid: 'Trả phí',
    loadError: 'Không tải được dữ liệu.',
  },
  en: {
    testTitle: 'Skill assessment',
    testNote: 'Ten AI questions built from the JD, covering fundamentals and role-specific skills. Skills under 70 go into the learning path.',
    testIntro: 'You have not taken an assessment for this job yet. It is optional, but lets the learning path see which skills need practice, not just what your CV lists.',
    testStart: 'Create assessment',
    testCreating: 'Writing questions from the JD. This can take a few minutes.',
    question: (cur: number, total: number) => `Question ${cur} of ${total}`,
    prev: 'Previous',
    next: 'Next',
    submit: 'Submit',
    submitting: 'Scoring',
    answered: (n: number, total: number) => `${n}/${total} answered`,
    answerAll: 'Answer every question to submit.',
    resultLabel: 'Assessment score',
    resultLine: (c: number, t: number) => `${c}/${t} correct`,
    passMark: `Pass mark ${SKILL_PASS_SCORE}`,
    bySkill: 'By skill',
    needPractice: 'Needs practice',
    passed: 'Passed',
    review: 'Review answers',
    hideReview: 'Hide answers',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    noAnswer: 'No answer',
    retake: 'Take a new one',
    doneAt: (d: string) => `Submitted ${d}`,
    nextWeak: (names: string) => `Skills to improve: ${names}. Build a learning path for exactly these skills.`,
    nextAllPass: 'You passed every skill in the test. The path will only cover required skills your CV does not show.',
    nextBuild: 'Build a learning path from this result',
    nextView: 'View learning path',
    pathTitle: 'Learning path',
    pathNote: 'Only the required JD skills missing from your CV and profile, or scored under 70 in the assessment.',
    pathIntro: 'No learning path for this job yet.',
    pathMissing: (n: number) => `The analysis above found ${n} JD skills missing from your CV:`,
    pathUsesTest: 'The path will also use your assessment result.',
    pathNoTest: 'Take the assessment above first for a more accurate path.',
    pathCreate: 'Create learning path',
    pathCreating: 'Building your learning path. This can take a few minutes.',
    pathRebuild: 'Rebuild for the selected CV',
    outdated: 'Your CV, profile or assessment changed after this path was built.',
    pathEmpty: 'Your CV covers every required JD skill. Time to prepare for the interview.',
    hours: (h: number) => `${h} h`,
    progress: 'Progress',
    totalTime: 'Estimated time',
    skillsCount: 'Skills to learn',
    status: { not_started: 'Not started', in_progress: 'Learning', completed: 'Done' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Assessment under 70', MISSING_EVIDENCE: 'Not in CV' },
    startNode: 'Start learning',
    finishNode: 'Mark as done',
    resetNode: 'Undo',
    after: (names: string) => `After: ${names}`,
    resources: (n: number) => `Resources (${n})`,
    noResources: 'No library resources for this skill yet.',
    free: 'Free',
    paid: 'Paid',
    loadError: 'Could not load data.',
  },
};

type Copy = typeof copy.vi;

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const pad2 = (n: number) => String(n).padStart(2, '0');

function SectionHead({ index, title, note, action }: { index: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="border-b border-ink pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums text-slate-500">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

function Working({ text }: { text: string }) {
  return (
    <p role="status" className="flex items-center gap-2 border-b border-border py-6 text-[15px] text-ink">
      <Loader2 size={15} className="animate-spin text-brand" aria-hidden="true" />
      {text}
    </p>
  );
}

function ErrorLine({ error, fallback }: { error: unknown; fallback: string }) {
  if (!error) return null;
  return <p className="mt-3 text-[13px] leading-6 text-danger">{authErrorMessage(error, fallback)}</p>;
}

function formatDay(iso: string | undefined, vi: boolean) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(vi ? 'vi-VN' : 'en-GB');
}

// ─── Assessment ─────────────────────────────────────────────────────────────

function Quiz({ session, c, onSubmit, submitting }: { session: JdAssessment; c: Copy; onSubmit: (answers: Record<string, string>) => void; submitting: boolean }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers);
  const questions = session.questions;
  const current = questions[index];
  const answered = questions.filter((q) => answers[q.id]).length;
  const allAnswered = answered === questions.length;
  if (!current) return null;

  return (
    <div className="grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-8 py-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="min-w-0">
        <p className="flex flex-wrap gap-x-3 text-[13px] text-slate-600">
          <span className="tabular-nums text-ink">{c.question(index + 1, questions.length)}</span>
          {current.topic && <span>· {current.topic}</span>}
        </p>
        <h3 className="mt-3 max-w-[44rem] text-[clamp(1.125rem,1.8vw,1.5rem)] font-normal leading-[1.45] text-ink">{current.text}</h3>
        <div role="radiogroup" aria-label={current.text} className="mt-6 border-t border-slate-400">
          {current.options.map((option) => {
            const selected = answers[current.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.id }))}
                className={`group flex w-full items-start gap-4 border-b border-border py-3.5 pr-2 text-left transition-colors cursor-pointer ${
                  selected ? 'bg-brand-50/60' : 'hover:bg-slate-100/60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] ${
                    selected ? 'border-brand bg-brand text-white' : 'border-slate-400 text-slate-600 group-hover:border-ink'
                  }`}
                >
                  {option.id}
                </span>
                <span className={`pt-0.5 text-[15px] leading-7 ${selected ? 'text-ink' : 'text-slate-700'}`}>{option.text}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className={`${textLink} text-ink`}>
            <ArrowLeft size={14} aria-hidden="true" />
            {c.prev}
          </button>
          {index < questions.length - 1 ? (
            <button type="button" onClick={() => setIndex((i) => i + 1)} className={primaryButton}>
              {c.next}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={() => onSubmit(answers)} disabled={!allAnswered || submitting} className={primaryButton}>
              {submitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {submitting ? c.submitting : c.submit}
            </button>
          )}
        </div>
      </div>

      <aside className="border-t border-border pt-4 lg:border-t-0 lg:pt-0">
        <p className="text-[13px] text-slate-600">{c.answered(answered, questions.length)}</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className={`h-9 rounded-full border text-[12px] tabular-nums transition-colors cursor-pointer ${
                i === index
                  ? 'border-ink bg-ink text-white'
                  : answers[q.id]
                    ? 'border-brand text-brand'
                    : 'border-slate-300 text-slate-500 hover:border-ink'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {!allAnswered && <p className="mt-3 text-[12px] leading-5 text-slate-500">{c.answerAll}</p>}
      </aside>
    </div>
  );
}

function AssessmentResult({ session, c, vi }: { session: JdAssessment; c: Copy; vi: boolean }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const passed = session.score >= SKILL_PASS_SCORE;
  return (
    <div className="py-6">
      <div className="grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div>
          <p className="text-[13px] text-slate-600">{c.resultLabel}</p>
          <p className={`mt-2 flex items-baseline gap-1 leading-none ${passed ? 'text-brand' : 'text-danger'}`}>
            <span className="text-[clamp(3rem,6vw,4.5rem)] font-normal tracking-[-0.04em] tabular-nums">{session.score}</span>
            <span className="text-[clamp(1.25rem,2vw,1.75rem)]">%</span>
          </p>
          <p className="mt-3 text-[13px] text-slate-600">
            {c.resultLine(session.correct, session.total)} · {c.passMark}
          </p>
          {session.submittedAt && <p className="mt-1 text-[12px] text-slate-500">{c.doneAt(formatDay(session.submittedAt, vi))}</p>}
        </div>
        <div>
          <p className="text-[13px] text-slate-600">{c.bySkill}</p>
          <ul className="mt-2">
            {session.skillScores.map((s) => {
              const ok = s.score >= SKILL_PASS_SCORE;
              return (
                <li key={s.skill} className="border-b border-border py-3">
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-ink">{s.skill}</span>
                    <span className={`tabular-nums ${ok ? 'text-brand' : 'text-danger'}`}>
                      {s.score}% · {ok ? c.passed : c.needPractice}
                    </span>
                  </div>
                  <div className="relative mt-2 h-[2px] w-full bg-slate-200">
                    <div className={`h-full ${ok ? 'bg-brand' : 'bg-danger'}`} style={{ width: `${s.score}%` }} />
                    <span aria-hidden="true" className="absolute -top-1.5 h-[14px] w-px bg-ink" style={{ left: `${SKILL_PASS_SCORE}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <button type="button" onClick={() => setReviewOpen((o) => !o)} aria-expanded={reviewOpen} className={`${textLink} mt-6 text-[13px] text-ink`}>
        {reviewOpen ? c.hideReview : c.review}
      </button>
      {reviewOpen && (
        <ol className="mt-3 border-t border-border">
          {session.questions.map((q, i) => {
            const picked = session.answers[q.id];
            const right = picked === q.correctOptionId;
            return (
              <li key={q.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-4">
                <span className="pt-0.5 text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
                <div className="min-w-0">
                  <p className={`text-[12px] ${right ? 'text-brand' : 'text-danger'}`}>{q.topic}</p>
                  <p className="mt-1 text-[15px] leading-7 text-ink">{q.text}</p>
                  <dl className="mt-1.5 space-y-1 text-[13px] leading-6">
                    {!right && (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-slate-500">{c.yourAnswer}:</dt>
                        <dd className="text-danger line-through decoration-1">{q.options.find((o) => o.id === picked)?.text ?? c.noAnswer}</dd>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-slate-500">{c.correctAnswer}:</dt>
                      <dd className="text-ink">{q.options.find((o) => o.id === q.correctOptionId)?.text}</dd>
                    </div>
                  </dl>
                  {q.explanation && <p className="mt-2 max-w-[44rem] border-l border-brand pl-4 text-sm leading-7 text-slate-700">{q.explanation}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ─── Learning path ──────────────────────────────────────────────────────────

function ResourceList({ resources, c }: { resources: LearningResource[]; c: Copy }) {
  if (resources.length === 0) return <p className="mt-3 text-[13px] text-slate-500">{c.noResources}</p>;
  return (
    <ul className="mt-3 border-t border-border">
      {resources.map((r) => (
        <li key={r.id}>
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 border-b border-border py-3">
            <span className="min-w-0">
              <span className="block truncate text-[15px] text-ink transition-colors group-hover:text-brand">{r.title}</span>
              <span className="mt-0.5 block text-[12px] text-slate-500">
                {[r.provider, r.duration, r.isFree ? c.free : c.paid].filter(Boolean).join(' · ')}
              </span>
            </span>
            <ArrowUpRight size={15} aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-brand" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function NodeRow({
  node,
  index,
  path,
  c,
  onStatus,
  busy,
}: {
  node: LearningPathNode;
  index: number;
  path: LearningPath;
  c: Copy;
  onStatus: (status: LearningPathNode['status']) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(index === 0);
  const gap = path.missing.find((m) => m.skill.toLowerCase() === node.skill.toLowerCase());
  const after = node.prerequisiteIds.map((id) => path.nodes.find((n) => n.id === id)?.skill).filter(Boolean).join(', ');
  const done = node.status === 'completed';
  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-5 md:grid-cols-[3rem_minmax(0,1fr)_auto]">
      <span className={`pt-1 text-xs tabular-nums ${done ? 'text-brand' : 'text-slate-500'}`}>{pad2(index + 1)}</span>
      <div className="min-w-0">
        <p className="flex flex-wrap gap-x-2 text-[12px] text-slate-500">
          <span className={done ? 'text-brand' : node.status === 'in_progress' ? 'text-ink' : ''}>{c.status[node.status]}</span>
          {node.hours > 0 && <span>· {c.hours(node.hours)}</span>}
          {gap && <span>· {gap.score !== undefined ? `${c.reason[gap.status]} (${gap.score})` : c.reason[gap.status]}</span>}
        </p>
        <h3 className={`mt-1 text-[clamp(1.0625rem,1.5vw,1.25rem)] font-normal ${done ? 'text-brand' : 'text-ink'}`}>{node.skill}</h3>
        {node.description && <p className="mt-1.5 max-w-[44rem] text-[15px] leading-7 text-slate-700">{node.description}</p>}
        {after && <p className="mt-1.5 text-[13px] text-slate-500">{c.after(after)}</p>}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${textLink} mt-3 text-[13px] text-ink`}>
          {c.resources(node.resources.length)}
        </button>
        {open && <ResourceList resources={node.resources} c={c} />}
      </div>
      <div className="col-start-2 mt-3 flex flex-wrap gap-x-5 gap-y-2 md:col-start-3 md:mt-0 md:flex-col md:items-end">
        {node.status === 'not_started' && (
          <button type="button" disabled={busy} onClick={() => onStatus('in_progress')} className={`${textLink} whitespace-nowrap text-[13px] text-ink`}>
            {c.startNode}
          </button>
        )}
        {!done && (
          <button type="button" disabled={busy} onClick={() => onStatus('completed')} className={`${textLink} whitespace-nowrap text-[13px] text-ink`}>
            <Check size={13} aria-hidden="true" />
            {c.finishNode}
          </button>
        )}
        {node.status !== 'not_started' && (
          <button type="button" disabled={busy} onClick={() => onStatus('not_started')} className={`${textLink} whitespace-nowrap text-[13px] text-slate-600`}>
            {c.resetNode}
          </button>
        )}
      </div>
    </li>
  );
}

// ─── Sections ───────────────────────────────────────────────────────────────

export default function SkillPathSections({
  jobId,
  cvId,
  missingSkills,
  testIndex,
  pathIndex,
}: {
  jobId: string;
  cvId: string;
  /** Kỹ năng JD còn thiếu theo phân tích ATS ở trên. */
  missingSkills: string[];
  testIndex: string;
  pathIndex: string;
}) {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();

  const testQuery = useQuery({ queryKey: ['jdAssessment', jobId], queryFn: () => getLatestJdAssessment(jobId), enabled: !!jobId });
  const pathQuery = useQuery({ queryKey: ['learningPath', jobId], queryFn: () => getLatestLearningPath(jobId), enabled: !!jobId });
  const session = testQuery.data ?? null;
  const path = pathQuery.data ?? null;

  const startTest = useMutation({
    mutationFn: () => startJdAssessment(jobId),
    onSuccess: (data) => queryClient.setQueryData(['jdAssessment', jobId], data),
  });
  const submitTest = useMutation({
    mutationFn: (answers: Record<string, string>) => submitJdAssessment(session!.id, answers),
    onSuccess: (data) => {
      queryClient.setQueryData(['jdAssessment', jobId], data);
      // Nộp bài làm lộ trình cũ hết hiệu lực ở backend.
      queryClient.invalidateQueries({ queryKey: ['learningPath', jobId] });
    },
  });
  const completedTest = session?.status === 'completed' ? session : null;
  const buildPath = useMutation({
    mutationFn: () => createLearningPath({ jobId, resumeId: cvId || undefined, assessmentId: completedTest?.id }),
    onSuccess: (data) => queryClient.setQueryData(['learningPath', jobId], data),
  });
  const nodeStatus = useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: LearningPathNode['status'] }) => setLearningNodeStatus(path!.id, nodeId, status),
    onSuccess: (data) => queryClient.setQueryData(['learningPath', jobId], data),
  });

  const doneNodes = path?.nodes.filter((n) => n.status === 'completed').length ?? 0;

  // Mở từ lời mời sau khi ứng tuyển (?test=start): tạo bài ngay nếu job này chưa có bài nào.
  const [searchParams, setSearchParams] = useSearchParams();
  const wantsTest = searchParams.get('test') === 'start';
  const { mutate: startTestNow, isPending: startingTest } = startTest;
  useEffect(() => {
    if (!wantsTest || !testQuery.isSuccess || startingTest) return;
    // Đã có bài (đang làm hoặc đã nộp) thì hiện bài đó, không tạo thêm.
    if (!testQuery.data) startTestNow();
    const next = new URLSearchParams(searchParams);
    next.delete('test');
    setSearchParams(next, { replace: true });
  }, [wantsTest, testQuery.isSuccess, testQuery.data, startingTest, startTestNow, searchParams, setSearchParams]);

  // Link có #skill-test / #learning-path: cuộn tới sau khi phần đó có dữ liệu.
  const { hash } = useLocation();
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !hash || testQuery.isPending || pathQuery.isPending) return;
    const target = document.getElementById(hash.slice(1));
    if (target) {
      scrolled.current = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash, testQuery.isPending, pathQuery.isPending]);

  const weakSkills = completedTest?.skillScores.filter((s) => s.score < SKILL_PASS_SCORE).map((s) => s.skill) ?? [];
  const pathIsCurrent =
    !!path && !path.outdated && (!completedTest?.submittedAt || new Date(path.createdAt) >= new Date(completedTest.submittedAt));

  return (
    <>
      {/* Skill assessment */}
      <section id="skill-test" className="mt-[clamp(3rem,6vw,4.5rem)] scroll-mt-6">
        <SectionHead
          index={testIndex}
          title={c.testTitle}
          note={c.testNote}
          action={
            completedTest && !startTest.isPending ? (
              <button type="button" onClick={() => startTest.mutate()} className={`${textLink} text-[13px] text-ink`}>
                {c.retake}
              </button>
            ) : undefined
          }
        />
        {testQuery.isPending ? (
          <Loading />
        ) : testQuery.isError ? (
          <ErrorLine error={testQuery.error} fallback={c.loadError} />
        ) : startTest.isPending ? (
          <Working text={c.testCreating} />
        ) : !session ? (
          <div className="border-b border-border py-6">
            <p className="max-w-2xl text-[15px] leading-7 text-slate-700">{c.testIntro}</p>
            <button type="button" onClick={() => startTest.mutate()} className={`${primaryButton} mt-5`}>
              {c.testStart}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : session.status === 'in_progress' ? (
          <Quiz key={session.id} session={session} c={c} onSubmit={(answers) => submitTest.mutate(answers)} submitting={submitTest.isPending} />
        ) : (
          <>
            <AssessmentResult key={session.id} session={session} c={c} vi={isVietnamese} />
            <div className="flex flex-col gap-4 border-t border-ink pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-[15px] leading-7 text-ink">
                {weakSkills.length ? c.nextWeak(weakSkills.join(', ')) : c.nextAllPass}
              </p>
              {pathIsCurrent ? (
                <a href="#learning-path" className={`${textLink} shrink-0 text-ink`}>
                  {c.nextView}
                </a>
              ) : (
                <button
                  type="button"
                  disabled={buildPath.isPending}
                  onClick={() => {
                    buildPath.mutate();
                    document.getElementById('learning-path')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`${primaryButton} shrink-0`}
                >
                  {c.nextBuild}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
        <ErrorLine error={startTest.error ?? submitTest.error} fallback={c.loadError} />
      </section>

      {/* Learning path */}
      <section id="learning-path" className="mt-[clamp(3rem,6vw,4.5rem)] scroll-mt-6">
        <SectionHead
          index={pathIndex}
          title={c.pathTitle}
          note={c.pathNote}
          action={
            path && !buildPath.isPending ? (
              <button type="button" onClick={() => buildPath.mutate()} className={`${textLink} text-[13px] text-ink`}>
                {c.pathRebuild}
              </button>
            ) : undefined
          }
        />
        {pathQuery.isPending ? (
          <Loading />
        ) : pathQuery.isError ? (
          <ErrorLine error={pathQuery.error} fallback={c.loadError} />
        ) : buildPath.isPending ? (
          <Working text={c.pathCreating} />
        ) : !path ? (
          <div className="border-b border-border py-6">
            <p className="text-[15px] leading-7 text-ink">{c.pathIntro}</p>
            {missingSkills.length > 0 && (
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-700">
                {c.pathMissing(missingSkills.length)} <span className="text-ink">{missingSkills.join(' · ')}</span>
              </p>
            )}
            <p className="mt-2 text-[13px] text-slate-600">{completedTest ? c.pathUsesTest : c.pathNoTest}</p>
            <button type="button" onClick={() => buildPath.mutate()} className={`${primaryButton} mt-5`}>
              {c.pathCreate}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div>
            {path.outdated && (
              <p className="mt-4 border-l-2 border-warning pl-4 text-sm leading-6 text-ink">
                {c.outdated}{' '}
                <button type="button" onClick={() => buildPath.mutate()} className={`${textLink} text-[13px] text-ink`}>
                  {c.pathRebuild}
                </button>
              </p>
            )}
            {path.nodes.length === 0 ? (
              <p className="border-b border-border py-6 text-[15px] leading-7 text-slate-700">{c.pathEmpty}</p>
            ) : (
              <>
                <dl className="mt-4 grid border-y border-border sm:grid-cols-3">
                  {[
                    { label: c.skillsCount, value: String(path.nodes.length) },
                    { label: c.totalTime, value: c.hours(path.totalHours) },
                    { label: c.progress, value: `${doneNodes}/${path.nodes.length} · ${path.progress}%` },
                  ].map((row, i) => (
                    <div key={row.label} className={`flex items-baseline justify-between gap-4 py-3 text-sm sm:block ${i > 0 ? 'sm:border-l sm:border-border sm:pl-5' : ''}`}>
                      <dt className="text-slate-600">{row.label}</dt>
                      <dd className="tabular-nums text-ink sm:mt-1 sm:text-[clamp(1.25rem,2vw,1.5rem)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 h-[2px] w-full bg-slate-200">
                  <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${path.progress}%` }} />
                </div>
                <ol className="mt-2">
                  {path.nodes.map((node, i) => (
                    <NodeRow
                      key={node.id}
                      node={node}
                      index={i}
                      path={path}
                      c={c}
                      busy={nodeStatus.isPending}
                      onStatus={(status) => nodeStatus.mutate({ nodeId: node.id, status })}
                    />
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
        <ErrorLine error={buildPath.error ?? nodeStatus.error} fallback={c.loadError} />
      </section>
    </>
  );
}
