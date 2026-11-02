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
import { JobDescription } from '../../components/jobs/JobContent';

const copy = {
  vi: {
    crumbGroup: 'Phát triển',
    crumbPage: 'Đánh giá kỹ năng',
    heroA: 'Kiểm tra kỹ năng theo JD.',
    heroB: 'CV không bắt buộc.',
    introShort: 'Chọn công việc bạn nhắm tới. Hệ thống ra 10 câu hỏi về đúng các kỹ năng trong JD, chấm điểm từng kỹ năng và lập lộ trình cho phần còn yếu.',
    sumNotPassed: `Chưa đạt mức ${SKILL_PASS_SCORE}`,
    sumPassed: `Đạt mức ${SKILL_PASS_SCORE}`,
    sumSkills: (d: number, n: number) => `${d} / ${n} kỹ năng`,
    hoursLeft: (h: number) => `${h} giờ còn lại`,
    newTest: 'Làm bài mới',
    resultTitle: 'Kết quả bài đánh giá',
    missingPoints: (n: number) => `Chưa đạt, còn thiếu ${n} điểm`,
    passedLine: 'Đã đạt mức yêu cầu',
    pathSummary: (n: number, h: number, d: number) => `${n} kỹ năng · ${h} giờ còn lại · Đã xong ${d}/${n}.`,
    noResShort: 'Chưa có tài liệu trong thư viện',
    afterShort: (names: string) => `Nên học sau: ${names}`,
    reasonScore: (s: number) => `Điểm bài đánh giá ${s}/100`,
    fitTitle: 'Xem độ phù hợp của CV với công việc này',
    fitSub: (t: string) => `So khớp CV với JD ${t} và nhận gợi ý sửa CV.`,
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
    moreJd: 'Xem thêm',
    lessJd: 'Thu gọn',
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
    aiInvalid: 'AI trả về kết quả chưa hợp lệ (ví dụ câu hỏi bị trùng) dù đã thử lại. Chưa có gì được lưu, bạn bấm lại để thử lần nữa.',
    fitLink: 'Xem độ phù hợp của CV với công việc này',
  },
  en: {
    crumbGroup: 'Growth',
    crumbPage: 'Skill assessment',
    heroA: 'Test your skills against the JD.',
    heroB: 'CV optional.',
    introShort: 'Pick the job you are aiming for. We write 10 questions on exactly the skills in the JD, score each skill and build a path for the weak ones.',
    sumNotPassed: `Below the ${SKILL_PASS_SCORE} pass mark`,
    sumPassed: `Passed the ${SKILL_PASS_SCORE} mark`,
    sumSkills: (d: number, n: number) => `${d} / ${n} skills`,
    hoursLeft: (h: number) => `${h} h left`,
    newTest: 'New assessment',
    resultTitle: 'Assessment result',
    missingPoints: (n: number) => `Not passed, ${n} points short`,
    passedLine: 'Pass mark reached',
    pathSummary: (n: number, h: number, d: number) => `${n} skills · ${h} h left · ${d}/${n} done.`,
    noResShort: 'No library resources yet',
    afterShort: (names: string) => `Learn after: ${names}`,
    reasonScore: (s: number) => `Assessment score ${s}/100`,
    fitTitle: 'See how your CV fits this job',
    fitSub: (t: string) => `Match your CV with the ${t} JD and get CV fixes.`,
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
    moreJd: 'Show more',
    lessJd: 'Show less',
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
    aiInvalid: 'The AI returned an invalid result (for example, repeated questions) even after retrying. Nothing was saved; press the button to try again.',
    fitLink: 'See how your CV fits this job',
  },
};

export type Copy = typeof copy.vi;
/** Câu chữ dùng chung với trang Lộ trình học (PathView, ErrorLine…). */
export const skillPathCopy = copy;

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

export function Section({ id, index, title, note, action, children }: { id: string; index: string; title: string; note?: string; action?: ReactNode; children: ReactNode }) {
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

export function Working({ text }: { text: string }) {
  return (
    <p role="status" className="flex items-center gap-2 border-b border-border py-6 text-[15px] text-ink">
      <Loader2 size={15} className="animate-spin text-brand" aria-hidden="true" />
      {text}
    </p>
  );
}

export function ErrorLine({ error, c }: { error: unknown; c: Copy }) {
  if (!error) return null;
  // Bước gọi AI dài: tách lỗi hết giờ chờ và lỗi mất kết nối giữa chừng cho dễ tìm nguyên nhân.
  // 502 = AI trả kết quả không hợp lệ (câu hỏi trùng, thiếu trích dẫn JD…), câu chữ gốc của BE là tiếng Anh kỹ thuật.
  const message = !isAxiosError(error)
    ? authErrorMessage(error, c.loadError)
    : !error.response
      ? error.code === 'ECONNABORTED'
        ? c.timeout
        : c.network
      : error.response.status === 502
        ? c.aiInvalid
        : authErrorMessage(error, c.loadError);
  return <p className="mt-3 text-[13px] leading-6 text-danger">{message}</p>;
}

export function Muted({ children }: { children: ReactNode }) {
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

function AssessmentResult({ session, c, vi, reviewOpen }: { session: JdAssessment; c: Copy; vi: boolean; reviewOpen: boolean }) {
  const passed = session.score >= SKILL_PASS_SCORE;
  const skills = [...session.skillScores].sort((a, b) => a.score - b.score);
  return (
    <div className="pt-6">
      <div className="grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-6 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <div>
          <p className={`text-[clamp(3.5rem,7vw,5.25rem)] font-normal leading-none tracking-[-0.04em] tabular-nums ${passed ? 'text-brand' : 'text-danger'}`}>
            {session.score}%
          </p>
          <p className="mt-4 text-[13px] text-slate-700">
            {c.resultLine(session.correct, session.total)} · {c.passMark}
          </p>
          <p className={`mt-1 text-[13px] ${passed ? 'text-brand' : 'text-danger'}`}>
            {passed ? c.passedLine : c.missingPoints(SKILL_PASS_SCORE - session.score)}
          </p>
          {session.submittedAt && <p className="mt-1 text-[12px] text-slate-500">{c.doneAt(formatDay(session.submittedAt, vi))}</p>}
        </div>
        <ul className="border-t border-border md:border-t-0">
          {skills.map((s) => {
            const ok = s.score >= SKILL_PASS_SCORE;
            return (
              <li key={s.skill} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-border py-3 sm:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)_minmax(8rem,auto)]">
                <span className="truncate text-[15px] text-ink">{s.skill}</span>
                <span className="order-3 col-span-2 h-[2px] w-full bg-slate-200 sm:order-none sm:col-span-1">
                  <span className={`block h-full ${ok ? 'bg-brand' : 'bg-danger'}`} style={{ width: `${Math.max(s.score, 1)}%` }} />
                </span>
                <span className={`text-right text-[13px] tabular-nums ${ok ? 'text-brand' : 'text-danger'}`}>
                  {s.score}% · {ok ? c.passed : c.needPractice}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {reviewOpen && (
        <ol className="mt-8 border-t border-border">
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
  const [open, setOpen] = useState(false);
  const gap = path.missing.find((m) => m.skill.toLowerCase() === node.skill.toLowerCase());
  const after = node.prerequisiteIds.map((id) => path.nodes.find((n) => n.id === id)?.skill).filter(Boolean).join(', ');
  const done = node.status === 'completed';
  const reason = gap
    ? gap.status === 'NEEDS_PRACTICE' && gap.score !== undefined
      ? c.reasonScore(gap.score)
      : c.reason[gap.status]
    : '';
  const action = `${textLink} whitespace-nowrap text-[13px]`;
  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
      <span className={`pt-1.5 text-xs tabular-nums ${done ? 'text-brand' : 'text-slate-500'}`}>{done ? <Check size={13} aria-label={c.status.completed} /> : pad2(index + 1)}</span>
      <div className="min-w-0">
        <h3 className={`text-[clamp(1.0625rem,1.5vw,1.25rem)] font-normal ${done ? 'text-brand' : 'text-ink'}`}>{node.skill}</h3>
        {node.description && <p className="mt-1.5 max-w-[42rem] text-[15px] leading-7 text-slate-700">{node.description}</p>}
        {after && <p className="mt-1.5 text-[13px] text-slate-500">{c.afterShort(after)}</p>}
        <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          {node.status === 'not_started' && (
            <button type="button" disabled={busy} onClick={() => onStatus('in_progress')} className={`${action} text-brand`}>
              {c.startNode}
            </button>
          )}
          {node.status === 'in_progress' && <span className="text-[13px] text-ink">{c.status.in_progress}</span>}
          {node.resources.length > 0 ? (
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${action} text-ink`}>
              {c.resources(node.resources.length)}
            </button>
          ) : (
            <span className="text-[13px] text-slate-500">{c.noResShort}</span>
          )}
          {!done ? (
            <button type="button" disabled={busy} onClick={() => onStatus('completed')} className={`${action} text-ink`}>
              {c.finishNode}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => onStatus('not_started')} className={`${action} text-slate-600`}>
              {c.resetNode}
            </button>
          )}
        </p>
        {open && <ResourceList resources={node.resources} c={c} />}
      </div>
      <p className="col-start-2 mt-2 text-[13px] text-slate-500 sm:col-start-3 sm:mt-1 sm:text-right">
        {[node.hours > 0 ? c.hours(node.hours) : '', ''].filter(Boolean).join('')}
        {reason && (
          <span className={gap?.status === 'NEEDS_PRACTICE' ? 'text-danger' : ''}>
            {node.hours > 0 ? ' · ' : ''}
            {reason}
          </span>
        )}
      </p>
    </li>
  );
}

const hoursLeftOf = (path: LearningPath) => path.nodes.filter((n) => n.status !== 'completed').reduce((sum, n) => sum + n.hours, 0);

export function PathView({ path, c, busy, onStatus }: { path: LearningPath; c: Copy; busy: boolean; onStatus: (nodeId: string, status: LearningPathNode['status']) => void }) {
  if (path.nodes.length === 0) return <p className="border-b border-border py-6 text-[15px] leading-7 text-slate-700">{c.pathEmpty}</p>;
  const doneNodes = path.nodes.filter((n) => n.status === 'completed').length;
  return (
    <>
      <p className="pt-4 text-[13px] leading-6 text-slate-600">
        <span className="text-ink">{c.pathSummary(path.nodes.length, hoursLeftOf(path), doneNodes)}</span> {c.pathNote}
      </p>
      <ol className="mt-2">
        {path.nodes.map((node, i) => (
          <NodeRow key={node.id} node={node} index={i} path={path} c={c} busy={busy} onStatus={(status) => onStatus(node.id, status)} />
        ))}
      </ol>
    </>
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
  const [reviewOpen, setReviewOpen] = useState(false);

  // Chỉ CV đã xác nhận (READY) mới dùng được cho bài đánh giá; không có CV thì ẩn ô chọn CV.
  const resumesQuery = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const readyCvs = (resumesQuery.data ?? []).filter((r) => r.status === 'Ready');
  const cvsLoaded = !resumesQuery.isPending;
  const defaultCv = readyCvs.find((r) => r.isDefault) ?? readyCvs[0];
  const cvId = cvParam === 'none' ? '' : readyCvs.some((r) => r.id === cvParam) ? cvParam : (defaultCv?.id ?? '');

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: activity } = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity });
  const { data: job } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJobById(jobId), enabled: !!jobId });

  const testKey = ['jdAssessment', jobId, cvId];
  const pathKey = ['learningPath', jobId, cvId];
  const testQuery = useQuery({ queryKey: testKey, queryFn: () => getLatestJdAssessment(jobId, cvId), enabled: !!jobId && cvsLoaded });
  const pathQuery = useQuery({ queryKey: pathKey, queryFn: () => getLatestLearningPath(jobId, cvId), enabled: !!jobId && cvsLoaded });
  const session = testQuery.data ?? null;
  const path = pathQuery.data ?? null;
  const completedTest = session?.status === 'completed' ? session : null;

  const updateParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setSearchParams(next, { replace: true });
  };
  const selectJob = (id: string) => {
    updateParams({ jobId: id });
    setJdOpen(false);
    setReviewOpen(false);
  };
  const selectCv = (id: string) => {
    updateParams({ cvId: id || 'none' });
    setReviewOpen(false);
  };

  const startTest = useMutation({
    mutationFn: () => startJdAssessment(jobId, cvId || undefined),
    onSuccess: (data) => {
      queryClient.setQueryData(testKey, data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessments'] });
      setReviewOpen(false);
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
  const doneNodes = path?.nodes.filter((n) => n.status === 'completed').length ?? 0;
  const testPassed = !!completedTest && completedTest.score >= SKILL_PASS_SCORE;

  const summary = [
    { label: c.jobTitle, value: job?.title ?? c.stepNone, sub: job?.company ?? '', tone: '' },
    {
      label: c.testTitle,
      value: completedTest ? `${completedTest.score}%` : session ? c.testOpen : c.stepNone,
      sub: completedTest ? (testPassed ? c.sumPassed : c.sumNotPassed) : '',
      tone: completedTest ? (testPassed ? 'text-brand' : 'text-danger') : '',
    },
    {
      label: c.pathTitle,
      value: path ? c.sumSkills(doneNodes, path.nodes.length) : c.stepNone,
      sub: path && path.nodes.length > 0 ? c.hoursLeft(hoursLeftOf(path)) : '',
      tone: '',
    },
  ];

  const headAction =
    !job || busyAi || testQuery.isPending ? null : !session ? (
      <button type="button" onClick={() => startTest.mutate()} className={`${primaryButton} shrink-0`}>
        {c.testStart}
      </button>
    ) : completedTest ? (
      <button type="button" onClick={() => startTest.mutate()} className={`${primaryButton} shrink-0`}>
        {c.newTest}
      </button>
    ) : null;

  return (
    <div className="w-full max-w-[min(100%,76rem)] pb-[clamp(2rem,5vw,4rem)]">
      <nav className="flex flex-wrap items-baseline gap-1.5 text-[13px] text-slate-600">
        <span>{c.crumbGroup}</span>
        <span>/</span>
        <span className="text-brand">{c.crumbPage}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-[clamp(2rem,3.2vw,2.875rem)] font-normal leading-[1.15] tracking-[-0.03em] text-ink">
          {c.heroA} <span className="text-brand">{c.heroB}</span>
        </h1>
        <p className="mt-3 max-w-[40rem] text-[15px] leading-7 text-slate-600">{c.introShort}</p>
      </header>

      {/* Tóm tắt: công việc, điểm bài đánh giá, lộ trình */}
      <dl className="mt-[clamp(2rem,4vw,3rem)] grid border-y border-border border-t-ink sm:grid-cols-3">
        {summary.map((item, i) => (
          <div key={item.label} className={`min-w-0 py-4 ${i > 0 ? 'border-t border-border sm:border-t-0 sm:pl-6' : ''} sm:pr-4`}>
            <dt className="text-[12px] text-slate-500">{item.label}</dt>
            <dd className="mt-1.5 truncate text-[clamp(1.125rem,1.7vw,1.375rem)] text-ink tabular-nums">{item.value}</dd>
            {item.sub && <dd className={`mt-0.5 truncate text-[12px] ${item.tone || 'text-slate-500'}`}>{item.sub}</dd>}
          </div>
        ))}
      </dl>

      {/* 01 Công việc mục tiêu */}
      <Section id="step-1" index="01" title={c.jobTitle}>
        <div className="grid items-end gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-6 pt-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_auto]">
          <div className="min-w-0">
            <p className="text-[12px] text-slate-500">{c.jobLabel}</p>
            <div className="mt-1">
              {jobsQuery.isPending ? (
                <p className="py-2 text-sm text-slate-500">…</p>
              ) : (
                <JobPicker jobs={jobsQuery.data ?? []} selectedId={jobId} activity={activity} onSelect={selectJob} c={pickerCopy} label={c.jobLabel} />
              )}
            </div>
          </div>
          {readyCvs.length > 0 ? (
            <div className="min-w-0">
              <label htmlFor="assess-cv" className="block text-[12px] text-slate-500">
                {c.cvLabel}
              </label>
              <div className="relative mt-1">
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
            </div>
          ) : (
            <span className="hidden md:block" />
          )}
          <div className="md:pb-0.5">{headAction}</div>
        </div>

        {job ? (
          <div className="mt-4 space-y-1 text-[13px] leading-6 text-slate-600">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span>{[job.company, job.location].filter(Boolean).join(' · ')}</span>
              <span>·</span>
              <button type="button" onClick={() => setJdOpen((o) => !o)} aria-expanded={jdOpen} className={`${textLink} text-[13px] text-ink`}>
                {jdOpen ? c.hideJd : c.readJd}
              </button>
              <Link to={`/candidate/jobs/${job.id}`} className={`${textLink} text-[13px] text-ink`}>
                {c.viewJob}
              </Link>
            </p>
            {job.skills.length > 0 && (
              <p>
                {c.skills}: <span className="text-ink">{job.skills.join(', ')}</span>
              </p>
            )}
            {readyCvs.length > 0 && <p>{cvId ? c.cvWith : c.cvWithout}</p>}
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-slate-500">{c.pickFirst}</p>
        )}

        {jdOpen && job && (
          <div className="mt-5 border-t border-border">
            <JobDescription job={job} moreLabel={c.moreJd} lessLabel={c.lessJd} />
          </div>
        )}
      </Section>

      {/* 02 Bài đánh giá / kết quả */}
      <Section
        id="step-2"
        index="02"
        title={completedTest && !busyAi ? c.resultTitle : c.testTitle}
        note={completedTest && !busyAi ? undefined : c.testNote}
        action={
          completedTest && !busyAi ? (
            <button type="button" onClick={() => setReviewOpen((o) => !o)} aria-expanded={reviewOpen} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
              {reviewOpen ? c.hideReview : c.review}
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
          <div className="border-b border-border py-6">
            <p className="max-w-xl text-[15px] leading-7 text-ink">{c.testIntro}</p>
            <p className="mt-1 text-[13px] text-slate-500">{c.testCost}</p>
          </div>
        ) : session.status === 'in_progress' ? (
          <Quiz key={session.id} session={session} c={c} onSubmit={(answers) => submitTest.mutate(answers)} submitting={submitTest.isPending} />
        ) : (
          <AssessmentResult key={session.id} session={session} c={c} vi={isVietnamese} reviewOpen={reviewOpen} />
        )}
        <ErrorLine error={startTest.error ?? submitTest.error} c={c} />
      </Section>

      {/* 03 Lộ trình học */}
      <Section
        id="step-3"
        index="03"
        title={c.pathTitle}
        action={
          path && !busyAi && canBuildPath ? (
            <button type="button" onClick={() => buildPath.mutate()} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
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
            <div>
              <p className="max-w-xl text-[15px] leading-7 text-ink">
                {completedTest ? (weakSkills.length ? c.pathWeak(weakSkills.join(', ')) : c.pathAllPass) : cvId ? c.pathNeedsTest : c.pathLocked}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">{c.pathNote}</p>
            </div>
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
                {path.outdated ? c.outdated : c.pathStale}
              </p>
            )}
            <PathView path={path} c={c} busy={nodeStatus.isPending} onStatus={(nodeId, status) => nodeStatus.mutate({ nodeId, status })} />
          </div>
        )}
        <ErrorLine error={buildPath.error ?? nodeStatus.error} c={c} />
      </Section>

      {job && (
        <Link
          to={`/candidate/cv-job-fit?jobId=${job.id}${cvId ? `&cvId=${cvId}` : ''}`}
          className="group mt-[clamp(3rem,6vw,4.5rem)] flex items-center justify-between gap-6 border-t border-ink pt-6"
        >
          <span className="min-w-0">
            <span className="block text-[clamp(1.0625rem,1.5vw,1.25rem)] text-ink transition-colors group-hover:text-brand">{c.fitTitle}</span>
            <span className="mt-1 block text-[13px] text-slate-600">{c.fitSub(job.title)}</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-ink transition-colors group-hover:text-brand" />
        </Link>
      )}
    </div>
  );
}
