import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  SKILL_PASS_SCORE,
  createLearningPath,
  getLatestJdAssessment,
  getLatestLearningPath,
  listJdAssessments,
  setLearningNodeStatus,
  startJdAssessment,
  submitJdAssessment,
  type JdAssessment,
  type LearningPath,
  type LearningPathNode,
} from '../../services/skillPathService';
import type { LearningResource } from '../../types/assessment';
import { authErrorMessage } from '../../services/authService';
import { getJobById, getJobs, getResumes } from '../../services/candidateService';
import { JOB_ACTIVITY_QUERY_KEY, getJobActivity } from '../../services/jobActivityService';
import { Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { JobPicker, jobPickerCopy, lineField } from './cv-job-fit/JobPicker';

const copy = {
  vi: {
    title: 'Đánh giá kỹ năng.',
    titleLine: 'Theo JD, CV không bắt buộc.',
    intro: 'Chọn công việc bạn nhắm tới, và CV nếu bạn có. Hệ thống đối chiếu JD với CV, ra 10 câu hỏi về đúng các kỹ năng đó, chấm điểm từng kỹ năng rồi lập lộ trình học cho phần còn yếu.',
    cvLabel: 'CV dùng để đánh giá',
    cvNone: 'Không dùng CV, chỉ theo JD',
    cvWith: 'Câu hỏi và lộ trình dựa trên CV này đối chiếu với JD.',
    cvWithout: 'Câu hỏi và lộ trình chỉ dựa trên JD và hồ sơ nghề nghiệp.',
    withCv: (name: string) => `CV: ${name}`,
    pathNeedsTest: 'Khi dùng CV, cần làm xong bài đánh giá rồi mới lập lộ trình.',
    steps: ['Công việc mục tiêu', 'Bài đánh giá', 'Lộ trình học'],
    stepNone: 'Chưa có',
    jobTitle: 'Công việc mục tiêu',
    jobNote: 'Bài đánh giá dựa trên kỹ năng trong JD của công việc này.',
    jobLabel: 'Công việc',
    pickFirst: 'Chọn một công việc để bắt đầu.',
    recent: 'Đã đánh giá gần đây',
    recentEmpty: 'Chưa có bài nào.',
    skills: 'Kỹ năng trong JD',
    readJd: 'Đọc JD',
    hideJd: 'Thu gọn JD',
    viewJob: 'Chi tiết công việc',
    responsibilities: 'Bạn sẽ làm gì',
    requirements: 'Yêu cầu',
    testTitle: 'Bài đánh giá',
    testNote: `10 câu trắc nghiệm do AI tạo từ JD. Kỹ năng dưới ${SKILL_PASS_SCORE} điểm sẽ vào lộ trình học.`,
    testIntro: 'Bạn chưa làm bài cho công việc này. Bài mất khoảng 10 phút.',
    testCost: 'Tạo bài dùng một lượt AI.',
    testStart: 'Bắt đầu đánh giá',
    testCreating: 'Đang tạo câu hỏi từ JD. Việc này có thể mất vài phút.',
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
    testDone: (score: number) => `${score}%`,
    testOpen: 'Đang làm dở',
    pathTitle: 'Lộ trình học',
    pathNote: 'Chỉ gồm kỹ năng bắt buộc của JD mà CV và hồ sơ chưa có, hoặc bài đánh giá dưới 70 điểm.',
    pathLocked: 'Làm xong bài đánh giá để lộ trình biết bạn yếu kỹ năng nào.',
    pathWithoutTest: 'Lập lộ trình không cần làm bài',
    pathWeak: (names: string) => `Kỹ năng cần cải thiện: ${names}.`,
    pathAllPass: 'Bạn đạt mọi kỹ năng trong bài. Lộ trình chỉ gồm kỹ năng bắt buộc mà hồ sơ chưa thể hiện.',
    pathCreate: 'Lập lộ trình học',
    pathCreating: 'Đang lập lộ trình học. Việc này có thể mất vài phút.',
    pathRebuild: 'Lập lại theo bài mới nhất',
    pathStale: 'Lộ trình này lập trước bài đánh giá mới nhất.',
    outdated: 'Hồ sơ hoặc bài đánh giá đã thay đổi sau khi lập lộ trình này.',
    pathEmpty: 'Bạn đã có đủ kỹ năng bắt buộc của JD. Có thể chuẩn bị phỏng vấn.',
    pathDone: (n: number, progress: number) => `${n} kỹ năng · ${progress}%`,
    hours: (h: number) => `${h} giờ`,
    progress: 'Tiến độ',
    totalTime: 'Thời gian ước tính',
    skillsCount: 'Kỹ năng cần học',
    status: { not_started: 'Chưa học', in_progress: 'Đang học', completed: 'Đã xong' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Bài đánh giá dưới 70 điểm', MISSING_EVIDENCE: 'CV và hồ sơ chưa có' },
    startNode: 'Bắt đầu học',
    finishNode: 'Đánh dấu đã xong',
    resetNode: 'Bỏ đánh dấu',
    after: (names: string) => `Học sau: ${names}`,
    resources: (n: number) => `Tài liệu (${n})`,
    noResources: 'Chưa có tài liệu trong thư viện cho kỹ năng này.',
    free: 'Miễn phí',
    paid: 'Trả phí',
    loadError: 'Không tải được dữ liệu.',
    timeout: 'Quá 16 phút chờ AI trả kết quả. Ollama đang quá chậm hoặc bị treo, kiểm tra rồi thử lại.',
    network: 'Mất kết nối tới backend trong lúc xử lý. Kiểm tra backend và Ollama rồi thử lại.',
    fitLink: 'Xem độ phù hợp của CV với công việc này',
  },
  en: {
    title: 'Skill assessment.',
    titleLine: 'From the JD, CV optional.',
    intro: 'Pick the job you are aiming for, and your CV if you have one. We compare the JD with the CV, write 10 questions on exactly those skills, score each skill and build a learning path for the weak ones.',
    cvLabel: 'CV to assess with',
    cvNone: 'No CV, JD only',
    cvWith: 'Questions and the path use this CV against the JD.',
    cvWithout: 'Questions and the path use only the JD and your career profile.',
    withCv: (name: string) => `CV: ${name}`,
    pathNeedsTest: 'With a CV, finish the assessment before building the path.',
    steps: ['Target job', 'Assessment', 'Learning path'],
    stepNone: 'Not yet',
    jobTitle: 'Target job',
    jobNote: 'The assessment uses the skills in this job description.',
    jobLabel: 'Job',
    pickFirst: 'Pick a job to start.',
    recent: 'Recently assessed',
    recentEmpty: 'None yet.',
    skills: 'Skills in the JD',
    readJd: 'Read the JD',
    hideJd: 'Hide the JD',
    viewJob: 'Job details',
    responsibilities: 'What you will do',
    requirements: 'Requirements',
    testTitle: 'Assessment',
    testNote: `10 multiple-choice questions written from the JD. Skills under ${SKILL_PASS_SCORE} go into the learning path.`,
    testIntro: 'You have not taken an assessment for this job. It takes about 10 minutes.',
    testCost: 'Creating it uses one AI request.',
    testStart: 'Start assessment',
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
    testDone: (score: number) => `${score}%`,
    testOpen: 'In progress',
    pathTitle: 'Learning path',
    pathNote: 'Only the required JD skills missing from your CV and profile, or scored under 70 in the assessment.',
    pathLocked: 'Finish the assessment so the path knows which skills are weak.',
    pathWithoutTest: 'Build a path without the test',
    pathWeak: (names: string) => `Skills to improve: ${names}.`,
    pathAllPass: 'You passed every skill in the test. The path only covers required skills your profile does not show.',
    pathCreate: 'Build learning path',
    pathCreating: 'Building your learning path. This can take a few minutes.',
    pathRebuild: 'Rebuild from the latest test',
    pathStale: 'This path was built before your latest assessment.',
    outdated: 'Your profile or assessment changed after this path was built.',
    pathEmpty: 'You already have every required JD skill. Time to prepare for the interview.',
    pathDone: (n: number, progress: number) => `${n} skills · ${progress}%`,
    hours: (h: number) => `${h} h`,
    progress: 'Progress',
    totalTime: 'Estimated time',
    skillsCount: 'Skills to learn',
    status: { not_started: 'Not started', in_progress: 'Learning', completed: 'Done' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Assessment under 70', MISSING_EVIDENCE: 'Not in CV or profile' },
    startNode: 'Start learning',
    finishNode: 'Mark as done',
    resetNode: 'Undo',
    after: (names: string) => `After: ${names}`,
    resources: (n: number) => `Resources (${n})`,
    noResources: 'No library resources for this skill yet.',
    free: 'Free',
    paid: 'Paid',
    loadError: 'Could not load data.',
    timeout: 'Waited over 16 minutes for the AI. Ollama is too slow or stuck; check it and try again.',
    network: 'Lost the connection to the backend while working. Check the backend and Ollama, then try again.',
    fitLink: 'See how your CV fits this job',
  },
};

type Copy = typeof copy.vi;

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const pad2 = (n: number) => String(n).padStart(2, '0');

function formatDay(iso: string | undefined, vi: boolean) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(vi ? 'vi-VN' : 'en-GB');
}

function Section({ id, index, title, note, action, children }: { id: string; index: string; title: string; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mt-[clamp(3rem,6vw,4.5rem)] scroll-mt-6">
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
      {children}
    </section>
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

function ErrorLine({ error, c }: { error: unknown; c: Copy }) {
  if (!error) return null;
  // Bước gọi AI dài: tách lỗi hết giờ chờ và lỗi mất kết nối giữa chừng cho dễ tìm nguyên nhân.
  const message =
    isAxiosError(error) && !error.response ? (error.code === 'ECONNABORTED' ? c.timeout : c.network) : authErrorMessage(error, c.loadError);
  return <p className="mt-3 text-[13px] leading-6 text-danger">{message}</p>;
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="border-b border-border py-6 text-[15px] leading-7 text-slate-500">{children}</p>;
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
                i === index ? 'border-ink bg-ink text-white' : answers[q.id] ? 'border-brand text-brand' : 'border-slate-300 text-slate-500 hover:border-ink'
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
              <span className="mt-0.5 block text-[12px] text-slate-500">{[r.provider, r.duration, r.isFree ? c.free : c.paid].filter(Boolean).join(' · ')}</span>
            </span>
            <ArrowUpRight size={15} aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-brand" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function NodeRow({ node, index, path, c, onStatus, busy }: { node: LearningPathNode; index: number; path: LearningPath; c: Copy; onStatus: (status: LearningPathNode['status']) => void; busy: boolean }) {
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

function PathView({ path, c, busy, onStatus }: { path: LearningPath; c: Copy; busy: boolean; onStatus: (nodeId: string, status: LearningPathNode['status']) => void }) {
  if (path.nodes.length === 0) return <p className="border-b border-border py-6 text-[15px] leading-7 text-slate-700">{c.pathEmpty}</p>;
  const doneNodes = path.nodes.filter((n) => n.status === 'completed').length;
  return (
    <>
      <dl className="grid border-b border-border sm:grid-cols-3">
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
      <div className="h-[2px] w-full bg-slate-200">
        <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${path.progress}%` }} />
      </div>
      <ol>
        {path.nodes.map((node, i) => (
          <NodeRow key={node.id} node={node} index={i} path={path} c={c} busy={busy} onStatus={(status) => onStatus(node.id, status)} />
        ))}
      </ol>
    </>
  );
}

function JdList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[13px] text-brand">{title}</p>
      <ul className="mt-2 border-t border-border">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 border-b border-border py-2.5 text-sm leading-6 text-ink">
            <span className="shrink-0 pt-px text-xs tabular-nums text-slate-500">{pad2(idx + 1)}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

/** Đánh giá kỹ năng theo JD của một công việc (kèm CV nếu có), rồi lập lộ trình học cho kỹ năng còn yếu. */
export default function SkillAssessmentPage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const pickerCopy = isVietnamese ? jobPickerCopy.vi : jobPickerCopy.en;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';
  const cvParam = searchParams.get('cvId') ?? '';
  const [jdOpen, setJdOpen] = useState(false);

  // Chỉ CV đã xác nhận (READY) mới dùng được cho bài đánh giá; không có CV thì ẩn ô chọn CV.
  const resumesQuery = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const readyCvs = (resumesQuery.data ?? []).filter((r) => r.status === 'Ready');
  const cvsLoaded = !resumesQuery.isPending;
  const defaultCv = readyCvs.find((r) => r.isDefault) ?? readyCvs[0];
  const cvId = cvParam === 'none' ? '' : readyCvs.some((r) => r.id === cvParam) ? cvParam : (defaultCv?.id ?? '');
  const currentCv = readyCvs.find((r) => r.id === cvId);

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: activity } = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity });
  const recentQuery = useQuery({ queryKey: ['jdAssessments'], queryFn: listJdAssessments });
  const { data: job } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJobById(jobId), enabled: !!jobId });

  const testKey = ['jdAssessment', jobId, cvId];
  const pathKey = ['learningPath', jobId, cvId];
  const testQuery = useQuery({ queryKey: testKey, queryFn: () => getLatestJdAssessment(jobId, cvId), enabled: !!jobId && cvsLoaded });
  const pathQuery = useQuery({ queryKey: pathKey, queryFn: () => getLatestLearningPath(jobId, cvId), enabled: !!jobId && cvsLoaded });
  const session = testQuery.data ?? null;
  const path = pathQuery.data ?? null;
  const completedTest = session?.status === 'completed' ? session : null;

  const selectJob = (id: string, resumeId?: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('jobId', id);
    if (resumeId !== undefined) next.set('cvId', resumeId || 'none');
    setSearchParams(next, { replace: true });
    setJdOpen(false);
  };

  const selectCv = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('cvId', id || 'none');
    setSearchParams(next, { replace: true });
  };

  const startTest = useMutation({
    mutationFn: () => startJdAssessment(jobId, cvId || undefined),
    onSuccess: (data) => {
      queryClient.setQueryData(testKey, data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessments'] });
    },
  });
  const submitTest = useMutation({
    mutationFn: (answers: Record<string, string>) => submitJdAssessment(session!.id, answers),
    onSuccess: (data) => {
      queryClient.setQueryData(testKey, data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessments'] });
      // Nộp bài làm lộ trình cũ hết hiệu lực ở backend.
      queryClient.invalidateQueries({ queryKey: pathKey });
    },
  });
  const buildPath = useMutation({
    // CV đi theo bài đánh giá; không có bài thì chỉ lập theo JD.
    mutationFn: () => createLearningPath({ jobId, assessmentId: completedTest?.id }),
    onSuccess: (data) => queryClient.setQueryData(pathKey, data),
  });
  const nodeStatus = useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: LearningPathNode['status'] }) => setLearningNodeStatus(path!.id, nodeId, status),
    onSuccess: (data) => queryClient.setQueryData(pathKey, data),
  });

  const weakSkills = completedTest?.skillScores.filter((s) => s.score < SKILL_PASS_SCORE).map((s) => s.skill) ?? [];
  const pathBeforeTest = !!path && !!completedTest?.submittedAt && new Date(path.createdAt) < new Date(completedTest.submittedAt);
  const busyAi = startTest.isPending || buildPath.isPending;
  // Lộ trình theo CV cần bài đánh giá dùng đúng CV đó (backend trả 409 nếu thiếu).
  const canBuildPath = !!completedTest || !cvId;

  const stepStatus = [
    job ? (currentCv ? `${job.title} · ${currentCv.name}` : job.title) : c.stepNone,
    !session ? c.stepNone : completedTest ? c.testDone(completedTest.score) : c.testOpen,
    path ? c.pathDone(path.nodes.length, path.progress) : c.stepNone,
  ];
  const stepDone = [!!job, !!completedTest, !!path];

  const recent = (recentQuery.data ?? []).slice(0, 5);

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      <header>
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.title}
          <span className="block text-brand">{c.titleLine}</span>
        </h1>
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[36rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">{c.intro}</p>
      </header>

      {/* Ba bước, mỗi bước nhảy tới mục tương ứng */}
      <ol className="mt-[clamp(2rem,4vw,2.75rem)] grid border-t border-slate-400 sm:grid-cols-3">
        {c.steps.map((label, i) => (
          <li key={label} className={`border-b border-border ${i > 0 ? 'sm:border-l sm:pl-5' : ''}`}>
            <a href={`#step-${i + 1}`} className="group block py-4 pr-3">
              <span className={`flex items-center gap-1.5 text-xs tabular-nums ${stepDone[i] ? 'text-brand' : 'text-slate-500'}`}>
                {stepDone[i] ? <Check size={12} aria-hidden="true" /> : pad2(i + 1)}
                <span className="text-slate-500">{label}</span>
              </span>
              <span className="mt-1 block truncate text-[15px] text-ink transition-colors group-hover:text-brand">{stepStatus[i]}</span>
            </a>
          </li>
        ))}
      </ol>

      {/* 01 Công việc mục tiêu */}
      <Section id="step-1" index="01" title={c.jobTitle} note={c.jobNote}>
        <div className="grid gap-x-[clamp(2rem,4vw,3.5rem)] gap-y-8 pt-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-[13px] text-slate-600">{c.jobLabel}</p>
            <div className="mt-1.5">
              {jobsQuery.isPending ? (
                <p className="py-2 text-sm text-slate-500">…</p>
              ) : (
                <JobPicker jobs={jobsQuery.data ?? []} selectedId={jobId} activity={activity} onSelect={selectJob} c={pickerCopy} label={c.jobLabel} />
              )}
            </div>
            {job ? (
              <div className="mt-3">
                <p className="text-[13px] leading-6 text-slate-600">
                  {[job.company, job.location, job.salary, job.experienceLevel].filter(Boolean).join(' · ')}
                </p>
                {job.skills.length > 0 && (
                  <p className="mt-3 text-sm leading-7">
                    <span className="text-slate-600">{c.skills}: </span>
                    {job.skills.map((s, i) => (
                      <span key={s}>
                        <span className="text-ink">{s}</span>
                        {i < job.skills.length - 1 && <span className="text-slate-400"> · </span>}
                      </span>
                    ))}
                  </p>
                )}
                <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  <button type="button" onClick={() => setJdOpen((o) => !o)} aria-expanded={jdOpen} className={`${textLink} text-[13px] text-ink`}>
                    {jdOpen ? c.hideJd : c.readJd}
                  </button>
                  <Link to={`/candidate/jobs/${job.id}`} className={`${textLink} text-[13px] text-ink`}>
                    {c.viewJob}
                  </Link>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-slate-500">{c.pickFirst}</p>
            )}

            {readyCvs.length > 0 && (
              <div className="mt-7">
                <label htmlFor="assess-cv" className="block text-[13px] text-slate-600">
                  {c.cvLabel}
                </label>
                <div className="relative mt-1.5">
                  <select id="assess-cv" value={cvId} onChange={(e) => selectCv(e.target.value)} disabled={busyAi} className={`${lineField} appearance-none pr-7`}>
                    {readyCvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name}
                      </option>
                    ))}
                    <option value="">{c.cvNone}</option>
                  </select>
                  <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
                <p className="mt-3 text-[13px] leading-6 text-slate-600">{currentCv ? c.cvWith : c.cvWithout}</p>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[13px] text-slate-600">{c.recent}</p>
            {recentQuery.isPending ? (
              <p className="mt-2 text-sm text-slate-500">…</p>
            ) : recent.length === 0 ? (
              <p className="mt-2 text-[13px] text-slate-500">{c.recentEmpty}</p>
            ) : (
              <ul className="mt-1.5 border-t border-border">
                {recent.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => selectJob(r.jobId, r.resumeId)}
                      aria-current={r.jobId === jobId && r.resumeId === cvId ? 'true' : undefined}
                      className="group flex w-full items-baseline justify-between gap-4 border-b border-border py-2.5 text-left cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className={`block truncate text-sm transition-colors group-hover:text-brand ${r.jobId === jobId && r.resumeId === cvId ? 'text-brand' : 'text-ink'}`}>
                          {r.jobTitle || '—'}
                        </span>
                        {r.resumeId && (
                          <span className="block truncate text-[12px] text-slate-500">
                            {c.withCv((resumesQuery.data ?? []).find((cv) => cv.id === r.resumeId)?.name ?? '…')}
                          </span>
                        )}
                      </span>
                      <span className={`shrink-0 text-[13px] tabular-nums ${r.score === undefined ? 'text-slate-500' : r.score >= SKILL_PASS_SCORE ? 'text-brand' : 'text-danger'}`}>
                        {r.score === undefined ? c.testOpen : `${r.score}%`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {jdOpen && job && (
          <div className="mt-6 grid gap-x-[clamp(2rem,4vw,3rem)] gap-y-8 border-t border-border pt-5 lg:grid-cols-2">
            {job.responsibilities?.length || job.requirements?.length ? (
              <>
                <JdList title={c.responsibilities} items={job.responsibilities} />
                <JdList title={c.requirements} items={job.requirements} />
              </>
            ) : (
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700 lg:col-span-2">{job.description}</p>
            )}
          </div>
        )}
      </Section>

      {/* 02 Bài đánh giá */}
      <Section
        id="step-2"
        index="02"
        title={c.testTitle}
        note={c.testNote}
        action={
          completedTest && !busyAi ? (
            <button type="button" onClick={() => startTest.mutate()} className={`${textLink} text-[13px] text-ink`}>
              {c.retake}
            </button>
          ) : undefined
        }
      >
        {!jobId ? (
          <Muted>{c.pickFirst}</Muted>
        ) : testQuery.isPending ? (
          <Loading />
        ) : testQuery.isError ? (
          <ErrorLine error={testQuery.error} c={c} />
        ) : startTest.isPending ? (
          <Working text={c.testCreating} />
        ) : !session ? (
          <div className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="max-w-xl text-[15px] leading-7 text-ink">{c.testIntro}</p>
              <p className="mt-1 text-[13px] text-slate-500">{c.testCost}</p>
            </div>
            <button type="button" onClick={() => startTest.mutate()} disabled={busyAi} className={`${primaryButton} shrink-0`}>
              {c.testStart}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : session.status === 'in_progress' ? (
          <Quiz key={session.id} session={session} c={c} onSubmit={(answers) => submitTest.mutate(answers)} submitting={submitTest.isPending} />
        ) : (
          <AssessmentResult key={session.id} session={session} c={c} vi={isVietnamese} />
        )}
        <ErrorLine error={startTest.error ?? submitTest.error} c={c} />
      </Section>

      {/* 03 Lộ trình học */}
      <Section
        id="step-3"
        index="03"
        title={c.pathTitle}
        note={c.pathNote}
        action={
          path && !busyAi && canBuildPath ? (
            <button type="button" onClick={() => buildPath.mutate()} className={`${textLink} text-[13px] text-ink`}>
              {c.pathRebuild}
            </button>
          ) : undefined
        }
      >
        {!jobId ? (
          <Muted>{c.pickFirst}</Muted>
        ) : pathQuery.isPending ? (
          <Loading />
        ) : pathQuery.isError ? (
          <ErrorLine error={pathQuery.error} c={c} />
        ) : buildPath.isPending ? (
          <Working text={c.pathCreating} />
        ) : !path ? (
          <div className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-[15px] leading-7 text-ink">
              {completedTest ? (weakSkills.length ? c.pathWeak(weakSkills.join(', ')) : c.pathAllPass) : cvId ? c.pathNeedsTest : c.pathLocked}
            </p>
            {completedTest ? (
              <button type="button" onClick={() => buildPath.mutate()} disabled={busyAi} className={`${primaryButton} shrink-0`}>
                {c.pathCreate}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              canBuildPath && (
                <button type="button" onClick={() => buildPath.mutate()} disabled={busyAi} className={`${textLink} shrink-0 text-[13px] text-slate-600`}>
                  {c.pathWithoutTest}
                </button>
              )
            )}
          </div>
        ) : (
          <div>
            {(path.outdated || pathBeforeTest) && (
              <p className="mt-4 border-l-2 border-warning pl-4 text-sm leading-6 text-ink">
                {path.outdated ? c.outdated : c.pathStale}{' '}
                {canBuildPath && (
                  <button type="button" onClick={() => buildPath.mutate()} disabled={busyAi} className={`${textLink} text-[13px] text-ink`}>
                    {c.pathRebuild}
                  </button>
                )}
              </p>
            )}
            <PathView path={path} c={c} busy={nodeStatus.isPending} onStatus={(nodeId, status) => nodeStatus.mutate({ nodeId, status })} />
          </div>
        )}
        <ErrorLine error={buildPath.error ?? nodeStatus.error} c={c} />
      </Section>

      {job && (
        <p className="mt-[clamp(3rem,6vw,4.5rem)] border-t border-ink pt-5">
          <Link to={`/candidate/cv-job-fit?jobId=${job.id}${cvId ? `&cvId=${cvId}` : ''}`} className={`${textLink} text-ink`}>
            {c.fitLink}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      )}
    </div>
  );
}
