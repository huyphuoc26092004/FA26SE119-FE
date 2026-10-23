import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, Loader2, Search } from 'lucide-react';
import { getLearningResources } from '../../mocks/services/mockService';
import {
  analyzeJourneyGap,
  createSkillJourney,
  generateJourneyRoadmap,
  getAssessableJobs,
  getSkillJourney,
  listSkillJourneys,
  resetSkillJourney,
  submitSkillTest,
  togglePhaseDone,
} from '../../services/skillJourneyService';
import type {
  JourneyPhase,
  PhaseKind,
  Readiness,
  SkillImportance,
  SkillJourney,
  SkillStatus,
  SkillTest,
  SkillTestResult,
} from '../../services/skillJourneyService';
import type { Job } from '../../types/domain';
import type { AssessmentQuestion, LearningResource } from '../../types/assessment';
import { Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';

// ─── Types ──────────────────────────────────────────────────────────────────

type View = 'auto' | 'jobs' | 'tests' | 'quiz' | 'testResult' | 'gap' | 'roadmap';
type StepId = 'jobs' | 'tests' | 'gap' | 'roadmap';

const PASS_MARK = 65;

// ─── Page copy (page-only strings, no new i18n keys) ─────────────────────────

const copy = {
  vi: {
    crumbGroup: 'Công cụ nghề nghiệp',
    pageName: 'Đánh giá kỹ năng',
    headline: 'Đánh giá kỹ năng.',
    headlineAccent: 'Theo đúng việc bạn ứng tuyển.',
    intro:
      'Chọn một công việc bạn đã ứng tuyển. Hệ thống đọc JD, tạo bài test cho từng kỹ năng được yêu cầu, chấm điểm, chỉ ra khoảng trống và lập lộ trình học để bạn sẵn sàng cho vòng phỏng vấn.',
    steps: {
      jobs: ['Chọn công việc', 'Đọc JD và trích xuất kỹ năng yêu cầu.'],
      tests: ['Làm bài đánh giá', 'Mỗi kỹ năng một bài test ngắn, có giải thích.'],
      gap: ['Phân tích khoảng trống', 'So sánh điểm của bạn với mức JD yêu cầu.'],
      roadmap: ['Lộ trình học', 'Các giai đoạn học kèm tài liệu và mốc kiểm tra.'],
    } as Record<StepId, [string, string]>,
    appliedTitle: 'Việc bạn đã ứng tuyển',
    appliedNote: 'Bài đánh giá được tạo riêng theo JD của từng công việc.',
    noApplied: 'Bạn chưa ứng tuyển công việc nào. Hãy ứng tuyển ở mục Khám phá việc làm, hoặc thử ngay với một việc phù hợp bên dưới.',
    goJobs: 'Khám phá việc làm',
    othersTitle: 'Việc phù hợp khác',
    othersNote: 'Bạn có thể đánh giá trước khi ứng tuyển.',
    savedTitle: 'Việc bạn đã lưu',
    savedNote: 'Kiểm tra kỹ năng trước khi ứng tuyển những việc này.',
    skillsCount: (n: number) => `${n} kỹ năng`,
    statusNew: 'Chưa đánh giá',
    statusTests: (done: number, total: number) => `Đã làm ${done}/${total} bài`,
    statusGap: (score: number) => `Phù hợp ${score}%`,
    start: 'Bắt đầu',
    resume: 'Tiếp tục',
    readingHead: 'Đang đọc JD.',
    readingSteps: ['Đọc mô tả công việc và yêu cầu', 'Trích xuất kỹ năng và mức độ quan trọng', 'Tạo bài test cho từng kỹ năng'],
    stepDone: 'Xong',
    stepNow: 'Đang làm',
    otherJob: 'Chọn công việc khác',
    testsHeadAccent: (tests: number, skills: number) => `${tests} bài test cho ${skills} kỹ năng.`,
    jdSkillsTitle: 'Kỹ năng trong JD',
    jdSkillsNote: 'Thứ tự trong JD được dùng để xác định mức độ quan trọng.',
    viaTest: (name: string) => `Bài test ${name}`,
    viaProfile: 'Ước tính từ hồ sơ',
    testsTitle: 'Bộ bài đánh giá',
    testsProgress: (done: number, total: number) => `${done}/${total} hoàn thành`,
    testMeta: (q: number, m: number) => `${q} câu · khoảng ${m} phút`,
    covers: 'Kỹ năng',
    takeTest: 'Làm bài',
    retake: 'Làm lại',
    testsCtaDone: (done: number, total: number) =>
      done === total ? 'Bạn đã làm đủ các bài. Xem khoảng trống so với JD.' : `Đã xong ${done}/${total} bài. Bài chưa làm sẽ được ước tính từ hồ sơ.`,
    testsCtaNone: 'Làm ít nhất một bài để phân tích khoảng trống.',
    analyze: 'Phân tích khoảng trống',
    viewGap: 'Xem khoảng trống',
    restart: 'Làm lại từ đầu',
    backToTests: 'Quay lại bộ bài đánh giá',
    questionLine: (cur: number, total: number) => `Câu ${cur} / ${total}.`,
    answered: (n: number, total: number) => `Đã trả lời ${n}/${total}`,
    remaining: (n: number) => `Còn ${n} câu`,
    allAnswered: 'Đã trả lời tất cả',
    elapsed: 'Thời gian',
    questionsLabel: 'Danh sách câu hỏi',
    legendCurrent: 'Đang xem',
    legendDone: 'Đã trả lời',
    legendTodo: 'Chưa trả lời',
    submitHint: 'Trả lời đủ tất cả câu để nộp bài.',
    resultHead: (s: number) => `Kết quả ${s}%.`,
    passLine: (name: string) => `${name} · Đạt yêu cầu.`,
    failLine: (name: string) => `${name} · Chưa đạt.`,
    scoreLabel: 'Điểm bài test',
    passMarkLabel: 'Điểm đạt',
    correctLabel: 'Số câu đúng',
    timeLabel: 'Thời gian làm bài',
    coversLabel: 'Kỹ năng trong JD',
    strongTopics: 'Làm tốt',
    weakTopics: 'Cần ôn lại',
    noItems: 'Không có mục nào.',
    reviewTitle: 'Xem lại câu hỏi',
    reviewAll: 'Tất cả',
    reviewWrong: 'Sai',
    reviewRight: 'Đúng',
    yourAnswer: 'Bạn chọn',
    correctAnswer: 'Đáp án đúng',
    noAnswer: 'Không trả lời',
    nextTest: (name: string) => `Bài tiếp theo: ${name}`,
    analyzingHead: 'Đang phân tích.',
    analyzingSteps: ['Tổng hợp điểm các bài test', 'Đối chiếu với mức yêu cầu của JD', 'Ước tính kỹ năng chưa có bài test từ hồ sơ'],
    fitHead: (s: number) => `Phù hợp ${s}%.`,
    readiness: {
      ready: 'Sẵn sàng ứng tuyển.',
      near: 'Gần sẵn sàng.',
      developing: 'Cần bổ sung vài kỹ năng.',
      early: 'Còn nhiều khoảng trống.',
    } as Record<Readiness, string>,
    gapIntro: (tests: number, job: string, company: string) =>
      `Dựa trên ${tests} bài test và hồ sơ của bạn, so với JD ${job} tại ${company}.`,
    fitLabel: 'Mức phù hợp với JD',
    metSkills: 'Kỹ năng đạt yêu cầu',
    keyGaps: 'Khoảng trống quan trọng',
    weeks: 'Thời gian ước tính',
    weeksValue: (n: number) => (n === 0 ? 'Không cần' : `${n} tuần`),
    breakdownTitle: 'Mức độ theo từng kỹ năng',
    breakdownNote: 'Vạch đứng là mức JD yêu cầu.',
    all: 'Tất cả',
    sourceTest: 'Bài test',
    sourceProfile: 'Hồ sơ',
    priorityTitle: 'Ưu tiên lấp trước',
    priorityNote: 'Kỹ năng bắt buộc hoặc quan trọng đang thấp hơn mức yêu cầu.',
    noPriority: 'Không có khoảng trống quan trọng. Bạn có thể tập trung củng cố và chuẩn bị phỏng vấn.',
    gapPoints: (n: number) => `Thiếu ${n} điểm`,
    retakeTest: 'Làm lại bài test',
    planTitle: 'Việc nên làm tiếp',
    planBridge: (names: string) => `Dành 3–5 giờ mỗi tuần cho ${names} trước khi phỏng vấn.`,
    planWeak: (topics: string) => `Ôn lại các chủ đề bạn làm sai: ${topics}.`,
    planProfile: (names: string) => `Tự kiểm tra thêm ${names} vì kỹ năng này chưa có bài test, điểm hiện đang ước tính từ hồ sơ.`,
    planStrong: 'Giữ phong độ ở các kỹ năng đã đạt và thêm ví dụ định lượng vào CV.',
    planCv: 'Cập nhật CV với kỹ năng mới rồi chạy lại phân tích Fit CV–Job.',
    gapCta: 'Biến khoảng trống thành kế hoạch học theo tuần.',
    makeRoadmap: 'Tạo lộ trình học',
    viewRoadmap: 'Xem lộ trình học',
    reanalyze: 'Phân tích lại',
    buildingHead: 'Đang lập lộ trình.',
    buildingSteps: ['Nhóm kỹ năng theo mức ưu tiên', 'Chia giai đoạn và ước tính số tuần', 'Chọn tài liệu phù hợp cho từng giai đoạn'],
    roadmapHead: (w: number) => `Lộ trình ${w} tuần.`,
    roadmapAccent: (job: string) => `Đến ${job}.`,
    roadmapIntro: (n: number) => `${n} giai đoạn. Đánh dấu hoàn thành sau mỗi giai đoạn và làm lại bài test để cập nhật khoảng trống.`,
    progressLabel: 'Tiến độ',
    phasesDone: (d: number, t: number) => `${d}/${t} giai đoạn`,
    phasesTitle: 'Các giai đoạn',
    weekRange: (a: number, b: number) => (a === b ? `Tuần ${a}` : `Tuần ${a}–${b}`),
    phase: {
      bridge: {
        title: 'Lấp khoảng trống quan trọng',
        goal: 'Tập trung vào các kỹ năng bắt buộc còn thiếu trong JD.',
        milestone: 'Làm lại bài test của các kỹ năng này và đạt từ 80%.',
      },
      strengthen: {
        title: 'Củng cố kỹ năng gần đạt',
        goal: 'Nâng các kỹ năng bạn đã có lên đúng mức JD yêu cầu.',
        milestone: 'Có một ví dụ thực tế cho mỗi kỹ năng để kể trong phỏng vấn.',
      },
      practice: {
        title: 'Dự án thực hành và ôn tập',
        goal: 'Ghép các kỹ năng chính vào một dự án nhỏ giống bài toán của công ty.',
        milestone: 'Hoàn thành dự án demo và cập nhật CV trước vòng phỏng vấn.',
      },
    } as Record<PhaseKind, { title: string; goal: string; milestone: string }>,
    milestone: 'Mốc kiểm tra',
    skillsLabel: 'Kỹ năng',
    resources: (n: number) => `Tài liệu (${n})`,
    noResources: 'Chưa có tài liệu gợi ý cho giai đoạn này. Xem thư viện bên dưới.',
    markDone: 'Đánh dấu hoàn thành',
    markUndone: 'Bỏ đánh dấu',
    doneLabel: 'Đã hoàn thành',
    libraryTitle: 'Thư viện tài liệu',
    libraryNote: 'Tìm thêm tài liệu theo kỹ năng hoặc loại.',
    searchPlaceholder: 'Tìm theo kỹ năng hoặc tên tài liệu',
    noMatch: 'Không có tài liệu phù hợp.',
    roadmapCta: 'Học xong một giai đoạn? Làm lại bài test để xem khoảng trống đã thu hẹp chưa.',
    askAssistant: 'Hỏi trợ lý nghề nghiệp',
    backToTestsCta: 'Làm lại bài đánh giá',
    minutes: (m: number) => `${m} phút`,
    loadError: 'Không tải được dữ liệu. Vui lòng thử lại.',
    importance: { critical: 'Bắt buộc', high: 'Quan trọng', medium: 'Nên có' } as Record<SkillImportance, string>,
    status: { strong: 'Đạt yêu cầu', present: 'Gần đạt', gap: 'Còn thiếu', missing: 'Chưa có' } as Record<SkillStatus, string>,
  },
  en: {
    crumbGroup: 'Career tools',
    pageName: 'Skill assessment',
    headline: 'Skill assessment.',
    headlineAccent: 'Built from the jobs you applied for.',
    intro:
      'Pick a job you applied for. The system reads the JD, creates a test for each required skill, scores it, shows your gaps and builds a learning plan so you are ready for the interview.',
    steps: {
      jobs: ['Choose a job', 'Read the JD and extract required skills.'],
      tests: ['Take the tests', 'One short test per skill, with explanations.'],
      gap: ['Gap analysis', 'Compare your scores with the level the JD asks for.'],
      roadmap: ['Learning roadmap', 'Phased learning with resources and checkpoints.'],
    } as Record<StepId, [string, string]>,
    appliedTitle: 'Jobs you applied for',
    appliedNote: 'Each assessment is generated from that job’s description.',
    noApplied: 'You have not applied for any job yet. Apply from Job discovery, or try one of the matching jobs below.',
    goJobs: 'Job discovery',
    othersTitle: 'Other matching jobs',
    othersNote: 'You can assess yourself before applying.',
    savedTitle: 'Jobs you saved',
    savedNote: 'Check your skills before you apply for them.',
    skillsCount: (n: number) => `${n} skills`,
    statusNew: 'Not assessed',
    statusTests: (done: number, total: number) => `${done}/${total} tests done`,
    statusGap: (score: number) => `${score}% fit`,
    start: 'Start',
    resume: 'Continue',
    readingHead: 'Reading the JD.',
    readingSteps: ['Reading the description and requirements', 'Extracting skills and their importance', 'Generating a test for each skill'],
    stepDone: 'Done',
    stepNow: 'Working',
    otherJob: 'Choose another job',
    testsHeadAccent: (tests: number, skills: number) => `${tests} tests for ${skills} skills.`,
    jdSkillsTitle: 'Skills in the JD',
    jdSkillsNote: 'Order in the JD is used to set how important each skill is.',
    viaTest: (name: string) => `${name} test`,
    viaProfile: 'Estimated from profile',
    testsTitle: 'Your tests',
    testsProgress: (done: number, total: number) => `${done}/${total} completed`,
    testMeta: (q: number, m: number) => `${q} questions · about ${m} min`,
    covers: 'Skills',
    takeTest: 'Take test',
    retake: 'Retake',
    testsCtaDone: (done: number, total: number) =>
      done === total ? 'All tests done. See your gaps against the JD.' : `${done}/${total} tests done. Untested skills are estimated from your profile.`,
    testsCtaNone: 'Finish at least one test to run the gap analysis.',
    analyze: 'Analyse gaps',
    viewGap: 'View gaps',
    restart: 'Start over',
    backToTests: 'Back to your tests',
    questionLine: (cur: number, total: number) => `Question ${cur} of ${total}.`,
    answered: (n: number, total: number) => `${n}/${total} answered`,
    remaining: (n: number) => `${n} remaining`,
    allAnswered: 'All answered',
    elapsed: 'Time',
    questionsLabel: 'Questions',
    legendCurrent: 'Current',
    legendDone: 'Answered',
    legendTodo: 'Not answered',
    submitHint: 'Answer every question to submit.',
    resultHead: (s: number) => `You scored ${s}%.`,
    passLine: (name: string) => `${name} · Meets the bar.`,
    failLine: (name: string) => `${name} · Below the bar.`,
    scoreLabel: 'Test score',
    passMarkLabel: 'Pass mark',
    correctLabel: 'Correct answers',
    timeLabel: 'Time taken',
    coversLabel: 'JD skills',
    strongTopics: 'Done well',
    weakTopics: 'Review again',
    noItems: 'Nothing to show.',
    reviewTitle: 'Question review',
    reviewAll: 'All',
    reviewWrong: 'Incorrect',
    reviewRight: 'Correct',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    noAnswer: 'No answer',
    nextTest: (name: string) => `Next test: ${name}`,
    analyzingHead: 'Analysing.',
    analyzingSteps: ['Combining your test scores', 'Comparing with the levels the JD asks for', 'Estimating untested skills from your profile'],
    fitHead: (s: number) => `${s}% fit.`,
    readiness: {
      ready: 'Ready to apply.',
      near: 'Nearly ready.',
      developing: 'A few skills to build.',
      early: 'Still a lot to close.',
    } as Record<Readiness, string>,
    gapIntro: (tests: number, job: string, company: string) =>
      `Based on ${tests} ${tests === 1 ? 'test' : 'tests'} and your profile, against the ${job} JD at ${company}.`,
    fitLabel: 'Fit with the JD',
    metSkills: 'Skills at the required level',
    keyGaps: 'Important gaps',
    weeks: 'Estimated time',
    weeksValue: (n: number) => (n === 0 ? 'None' : `${n} ${n === 1 ? 'week' : 'weeks'}`),
    breakdownTitle: 'Level per skill',
    breakdownNote: 'The vertical tick marks the level the JD asks for.',
    all: 'All',
    sourceTest: 'Test',
    sourceProfile: 'Profile',
    priorityTitle: 'Close these first',
    priorityNote: 'Required or important skills currently below the bar.',
    noPriority: 'No important gaps. Focus on polishing and interview prep.',
    gapPoints: (n: number) => `${n} points short`,
    retakeTest: 'Retake test',
    planTitle: 'What to do next',
    planBridge: (names: string) => `Spend 3–5 hours a week on ${names} before the interview.`,
    planWeak: (topics: string) => `Review the topics you missed: ${topics}.`,
    planProfile: (names: string) => `Check ${names} yourself; there is no test for it yet, so the level is estimated from your profile.`,
    planStrong: 'Keep your strong skills sharp and add measurable examples to your CV.',
    planCv: 'Update your CV with new skills, then rerun the CV–Job fit analysis.',
    gapCta: 'Turn these gaps into a week-by-week plan.',
    makeRoadmap: 'Build learning roadmap',
    viewRoadmap: 'View roadmap',
    reanalyze: 'Analyse again',
    buildingHead: 'Building your roadmap.',
    buildingSteps: ['Grouping skills by priority', 'Splitting into phases and estimating weeks', 'Picking resources for each phase'],
    roadmapHead: (w: number) => `${w}-week roadmap.`,
    roadmapAccent: (job: string) => `Towards ${job}.`,
    roadmapIntro: (n: number) => `${n} phases. Mark each one done and retake the tests to update your gaps.`,
    progressLabel: 'Progress',
    phasesDone: (d: number, t: number) => `${d}/${t} phases`,
    phasesTitle: 'Phases',
    weekRange: (a: number, b: number) => (a === b ? `Week ${a}` : `Weeks ${a}–${b}`),
    phase: {
      bridge: {
        title: 'Close the important gaps',
        goal: 'Focus on the required skills you are missing for this JD.',
        milestone: 'Retake these tests and score 80% or more.',
      },
      strengthen: {
        title: 'Strengthen near-ready skills',
        goal: 'Bring the skills you already have up to the level the JD asks for.',
        milestone: 'Have one real example per skill to tell in the interview.',
      },
      practice: {
        title: 'Practice project and review',
        goal: 'Combine the key skills in a small project close to the company’s problems.',
        milestone: 'Finish the demo project and update your CV before the interview.',
      },
    } as Record<PhaseKind, { title: string; goal: string; milestone: string }>,
    milestone: 'Checkpoint',
    skillsLabel: 'Skills',
    resources: (n: number) => `Resources (${n})`,
    noResources: 'No suggested resources for this phase yet. See the library below.',
    markDone: 'Mark as done',
    markUndone: 'Undo',
    doneLabel: 'Done',
    libraryTitle: 'Resource library',
    libraryNote: 'Find more by skill or type.',
    searchPlaceholder: 'Search by skill or title',
    noMatch: 'No matching resources.',
    roadmapCta: 'Finished a phase? Retake the tests to see whether your gaps have closed.',
    askAssistant: 'Ask the career assistant',
    backToTestsCta: 'Retake the assessment',
    minutes: (m: number) => `${m} min`,
    loadError: 'Could not load data. Please try again.',
    importance: { critical: 'Required', high: 'Important', medium: 'Nice to have' } as Record<SkillImportance, string>,
    status: { strong: 'Meets the bar', present: 'Almost there', gap: 'Gap', missing: 'Missing' } as Record<SkillStatus, string>,
  },
};

type Copy = typeof copy.vi;

// ─── Shared styles ──────────────────────────────────────────────────────────

const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const sectionGap = 'mt-[clamp(3rem,6vw,4.5rem)]';
const pageWrap = 'pb-[clamp(3rem,6vw,5rem)]';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function statusTone(status: SkillStatus) {
  if (status === 'strong') return 'text-brand';
  if (status === 'present') return 'text-ink';
  if (status === 'gap') return 'text-warning';
  return 'text-danger';
}

function difficultyLabel(diff: AssessmentQuestion['difficulty'], t: (k: string) => string) {
  if (diff === 'beginner') return t('skillAssessment.diffBeginner');
  if (diff === 'intermediate') return t('skillAssessment.diffIntermediate');
  return t('skillAssessment.diffAdvanced');
}

function resourceTypeKey(type: LearningResource['type']): string {
  const map: Record<string, string> = {
    course: 'typeCourse',
    docs: 'typeDocs',
    book: 'typeBook',
    article: 'typeArticle',
    video: 'typeVideo',
    certification: 'typeCertification',
    practice: 'typePractice',
  };
  return map[type] ?? 'typeCourse';
}

/** Furthest step a journey has reached. */
function furthestView(j: SkillJourney): View {
  if (j.roadmap) return 'roadmap';
  if (j.gap) return 'gap';
  return 'tests';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ─── Building blocks ────────────────────────────────────────────────────────

function SectionHead({ index, title, note, action }: { index: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="border-b border-ink pb-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="flex items-baseline gap-3 text-[clamp(1.25rem,2vw,1.625rem)] font-normal tracking-[-0.01em] text-ink">
          <span className="text-xs tabular-nums tracking-normal text-slate-500">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      {note && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-600">{note}</p>}
    </div>
  );
}

function Headline({ line1, line2, intro, eyebrow }: { line1: string; line2: string; intro?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
      {eyebrow && <p className="mb-3 text-[13px] text-brand">{eyebrow}</p>}
      <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
        {line1}
        <span className="block text-brand">{line2}</span>
      </h1>
      {intro && (
        <p className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-[40rem] text-[clamp(1rem,1.3vw,1.125rem)] leading-8 text-slate-600">
          {intro}
        </p>
      )}
    </header>
  );
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${textLink} text-[13px] text-slate-600 hover:text-ink`}>
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </button>
  );
}

/** 01–04 progress row across the whole flow. */
function Stepper({
  c,
  current,
  reachable,
  onGo,
}: {
  c: Copy;
  current: StepId;
  reachable: Record<StepId, boolean>;
  onGo: (step: StepId) => void;
}) {
  const order: StepId[] = ['jobs', 'tests', 'gap', 'roadmap'];
  const currentIndex = order.indexOf(current);
  return (
    <nav aria-label={c.pageName} className="mt-[clamp(2rem,4vw,2.75rem)]">
      <ol className="grid grid-cols-2 border-t border-slate-400 sm:grid-cols-4">
        {order.map((id, i) => {
          const isCurrent = id === current;
          const isPast = i < currentIndex;
          const canGo = reachable[id] && !isCurrent;
          return (
            <li key={id} className={`border-b border-border ${i % 2 === 1 ? 'border-l pl-4' : ''} ${i === 2 ? 'sm:border-l sm:pl-4' : ''} sm:border-b-0`}>
              <button
                type="button"
                disabled={!canGo}
                onClick={() => onGo(id)}
                aria-current={isCurrent ? 'step' : undefined}
                className="group relative w-full py-4 pr-3 text-left cursor-pointer disabled:cursor-default"
              >
                {isCurrent && <span aria-hidden="true" className="absolute inset-x-0 -top-px h-[2px] bg-ink" />}
                <span className={`text-xs tabular-nums ${isCurrent ? 'text-ink' : isPast ? 'text-brand' : 'text-slate-500'}`}>
                  {pad2(i + 1)}
                </span>
                <span
                  className={`mt-1 block text-[15px] transition-colors ${
                    isCurrent ? 'text-ink' : reachable[id] ? 'text-slate-700 group-hover:text-brand' : 'text-slate-400'
                  }`}
                >
                  {c.steps[id][0]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Animated "working" rows used while the mock AI runs. */
function WorkingSteps({ steps, intervalMs = 500 }: { steps: string[]; intervalMs?: number }) {
  const { isVietnamese } = useTranslation();
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), intervalMs);
    return () => clearInterval(id);
  }, [steps.length, intervalMs]);
  const c = isVietnamese ? copy.vi : copy.en;
  return (
    <section className="mt-[clamp(2rem,4vw,2.75rem)] max-w-3xl" role="status" aria-live="polite">
      <div className="h-[2px] w-full bg-slate-200">
        <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-2">
        {steps.map((label, i) => {
          const isDone = i < active;
          const isCurrent = i === active;
          return (
            <li
              key={label}
              className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-4 transition-opacity ${
                !isDone && !isCurrent ? 'opacity-45' : ''
              }`}
            >
              <span className="text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
              <span className={`text-[15px] leading-7 ${isCurrent ? 'text-ink' : 'text-slate-700'}`}>{label}</span>
              <span className="text-[13px]">
                {isDone ? (
                  <span className="text-brand">{c.stepDone}</span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-ink">
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                    {c.stepNow}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Thin bar with a vertical tick at a target value. */
function LevelBar({ value, target, tone }: { value: number; target: number; tone: string }) {
  return (
    <div className="relative h-[2px] w-full bg-slate-200">
      <div className={`h-full transition-[width] duration-500 ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      <span aria-hidden="true" className="absolute -top-1.5 h-[14px] w-px bg-ink" style={{ left: `${target}%` }} />
    </div>
  );
}

function StatList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 text-sm">
          <dt className="text-slate-600">{row.label}</dt>
          <dd className="text-right tabular-nums text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Job row ────────────────────────────────────────────────────────────────

function JobRow({
  job,
  index,
  journey,
  c,
  onStart,
  disabled,
}: {
  job: Job;
  index: number;
  journey?: SkillJourney;
  c: Copy;
  onStart: () => void;
  disabled: boolean;
}) {
  const done = journey ? Object.keys(journey.results).length : 0;
  const status = !journey
    ? c.statusNew
    : journey.gap
      ? c.statusGap(journey.gap.matchScore)
      : c.statusTests(done, journey.tests.length);
  return (
    <li className="border-b border-border">
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="group grid w-full grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 py-5 text-left cursor-pointer disabled:cursor-wait md:grid-cols-[2.25rem_minmax(0,1fr)_11rem_auto] md:items-baseline"
      >
        <span className="pt-1 text-xs tabular-nums text-slate-500">{pad2(index + 1)}</span>
        <span className="min-w-0">
          <span className="block text-[clamp(1.0625rem,1.5vw,1.25rem)] text-ink transition-colors group-hover:text-brand">{job.title}</span>
          <span className="mt-1 block text-[13px] text-slate-600">
            {job.company} · {job.location}
            {job.experienceLevel ? ` · ${job.experienceLevel}` : ''}
          </span>
          <span className="mt-1.5 block text-[12px] leading-5 text-slate-500">{job.skills.join(' · ')}</span>
        </span>
        <span
          className={`col-start-2 text-[13px] md:col-start-auto ${
            journey?.gap ? (journey.gap.matchScore >= 70 ? 'text-brand' : 'text-warning') : journey ? 'text-ink' : 'text-slate-500'
          }`}
        >
          {status}
        </span>
        <span className="col-start-2 inline-flex items-center gap-1 justify-self-start border-b border-current pb-px text-[13px] text-ink transition-colors group-hover:text-brand md:col-start-auto md:justify-self-end">
          {journey ? c.resume : c.start}
          <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </li>
  );
}

// ─── Quiz question ──────────────────────────────────────────────────────────

function QuizQuestion({
  question,
  questionNumber,
  selectedOptionId,
  onSelect,
}: {
  question: AssessmentQuestion;
  questionNumber: number;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-slate-600">
        <span className="tabular-nums text-ink">{pad2(questionNumber)}</span>
        <span>{difficultyLabel(question.difficulty, t)}</span>
        <span aria-hidden="true">·</span>
        <span>{question.topic}</span>
      </p>
      <h2 className="mt-3 max-w-[46rem] text-[clamp(1.25rem,2.2vw,1.75rem)] font-normal leading-[1.4] tracking-[-0.01em] text-ink">
        {question.text}
      </h2>
      <div role="radiogroup" aria-label={question.text} className="mt-[clamp(1.5rem,3vw,2.25rem)] border-t border-slate-400">
        {question.options.map((option, i) => {
          const selected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              id={`option-${question.id}-${option.id}`}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(option.id)}
              className={`group flex w-full items-start gap-4 border-b border-border py-4 pr-2 text-left transition-colors duration-150 cursor-pointer ${
                selected ? 'bg-brand-50/60' : 'hover:bg-slate-100/60'
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] transition-colors ${
                  selected ? 'border-brand bg-brand text-white' : 'border-slate-400 text-slate-600 group-hover:border-ink group-hover:text-ink'
                }`}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span className={`pt-0.5 text-[15px] leading-7 ${selected ? 'text-ink' : 'text-slate-700'}`}>{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Question review ────────────────────────────────────────────────────────

function QuestionReview({ test, result, c, index }: { test: SkillTest; result: SkillTestResult; c: Copy; index: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'wrong' | 'right'>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const items = test.questions
    .map((q, idx) => ({ q, idx, isCorrect: result.answers[q.id] === q.correctOptionId }))
    .filter(({ isCorrect }) => (filter === 'all' ? true : filter === 'wrong' ? !isCorrect : isCorrect));
  const filters = [
    { id: 'all' as const, label: c.reviewAll, count: result.total },
    { id: 'wrong' as const, label: c.reviewWrong, count: result.total - result.correct },
    { id: 'right' as const, label: c.reviewRight, count: result.correct },
  ];
  return (
    <section className={sectionGap}>
      <SectionHead
        index={index}
        title={c.reviewTitle}
        action={
          <div className="flex flex-wrap gap-x-5 gap-y-2" role="tablist">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`border-b pb-px text-[13px] transition-colors cursor-pointer ${
                  filter === f.id ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
                }`}
              >
                {f.label} <span className="tabular-nums text-slate-500">{f.count}</span>
              </button>
            ))}
          </div>
        }
      />
      <ol>
        {items.length === 0 && <li className="border-b border-border py-5 text-sm text-slate-500">{c.noItems}</li>}
        {items.map(({ q, idx, isCorrect }) => {
          const selected = q.options.find((o) => o.id === result.answers[q.id]);
          const correct = q.options.find((o) => o.id === q.correctOptionId);
          const expanded = open.has(q.id);
          return (
            <li key={q.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
              <span className="pt-0.5 text-xs tabular-nums text-slate-500">{pad2(idx + 1)}</span>
              <div className="min-w-0">
                <p className={`text-[12px] ${isCorrect ? 'text-brand' : 'text-danger'}`}>
                  {isCorrect ? t('skillAssessment.correct') : t('skillAssessment.incorrect')} · {difficultyLabel(q.difficulty, t)} · {q.topic}
                </p>
                <p className="mt-1.5 text-[15px] leading-7 text-ink">{q.text}</p>
                <dl className="mt-2 space-y-1 text-[13px] leading-6">
                  {!isCorrect && (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-slate-500">{c.yourAnswer}:</dt>
                      <dd className="text-danger line-through decoration-1">{selected?.text ?? c.noAnswer}</dd>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-slate-500">{c.correctAnswer}:</dt>
                    <dd className="text-ink">{correct?.text}</dd>
                  </div>
                </dl>
                {expanded && <p className="mt-3 max-w-[44rem] border-l border-brand pl-4 text-sm leading-7 text-slate-700">{q.explanation}</p>}
              </div>
              <div className="col-start-2 mt-3 sm:col-start-3 sm:mt-0">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(q.id)) next.delete(q.id);
                      else next.add(q.id);
                      return next;
                    })
                  }
                  className={`${textLink} whitespace-nowrap text-[13px] text-ink`}
                >
                  {expanded ? t('skillAssessment.hideExplanation') : t('skillAssessment.showExplanation')}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Roadmap phase ──────────────────────────────────────────────────────────

function PhaseRow({
  phase,
  index,
  c,
  onToggle,
  toggling,
}: {
  phase: JourneyPhase;
  index: number;
  c: Copy;
  onToggle: () => void;
  toggling: boolean;
}) {
  const [open, setOpen] = useState(index === 0);
  const text = c.phase[phase.kind];
  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-6 md:grid-cols-[3rem_9rem_minmax(0,1fr)]">
      <span className={`pt-1 text-xs tabular-nums ${phase.done ? 'text-brand' : 'text-slate-500'}`}>{pad2(index + 1)}</span>
      <span className="col-start-2 text-[13px] tabular-nums text-slate-600 md:col-start-auto md:pt-1">
        {c.weekRange(phase.startWeek, phase.endWeek)}
      </span>
      <div className="col-start-2 mt-1 min-w-0 md:col-start-auto md:mt-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className={`text-[clamp(1.125rem,1.6vw,1.375rem)] font-normal ${phase.done ? 'text-brand' : 'text-ink'}`}>
            {text.title}
            {phase.done && <span className="ml-3 text-[13px] text-brand">· {c.doneLabel}</span>}
          </h3>
          <button type="button" onClick={onToggle} disabled={toggling} className={`${textLink} text-[13px] text-ink`}>
            {phase.done ? c.markUndone : c.markDone}
          </button>
        </div>
        <p className="mt-1.5 max-w-[44rem] text-[15px] leading-7 text-slate-700">{text.goal}</p>
        <dl className="mt-3 space-y-1.5 text-[13px] leading-6">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-slate-500">{c.skillsLabel}:</dt>
            <dd className="text-ink">{phase.skills.join(' · ')}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-slate-500">{c.milestone}:</dt>
            <dd className="text-ink">{text.milestone}</dd>
          </div>
        </dl>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${textLink} mt-4 text-[13px] text-ink`}>
          {c.resources(phase.resources.length)}
        </button>
        {open &&
          (phase.resources.length === 0 ? (
            <p className="mt-3 text-[13px] text-slate-500">{c.noResources}</p>
          ) : (
            <ResourceList resources={phase.resources} className="mt-3" />
          ))}
      </div>
    </li>
  );
}

function ResourceList({ resources, className = '' }: { resources: LearningResource[]; className?: string }) {
  const { t } = useTranslation();
  return (
    <ul className={`border-t border-border ${className}`}>
      {resources.map((r) => (
        <li key={r.id}>
          <a
            id={`resource-${r.id}`}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border py-3"
          >
            <span className="min-w-0">
              <span className="block truncate text-[15px] text-ink transition-colors group-hover:text-brand">{r.title}</span>
              <span className="mt-0.5 block text-[12px] text-slate-500">
                {t(`learningRoadmap.${resourceTypeKey(r.type)}`)} · {r.provider} · {r.duration} ·{' '}
                <span className={r.isFree ? 'text-brand' : ''}>{r.isFree ? t('learningRoadmap.free') : t('learningRoadmap.paid')}</span> · {r.rating.toFixed(1)}
              </span>
            </span>
            <ArrowUpRight size={15} aria-hidden="true" className="text-slate-400 transition-colors group-hover:text-brand" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function ResourceLibrary({ c, index }: { c: Copy; index: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<LearningResource['type'] | 'all'>('all');
  const { data: resources = [], isPending } = useQuery({ queryKey: ['learningResources'], queryFn: () => getLearningResources() });
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter(
      (r) =>
        (type === 'all' || r.type === type) &&
        (!q || r.skill.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.tags.some((tag) => tag.includes(q)))
    );
  }, [resources, query, type]);
  const types: { id: LearningResource['type'] | 'all'; label: string }[] = [
    { id: 'all', label: c.all },
    { id: 'course', label: t('learningRoadmap.typeCourse') },
    { id: 'docs', label: t('learningRoadmap.typeDocs') },
    { id: 'book', label: t('learningRoadmap.typeBook') },
    { id: 'certification', label: t('learningRoadmap.typeCertification') },
  ];
  return (
    <section className={sectionGap}>
      <SectionHead index={index} title={c.libraryTitle} note={c.libraryNote} action={<span className="text-[13px] tabular-nums text-slate-600">{filtered.length}</span>} />
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="relative block w-full md:max-w-sm">
          <Search size={14} aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={c.searchPlaceholder}
            aria-label={c.searchPlaceholder}
            className="w-full border-0 border-b border-slate-300 bg-transparent py-2 pl-6 text-[15px] text-ink outline-none placeholder:text-slate-400 focus-visible:border-ink"
          />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-2" role="tablist">
          {types.map((tp) => (
            <button
              key={tp.id}
              type="button"
              role="tab"
              aria-selected={type === tp.id}
              onClick={() => setType(tp.id)}
              className={`border-b pb-px text-[13px] transition-colors cursor-pointer ${
                type === tp.id ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>
      {isPending ? (
        <div className="mt-4">
          <Loading />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-4 border-y border-border py-6 text-sm text-slate-500">{c.noMatch}</p>
      ) : (
        <ResourceList resources={filtered} className="mt-4 md:columns-2 md:gap-x-[clamp(2rem,4vw,3.5rem)]" />
      )}
    </section>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function SkillAssessmentPage() {
  const { t, isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';

  const [view, setView] = useState<View>(jobId ? 'auto' : 'jobs');
  const [activeTestId, setActiveTestId] = useState('');
  const [statusFilter, setStatusFilter] = useState<SkillStatus | 'all'>('all');

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries
  const jobsQuery = useQuery({ queryKey: ['skillJourneyJobs'], queryFn: getAssessableJobs });
  const journeysQuery = useQuery({ queryKey: ['skillJourneys'], queryFn: listSkillJourneys });
  const journeyQuery = useQuery({
    queryKey: ['skillJourney', jobId],
    queryFn: () => getSkillJourney(jobId),
    enabled: !!jobId,
  });
  const journey = journeyQuery.data ?? null;

  const allJobs = useMemo(
    () => [...(jobsQuery.data?.applied ?? []), ...(jobsQuery.data?.saved ?? []), ...(jobsQuery.data?.others ?? [])],
    [jobsQuery.data],
  );
  const journeysByJob = useMemo(
    () => Object.fromEntries((journeysQuery.data ?? []).map((j) => [j.jobId, j])) as Record<string, SkillJourney>,
    [journeysQuery.data]
  );

  const refreshJourney = (updated?: SkillJourney | null) => {
    if (updated !== undefined) queryClient.setQueryData(['skillJourney', jobId], updated);
    queryClient.invalidateQueries({ queryKey: ['skillJourney', jobId] });
    queryClient.invalidateQueries({ queryKey: ['skillJourneys'] });
  };

  /** Apply a mutation result to the cached journey right away, then resync. */
  const patchJourney = (fn: (j: SkillJourney) => SkillJourney) => {
    queryClient.setQueryData<SkillJourney | null>(['skillJourney', jobId], (old) => (old ? fn(old) : old));
    refreshJourney();
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSkillJourney,
    onSuccess: (data) => {
      queryClient.setQueryData(['skillJourney', data.jobId], data);
      queryClient.invalidateQueries({ queryKey: ['skillJourneys'] });
      setView('tests');
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitSkillTest,
    onSuccess: (res) => {
      if (timerRef.current) clearInterval(timerRef.current);
      patchJourney((j) => ({ ...j, results: { ...j.results, [res.testId]: res }, gap: undefined, roadmap: undefined }));
      setView('testResult');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeJourneyGap(jobId),
    onSuccess: (gap) => {
      patchJourney((j) => ({ ...j, gap, roadmap: undefined }));
      setStatusFilter('all');
      setView('gap');
    },
  });

  const roadmapMutation = useMutation({
    mutationFn: () => generateJourneyRoadmap(jobId),
    onSuccess: (roadmap) => {
      patchJourney((j) => ({ ...j, roadmap }));
      setView('roadmap');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (phaseId: string) => togglePhaseDone(jobId, phaseId),
    onSuccess: (roadmap) => patchJourney((j) => ({ ...j, roadmap })),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetSkillJourney(jobId),
    onSuccess: () => {
      refreshJourney(null);
      const job = allJobs.find((j) => j.id === jobId);
      if (job) createMutation.mutate(job);
    },
  });

  // Resolve deep links (?jobId=…) to the furthest step, or start a new journey.
  useEffect(() => {
    if (view !== 'auto' || !jobId || journeyQuery.isPending || jobsQuery.isPending) return;
    if (journey) {
      setView(furthestView(journey));
      return;
    }
    const job = allJobs.find((j) => j.id === jobId);
    if (job && !createMutation.isPending) createMutation.mutate(job);
    else if (!job) setView('jobs');
  }, [view, jobId, journey, journeyQuery.isPending, jobsQuery.isPending, allJobs, createMutation]);

  // Timer
  useEffect(() => {
    if (view === 'quiz') {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view, createMutation.isPending, analyzeMutation.isPending, roadmapMutation.isPending]);

  const handleStartJob = (job: Job) => {
    setSearchParams({ jobId: job.id });
    const existing = journeysByJob[job.id];
    if (existing) {
      queryClient.setQueryData(['skillJourney', job.id], existing);
      setView(furthestView(existing));
    } else {
      setView('tests');
      createMutation.mutate(job);
    }
  };

  const handleOtherJob = () => {
    setSearchParams({});
    setView('jobs');
  };

  const handleStartTest = (testId: string) => {
    setActiveTestId(testId);
    setCurrentIndex(0);
    setAnswers({});
    setElapsed(0);
    setView('quiz');
  };

  const activeTest = journey?.tests.find((tt) => tt.id === activeTestId);
  const activeResult = activeTest ? journey?.results[activeTest.id] : undefined;
  const doneCount = journey ? Object.keys(journey.results).length : 0;

  const handleSubmit = () => {
    if (!activeTest || submitMutation.isPending) return;
    submitMutation.mutate({ jobId, testId: activeTest.id, answers, timeSeconds: elapsed });
  };

  const reachable: Record<StepId, boolean> = {
    jobs: true,
    tests: !!journey,
    gap: !!journey?.gap,
    roadmap: !!journey?.roadmap,
  };
  const goStep = (step: StepId) => {
    if (step === 'jobs') handleOtherJob();
    else setView(step);
  };
  const stepper = (current: StepId) => <Stepper c={c} current={current} reachable={reachable} onGo={goStep} />;

  const jobLabel = journey ? `${journey.jobTitle}` : allJobs.find((j) => j.id === jobId)?.title ?? '';

  // ── Working states ──
  if (createMutation.isPending || (view === 'auto' && !!jobId)) {
    return (
      <div className={pageWrap}>
        <BackLink label={c.otherJob} onClick={handleOtherJob} />
        <Headline eyebrow={c.pageName} line1={c.readingHead} line2={`${jobLabel || '…'}.`} />
        <WorkingSteps steps={c.readingSteps} intervalMs={550} />
      </div>
    );
  }
  if (analyzeMutation.isPending) {
    return (
      <div className={pageWrap}>
        <Headline eyebrow={jobLabel} line1={c.analyzingHead} line2={c.steps.gap[0] + '.'} />
        <WorkingSteps steps={c.analyzingSteps} intervalMs={450} />
      </div>
    );
  }
  if (roadmapMutation.isPending) {
    return (
      <div className={pageWrap}>
        <Headline eyebrow={jobLabel} line1={c.buildingHead} line2={c.steps.roadmap[0] + '.'} />
        <WorkingSteps steps={c.buildingSteps} intervalMs={380} />
      </div>
    );
  }

  // ── 01 Jobs ──
  if (view === 'jobs' || !jobId || (!journey && !journeyQuery.isPending)) {
    const applied = jobsQuery.data?.applied ?? [];
    const saved = jobsQuery.data?.saved ?? [];
    const others = (jobsQuery.data?.others ?? []).slice(0, applied.length + saved.length ? 4 : 6);
    return (
      <div className={pageWrap}>
        <nav className="flex flex-wrap items-baseline gap-1.5 text-[13px] text-slate-600">
          <span>{c.crumbGroup}</span>
          <span>/</span>
          <span className="text-brand">{c.pageName}</span>
        </nav>
        <Headline line1={c.headline} line2={c.headlineAccent} intro={c.intro} />

        {/* How it works */}
        <ol className="mt-[clamp(2rem,4vw,2.75rem)] grid border-t border-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          {(['jobs', 'tests', 'gap', 'roadmap'] as StepId[]).map((id, i) => (
            <li
              key={id}
              className={`border-b border-border py-4 pr-4 lg:border-b-0 ${i % 2 === 1 ? 'sm:border-l sm:pl-5' : ''} ${i === 2 ? 'lg:border-l lg:pl-5' : ''}`}
            >
              <span className="text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
              <p className="mt-1 text-[15px] text-ink">{c.steps[id][0]}</p>
              <p className="mt-1 text-[13px] leading-6 text-slate-600">{c.steps[id][1]}</p>
            </li>
          ))}
        </ol>

        {jobsQuery.isPending ? (
          <div className={sectionGap}>
            <Loading />
          </div>
        ) : jobsQuery.isError ? (
          <p className={`${sectionGap} border-y border-border py-6 text-sm text-slate-600`}>{c.loadError}</p>
        ) : (
          <>
            <section className={sectionGap}>
              <SectionHead
                index="01"
                title={c.appliedTitle}
                note={c.appliedNote}
                action={<span className="text-[13px] tabular-nums text-slate-600">{applied.length}</span>}
              />
              {applied.length === 0 ? (
                <div className="border-b border-border py-6">
                  <p className="max-w-xl text-[15px] leading-7 text-slate-600">{c.noApplied}</p>
                  <Link to="/candidate/jobs" className={`${textLink} mt-4 text-ink`}>
                    {c.goJobs}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <ul>
                  {applied.map((job, i) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      index={i}
                      journey={journeysByJob[job.id]}
                      c={c}
                      onStart={() => handleStartJob(job)}
                      disabled={createMutation.isPending}
                    />
                  ))}
                </ul>
              )}
            </section>

            {saved.length > 0 && (
              <section className={sectionGap}>
                <SectionHead
                  index="02"
                  title={c.savedTitle}
                  note={c.savedNote}
                  action={<span className="text-[13px] tabular-nums text-slate-600">{saved.length}</span>}
                />
                <ul>
                  {saved.map((job, i) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      index={i}
                      journey={journeysByJob[job.id]}
                      c={c}
                      onStart={() => handleStartJob(job)}
                      disabled={createMutation.isPending}
                    />
                  ))}
                </ul>
              </section>
            )}

            {others.length > 0 && (
              <section className={sectionGap}>
                <SectionHead index={saved.length > 0 ? '03' : '02'} title={c.othersTitle} note={c.othersNote} />
                <ul>
                  {others.map((job, i) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      index={i}
                      journey={journeysByJob[job.id]}
                      c={c}
                      onStart={() => handleStartJob(job)}
                      disabled={createMutation.isPending}
                    />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  if (!journey) {
    return (
      <div className={pageWrap}>
        <Loading />
      </div>
    );
  }

  // ── 02 Quiz ──
  if (view === 'quiz' && activeTest) {
    const questions = activeTest.questions;
    const current = questions[currentIndex];
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const isAllAnswered = answeredCount === questions.length;
    const isLast = currentIndex === questions.length - 1;
    const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
    const submitButton = (withId: boolean) => (
      <button
        id={withId ? 'submit-assessment-btn' : undefined}
        type="button"
        onClick={handleSubmit}
        disabled={!isAllAnswered || submitMutation.isPending}
        className={primaryButton}
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            {t('skillAssessment.generating')}
          </>
        ) : (
          <>
            {t('skillAssessment.submitAnswers')}
            <ArrowRight size={15} aria-hidden="true" />
          </>
        )}
      </button>
    );

    return (
      <div className={pageWrap}>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <BackLink label={c.backToTests} onClick={() => setView('tests')} />
          <span className="text-[13px] text-slate-600">{journey.jobTitle}</span>
        </div>
        <Headline line1={`${activeTest.name}.`} line2={c.questionLine(currentIndex + 1, questions.length)} />

        <div className="mt-[clamp(2rem,4vw,2.75rem)] grid gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <aside className="lg:sticky lg:top-6 lg:order-2 lg:self-start">
            <div className="border-t border-slate-400 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[13px] text-slate-600">{c.elapsed}</span>
                <span className="text-[clamp(1.5rem,2.4vw,2rem)] tabular-nums tracking-[-0.02em] text-ink">{formatTime(elapsed)}</span>
              </div>
              <div className="mt-3 h-[2px] w-full bg-slate-200">
                <div className="h-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 flex justify-between gap-3 text-[12px] text-slate-600">
                <span>{c.answered(answeredCount, questions.length)}</span>
                <span className={isAllAnswered ? 'text-brand' : ''}>
                  {isAllAnswered ? c.allAnswered : c.remaining(questions.length - answeredCount)}
                </span>
              </p>
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[13px] text-slate-600">{c.questionsLabel}</p>
              <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isDone = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`${idx + 1}`}
                      className={`h-9 rounded-full border text-[12px] tabular-nums transition-colors cursor-pointer ${
                        isCurrent
                          ? 'border-ink bg-ink text-white'
                          : isDone
                            ? 'border-brand text-brand hover:bg-brand-50'
                            : 'border-slate-300 text-slate-500 hover:border-ink hover:text-ink'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
                  {c.legendCurrent}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-brand" aria-hidden="true" />
                  {c.legendDone}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-slate-300" aria-hidden="true" />
                  {c.legendTodo}
                </li>
              </ul>
            </div>
            <div className="mt-6 hidden border-t border-border pt-5 lg:block">
              {submitButton(false)}
              {!isAllAnswered && <p className="mt-3 text-[12px] leading-5 text-slate-500">{c.submitHint}</p>}
            </div>
          </aside>

          <div className="min-w-0 lg:order-1">
            {current && (
              <QuizQuestion
                question={current}
                questionNumber={currentIndex + 1}
                selectedOptionId={answers[current.id] ?? null}
                onSelect={(optionId) => setAnswers((prev) => ({ ...prev, [current.id]: optionId }))}
              />
            )}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className={`${textLink} text-ink`}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {t('skillAssessment.prevQuestion')}
              </button>
              {!isLast ? (
                <button type="button" onClick={() => setCurrentIndex((i) => i + 1)} className={primaryButton}>
                  {t('skillAssessment.nextQuestion')}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                submitButton(true)
              )}
            </div>
            {!isAllAnswered && isLast && <p className="mt-4 text-right text-[12px] text-slate-500">{t('skillAssessment.selectAnswer')}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── 02 Test result ──
  if (view === 'testResult' && activeTest && activeResult) {
    const passed = activeResult.score >= PASS_MARK;
    const nextTest = journey.tests.find((tt) => !journey.results[tt.id]);
    return (
      <div className={pageWrap}>
        <BackLink label={c.backToTests} onClick={() => setView('tests')} />
        <Headline
          eyebrow={journey.jobTitle}
          line1={c.resultHead(activeResult.score)}
          line2={passed ? c.passLine(activeTest.name) : c.failLine(activeTest.name)}
        />
        {stepper('tests')}

        <section className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div>
            <p className="text-[13px] text-slate-600">{c.scoreLabel}</p>
            <p className={`mt-2 flex items-baseline gap-1 leading-none ${passed ? 'text-brand' : 'text-danger'}`}>
              <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal tracking-[-0.04em] tabular-nums">{activeResult.score}</span>
              <span className="text-[clamp(1.5rem,2.4vw,2rem)]">%</span>
            </p>
            <div className="mt-2">
              <LevelBar value={activeResult.score} target={PASS_MARK} tone={passed ? 'bg-brand' : 'bg-danger'} />
            </div>
            <p className="mt-2 flex justify-between text-[12px] text-slate-500">
              <span>0</span>
              <span>
                {c.passMarkLabel} {PASS_MARK}%
              </span>
              <span>100</span>
            </p>
          </div>
          <div>
            <StatList
              rows={[
                { label: c.correctLabel, value: `${activeResult.correct}/${activeResult.total}` },
                { label: c.timeLabel, value: formatTime(activeResult.timeSeconds) },
                { label: c.coversLabel, value: activeTest.skills.join(' · ') },
                { label: c.strongTopics, value: activeResult.strongTopics.join(' · ') || '—' },
                { label: c.weakTopics, value: <span className="text-danger">{activeResult.weakTopics.join(' · ') || '—'}</span> },
              ]}
            />
          </div>
        </section>

        <QuestionReview test={activeTest} result={activeResult} c={c} index="01" />

        <section className={`${sectionGap} border-t border-ink pt-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">
              {c.testsCtaDone(doneCount, journey.tests.length)}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <button type="button" onClick={() => handleStartTest(activeTest.id)} className={`${textLink} text-ink`}>
                {c.retake}
              </button>
              {nextTest ? (
                <>
                  <button type="button" onClick={() => analyzeMutation.mutate()} className={`${textLink} text-ink`}>
                    {c.analyze}
                  </button>
                  <button type="button" onClick={() => handleStartTest(nextTest.id)} className={primaryButton}>
                    {c.nextTest(nextTest.name)}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => analyzeMutation.mutate()} className={primaryButton}>
                  {c.analyze}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── 03 Gap ──
  if (view === 'gap' && journey.gap) {
    const gap = journey.gap;
    const counts = {
      all: gap.skills.length,
      strong: gap.skills.filter((s) => s.status === 'strong').length,
      present: gap.skills.filter((s) => s.status === 'present').length,
      gap: gap.skills.filter((s) => s.status === 'gap').length,
      missing: gap.skills.filter((s) => s.status === 'missing').length,
    };
    const rows = statusFilter === 'all' ? gap.skills : gap.skills.filter((s) => s.status === statusFilter);
    const priority = gap.skills
      .filter((s) => s.importance !== 'medium' && s.status !== 'strong')
      .sort((a, b) => b.requiredLevel - b.candidateLevel - (a.requiredLevel - a.candidateLevel));
    const keyGapCount = gap.skills.filter((s) => s.importance !== 'medium' && (s.status === 'gap' || s.status === 'missing')).length;
    const weakTopics = [...new Set(Object.values(journey.results).flatMap((r) => r.weakTopics))].slice(0, 4);
    const untested = gap.skills.filter((s) => s.source === 'profile').map((s) => s.skill);
    const bridgeNames = priority.filter((s) => s.status === 'gap' || s.status === 'missing').map((s) => s.skill);
    const plan = [
      bridgeNames.length ? c.planBridge(bridgeNames.slice(0, 3).join(', ')) : c.planStrong,
      weakTopics.length ? c.planWeak(weakTopics.join(', ')) : null,
      untested.length ? c.planProfile(untested.slice(0, 3).join(', ')) : null,
      c.planCv,
    ].filter(Boolean) as string[];
    const testsTaken = Object.keys(journey.results).length;
    const scoreTone = gap.matchScore >= 70 ? 'text-brand' : gap.matchScore >= 50 ? 'text-warning' : 'text-danger';

    return (
      <div className={pageWrap}>
        <BackLink label={c.otherJob} onClick={handleOtherJob} />
        <Headline
          eyebrow={journey.jobTitle}
          line1={c.fitHead(gap.matchScore)}
          line2={c.readiness[gap.readiness]}
          intro={c.gapIntro(testsTaken, journey.jobTitle, journey.company)}
        />
        {stepper('gap')}

        <section className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-x-[clamp(2rem,5vw,4rem)] gap-y-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div>
            <p className="text-[13px] text-slate-600">{c.fitLabel}</p>
            <p className={`mt-2 flex items-baseline gap-1 leading-none ${scoreTone}`}>
              <span className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal tracking-[-0.04em] tabular-nums">{gap.matchScore}</span>
              <span className="text-[clamp(1.5rem,2.4vw,2rem)]">%</span>
            </p>
          </div>
          <StatList
            rows={[
              { label: c.metSkills, value: `${counts.strong}/${counts.all}` },
              { label: c.keyGaps, value: <span className={keyGapCount ? 'text-danger' : 'text-brand'}>{keyGapCount}</span> },
              { label: c.weeks, value: c.weeksValue(gap.weeksToReady) },
            ]}
          />
        </section>

        {/* 01 Breakdown */}
        <section className={sectionGap}>
          <SectionHead
            index="01"
            title={c.breakdownTitle}
            note={c.breakdownNote}
            action={
              <div className="flex flex-wrap gap-x-5 gap-y-2" role="tablist">
                {(['all', 'strong', 'present', 'gap', 'missing'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === f}
                    onClick={() => setStatusFilter(f)}
                    className={`border-b pb-px text-[13px] transition-colors cursor-pointer ${
                      statusFilter === f ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
                    }`}
                  >
                    {f === 'all' ? c.all : c.status[f]} <span className="tabular-nums text-slate-500">{counts[f]}</span>
                  </button>
                ))}
              </div>
            }
          />
          <ul>
            {rows.length === 0 && <li className="border-b border-border py-5 text-sm text-slate-500">{c.noItems}</li>}
            {rows.map((s) => (
              <li
                key={s.skill}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 border-b border-border py-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_7rem]"
              >
                <div className="min-w-0">
                  <p className="text-[15px] text-ink">{s.skill}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {c.importance[s.importance]} · {s.source === 'test' ? c.sourceTest : c.sourceProfile}
                  </p>
                </div>
                <p className={`text-right text-[13px] md:order-3 ${statusTone(s.status)}`}>{c.status[s.status]}</p>
                <div className="col-span-2 md:order-2 md:col-span-1">
                  <LevelBar
                    value={s.candidateLevel}
                    target={s.requiredLevel}
                    tone={s.status === 'strong' ? 'bg-brand' : s.status === 'present' ? 'bg-ink' : s.status === 'gap' ? 'bg-warning' : 'bg-danger'}
                  />
                  <p className="mt-1.5 text-[12px] tabular-nums text-slate-500">
                    {s.candidateLevel} / {s.requiredLevel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 02 Priority */}
        <section className={sectionGap}>
          <SectionHead index="02" title={c.priorityTitle} note={c.priorityNote} />
          {priority.length === 0 ? (
            <p className="border-b border-border py-5 text-[15px] leading-7 text-slate-600">{c.noPriority}</p>
          ) : (
            <ul>
              {priority.map((s, i) => (
                <li key={s.skill} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
                  <span className="pt-0.5 text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
                  <div className="min-w-0">
                    <p className={`text-[12px] ${statusTone(s.status)}`}>
                      {c.importance[s.importance]} · {c.status[s.status]}
                    </p>
                    <p className="mt-1 text-[clamp(1rem,1.3vw,1.1875rem)] text-ink">{s.skill}</p>
                    <p className="mt-1 text-[13px] text-slate-600">{c.gapPoints(Math.max(0, s.requiredLevel - s.candidateLevel))}</p>
                  </div>
                  {s.testId && (
                    <div className="col-start-2 mt-3 sm:col-start-3 sm:mt-0">
                      <button type="button" onClick={() => handleStartTest(s.testId!)} className={`${textLink} whitespace-nowrap text-[13px] text-ink`}>
                        {c.retakeTest}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 03 Next actions */}
        <section className={sectionGap}>
          <SectionHead index="03" title={c.planTitle} />
          <ol>
            {plan.map((line, i) => (
              <li key={line} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-b border-border py-4 sm:grid-cols-[3rem_minmax(0,1fr)]">
                <span className="pt-0.5 text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
                <p className="text-[15px] leading-7 text-ink">{line}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link to={`/candidate/cv-job-fit?jobId=${journey.jobId}`} className={`${textLink} text-[13px] text-ink`}>
              {t('nav.cvJobFit')}
            </Link>
            <button type="button" onClick={() => setView('tests')} className={`${textLink} text-[13px] text-ink`}>
              {c.testsTitle}
            </button>
          </div>
        </section>

        <section className={`${sectionGap} border-t border-ink pt-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{c.gapCta}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <button type="button" onClick={() => analyzeMutation.mutate()} className={`${textLink} text-ink`}>
                {c.reanalyze}
              </button>
              {journey.roadmap ? (
                <button type="button" onClick={() => setView('roadmap')} className={primaryButton}>
                  {c.viewRoadmap}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={() => roadmapMutation.mutate()} className={primaryButton}>
                  {c.makeRoadmap}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── 04 Roadmap ──
  if (view === 'roadmap' && journey.roadmap) {
    const roadmap = journey.roadmap;
    const done = roadmap.phases.filter((p) => p.done).length;
    const pct = roadmap.phases.length ? Math.round((done / roadmap.phases.length) * 100) : 0;
    return (
      <div className={pageWrap}>
        <BackLink label={c.otherJob} onClick={handleOtherJob} />
        <Headline
          eyebrow={journey.jobTitle}
          line1={c.roadmapHead(roadmap.totalWeeks)}
          line2={c.roadmapAccent(journey.jobTitle)}
          intro={c.roadmapIntro(roadmap.phases.length)}
        />
        {stepper('roadmap')}

        <section className="mt-[clamp(2.5rem,5vw,3.5rem)] max-w-xl">
          <div className="flex items-baseline justify-between gap-4 text-[13px]">
            <span className="text-slate-600">{c.progressLabel}</span>
            <span className="tabular-nums text-ink">
              {c.phasesDone(done, roadmap.phases.length)} · {pct}%
            </span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-slate-200">
            <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className={sectionGap}>
          <SectionHead index="01" title={c.phasesTitle} />
          <ol>
            {roadmap.phases.map((phase, i) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                index={i}
                c={c}
                onToggle={() => toggleMutation.mutate(phase.id)}
                toggling={toggleMutation.isPending}
              />
            ))}
          </ol>
        </section>

        <ResourceLibrary c={c} index="02" />

        <section className={`${sectionGap} border-t border-ink pt-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">{c.roadmapCta}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link to="/candidate/assistant" className={`${textLink} text-ink`}>
                {c.askAssistant}
              </Link>
              <button type="button" onClick={() => setView('tests')} className={primaryButton}>
                {c.backToTestsCta}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── 02 Tests (default for a journey) ──
  const testById = Object.fromEntries(journey.tests.map((tt) => [tt.id, tt]));
  return (
    <div className={pageWrap}>
      <BackLink label={c.otherJob} onClick={handleOtherJob} />
      <Headline
        eyebrow={journey.company}
        line1={`${journey.jobTitle}.`}
        line2={c.testsHeadAccent(journey.tests.length, journey.jdSkills.length)}
      />
      {stepper('tests')}

      {/* 01 JD skills */}
      <section className={sectionGap}>
        <SectionHead index="01" title={c.jdSkillsTitle} note={c.jdSkillsNote} />
        <ul className="grid md:grid-cols-2 md:gap-x-[clamp(2rem,4vw,3.5rem)]">
          {journey.jdSkills.map((s) => (
            <li key={s.name} className="flex items-baseline justify-between gap-4 border-b border-border py-3.5">
              <span className="min-w-0">
                <span className="block text-[15px] text-ink">{s.name}</span>
                <span className="mt-0.5 block text-[12px] text-slate-500">
                  {s.testId ? c.viaTest(testById[s.testId]?.name ?? s.testId) : c.viaProfile}
                </span>
              </span>
              <span className={`shrink-0 text-[13px] ${s.importance === 'critical' ? 'text-ink' : 'text-slate-500'}`}>
                {c.importance[s.importance]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 02 Tests */}
      <section className={sectionGap}>
        <SectionHead
          index="02"
          title={c.testsTitle}
          action={<span className="text-[13px] tabular-nums text-slate-600">{c.testsProgress(doneCount, journey.tests.length)}</span>}
        />
        <ul>
          {journey.tests.map((test, i) => {
            const result = journey.results[test.id];
            const passed = result ? result.score >= PASS_MARK : false;
            return (
              <li key={test.id} className="border-b border-border">
                <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-3 py-5 md:grid-cols-[3rem_minmax(0,1fr)_8rem_auto]">
                  <span className="text-xs tabular-nums text-slate-500">{pad2(i + 1)}</span>
                  <div className="min-w-0">
                    <p className="text-[clamp(1.0625rem,1.5vw,1.25rem)] text-ink">{test.name}</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      {c.importance[test.importance]} · {c.testMeta(test.questions.length, test.minutes)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {c.covers}: {test.skills.join(' · ')}
                    </p>
                  </div>
                  <span className={`text-right text-[clamp(1.25rem,2vw,1.5rem)] tabular-nums tracking-[-0.02em] md:text-left ${result ? (passed ? 'text-brand' : 'text-danger') : 'text-slate-300'}`}>
                    {result ? `${result.score}%` : '—'}
                  </span>
                  <div className="col-start-2 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:col-start-auto md:justify-end">
                    {result && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTestId(test.id);
                          setView('testResult');
                        }}
                        className={`${textLink} text-[13px] text-slate-600 hover:text-ink`}
                      >
                        {c.reviewTitle}
                      </button>
                    )}
                    <button type="button" onClick={() => handleStartTest(test.id)} className={`${textLink} text-[13px] text-ink`}>
                      {result ? c.retake : c.takeTest}
                      {!result && <ArrowRight size={13} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${sectionGap} border-t border-ink pt-6`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-[clamp(1rem,1.3vw,1.125rem)] leading-7 text-ink">
            {doneCount === 0 ? c.testsCtaNone : c.testsCtaDone(doneCount, journey.tests.length)}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} className={`${textLink} text-ink`}>
              {c.restart}
            </button>
            {journey.gap ? (
              <button type="button" onClick={() => setView('gap')} className={primaryButton}>
                {c.viewGap}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : doneCount === 0 ? (
              <button type="button" onClick={() => handleStartTest(journey.tests[0]?.id ?? '')} disabled={!journey.tests.length} className={primaryButton}>
                {c.takeTest}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={() => analyzeMutation.mutate()} className={primaryButton}>
                {c.analyze}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
