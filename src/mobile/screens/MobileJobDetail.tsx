import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Check, ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import {
  getAppliedJobIds,
  getJobById,
  getJobSemanticMatch,
  getSavedJobIds,
} from '../../mocks/services/mockService';
import {
  markJobApplied,
  openApplySource,
  refreshJobActivity,
  toggleSavedJob,
} from '../../services/jobActivityService';
import { useTranslation } from '../../i18n';
import { ErrorState } from '../../components/ui';
import {
  ActionBar,
  Bar,
  BigButton,
  Card,
  PillLink,
  ScoreRing,
  Screen,
  Sheet,
  Skeleton,
  Tag,
  useToast,
} from '../MobileKit';

const copy = {
  vi: {
    facts: { salary: 'Mức lương', type: 'Hình thức', level: 'Cấp bậc', deadline: 'Hạn nộp' },
    fit: 'Mức độ phù hợp với bạn',
    dims: ['Kỹ năng', 'Kinh nghiệm', 'Mức lương', 'Lĩnh vực'],
    matched: 'Bạn đã có',
    missing: 'Còn thiếu',
    checkFit: 'So khớp với CV',
    letter: 'Viết thư ứng tuyển',
    about: 'Mô tả công việc',
    sections: ['Bạn sẽ làm gì', 'Yêu cầu', 'Quyền lợi'],
    apply: 'Ứng tuyển',
    applied: 'Đã ứng tuyển',
    save: 'Lưu',
    saved: 'Đã lưu việc làm',
    unsaved: 'Đã bỏ lưu',
    appliedToast: 'Đã đánh dấu là đã ứng tuyển',
    sheetTitle: (s: string) => `Ứng tuyển qua ${s}`,
    sheetBody: (s: string) =>
      `Bạn sẽ được chuyển sang ${s} để nộp hồ sơ. CCV sẽ đánh dấu việc này là đã ứng tuyển để bạn theo dõi.`,
    go: (s: string) => `Mở ${s}`,
    cancel: 'Để sau',
  },
  en: {
    facts: { salary: 'Salary', type: 'Type', level: 'Level', deadline: 'Deadline' },
    fit: 'How well you fit',
    dims: ['Skills', 'Experience', 'Salary', 'Domain'],
    matched: 'You have',
    missing: 'Missing',
    checkFit: 'Compare with my CV',
    letter: 'Write cover letter',
    about: 'About the job',
    sections: ['What you will do', 'Requirements', 'Benefits'],
    apply: 'Apply',
    applied: 'Applied',
    save: 'Save',
    saved: 'Job saved',
    unsaved: 'Removed from saved',
    appliedToast: 'Marked as applied',
    sheetTitle: (s: string) => `Apply on ${s}`,
    sheetBody: (s: string) =>
      `You will continue on ${s} to send your application. CCV marks this job as applied so you can track it.`,
    go: (s: string) => `Open ${s}`,
    cancel: 'Later',
  },
};

function Collapsible({
  title,
  items,
  defaultOpen = false,
}: {
  title: string;
  items: string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[56px] w-full items-center justify-between px-4 text-left"
      >
        <span className="text-[16px] font-medium text-ink">{title}</span>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="space-y-2.5 px-4 pb-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-6 text-slate-700">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function MobileJobDetail() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [sheet, setSheet] = useState(false);

  const {
    data: job,
    isPending,
    isError,
  } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJobById(jobId) });
  const { data: semantic } = useQuery({
    queryKey: ['jobSemanticMatch', jobId],
    queryFn: () => getJobSemanticMatch(jobId),
    enabled: !!jobId,
  });
  const { data: savedIds = [] } = useQuery({ queryKey: ['savedJobs'], queryFn: getSavedJobIds });
  const { data: appliedIds = [] } = useQuery({
    queryKey: ['appliedJobs'],
    queryFn: getAppliedJobIds,
  });
  const isSaved = savedIds.includes(jobId);
  const isApplied = appliedIds.includes(jobId);

  const toggleSave = useMutation({
    mutationFn: () => toggleSavedJob(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['savedJobs'], res.ids);
      refreshJobActivity(queryClient);
      toast.show(res.saved ? c.saved : c.unsaved);
    },
  });
  const apply = useMutation({
    mutationFn: () => markJobApplied(jobId),
    onSuccess: (res) => {
      queryClient.setQueryData(['appliedJobs'], res.ids);
      refreshJobActivity(queryClient);
      setSheet(false);
      toast.show(c.appliedToast);
    },
  });

  if (isPending) return <Skeleton rows={3} />;
  if (isError || !job) return <ErrorState />;

  const source = job.externalSource?.sourceName ?? 'ITviec';
  const facts = [
    { label: c.facts.salary, value: job.salary },
    { label: c.facts.type, value: job.type },
    { label: c.facts.level, value: job.experienceLevel },
    { label: c.facts.deadline, value: job.externalSource?.applicationDeadline },
  ].filter((f) => !!f.value);
  const dims = semantic
    ? [semantic.skillsScore, semantic.experienceScore, semantic.salaryScore, semantic.domainScore]
    : [];
  const sections = [job.responsibilities, job.requirements, job.benefits]
    .map((items, i) => ({ title: c.sections[i], items: items ?? [] }))
    .filter((s) => s.items.length > 0);

  return (
    <Screen>
      <div className="flex items-start gap-3 pt-1">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-[20px] font-medium text-brand">
          {job.company.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="text-[21px] font-medium leading-tight text-ink">{job.title}</p>
          <p className="mt-1 text-[14px] text-slate-600">{job.company}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
            <MapPin size={13} aria-hidden="true" />
            {job.location} · {job.posted}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {facts.map((f) => (
          <Card key={f.label} className="px-3.5 py-3">
            <p className="text-[12px] text-slate-500">{f.label}</p>
            <p className="mt-0.5 text-[14px] font-medium leading-snug text-ink">{f.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <ScoreRing value={semantic?.overallScore ?? job.match} size={64} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium text-ink">{c.fit}</p>
            {semantic && <p className="text-[13px] text-slate-600">{semantic.fitLevel}</p>}
          </div>
        </div>
        {dims.length > 0 && (
          <div className="mt-4 space-y-3">
            {dims.map((v, i) => (
              <div key={c.dims[i]}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-slate-700">{c.dims[i]}</span>
                  <span className="tabular-nums text-slate-600">{v}%</span>
                </div>
                <Bar value={v} />
              </div>
            ))}
          </div>
        )}
        {semantic && (
          <div className="mt-4 space-y-2">
            <p className="text-[13px] text-slate-500">{c.matched}</p>
            <div className="flex flex-wrap gap-1.5">
              {semantic.matchedSkills.map((s) => (
                <Tag key={s} tone="brand">
                  <Check size={12} className="mr-1" />
                  {s}
                </Tag>
              ))}
            </div>
            {semantic.missingSkills.length > 0 && (
              <>
                <p className="pt-1 text-[13px] text-slate-500">{c.missing}</p>
                <div className="flex flex-wrap gap-1.5">
                  {semantic.missingSkills.map((s) => (
                    <Tag key={s} tone="warn">
                      {s}
                    </Tag>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <PillLink to={`/candidate/cv-job-fit?jobId=${job.id}`}>{c.checkFit}</PillLink>
          <PillLink to="/candidate/applications">{c.letter}</PillLink>
        </div>
      </Card>

      <Card>
        <p className="text-[16px] font-medium text-ink">{c.about}</p>
        <p className="mt-2 text-[14px] leading-6 text-slate-700">{job.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      </Card>

      {sections.map((s, i) => (
        <Collapsible key={s.title} title={s.title} items={s.items} defaultOpen={i === 0} />
      ))}

      <ActionBar>
        <button
          type="button"
          onClick={() => toggleSave.mutate()}
          aria-pressed={isSaved}
          aria-label={c.save}
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-ink/25 bg-surface text-ink"
        >
          <Bookmark size={20} className={isSaved ? 'fill-brand text-brand' : ''} />
        </button>
        <BigButton onClick={() => setSheet(true)} disabled={isApplied}>
          {isApplied ? (
            <>
              <Check size={18} /> {c.applied}
            </>
          ) : (
            c.apply
          )}
        </BigButton>
      </ActionBar>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <p className="text-[19px] font-medium text-ink">{c.sheetTitle(source)}</p>
        <p className="mt-2 text-[14px] leading-6 text-slate-600">{c.sheetBody(source)}</p>
        <div className="mt-5 space-y-3">
          <BigButton
            onClick={() => {
              openApplySource(job);
              apply.mutate();
            }}
          >
            {c.go(source)} <ExternalLink size={16} />
          </BigButton>
          <BigButton tone="secondary" onClick={() => setSheet(false)}>
            {c.cancel}
          </BigButton>
        </div>
      </Sheet>
      {toast.node}
    </Screen>
  );
}
