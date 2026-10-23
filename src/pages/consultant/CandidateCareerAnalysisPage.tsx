import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import ConsultationAdviceBuilder from '../../components/consultation/ConsultationAdviceBuilder';
import {
  Avatar,
  Headline,
  Modal,
  SectionHead,
  StatRow,
  SubHead,
  ThinBar,
  UnderlineTabs,
  pad2,
  primaryButton,
  textLink,
} from '../../components/consultation/ConsultantKit';
import {
  getCandidateCareerAnalysis,
  saveCandidateCareerAdvice,
} from '../../services/consultationService';
import type { CandidateCareerAnalysis } from '../../types/consultation';
import { useTranslation } from '../../i18n';

type Tab = 'profile' | 'ats' | 'assessment' | 'gap' | 'advice';
type Readiness = CandidateCareerAnalysis['readinessLevel'];
type SkillStatus = 'strong' | 'present' | 'gap' | 'missing';

const copy = {
  vi: {
    back: 'Danh sách ứng viên',
    backToList: 'Quay lại danh sách ứng viên',
    openRequest: (id: string) => `Mở yêu cầu ${id}`,
    giveAdvice: 'Viết lời khuyên',
    readiness: {
      Ready: 'Sẵn sàng ứng tuyển',
      'Near Ready': 'Gần đạt chuẩn',
      Developing: 'Đang phát triển',
      'Early Stage': 'Giai đoạn đầu',
    } as Record<Readiness, string>,
    line2: (r: number, ats: number) => `Sẵn sàng ${r}%, ATS ${ats}/100.`,
    stats: {
      fit: 'Độ phù hợp',
      fitDetail: (t: string) => `với ${t}`,
      readiness: 'Độ sẵn sàng',
      ats: 'Điểm ATS',
      atsDetail: (g: string) => `Hạng ${g}`,
      profile: 'Hồ sơ hoàn thiện',
      profileDetail: (a: string) => a,
    },
    tabs: {
      profile: 'Hồ sơ',
      ats: 'CV & ATS',
      assessment: 'Đánh giá kỹ năng',
      gap: 'Khoảng trống',
      advice: 'Lời khuyên',
    },
    goal: 'Mục tiêu nghề nghiệp',
    experience: 'Kinh nghiệm làm việc',
    years: (n: number) => `${n} năm`,
    projects: 'Dự án tiêu biểu',
    skills: 'Kỹ năng',
    technical: 'Chuyên môn',
    soft: 'Kỹ năng mềm',
    level: 'Nâng cao',
    education: 'Học vấn',
    preferences: 'Mong muốn',
    availability: 'Có thể bắt đầu',
    employment: 'Hình thức',
    expected: 'Lương kỳ vọng',
    atsLine: (p: number) => `Xác suất vượt vòng lọc CV tự động: ${p}%`,
    updated: 'Cập nhật',
    viewCv: 'Xem toàn văn CV',
    breakdown: 'Chỉ số thành phần',
    dims: {
      formatting: ['Định dạng & khả năng đọc', 'Một cột, không bảng chia, phông chữ chuẩn ATS.'],
      keyword: ['Từ khoá chuẩn ngành', 'Khớp 10/14 từ khoá trọng tâm của vị trí Senior Frontend.'],
      impact: ['Định lượng kết quả (STAR)', 'Cần bổ sung % đo lường kết quả theo công thức STAR.'],
      structure: ['Đầy đủ cấu trúc', 'Có đủ Kinh nghiệm, Học vấn, Kỹ năng, Dự án.'],
    },
    keywords: 'Đối chiếu từ khoá',
    matched: 'Đã có trong CV',
    missing: 'Còn thiếu',
    improvements: 'Đề xuất cải thiện',
    assessmentIntro:
      'Kết quả trắc nghiệm giúp bạn kiểm chứng những gì ứng viên kê khai trên CV trước buổi tư vấn.',
    tests: 'Bài đánh giá đã làm',
    time: 'Thời gian',
    grade: 'Hạng',
    correct: (a: number, b: number) => `${a}/${b} câu đúng`,
    strengths: 'Điểm mạnh',
    weaknesses: 'Cần lưu ý',
    prompt: 'Gợi ý khi phỏng vấn',
    target: 'Vị trí mục tiêu',
    benchmark: 'Chuẩn tham chiếu',
    weeks: (n: number) => (n > 0 ? 'tuần để đạt chuẩn' : 'đã đạt chuẩn'),
    compare: 'Năng lực so với yêu cầu',
    compareMeta: 'vạch đứng là mức yêu cầu',
    candidateLevel: 'Ứng viên',
    required: 'Yêu cầu',
    status: { strong: 'Vững', present: 'Đã có', gap: 'Khoảng trống', missing: 'Chưa có' } as Record<SkillStatus, string>,
    critical: 'Bắt buộc',
    gaps: 'Khoảng trống cốt lõi',
    quickWins: 'Thu hẹp nhanh (1–2 tuần)',
    roadmap: 'Lộ trình 4 tuần gợi ý',
    salaryRef: 'Tham khảo mức lương thị trường',
    salaryRefHint: 'Dữ liệu tham khảo, chỉ dùng khi ứng viên hỏi về đàm phán.',
    median: 'Trung vị thị trường',
    range: 'Khoảng thị trường',
    candidateExpected: 'Ứng viên kỳ vọng',
    verdict: 'Nhận định',
    verdictText: 'Hợp lý và khả thi',
    strategy: 'Chiến thuật thương lượng',
    perMonth: 'đ/tháng',
    notesTitle: 'Ghi chú nhanh về ứng viên',
    notesPlaceholder:
      'Ghi chú sơ bộ về điểm mạnh kỹ thuật, phong thái giao tiếp hoặc chiến lược tư vấn cho ứng viên này…',
    saveNote: 'Lưu ghi chú',
    saved: 'Đã lưu',
    noAdvice: 'Chưa có dữ liệu lời khuyên cho ứng viên này.',
    cvSummary: 'Tóm tắt mục tiêu',
    cvExperience: 'Kinh nghiệm gần nhất',
    close: 'Đóng',
  },
  en: {
    back: 'Candidates',
    backToList: 'Back to candidates',
    openRequest: (id: string) => `Open request ${id}`,
    giveAdvice: 'Write advice',
    readiness: {
      Ready: 'Ready to apply',
      'Near Ready': 'Near ready',
      Developing: 'Developing',
      'Early Stage': 'Early stage',
    } as Record<Readiness, string>,
    line2: (r: number, ats: number) => `${r}% ready, ATS ${ats}/100.`,
    stats: {
      fit: 'Fit',
      fitDetail: (t: string) => `for ${t}`,
      readiness: 'Readiness',
      ats: 'ATS score',
      atsDetail: (g: string) => `Grade ${g}`,
      profile: 'Profile complete',
      profileDetail: (a: string) => a,
    },
    tabs: {
      profile: 'Profile',
      ats: 'CV & ATS',
      assessment: 'Skill tests',
      gap: 'Skill gap',
      advice: 'Advice',
    },
    goal: 'Career goal',
    experience: 'Work experience',
    years: (n: number) => `${n} yrs`,
    projects: 'Selected projects',
    skills: 'Skills',
    technical: 'Technical',
    soft: 'Soft skills',
    level: 'Advanced',
    education: 'Education',
    preferences: 'Preferences',
    availability: 'Available from',
    employment: 'Employment',
    expected: 'Expected salary',
    atsLine: (p: number) => `Chance to pass automated CV screening: ${p}%`,
    updated: 'Updated',
    viewCv: 'View full CV',
    breakdown: 'Score breakdown',
    dims: {
      formatting: ['Formatting & parsing', 'Single column, no tables, ATS-safe fonts.'],
      keyword: ['Industry keywords', 'Matches 10 of 14 core keywords for Senior Frontend.'],
      impact: ['Quantified impact (STAR)', 'Add measurable results using the STAR formula.'],
      structure: ['Complete structure', 'Experience, Education, Skills and Projects present.'],
    },
    keywords: 'Keyword check',
    matched: 'Found in CV',
    missing: 'Missing',
    improvements: 'Suggested improvements',
    assessmentIntro: 'Test results help you verify what the candidate claims on the CV before the session.',
    tests: 'Completed tests',
    time: 'Time',
    grade: 'Grade',
    correct: (a: number, b: number) => `${a}/${b} correct`,
    strengths: 'Strengths',
    weaknesses: 'Watch out',
    prompt: 'Interview prompt',
    target: 'Target role',
    benchmark: 'Benchmark',
    weeks: (n: number) => (n > 0 ? 'weeks to ready' : 'ready now'),
    compare: 'Skills vs requirement',
    compareMeta: 'the tick marks the required level',
    candidateLevel: 'Candidate',
    required: 'Required',
    status: { strong: 'Strong', present: 'Present', gap: 'Gap', missing: 'Missing' } as Record<SkillStatus, string>,
    critical: 'Critical',
    gaps: 'Critical gaps',
    quickWins: 'Quick wins (1–2 weeks)',
    roadmap: 'Suggested 4-week plan',
    salaryRef: 'Market salary reference',
    salaryRefHint: 'Reference data, use only if the candidate asks about negotiation.',
    median: 'Market median',
    range: 'Market range',
    candidateExpected: 'Candidate expects',
    verdict: 'Verdict',
    verdictText: 'Reasonable and achievable',
    strategy: 'Negotiation approach',
    perMonth: 'VND/month',
    notesTitle: 'Quick notes on this candidate',
    notesPlaceholder: 'First observations on technical strength, communication style or your advisory plan…',
    saveNote: 'Save note',
    saved: 'Saved',
    noAdvice: 'No advice data for this candidate yet.',
    cvSummary: 'Summary',
    cvExperience: 'Recent experience',
    close: 'Close',
  },
};

const SOFT_SKILLS = ['Problem Solving & Architecture', 'Team Leadership & Mentoring', 'Agile / Scrum'];

function statusTone(status: SkillStatus) {
  if (status === 'strong') return 'text-brand';
  if (status === 'present') return 'text-ink';
  if (status === 'gap') return 'text-warning';
  return 'text-danger';
}

export default function CandidateCareerAnalysisPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showCvModal, setShowCvModal] = useState(false);
  const [consultantNote, setConsultantNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const {
    data: analysis,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['candidate-career-analysis', candidateId],
    queryFn: () => getCandidateCareerAnalysis(candidateId || '1'),
    enabled: !!candidateId,
  });

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  if (isLoading) return <Loading />;
  if (isError || !analysis) {
    return (
      <div className="py-12 text-center">
        <ErrorState />
        <button type="button" onClick={() => navigate('/consultant/candidates')} className={`${textLink} mt-6 text-ink`}>
          {c.backToList}
        </button>
      </div>
    );
  }

  const { candidate, resumeDetails, skillAssessments, skillGap, salaryBenchmark } = analysis;
  const latestRequest = analysis.consultationHistory[0];

  const dims = [
    { key: 'formatting', score: resumeDetails.formattingScore },
    { key: 'keyword', score: resumeDetails.keywordScore },
    { key: 'impact', score: resumeDetails.impactScore },
    { key: 'structure', score: resumeDetails.structureScore },
  ] as const;

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <Link
          to="/consultant/candidates"
          className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} />
          {c.back}
        </Link>
        {latestRequest && (
          <Link to={`/consultant/consultations/${latestRequest.id}`} className={`${textLink} text-[13px] text-ink`}>
            {c.openRequest(latestRequest.id)}
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* Headline */}
      <Headline
        eyebrow={c.readiness[analysis.readinessLevel]}
        line1={`${candidate.name}.`}
        line2={c.line2(analysis.readinessScore, resumeDetails.atsScore)}
        intro={
          <>
            <span>
              {candidate.currentTitle} <span className="text-slate-400">→</span>{' '}
              <span className="text-ink">{candidate.targetRole}</span>
            </span>
            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>{candidate.email}</span>
              <span>{candidate.phone}</span>
              <span>{candidate.location}</span>
              {candidate.github && (
                <a href={candidate.github} target="_blank" rel="noreferrer" className={`${textLink} text-sm text-slate-600`}>
                  GitHub
                  <ExternalLink size={12} />
                </a>
              )}
            </span>
          </>
        }
        aside={<Avatar src={candidate.avatar} name={candidate.name} size="lg" />}
      >
        {analysis.consultantAdvice && (
          <button type="button" onClick={() => setActiveTab('advice')} className={primaryButton}>
            {c.giveAdvice}
            <ArrowRight size={16} />
          </button>
        )}
      </Headline>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        <StatRow
          items={[
            {
              label: c.stats.fit,
              value: (
                <>
                  {skillGap.overallFitScore}
                  <span className="text-[0.55em] text-slate-400">%</span>
                </>
              ),
              detail: c.stats.fitDetail(skillGap.targetJobTitle),
            },
            {
              label: c.stats.readiness,
              value: (
                <>
                  {analysis.readinessScore}
                  <span className="text-[0.55em] text-slate-400">%</span>
                </>
              ),
              detail: c.readiness[analysis.readinessLevel],
            },
            {
              label: c.stats.ats,
              value: (
                <>
                  {resumeDetails.atsScore}
                  <span className="text-[0.55em] text-slate-400">/100</span>
                </>
              ),
              detail: c.stats.atsDetail(resumeDetails.grade),
            },
            {
              label: c.stats.profile,
              value: (
                <>
                  {analysis.profileCompletion}
                  <span className="text-[0.55em] text-slate-400">%</span>
                </>
              ),
              detail: c.stats.profileDetail(analysis.availability),
            },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <UnderlineTabs
          size="lg"
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'profile', label: c.tabs.profile },
            { value: 'ats', label: c.tabs.ats, count: resumeDetails.atsScore },
            { value: 'assessment', label: c.tabs.assessment, count: skillAssessments.length },
            { value: 'gap', label: c.tabs.gap, count: `${skillGap.overallFitScore}%` },
            { value: 'advice', label: c.tabs.advice },
          ]}
        />
      </div>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        {/* ── Profile ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="grid gap-x-[clamp(2rem,4vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)]">
            <div className="min-w-0 space-y-14">
              <section>
                <SectionHead index="01" title={c.goal} />
                <p className="pt-5 text-[clamp(1.0625rem,1.5vw,1.3125rem)] leading-[1.7] text-ink">
                  {analysis.careerGoal}
                </p>
              </section>

              <section>
                <SectionHead index="02" title={c.experience} meta={c.years(candidate.yearsOfExperience)} />
                <ol>
                  {resumeDetails.workExperience.map((exp, idx) => (
                    <li key={idx} className="grid gap-x-8 gap-y-2 border-b border-border py-6 md:grid-cols-[10rem_minmax(0,1fr)]">
                      <p className="text-[13px] tabular-nums text-slate-500">{exp.duration}</p>
                      <div className="min-w-0">
                        <h4 className="text-[17px] text-ink">{exp.role}</h4>
                        <p className="text-sm text-brand">{exp.company}</p>
                        <p className="mt-2 text-[15px] leading-7 text-slate-600">{exp.description}</p>
                        <ul className="mt-3 space-y-1.5">
                          {exp.highlights.map((hl, hIdx) => (
                            <li key={hIdx} className="flex gap-3 text-sm leading-6 text-slate-700">
                              <span className="mt-[0.7rem] h-px w-3 shrink-0 bg-slate-400" aria-hidden />
                              {hl}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <SectionHead index="03" title={c.projects} />
                <ol>
                  {resumeDetails.projects.map((proj, idx) => (
                    <li key={idx} className="grid gap-x-8 gap-y-2 border-b border-border py-6 md:grid-cols-[10rem_minmax(0,1fr)]">
                      <p className="text-[13px] text-slate-500">
                        <span className="tabular-nums text-slate-400">{pad2(idx + 1)}</span> · {proj.role}
                      </p>
                      <div className="min-w-0">
                        <h4 className="flex items-baseline gap-2 text-[17px] text-ink">
                          {proj.name}
                          {proj.link && (
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={proj.name}
                              className="text-slate-400 transition-colors hover:text-brand"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </h4>
                        <p className="mt-1.5 text-[15px] leading-7 text-slate-600">{proj.description}</p>
                        <p className="mt-2 text-[13px] text-slate-500">{proj.techStack.join(' · ')}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="min-w-0 space-y-12">
              <section>
                <SectionHead index="04" title={c.skills} />
                <p className="mt-5 text-[13px] text-slate-500">{c.technical}</p>
                <ul className="mt-1">
                  {candidate.topSkills.map((sk) => (
                    <li key={sk} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
                      <span className="text-ink">{sk}</span>
                      <span className="text-[13px] text-slate-500">{c.level}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[13px] text-slate-500">{c.soft}</p>
                <p className="mt-1 text-sm leading-6 text-ink">{SOFT_SKILLS.join(' · ')}</p>
              </section>

              <section>
                <SectionHead index="05" title={c.education} />
                <ul>
                  {resumeDetails.education.map((edu, idx) => (
                    <li key={idx} className="border-b border-border py-4">
                      <p className="text-[15px] text-ink">{edu.school}</p>
                      <p className="text-sm text-slate-600">{edu.degree}</p>
                      <p className="mt-1 flex justify-between text-[13px] tabular-nums text-slate-500">
                        <span>{edu.years}</span>
                        {edu.gpa && <span>GPA {edu.gpa}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <SectionHead index="06" title={c.preferences} />
                <dl className="text-sm">
                  {[
                    [c.availability, analysis.availability],
                    [c.employment, analysis.employmentType],
                    [c.expected, analysis.expectedSalary.split('(')[0]],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </aside>
          </div>
        )}

        {/* ── CV & ATS ──────────────────────────────────────────── */}
        {activeTab === 'ats' && (
          <div className="space-y-14">
            <section className="grid gap-6 border-y border-ink py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-10">
              <p className="text-[clamp(3.5rem,7vw,5.5rem)] font-normal leading-none tracking-[-0.04em] tabular-nums text-ink">
                {resumeDetails.atsScore}
                <span className="ml-1 text-[0.3em] tracking-normal text-slate-400">/100</span>
              </p>
              <div className="min-w-0">
                <p className="text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink">
                  {resumeDetails.name}
                  <span className="ml-3 text-sm text-brand">
                    {c.grade} {resumeDetails.grade}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{c.atsLine(resumeDetails.passProbability)}</p>
                <p className="mt-0.5 text-[13px] text-slate-400">
                  {c.updated} {resumeDetails.lastUpdated}
                </p>
              </div>
              <button type="button" onClick={() => setShowCvModal(true)} className={`${textLink} justify-self-start text-ink`}>
                {c.viewCv}
              </button>
            </section>

            <section>
              <SectionHead index="01" title={c.breakdown} />
              <div className="grid gap-x-10 sm:grid-cols-2">
                {dims.map((d) => {
                  const [label, note] = c.dims[d.key];
                  return (
                    <div key={d.key} className="border-b border-border py-5">
                      <div className="mb-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-[15px] text-ink">{label}</span>
                        <span className="text-[clamp(1.25rem,1.8vw,1.5rem)] leading-none tabular-nums text-ink">
                          {d.score}
                          <span className="text-xs text-slate-400">%</span>
                        </span>
                      </div>
                      <ThinBar value={d.score} tone={d.score < 70 ? 'warning' : 'brand'} />
                      <p className="mt-2.5 text-[13px] text-slate-500">{note}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHead index="02" title={c.keywords} />
              <div className="grid gap-x-10 md:grid-cols-2">
                <div>
                  <p className="border-b border-border py-3 text-[13px] text-slate-500">
                    {c.matched} <span className="tabular-nums">· {resumeDetails.matchedKeywords.length}</span>
                  </p>
                  <ul>
                    {resumeDetails.matchedKeywords.map((kw) => (
                      <li key={kw} className="flex items-center gap-3 border-b border-border py-2.5 text-sm text-ink">
                        <Check size={14} className="shrink-0 text-brand" />
                        {kw}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="border-b border-border py-3 text-[13px] text-slate-500">
                    {c.missing} <span className="tabular-nums">· {resumeDetails.missingKeywords.length}</span>
                  </p>
                  <ul>
                    {resumeDetails.missingKeywords.map((kw) => (
                      <li key={kw} className="flex items-center gap-3 border-b border-border py-2.5 text-sm text-slate-700">
                        <span className="h-px w-3.5 shrink-0 bg-amber-500" aria-hidden />
                        {kw}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <SectionHead index="03" title={c.improvements} />
              <ol>
                {resumeDetails.improvements.map((imp, idx) => (
                  <li key={idx} className="flex gap-5 border-b border-border py-4">
                    <span className="pt-1 text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</span>
                    <p className="text-[15px] leading-7 text-ink">{imp}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}

        {/* ── Skill tests ───────────────────────────────────────── */}
        {activeTab === 'assessment' && (
          <section>
            <SectionHead index="01" title={c.tests} meta={skillAssessments.length} />
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">{c.assessmentIntro}</p>
            <ol className="mt-4">
              {skillAssessments.map((test, idx) => (
                <li key={test.topicId} className="border-b border-border py-7">
                  <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                    <div className="min-w-0">
                      <p className="text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</p>
                      <h4 className="mt-1 text-[clamp(1.125rem,1.6vw,1.375rem)] text-ink">{test.topicName}</h4>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {test.completedAt} · {c.time} {test.timeSpent} · {c.correct(test.correctAnswers, test.totalQuestions)}
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="text-[clamp(2rem,3.5vw,2.75rem)] leading-none tabular-nums text-ink">
                        {test.score}
                        <span className="text-[0.45em] text-slate-400">%</span>
                      </span>
                      <span className="ml-3 text-sm text-brand">
                        {c.grade} {test.grade}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <ThinBar value={test.score} />
                  </div>
                  <div className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
                    <div>
                      <p className="text-[13px] text-slate-500">{c.strengths}</p>
                      <ul className="mt-2 space-y-1.5">
                        {test.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm leading-6 text-ink">
                            <Check size={14} className="mt-1 shrink-0 text-brand" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-500">{c.weaknesses}</p>
                      <ul className="mt-2 space-y-1.5">
                        {test.weaknesses.map((w, i) => (
                          <li key={i} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                            <span className="mt-[0.7rem] h-px w-3 shrink-0 bg-amber-500" aria-hidden />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-5 border-l-2 border-brand pl-4 text-sm leading-6 text-slate-700">
                    <span className="mb-0.5 block text-[13px] text-brand">{c.prompt}</span>
                    {test.consultantPrompt}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── Skill gap ─────────────────────────────────────────── */}
        {activeTab === 'gap' && (
          <div className="space-y-14">
            <section className="grid gap-6 border-y border-ink py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <p className="text-[13px] text-slate-500">{c.target}</p>
                <h3 className="mt-1 text-[clamp(1.375rem,2.4vw,2rem)] font-normal leading-tight tracking-[-0.015em] text-ink">
                  {skillGap.targetJobTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {c.benchmark}: {skillGap.companyBenchmark}
                </p>
              </div>
              <div className="flex gap-10">
                <p>
                  <span className="block text-[clamp(2.25rem,4vw,3.25rem)] leading-none tabular-nums text-brand">
                    {skillGap.overallFitScore}
                    <span className="text-[0.45em]">%</span>
                  </span>
                  <span className="text-[13px] text-slate-500">{skillGap.fitLevel}</span>
                </p>
                <p>
                  <span className="block text-[clamp(2.25rem,4vw,3.25rem)] leading-none tabular-nums text-ink">
                    {skillGap.estimatedWeeksToReady}
                  </span>
                  <span className="text-[13px] text-slate-500">{c.weeks(skillGap.estimatedWeeksToReady)}</span>
                </p>
              </div>
            </section>

            <section>
              <SectionHead index="01" title={c.compare} meta={c.compareMeta} />
              <ul>
                {skillGap.skillsAnalysis.map((sk) => (
                  <li
                    key={sk.name}
                    className="grid gap-x-8 gap-y-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,20rem)] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-3 text-[15px] text-ink">
                        {sk.name}
                        <span className={`text-[13px] ${statusTone(sk.status)}`}>{c.status[sk.status]}</span>
                        {sk.importance === 'critical' && <span className="text-[13px] text-danger">{c.critical}</span>}
                      </p>
                      <p className="text-[13px] text-slate-500">{sk.category}</p>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs tabular-nums text-slate-500">
                        <span>
                          {c.candidateLevel} <span className="text-ink">{sk.candidateLevel}%</span>
                        </span>
                        <span>
                          {c.required} <span className="text-ink">{sk.requiredLevel}%</span>
                        </span>
                      </div>
                      <ThinBar
                        value={sk.candidateLevel}
                        marker={sk.requiredLevel}
                        tone={sk.candidateLevel >= sk.requiredLevel ? 'brand' : 'warning'}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
              <section>
                <SectionHead index="02" title={c.gaps} />
                <ol>
                  {skillGap.criticalGaps.map((gap, idx) => (
                    <li key={idx} className="flex gap-4 border-b border-border py-4 text-[15px] leading-7 text-ink">
                      <span className="pt-1 text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</span>
                      {gap}
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <SectionHead index="03" title={c.quickWins} />
                <ol>
                  {skillGap.quickWins.map((win, idx) => (
                    <li key={idx} className="flex gap-4 border-b border-border py-4 text-[15px] leading-7 text-ink">
                      <span className="pt-1 text-xs tabular-nums text-slate-400">{pad2(idx + 1)}</span>
                      {win}
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section>
              <SectionHead index="04" title={c.roadmap} />
              <ol className="grid sm:grid-cols-2 sm:gap-x-10">
                {skillGap.actionRoadmap.map((step, idx) => (
                  <li key={idx} className="flex gap-4 border-b border-border py-4">
                    <span className="text-[clamp(1.25rem,1.8vw,1.5rem)] leading-none tabular-nums text-brand">
                      {pad2(idx + 1)}
                    </span>
                    <p className="text-[15px] leading-7 text-ink">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Salary benchmark kept as quiet reference, collapsed by default */}
            <details className="group border-y border-border">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 text-sm text-slate-600 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                <span>
                  {c.salaryRef}
                  <span className="ml-2 text-[13px] text-slate-400">· {salaryBenchmark.trackName}</span>
                </span>
                <span className="text-lg leading-none text-slate-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="pb-6">
                <p className="text-[13px] text-slate-500">{c.salaryRefHint}</p>
                <dl className="mt-3 text-sm">
                  {[
                    [
                      c.median,
                      `${salaryBenchmark.medianVND.toLocaleString('vi-VN')} ${c.perMonth} ($${salaryBenchmark.medianUSD})`,
                    ],
                    [
                      c.range,
                      `${salaryBenchmark.minVND.toLocaleString('vi-VN')} – ${salaryBenchmark.maxVND.toLocaleString('vi-VN')} ${c.perMonth}`,
                    ],
                    [c.candidateExpected, salaryBenchmark.candidateExpected],
                    [c.verdict, c.verdictText],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 border-b border-border py-2.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="tabular-nums text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-[13px] text-slate-500">{c.strategy}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{salaryBenchmark.negotiationStrategy}</p>
              </div>
            </details>
          </div>
        )}

        {/* ── Advice ────────────────────────────────────────────── */}
        {activeTab === 'advice' &&
          (analysis.consultantAdvice ? (
            <ConsultationAdviceBuilder
              initialAdvice={analysis.consultantAdvice}
              candidateName={candidate.name}
              candidateRole={candidate.targetRole}
              topic="CAREER_ORIENTATION"
              onSave={async (newAdv) => {
                await saveCandidateCareerAdvice(candidate.id, newAdv);
              }}
            />
          ) : (
            <p className="border-y border-border py-10 text-center text-sm text-slate-500">{c.noAdvice}</p>
          ))}
      </div>

      {/* Quick notes */}
      <section className="mt-[clamp(3rem,6vw,5rem)]">
        <SubHead
          title={c.notesTitle}
          action={
            noteSaved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-brand">
                <Check size={13} />
                {c.saved}
              </span>
            )
          }
        />
        <textarea
          rows={3}
          value={consultantNote}
          onChange={(e) => setConsultantNote(e.target.value)}
          placeholder={c.notesPlaceholder}
          className="mt-3 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] leading-7 text-ink outline-none placeholder:text-slate-400 focus:border-brand"
        />
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={handleSaveNote} className={`${textLink} text-ink`}>
            {c.saveNote}
          </button>
        </div>
      </section>

      {/* Full CV */}
      {showCvModal && (
        <Modal
          eyebrow="CV"
          title={resumeDetails.name}
          onClose={() => setShowCvModal(false)}
          footer={
            <button type="button" onClick={() => setShowCvModal(false)} className={primaryButton}>
              {c.close}
            </button>
          }
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-lg text-ink">{candidate.name}</p>
              <p className="text-sm text-slate-600">{candidate.currentTitle}</p>
            </div>
            <p className="text-right">
              <span className="block text-[clamp(1.75rem,3vw,2.25rem)] leading-none tabular-nums text-ink">
                {resumeDetails.atsScore}
              </span>
              <span className="text-xs text-slate-500">ATS / 100</span>
            </p>
          </div>
          <div className="py-4">
            <p className="text-[13px] text-slate-500">01 · {c.cvSummary}</p>
            <p className="mt-1.5 text-[15px] leading-7 text-slate-700">{analysis.careerGoal}</p>
          </div>
          <div className="border-t border-border py-4">
            <p className="text-[13px] text-slate-500">02 · {c.cvExperience}</p>
            <ul>
              {resumeDetails.workExperience.map((exp, idx) => (
                <li key={idx} className="border-b border-border py-3 last:border-b-0">
                  <p className="text-[15px] text-ink">
                    {exp.role} <span className="text-slate-400">·</span> {exp.company}
                  </p>
                  <p className="text-[13px] tabular-nums text-slate-500">{exp.duration}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{exp.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}
