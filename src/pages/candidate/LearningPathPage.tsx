import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import {
  createLearningPath,
  getLatestLearningPath,
  setLearningNodeStatus,
  type LearningPathNode,
} from '../../services/skillPathService';
import { getJobById, getJobs } from '../../services/candidateService';
import { JOB_ACTIVITY_QUERY_KEY, getJobActivity } from '../../services/jobActivityService';
import { Loading } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { JobPicker, jobPickerCopy } from './cv-job-fit/JobPicker';
import { ErrorLine, Muted, PathView, Section, Working, skillPathCopy } from './SkillAssessmentPage';

const copy = {
  vi: {
    crumbGroup: 'Phát triển',
    crumbPage: 'Lộ trình học',
    heroA: 'Lộ trình học theo việc làm.',
    heroB: 'Không cần CV, không cần làm bài.',
    intro: 'Chọn việc làm bạn muốn hướng tới. Hệ thống đọc kỹ năng trong JD, so với hồ sơ nghề nghiệp của bạn rồi lập lộ trình học kèm tài liệu cho từng kỹ năng.',
    jobTitle: 'Việc làm mục tiêu',
    jobLabel: 'Việc làm',
    pickFirst: 'Chọn một việc làm, hoặc bấm “Tạo lộ trình học” ở trang Khám phá việc làm.',
    browse: 'Mở Khám phá việc làm',
    pathTitle: 'Lộ trình học',
    create: 'Tạo lộ trình học',
    rebuild: 'Tạo lại lộ trình',
    noPath: 'Chưa có lộ trình cho việc này.',
    noPathNote: 'Lộ trình dựa trên JD và hồ sơ nghề nghiệp, dùng một lượt AI.',
    creating: 'Đang tạo lộ trình học. Việc này có thể mất vài phút.',
    testLink: 'Muốn biết chính xác mình yếu kỹ năng nào? Làm bài đánh giá kỹ năng',
    testSub: '10 câu hỏi theo JD; lộ trình sau bài đánh giá chỉ gồm kỹ năng bạn chưa đạt.',
  },
  en: {
    crumbGroup: 'Growth',
    crumbPage: 'Learning path',
    heroA: 'A learning path for a job.',
    heroB: 'No CV or test needed.',
    intro: 'Choose the job you are aiming for. The system reads the skills in the JD, compares them with your career profile and builds a learning path with resources for each skill.',
    jobTitle: 'Target job',
    jobLabel: 'Job',
    pickFirst: 'Choose a job, or press “Create learning path” on the Job discovery page.',
    browse: 'Open Job discovery',
    pathTitle: 'Learning path',
    create: 'Create learning path',
    rebuild: 'Rebuild path',
    noPath: 'No learning path for this job yet.',
    noPathNote: 'The path is based on the JD and your career profile and uses one AI credit.',
    creating: 'Building the learning path. This can take a few minutes.',
    testLink: 'Want to know exactly which skills are weak? Take the skill assessment',
    testSub: '10 questions from the JD; a path built after the test only covers the skills you missed.',
  },
};

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
const textLink =
  'inline-flex items-center gap-1 border-b border-current pb-px text-sm transition-colors duration-150 hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40';

/**
 * Lộ trình học lập thẳng từ JD của một việc làm (không CV, không bài đánh giá).
 * Mở từ nút "Tạo lộ trình học" ở Khám phá việc làm: ?jobId=…&build=1 tự tạo nếu việc đó chưa có lộ trình.
 */
export default function LearningPathPage() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const sc = isVietnamese ? skillPathCopy.vi : skillPathCopy.en;
  const pickerCopy = isVietnamese ? jobPickerCopy.vi : jobPickerCopy.en;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';
  const autoBuild = searchParams.get('build') === '1';

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() });
  const { data: activity } = useQuery({ queryKey: JOB_ACTIVITY_QUERY_KEY, queryFn: getJobActivity });
  const { data: job } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJobById(jobId), enabled: !!jobId });

  // Cùng khoá với trang Đánh giá kỹ năng khi không dùng CV, nên hai trang thấy cùng một lộ trình.
  const pathKey = ['learningPath', jobId, ''];
  const pathQuery = useQuery({ queryKey: pathKey, queryFn: () => getLatestLearningPath(jobId, ''), enabled: !!jobId });
  const path = pathQuery.data ?? null;

  const buildPath = useMutation({
    mutationFn: () => createLearningPath({ jobId }),
    onSuccess: (data) => queryClient.setQueryData(pathKey, data),
  });
  const nodeStatus = useMutation({
    mutationFn: ({ nodeId, status }: { nodeId: string; status: LearningPathNode['status'] }) => setLearningNodeStatus(path!.id, nodeId, status),
    onSuccess: (data) => queryClient.setQueryData(pathKey, data),
  });

  // Bấm "Tạo lộ trình học" ở Khám phá việc làm: tạo ngay một lần nếu việc này chưa có lộ trình.
  const autoBuilt = useRef('');
  useEffect(() => {
    if (!autoBuild || !jobId || !pathQuery.isSuccess || pathQuery.data || buildPath.isPending) return;
    if (autoBuilt.current === jobId) return;
    autoBuilt.current = jobId;
    buildPath.mutate();
  }, [autoBuild, jobId, pathQuery.isSuccess, pathQuery.data, buildPath]);

  const selectJob = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('jobId', id);
    next.delete('build');
    setSearchParams(next, { replace: true });
  };

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
        <p className="mt-3 max-w-[40rem] text-[15px] leading-7 text-slate-600">{c.intro}</p>
      </header>

      <Section id="job" index="01" title={c.jobTitle}>
        <div className="grid items-end gap-x-8 gap-y-4 pt-5 md:grid-cols-[minmax(0,1fr)_auto]">
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
          <Link to="/candidate/jobs" className={`${textLink} text-[13px] text-ink`}>
            {c.browse}
          </Link>
        </div>
        {job ? (
          <p className="mt-4 text-[13px] leading-6 text-slate-600">
            {[job.company, job.location].filter(Boolean).join(' · ')}
            {job.skills.length > 0 && (
              <>
                {' · '}
                {sc.skills}: <span className="text-ink">{job.skills.join(', ')}</span>
              </>
            )}
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-slate-500">{c.pickFirst}</p>
        )}
      </Section>

      <Section
        id="path"
        index="02"
        title={c.pathTitle}
        action={
          path && !buildPath.isPending ? (
            <button type="button" onClick={() => buildPath.mutate()} className={`${textLink} text-[13px] text-brand hover:text-ink`}>
              {c.rebuild}
            </button>
          ) : undefined
        }
      >
        {!jobId ? (
          <Muted>{c.pickFirst}</Muted>
        ) : pathQuery.isPending ? (
          <Loading />
        ) : pathQuery.isError ? (
          <ErrorLine error={pathQuery.error} c={sc} />
        ) : buildPath.isPending ? (
          <Working text={c.creating} />
        ) : !path ? (
          <div className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="max-w-xl text-[15px] leading-7 text-ink">{c.noPath}</p>
              <p className="mt-1 text-[13px] text-slate-500">{c.noPathNote}</p>
            </div>
            <button type="button" onClick={() => buildPath.mutate()} className={`${primaryButton} shrink-0`}>
              {c.create}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div>
            {path.outdated && <p className="mt-4 border-l-2 border-warning pl-4 text-sm leading-6 text-ink">{sc.outdated}</p>}
            <PathView path={path} c={sc} busy={nodeStatus.isPending} onStatus={(nodeId, status) => nodeStatus.mutate({ nodeId, status })} />
          </div>
        )}
        <ErrorLine error={buildPath.error ?? nodeStatus.error} c={sc} />
      </Section>

      {job && (
        <Link
          to={`/candidate/skill-assessment?jobId=${job.id}`}
          className="group mt-[clamp(3rem,6vw,4.5rem)] flex items-center justify-between gap-6 border-t border-ink pt-6"
        >
          <span className="min-w-0">
            <span className="block text-[clamp(1.0625rem,1.5vw,1.25rem)] text-ink transition-colors group-hover:text-brand">{c.testLink}</span>
            <span className="mt-1 block text-[13px] text-slate-600">{c.testSub}</span>
          </span>
          <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-ink transition-colors group-hover:text-brand" />
        </Link>
      )}
    </div>
  );
}
