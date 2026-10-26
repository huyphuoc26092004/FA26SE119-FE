import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileSearch, FileText, MessageSquare, Target } from 'lucide-react';
import {
  getCandidateProfile,
  getRecommendations,
  getResumes,
} from '../../mocks/services/mockService';
import { useTranslation } from '../../i18n';
import { Bar, Card, ScoreRing, Screen, SectionTitle, Skeleton } from '../MobileKit';
import { JobCard } from './MobileJobs';

const copy = {
  vi: {
    hello: (name: string) => `Chào ${name}`,
    profile: (p: number) => `Hồ sơ đã hoàn thiện ${p}%`,
    finishProfile: 'Hoàn thiện hồ sơ',
    ats: 'Điểm ATS',
    recommended: 'Việc phù hợp',
    match: 'Khớp trung bình',
    quick: 'Làm nhanh',
    analyse: 'Phân tích CV',
    fit: 'Độ phù hợp',
    letter: 'Thư ứng tuyển',
    advice: 'Gặp cố vấn',
    forYou: 'Việc làm cho bạn',
    seeAll: 'Xem tất cả',
  },
  en: {
    hello: (name: string) => `Hi ${name}`,
    profile: (p: number) => `Profile ${p}% complete`,
    finishProfile: 'Complete profile',
    ats: 'ATS score',
    recommended: 'Matching jobs',
    match: 'Avg. match',
    quick: 'Quick actions',
    analyse: 'Analyse CV',
    fit: 'CV fit',
    letter: 'Cover letter',
    advice: 'Talk to advisor',
    forYou: 'Jobs for you',
    seeAll: 'See all',
  },
};

export default function MobileHome() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getCandidateProfile });
  const { data: jobs, isPending } = useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendations,
  });
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });

  const primary = resumes?.find((r) => r.isDefault) ?? resumes?.[0];
  const ats = primary?.atsScore ?? 88;
  const completion = profile?.completion ?? 85;
  const firstName = profile?.name ? profile.name.split(' ').slice(-1)[0] : 'Alex';

  const actions = [
    {
      to: `/candidate/resumes/${primary?.id ?? 'cv-1'}/analysis`,
      label: c.analyse,
      icon: FileSearch,
    },
    { to: '/candidate/cv-job-fit', label: c.fit, icon: Target },
    { to: '/candidate/applications', label: c.letter, icon: FileText },
    { to: '/candidate/consultations', label: c.advice, icon: MessageSquare },
  ];

  return (
    <Screen>
      <Card className="bg-night text-white border-night">
        <p className="text-[22px] font-medium leading-tight">{c.hello(firstName)}</p>
        <p className="mt-1 text-[14px] text-white/70">
          {profile?.headline ?? profile?.targetPosition}
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-mint" style={{ width: `${completion}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px]">
          <span className="text-white/80">{c.profile(completion)}</span>
          <Link to="/candidate/profile" className="text-mint">
            {c.finishProfile}
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card to="/candidate/resumes" className="flex flex-col items-center gap-2 px-2 text-center">
          <ScoreRing value={ats} size={52} />
          <span className="text-[12px] text-slate-600">{c.ats}</span>
        </Card>
        <Card
          to="/candidate/jobs"
          className="flex flex-col items-center justify-center gap-2 px-2 text-center"
        >
          <span className="text-[26px] font-medium leading-[52px] text-ink">24</span>
          <span className="text-[12px] text-slate-600">{c.recommended}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-2 px-2 text-center">
          <span className="text-[26px] font-medium leading-[52px] text-brand">88%</span>
          <span className="text-[12px] text-slate-600">{c.match}</span>
        </Card>
      </div>

      <SectionTitle title={c.quick} />
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-2xl py-2 text-center active:bg-slate-100"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface text-brand">
              <Icon size={20} strokeWidth={1.7} />
            </span>
            <span className="text-[12px] leading-tight text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <SectionTitle title={c.forYou} action={{ label: c.seeAll, to: '/candidate/jobs' }} />
      {isPending ? (
        <Skeleton rows={2} />
      ) : (
        <div className="space-y-3">
          {(jobs ?? []).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {primary && (
        <Card to={`/candidate/resumes/${primary.id}`}>
          <p className="text-[13px] text-slate-500">CV</p>
          <p className="mt-0.5 truncate text-[15px] font-medium text-ink">{primary.name}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <Bar value={ats} />
            </div>
            <span className="text-[13px] tabular-nums text-slate-600">ATS {ats}</span>
          </div>
        </Card>
      )}
    </Screen>
  );
}
