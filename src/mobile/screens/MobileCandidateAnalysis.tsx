import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CandidateCareerAnalysisPage from '../../pages/consultant/CandidateCareerAnalysisPage';
import { getCandidateCareerAnalysis } from '../../services/consultationService';
import { useTranslation } from '../../i18n';
import {
  Avatar,
  Bar,
  BigLink,
  Card,
  Empty,
  InfoRow,
  Screen,
  ScoreRing,
  SectionTitle,
  Skeleton,
  Tag,
} from '../MobileKit';
import { readinessLabel, readinessTone } from './MobileConsultantCandidates';

const copy = {
  vi: {
    notFound: 'Không tìm thấy ứng viên.',
    readiness: 'Mức sẵn sàng',
    goal: 'Mục tiêu',
    salary: 'Lương mong muốn',
    availability: 'Có thể bắt đầu',
    type: 'Hình thức',
    profile: 'Hồ sơ hoàn thiện',
    cv: 'CV đính kèm',
    ats: 'Điểm ATS',
    pass: (p: number) => `Khả năng qua vòng lọc ${p}%`,
    parts: ['Trình bày', 'Từ khoá', 'Tác động', 'Cấu trúc'],
    matched: 'Đã có',
    missing: 'Còn thiếu',
    gap: 'Khoảng cách kỹ năng',
    weeks: (n: number) => `Khoảng ${n} tuần để sẵn sàng`,
    criticalGaps: 'Thiếu quan trọng',
    quickWins: 'Cải thiện nhanh',
    roadmap: 'Lộ trình',
    tests: 'Bài đánh giá',
    correct: (a: number, b: number) => `${a}/${b} câu đúng`,
    full: 'Xem phân tích đầy đủ & soạn tư vấn',
  },
  en: {
    notFound: 'Candidate not found.',
    readiness: 'Readiness',
    goal: 'Goal',
    salary: 'Expected salary',
    availability: 'Available from',
    type: 'Employment',
    profile: 'Profile complete',
    cv: 'Attached CV',
    ats: 'ATS score',
    pass: (p: number) => `${p}% chance to pass screening`,
    parts: ['Formatting', 'Keywords', 'Impact', 'Structure'],
    matched: 'Has',
    missing: 'Missing',
    gap: 'Skill gap',
    weeks: (n: number) => `About ${n} weeks to ready`,
    criticalGaps: 'Critical gaps',
    quickWins: 'Quick wins',
    roadmap: 'Roadmap',
    tests: 'Assessments',
    correct: (a: number, b: number) => `${a}/${b} correct`,
    full: 'Full analysis & write advice',
  },
};

/** `?view=full` opens the full web page (tabs, salary, advice builder) inside the app. */
export default function MobileCandidateAnalysis() {
  const [params] = useSearchParams();
  return params.get('view') === 'full' ? <CandidateCareerAnalysisPage /> : <AnalysisScreen />;
}

function AnalysisScreen() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-career-analysis', candidateId],
    queryFn: () => getCandidateCareerAnalysis(candidateId || '1'),
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <Screen>
        <Skeleton />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <Empty title={c.notFound} />
      </Screen>
    );
  }

  const cv = data.resumeDetails;
  const gap = data.skillGap;

  return (
    <Screen>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={data.candidate.name} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-medium text-ink">{data.candidate.name}</p>
            <p className="truncate text-[13px] text-slate-600">
              {data.candidate.currentTitle} → {data.candidate.targetRole}
            </p>
          </div>
          <ScoreRing value={data.readinessScore} size={52} label={c.readiness} />
        </div>
        <div className="mt-3">
          <Tag tone={readinessTone[data.readinessLevel]}>
            {readinessLabel[lang][data.readinessLevel]}
          </Tag>
        </div>
        {data.careerGoal && (
          <p className="mt-3 text-[14px] leading-6 text-ink">{data.careerGoal}</p>
        )}
        <div className="mt-2 divide-y divide-border">
          <InfoRow label={c.salary}>{data.expectedSalary}</InfoRow>
          <InfoRow label={c.availability}>{data.availability}</InfoRow>
          <InfoRow label={c.type}>{data.employmentType}</InfoRow>
          <InfoRow label={c.profile}>{data.profileCompletion}%</InfoRow>
        </div>
      </Card>

      <BigLink to={`/consultant/candidates/${candidateId}?view=full`}>{c.full}</BigLink>

      <SectionTitle title={c.cv} />
      <Card>
        <div className="flex items-center gap-3">
          <ScoreRing value={cv.atsScore} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-ink">{cv.name}</p>
            <p className="text-[13px] text-slate-600">{c.pass(cv.passProbability)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[cv.formattingScore, cv.keywordScore, cv.impactScore, cv.structureScore].map((v, i) => (
            <div key={c.parts[i]}>
              <div className="mb-1 flex justify-between text-[13px]">
                <span className="text-slate-600">{c.parts[i]}</span>
                <span className="tabular-nums text-ink">{v}</span>
              </div>
              <Bar value={v} />
            </div>
          ))}
        </div>
        <TagList title={c.matched} items={cv.matchedKeywords} tone="brand" />
        <TagList title={c.missing} items={cv.missingKeywords} tone="warn" />
      </Card>

      <SectionTitle title={c.gap} />
      <Card>
        <div className="flex items-center gap-3">
          <ScoreRing value={gap.overallFitScore} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-ink">{gap.targetJobTitle}</p>
            <p className="text-[13px] text-slate-600">{c.weeks(gap.estimatedWeeksToReady)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {gap.skillsAnalysis.map((s) => (
            <div key={s.name}>
              <div className="mb-1 flex justify-between text-[13px]">
                <span className="text-ink">{s.name}</span>
                <span className="tabular-nums text-slate-600">
                  {s.candidateLevel}/{s.requiredLevel}
                </span>
              </div>
              <Bar value={s.requiredLevel ? (s.candidateLevel / s.requiredLevel) * 100 : 0} />
            </div>
          ))}
        </div>
        <TagList title={c.criticalGaps} items={gap.criticalGaps} tone="danger" />
        <TagList title={c.quickWins} items={gap.quickWins} tone="brand" />
        {gap.actionRoadmap.length > 0 && (
          <div className="mt-4">
            <p className="text-[12px] text-slate-500">{c.roadmap}</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-[14px] leading-6 text-ink">
              {gap.actionRoadmap.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      {data.skillAssessments.length > 0 && (
        <>
          <SectionTitle title={c.tests} />
          <div className="space-y-3">
            {data.skillAssessments.map((a) => (
              <Card key={a.topicId}>
                <div className="flex items-center gap-3">
                  <ScoreRing value={a.score} size={48} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink">{a.topicName}</p>
                    <p className="text-[13px] text-slate-600">
                      {a.grade} · {c.correct(a.correctAnswers, a.totalQuestions)} · {a.timeSpent}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}

function TagList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'brand' | 'warn' | 'danger';
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[12px] text-slate-500">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item} tone={tone}>
            {item}
          </Tag>
        ))}
      </div>
    </div>
  );
}
