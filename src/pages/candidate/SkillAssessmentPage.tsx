import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  SKILL_PASS_SCORE,
  createLearningPath,
  getJdAssessment,
  getLearningPathForAssessment,
  getLatestJdAssessment,
  getLatestLearningPath,
  listSavedPastedLearningPaths,
  setLearningNodeStatus,
  skillTestHref,
  startJdAssessment,
  type JdAssessment,
  type LearningPath,
  type LearningPathNode,
} from '../../services/skillPathService';
import type { LearningResource } from '../../types/assessment';
import { authErrorMessage } from '../../services/authService';
import { analyzeJdSkillProficiency, getJobById, getJobs, getResumes } from '../../services/candidateService';
import { AssessmentHistory } from './skill-assessment/AssessmentHistory';
import { JOB_ACTIVITY_QUERY_KEY, getJobActivity } from '../../services/jobActivityService';
import { Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { JobPicker, jobPickerCopy, lineField } from './cv-job-fit/JobPicker';
import { JobDescription } from '../../components/jobs/JobContent';

const copy = {
  vi: {
    crumbGroup: 'Phát triển',
    crumbPage: 'Chuẩn bị phỏng vấn',
    heroA: 'Chuẩn bị phỏng vấn theo JD.',
    heroB: 'CV không bắt buộc.',
    introShort: 'Tìm công việc bạn nhắm tới hoặc dán thẳng JD. Hệ thống nhận diện kỹ năng trong JD, tạo câu hỏi đánh giá và lập lộ trình cho phần còn yếu.',
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
    title: 'Chuẩn bị phỏng vấn.',
    titleLine: 'Theo JD, CV không bắt buộc.',
    intro: 'Chọn công việc bạn nhắm tới, và CV nếu bạn có. Hệ thống đối chiếu JD với CV, ra câu hỏi về đúng các kỹ năng đó, chấm điểm từng kỹ năng rồi lập lộ trình học cho phần còn yếu.',
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
    testNote: `Câu hỏi trắc nghiệm do AI tạo từ JD. Kỹ năng dưới ${SKILL_PASS_SCORE} điểm sẽ vào lộ trình học.`,
    testIntro: 'Bài làm trên một trang riêng, mỗi lần một câu. Bạn có một quỹ thời gian chung cho cả bài, tính theo 1 phút 30 giây nhân với số câu hỏi.',
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
    timeRemaining: 'Thời gian còn lại',
    quizTotalTime: 'Tổng thời gian',
    timeExpired: 'Đã hết giờ. Hệ thống chấm các câu trả lời đã lưu.',
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
    continueTest: 'Tiếp tục làm bài',
    openTestLine: 'Bạn có một bài đang làm dở. Bài làm trên một trang riêng, câu trả lời được lưu sau mỗi lần chọn.',
    openTestStats: (a: number, n: number, m: string) => `Đã trả lời ${a}/${n} câu · còn ${m}`,
    openTestExpired: (a: number, n: number) => `Đã trả lời ${a}/${n} câu · đã hết giờ, mở bài để nộp`,
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
    pathEmpty: 'Chưa có nội dung học được xác định từ dữ liệu hiện tại. Điều này không xác nhận bạn đã đáp ứng toàn bộ JD; hãy kiểm tra các yêu cầu cần xác minh.',
    pathDone: (n: number, progress: number) => `${n} kỹ năng · ${progress}%`,
    hours: (h: number) => `${h} giờ`,
    progress: 'Tiến độ',
    totalTime: 'Thời gian ước tính',
    skillsCount: 'Kỹ năng cần học',
    status: { not_started: 'Chưa học', in_progress: 'Đang học', completed: 'Đã xong' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Bài đánh giá dưới 70 điểm', MISSING_EVIDENCE: 'CV và hồ sơ chưa có' },
    finishNode: 'Đánh dấu đã xong',
    resetNode: 'Bỏ đánh dấu',
    after: (names: string) => `Học sau: ${names}`,
    resources: (n: number) => `Tài liệu (${n})`,
    noResources: 'Chưa có tài liệu trong thư viện cho kỹ năng này.',
    free: 'Miễn phí',
    paid: 'Trả phí',
    loadError: 'Không tải được dữ liệu.',
    timeout: 'Quá thời gian chờ AI trả kết quả. Vui lòng thử lại sau.',
    network: 'Mất kết nối trong lúc xử lý. Kiểm tra kết nối rồi thử lại.',
    aiInvalid: 'AI chưa tạo được kết quả hợp lệ. Chưa có gì được lưu.',
    aiProvider: 'Nhà cung cấp AI không xử lý được yêu cầu. Vui lòng kiểm tra cấu hình model hoặc liên hệ quản trị viên.',
    fitLink: 'Xem độ phù hợp của CV với công việc này',
  },
  en: {
    crumbGroup: 'Growth',
    crumbPage: 'Interview preparation',
    heroA: 'Prepare for interviews from the JD.',
    heroB: 'CV optional.',
    introShort: 'Pick the job you are aiming for. We write questions on exactly the skills in the JD, score each skill and build a path for the weak ones.',
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
    title: 'Interview preparation.',
    titleLine: 'From the JD, CV optional.',
    intro: 'Pick the job you are aiming for, and your CV if you have one. We compare the JD with the CV, write questions on exactly those skills, score each skill and build a learning path for the weak ones.',
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
    testNote: `Multiple-choice questions written from the JD. Skills under ${SKILL_PASS_SCORE} go into the learning path.`,
    testIntro: 'The test opens on its own page, one question at a time. It has one shared time limit of 90 seconds multiplied by the number of questions.',
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
    timeRemaining: 'Time remaining',
    quizTotalTime: 'Total time',
    timeExpired: 'Time is up. Your saved answers will be scored.',
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
    continueTest: 'Continue the test',
    openTestLine: 'You have a test in progress. It opens on its own page and every answer is saved as you pick it.',
    openTestStats: (a: number, n: number, m: string) => `${a}/${n} answered · ${m} left`,
    openTestExpired: (a: number, n: number) => `${a}/${n} answered · time is up, open it to submit`,
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
    pathEmpty: 'No learning items were identified from the current evidence. This does not confirm that you meet the entire JD; review requirements needing verification.',
    pathDone: (n: number, progress: number) => `${n} skills · ${progress}%`,
    hours: (h: number) => `${h} h`,
    progress: 'Progress',
    totalTime: 'Estimated time',
    skillsCount: 'Skills to learn',
    status: { not_started: 'Not started', in_progress: 'Learning', completed: 'Done' } as Record<LearningPathNode['status'], string>,
    reason: { NEEDS_PRACTICE: 'Assessment under 70', MISSING_EVIDENCE: 'Not in CV or profile' },
    finishNode: 'Mark as done',
    resetNode: 'Undo',
    after: (names: string) => `After: ${names}`,
    resources: (n: number) => `Resources (${n})`,
    noResources: 'No library resources for this skill yet.',
    free: 'Free',
    paid: 'Paid',
    loadError: 'Could not load data.',
    timeout: 'The AI request timed out. Please try again later.',
    network: 'The connection was lost while processing. Check your connection and try again.',
    aiInvalid: 'AI could not complete a valid result. Nothing was saved.',
    aiProvider: 'The AI provider could not process the request. Please check model configuration or contact an administrator.',
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
  const providerFailure = isAxiosError(error)
    && /AI provider/i.test(String((error.response?.data as { detail?: string } | undefined)?.detail ?? ''));
  const message = !isAxiosError(error)
    ? authErrorMessage(error, c.loadError)
    : !error.response
      ? error.code === 'ECONNABORTED'
        ? c.timeout
        : c.network
      : error.response.status === 502
        ? providerFailure ? c.aiProvider : c.aiInvalid
        : authErrorMessage(error, c.loadError);
  return <p className="mt-3 text-[13px] leading-6 text-danger">{message}</p>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="border-b border-border py-6 text-[15px] leading-7 text-slate-500">{children}</p>;
}

export function RoadmapBuildError({ error, c, vi }: { error: unknown; c: Copy; vi: boolean }) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status !== 402 && status !== 429) return <ErrorLine error={error} c={c} />;
  return (
    <div role="alert" className="mt-3 text-[13px] leading-6">
      <p className="text-danger">{status === 402
        ? (vi ? 'Bạn cần gói AI trả phí hoặc đủ token đã mua để tạo lộ trình.' : 'A paid AI plan or enough purchased tokens are required to create a roadmap.')
        : (vi ? 'Bạn đã hết hạn mức AI khả dụng để tạo lộ trình.' : 'You have reached your available AI quota for roadmaps.')}</p>
      <Link to="/candidate/subscription" className={textLink}>{vi ? 'Xem gói AI và nạp token' : 'View AI plans and top up'}</Link>
    </div>
  );
}

// ─── Assessment ─────────────────────────────────────────────────────────────

/** Bài đang làm dở: chỉ tóm tắt, việc làm bài diễn ra ở trang riêng. */
function OpenTest({ session, c }: { session: JdAssessment; c: Copy }) {
  const answered = session.questions.filter((q) => session.answers[q.id]).length;
  const total = session.questions.length;
  const deadline = Date.parse(session.expiresAt);
  const left = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : session.timeLimitSeconds;
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <div className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="max-w-xl text-[15px] leading-7 text-ink">{c.openTestLine}</p>
        <p className="mt-1 text-[13px] tabular-nums text-slate-500">{left > 0 ? c.openTestStats(answered, total, time) : c.openTestExpired(answered, total)}</p>
      </div>
      <Link to={skillTestHref(session.id)} className={`${primaryButton} shrink-0`}>
        {c.continueTest}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function AssessmentResult({ session, c, vi, reviewOpen }: { session: JdAssessment; c: Copy; vi: boolean; reviewOpen: boolean }) {
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
            const right = !!picked && picked === q.correctOptionId;
            return (
              <li key={q.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-4">
                <span className="pt-0.5 text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
                <div className="min-w-0">
                  <p className={`text-[12px] ${right ? 'text-brand' : 'text-danger'}`}>{q.topic}</p>
                  <p className="mt-1 text-[15px] leading-7 text-ink">{q.text}</p>
                  <dl className="mt-1.5 space-y-1 text-[13px] leading-6">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-slate-500">{c.yourAnswer}:</dt>
                      <dd className={right ? 'text-brand' : 'text-danger'}>{q.options.find((o) => o.id === picked)?.text ?? c.noAnswer}</dd>
                    </div>
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

export function SkillEvidence({ path }: { path: LearningPath }) {
  const { isVietnamese } = useTranslation();
  return <>
            {path.gapAnalysisVersion !== 'jd-skills-v3' ? (
              <p className="mt-4 text-sm text-slate-600">{isVietnamese ? 'Lộ trình này dùng cách chọn kỹ năng cũ. Tạo lại để đề xuất đầy đủ kỹ năng trong JD.' : 'This roadmap uses the previous skill selection policy. Regenerate to include all relevant JD skills.'}</p>
            ) : <details className="mt-4 border-b border-border pb-4" open>
              <summary className="cursor-pointer text-sm">{isVietnamese ? `Đối chiếu ${path.skillStates.length} kỹ năng JD · ${path.nodes.length} nội dung học` : `${path.skillStates.length} JD skills reviewed · ${path.nodes.length} learning items`}</summary>
              <p className="mt-2 text-xs text-slate-600">{isVietnamese ? 'Đề xuất các kỹ năng JD chưa có trong hồ sơ hoặc bài đánh giá chưa đạt. Kỹ năng ưu tiên và lựa chọn thay thế không đồng nghĩa bắt buộc học tất cả.' : 'Recommend JD skills absent from the profile or below the assessment threshold. Optional skills and alternatives remain optional.'}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {path.skillStates.map((skill) => <li key={skill.skill}>
                  <span className="font-medium">{skill.skill}</span> · {isVietnamese ? ({ SATISFIED: 'Đạt ngưỡng bài đánh giá', MISSING: 'Đề xuất học', NEEDS_IMPROVEMENT: 'Cần cải thiện', DECLARED: 'Đã khai trong hồ sơ' })[skill.status] : skill.status}
                  {' · '}{isVietnamese ? skill.priority === 'REQUIRED' ? 'Bắt buộc' : skill.priority === 'OPTIONAL' ? 'Ưu tiên / tùy chọn' : 'Kỹ năng liên quan JD' : skill.priority}
                </li>)}
              </ul>
            </details>}
  </>;
}

export function PathView({ path, c, busy, onStatus }: { path: LearningPath; c: Copy; busy: boolean; onStatus: (nodeId: string, status: LearningPathNode['status']) => void }) {
  if (path.nodes.length === 0) return <><SkillEvidence path={path} /><p className="border-b border-border py-6 text-[15px] leading-7 text-slate-700">{c.pathEmpty}</p></>;
  const doneNodes = path.nodes.filter((n) => n.status === 'completed').length;
  return (
    <>
      <SkillEvidence path={path} />
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';
  const cvParam = searchParams.get('cvId') ?? '';
  const [jdOpen, setJdOpen] = useState(false);
  const historySessionId = searchParams.get('assessmentSessionId') ?? '';
  const [reviewOpen, setReviewOpen] = useState(!!historySessionId);
  const pastedSessionId = searchParams.get('pastedSessionId') ?? '';
  const [pasteSelected, setPastedMode] = useState(false);
  const selectedSessionId = historySessionId || pastedSessionId;
  const pastedMode = selectedSessionId ? !jobId : pasteSelected;
  const savedRoadmapId = pastedMode && selectedSessionId ? searchParams.get('roadmapId') ?? '' : '';
  const [pastedJd, setPastedJd] = useState('');
  const pastedValid = pastedJd.trim().length >= 30;
  const targetHint = pastedMode ? (isVietnamese ? 'Dán nội dung JD để bắt đầu.' : 'Paste the JD to get started.') : c.pickFirst;

  // Chỉ CV đã xác nhận (READY) mới dùng được cho bài đánh giá; không có CV thì ẩn ô chọn CV.
  const resumesQuery = useQuery({ queryKey: ['resumes'], queryFn: getResumes });
  const readyCvs = (resumesQuery.data ?? []).filter((r) => r.status === 'Ready');
  const cvsLoaded = !resumesQuery.isPending;
  const defaultCv = readyCvs.find((r) => r.isDefault) ?? readyCvs[0];
  const cvId = cvParam === 'none' ? '' : readyCvs.some((r) => r.id === cvParam) ? cvParam : (defaultCv?.id ?? '');

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: activity } = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity });
  const { data: job } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJobById(jobId), enabled: !!jobId });


  const proficiencyPreview = useMutation({ mutationFn: analyzeJdSkillProficiency });
  const previewIsCurrent = proficiencyPreview.variables === pastedJd.trim();
  const skillProficiency = pastedMode
    ? (previewIsCurrent ? proficiencyPreview.data : undefined)
    : job?.skillProficiencyAnalysis;

  const contextKey = pastedMode && selectedSessionId ? ['pasted-session', selectedSessionId] : pastedMode ? ['pasted', pastedJd] : [jobId];
  const testKey = ['jdAssessment', ...contextKey, cvId];
  const pathKey = pastedMode && selectedSessionId
    ? ['learningPath', 'pasted-session', selectedSessionId, savedRoadmapId]
    : ['learningPath', ...contextKey, cvId];
  const testQuery = useQuery({ queryKey: testKey, queryFn: () => getLatestJdAssessment(jobId, cvId), enabled: !selectedSessionId && !pastedMode && !!jobId && cvsLoaded });
  const canLoadPath = pastedMode ? !!selectedSessionId : !!jobId && cvsLoaded;
  const pathQuery = useQuery({
    queryKey: pathKey,
    queryFn: () => pastedMode ? getLearningPathForAssessment(selectedSessionId, savedRoadmapId) : getLatestLearningPath(jobId, cvId),
    enabled: canLoadPath,
  });
  const savedPaths = useQuery({ queryKey: ['learningPath', 'saved-pasted'], queryFn: listSavedPastedLearningPaths });
  const selectedSessionQuery = useQuery({
    queryKey: ['jdAssessment', 'session', selectedSessionId],
    queryFn: () => getJdAssessment(selectedSessionId),
    enabled: !!selectedSessionId,
    staleTime: Infinity,
  });
  const activeTestQuery = selectedSessionId ? selectedSessionQuery : testQuery;
  const session = activeTestQuery.data ?? null;
  const hasAssessmentTarget = pastedMode ? pastedValid || !!selectedSessionId : !!jobId;
  const path = pathQuery.data ?? null;
  const completedTest = session?.status === 'completed' ? session : null;

  const updateParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };
  const selectJob = (id: string) => {
    updateParams({ jobId: id, pastedSessionId: '', assessmentSessionId: '', roadmapId: '' });
    setJdOpen(false);
    setReviewOpen(false);
  };
  const selectCv = (id: string) => {
    updateParams({ cvId: id || 'none', pastedSessionId: '', assessmentSessionId: '', roadmapId: '' });
    setReviewOpen(false);
  };

  const editPastedJd = (value: string) => {
    setPastedJd(value);
    if (selectedSessionId) {
      setPastedMode(true);
      updateParams({ pastedSessionId: '', assessmentSessionId: '', roadmapId: '' });
    }
  };

  const startTest = useMutation({
    mutationFn: () => startJdAssessment(jobId, cvId || undefined, pastedMode ? { jdText: pastedJd.trim() } : undefined),
    onSuccess: (data) => {
      queryClient.setQueryData(testKey, data);
      queryClient.setQueryData(['jdAssessment', 'session', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['jdAssessments'] });
      setReviewOpen(false);
      // Làm bài trên trang riêng để tập trung.
      navigate(skillTestHref(data.id));
    },
  });
  const buildPath = useMutation({
    // CV đi theo bài đánh giá; không có bài thì chỉ lập theo JD.
    mutationFn: ({ request }: {
      request: Parameters<typeof createLearningPath>[0];
      key: string[];
      openedRoadmapId: string;
    }) => createLearningPath(request),
    onSuccess: (data, { key, openedRoadmapId }) => {
      queryClient.setQueryData(key, data);
      if (openedRoadmapId && openedRoadmapId === savedRoadmapId && key[2] === selectedSessionId) {
        updateParams({ roadmapId: '' });
      }
      void queryClient.invalidateQueries({ queryKey: ['learningPath', 'saved-pasted'] });
    },
  });
  const requestBuildPath = () => buildPath.mutate({
    request: { jobId: pastedMode ? undefined : jobId, assessmentId: completedTest?.id },
    key: savedRoadmapId ? ['learningPath', 'pasted-session', selectedSessionId, ''] : pathKey,
    openedRoadmapId: savedRoadmapId,
  });
  const nodeStatus = useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: LearningPathNode['status'] }) => setLearningNodeStatus(path!.id, nodeId, status),
    onSuccess: (data) => queryClient.setQueryData(pathKey, data),
  });

  // Quay về từ trang làm bài (#step-2 / #step-3): cuộn tới đúng phần khi dữ liệu đã tải.
  const { hash, key: locationKey } = useLocation();
  useEffect(() => {
    if (historySessionId) setReviewOpen(true);
  }, [historySessionId, locationKey]);
  const sectionsReady = !activeTestQuery.isLoading && !pathQuery.isLoading;
  useEffect(() => {
    if (!hash || !sectionsReady) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, locationKey, sectionsReady]);

  const weakSkills = completedTest?.skillScores.filter((s) => s.score < SKILL_PASS_SCORE).map((s) => s.skill) ?? [];
  const pathBeforeTest = !!path && !!completedTest?.submittedAt && new Date(path.createdAt) < new Date(completedTest.submittedAt);
  const busyAi = startTest.isPending || buildPath.isPending;
  // Lộ trình theo CV cần bài đánh giá dùng đúng CV đó (backend trả 409 nếu thiếu).
  const canBuildPath = !!completedTest || (!pastedMode && !cvId);
  const doneNodes = path?.nodes.filter((n) => n.status === 'completed').length ?? 0;
  const testPassed = !!completedTest && completedTest.score >= SKILL_PASS_SCORE;

  const summary = [
    { label: c.jobTitle, value: pastedMode ? (pastedValid ? (isVietnamese ? 'JD đã dán' : 'Pasted JD') : c.stepNone) : job?.title ?? c.stepNone, sub: pastedMode ? '' : job?.company ?? '', tone: '' },
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
    (pastedMode ? !pastedValid : !job || testQuery.isPending) || busyAi ? null : !session ? (
      <button type="button" onClick={() => startTest.mutate()} className={`${primaryButton} shrink-0`}>
        {c.testStart}
      </button>
    ) : completedTest ? (
      <button type="button" onClick={() => startTest.mutate()} className={`${primaryButton} shrink-0`}>
        {c.newTest}
      </button>
    ) : (
      <Link to={skillTestHref(session.id)} className={`${primaryButton} shrink-0`}>
        {c.continueTest}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    );

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
        <div role="tablist" aria-label={isVietnamese ? 'Nguồn JD' : 'JD source'} className="mt-5 inline-flex rounded-full border border-border p-1">
          {[
            { value: false, label: isVietnamese ? 'Tìm công việc' : 'Search jobs' },
            { value: true, label: isVietnamese ? 'Dán JD trực tiếp' : 'Paste a JD' },
          ].map((tab) => (
            <button
              key={String(tab.value)}
              type="button"
              role="tab"
              aria-selected={pastedMode === tab.value}
              disabled={busyAi}
              onClick={() => {
                setPastedMode(tab.value);
                if (tab.value !== pastedMode && selectedSessionId) updateParams({ pastedSessionId: '', assessmentSessionId: '', roadmapId: '' });
              }}
              className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${pastedMode === tab.value ? 'bg-ink text-white' : 'text-slate-700 hover:text-ink'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-slate-500">
          {pastedMode
            ? isVietnamese ? 'Chưa có tin trong hệ thống? Dán nội dung JD từ TopCV, ITviec, LinkedIn… vào đây.' : 'Job not in the catalogue? Paste the JD from TopCV, ITviec, LinkedIn…'
            : isVietnamese ? 'Gõ tên vị trí, công ty hoặc kỹ năng để tìm. Không thấy công việc thì chuyển sang “Dán JD trực tiếp”.' : 'Type a role, company or skill. Not found? Switch to “Paste a JD”.'}
        </p>
        {pastedMode && <div className="mt-4 space-y-4">
          <label className="block text-[12px] text-slate-500">{isVietnamese ? 'Nội dung JD (30–50.000 ký tự)' : 'JD text (30–50,000 characters)'}
            <textarea value={pastedJd} maxLength={50000} rows={8} disabled={busyAi} placeholder={isVietnamese ? 'Dán phần mô tả công việc và yêu cầu ứng viên…' : 'Paste the job description and requirements…'} onChange={(event) => editPastedJd(event.target.value)} className="mt-1 block w-full rounded-xl border border-border bg-transparent p-3 text-sm text-ink outline-none focus:border-ink" />
            <span className="mt-1 block text-right tabular-nums">{pastedJd.trim().length.toLocaleString()} / 50.000</span>
          </label>
        </div>}
        <div className="grid items-end gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-6 pt-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_auto]">
          {!pastedMode && <div className="min-w-0">
            <p className="text-[12px] text-slate-500">{c.jobLabel}</p>
            <div className="mt-1">
              {jobsQuery.isPending ? (
                <p className="py-2 text-sm text-slate-500">…</p>
              ) : (
                <JobPicker jobs={jobsQuery.data ?? []} selectedId={jobId} activity={activity} onSelect={selectJob} c={pickerCopy} label={c.jobLabel} />
              )}
            </div>
          </div>}
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

        {!pastedMode && job ? (
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
        ) : !hasAssessmentTarget ? (
          <p className="mt-4 text-[13px] text-slate-500">{targetHint}</p>
        ) : null}

        {!pastedMode && jdOpen && job && (
          <div className="mt-5 border-t border-border">
            <JobDescription job={job} moreLabel={c.moreJd} lessLabel={c.lessJd} />
          </div>
        )}
      </Section>

      <Section
        id="step-proficiency"
        index="02"
        title={isVietnamese ? 'Mức kỹ năng JD yêu cầu' : 'Required skill proficiency'}
      >
        {pastedMode && pastedValid && (
          <div className="py-3">
            <button
              type="button"
              disabled={proficiencyPreview.isPending}
              onClick={() => proficiencyPreview.mutate(pastedJd.trim())}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {proficiencyPreview.isPending
                ? (isVietnamese ? 'Đang phân tích…' : 'Analyzing…')
                : (isVietnamese ? 'Phân tích mức kỹ năng bằng AI' : 'Analyze skill proficiency with AI')}
            </button>
            {previewIsCurrent && proficiencyPreview.isError && (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                {authErrorMessage(proficiencyPreview.error, isVietnamese ? 'Không phân tích được JD.' : 'Could not analyze the JD.')}
              </p>
            )}
          </div>
        )}
        {!hasAssessmentTarget ? (
          <Muted>{targetHint}</Muted>
        ) : !pastedMode && !job ? (
          <Loading />
        ) : !skillProficiency?.results.length ? (
          <Muted>{isVietnamese ? 'Chưa có kết quả phân tích mức kỹ năng.' : 'No skill proficiency analysis is available yet.'}</Muted>
        ) : (
          <ul className="divide-y divide-border">
            {skillProficiency.results.map((skill) => (
              <li key={skill.skill_id} className="py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <strong>{skill.skill_name}</strong>
                  <span>{skill.required_level === null
                    ? (isVietnamese ? 'Chưa đủ bằng chứng' : 'Insufficient evidence')
                    : `${skill.required_level}/4 · ${skill.level_label}`}</span>
                </div>
                <p className="mt-1 text-slate-600"><q>{skill.evidence}</q></p>
                <p className="mt-1 text-slate-600">{skill.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 03 Bài đánh giá / kết quả */}
      <Section
        id="step-2"
        index="03"
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
        {!hasAssessmentTarget ? (
          <Muted>{targetHint}</Muted>
        ) : activeTestQuery.isLoading ? (
          <Loading />
        ) : activeTestQuery.isError ? (
          <ErrorLine error={activeTestQuery.error} c={c} />
        ) : startTest.isPending ? (
          <Working text={c.testCreating} />
        ) : !session ? (
          <div className="border-b border-border py-6">
            <p className="max-w-xl text-[15px] leading-7 text-ink">{c.testIntro}</p>
            <p className="mt-1 text-[13px] text-slate-500">{c.testCost}</p>
          </div>
        ) : session.status === 'in_progress' ? (
          <OpenTest session={session} c={c} />
        ) : (
          <AssessmentResult key={session.id} session={session} c={c} vi={isVietnamese} reviewOpen={reviewOpen} />
        )}
        <ErrorLine error={startTest.error} c={c} />
      </Section>

      {/* 03 Lộ trình học */}
      <Section
        id="step-3"
        index="04"
        title={c.pathTitle}
        action={
          path && !busyAi && canBuildPath ? (
            <button type="button" onClick={requestBuildPath} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
              {c.pathRebuild}
            </button>
          ) : undefined
        }
      >
        {!hasAssessmentTarget ? (
          <Muted>{targetHint}</Muted>
        ) : canLoadPath && pathQuery.isPending ? (
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
              {canBuildPath && <p className="mt-1 text-[13px] text-slate-500">
                {isVietnamese ? 'Tạo lộ trình cần gói AI trả phí hoặc đủ token đã mua.' : 'Creating a path requires a paid AI plan or enough purchased tokens.'}
              </p>}
            </div>
            {completedTest ? (
              <button type="button" onClick={requestBuildPath} disabled={busyAi} className={`${primaryButton} shrink-0`}>
                {c.pathCreate}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              canBuildPath && (
                <button type="button" onClick={requestBuildPath} disabled={busyAi} className={`${textLink} shrink-0 text-[13px] text-slate-600`}>
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
        <RoadmapBuildError error={buildPath.error} c={c} vi={isVietnamese} />
        <ErrorLine error={nodeStatus.error} c={c} />
      </Section>

      <Section id="saved-pasted-paths" index="05" title={isVietnamese ? 'Lộ trình đã lưu từ JD dán' : 'Saved paths from pasted JDs'}>
        {savedPaths.isPending ? <Loading /> : savedPaths.isError ? <ErrorLine error={savedPaths.error} c={c} /> :
          savedPaths.data.length === 0 ? <Muted>{isVietnamese ? 'Chưa có lộ trình đã lưu.' : 'No saved paths yet.'}</Muted> : (
            <ul className="pt-4">
              {savedPaths.data.map(({ id, assessmentId, title, createdAt }) => (
                <li key={id} className="flex flex-wrap justify-between gap-2 border-b border-border py-3 text-sm">
                  <Link to={`/candidate/skill-assessment?${new URLSearchParams({ pastedSessionId: assessmentId, roadmapId: id })}#step-3`} className={textLink}>
                    {title}
                  </Link>
                  <time dateTime={createdAt} className="text-slate-500">
                    {new Date(createdAt).toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-GB')}
                  </time>
                </li>
              ))}
            </ul>
          )}
      </Section>

      {/* 05 Lịch sử, nhóm theo tiêu đề */}
      <Section id="step-history" index="06" title={isVietnamese ? 'Lịch sử chuẩn bị phỏng vấn' : 'Preparation history'}>
        <AssessmentHistory
          vi={isVietnamese}
          onOpen={(item) => {
            setPastedMode(false);
            updateParams({ jobId: item.jobId, cvId: item.resumeId || 'none', pastedSessionId: '', assessmentSessionId: '', roadmapId: '' });
            setReviewOpen(false);
            document.getElementById('step-1')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </Section>

      {!pastedMode && job && (
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
