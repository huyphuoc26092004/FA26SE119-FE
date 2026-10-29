import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Layers,
  Lightbulb,
  Loader2,
  RefreshCw,
  Route,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  getJobRequirementProfiles,
  analyzeSkillGap,
  getCandidateProfile,
} from '../../services/candidateService';
import type { SkillGapAnalysis, SkillGapItem } from '../../types/assessment';
import { Button, Card, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusConfig(status: SkillGapItem['status']) {
  switch (status) {
    case 'strong':
      return { color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', border: 'border-emerald-200', label: 'strong' };
    case 'present':
      return { color: 'bg-brand-400', textColor: 'text-brand-700', bgColor: 'bg-brand-50', border: 'border-brand-200', label: 'present' };
    case 'gap':
      return { color: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50', border: 'border-amber-200', label: 'gap' };
    case 'missing':
      return { color: 'bg-red-400', textColor: 'text-red-700', bgColor: 'bg-red-50', border: 'border-red-200', label: 'missing' };
  }
}

function importanceColor(importance: SkillGapItem['importance']) {
  switch (importance) {
    case 'critical': return 'text-red-700 bg-red-50';
    case 'high': return 'text-amber-700 bg-amber-50';
    case 'medium': return 'text-brand-700 bg-brand-50';
    case 'low': return 'text-slate-600 bg-slate-100';
  }
}

function readinessConfig(level: SkillGapAnalysis['readinessLevel']) {
  switch (level) {
    case 'Ready': return { from: 'bg-emerald-400', to: '', label: 'readyLevel' };
    case 'Near Ready': return { from: 'bg-brand-400', to: '', label: 'nearReadyLevel' };
    case 'Developing': return { from: 'bg-amber-400', to: '', label: 'developingLevel' };
    case 'Early Stage': return { from: 'bg-red-400', to: '', label: 'earlyStageLevel' };
  }
}

// ─── Skill Row ────────────────────────────────────────────────────────────────

function SkillRow({ skill }: { skill: SkillGapItem }) {
  const { t } = useTranslation();
  const cfg = statusConfig(skill.status);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
        <span className="text-sm font-semibold text-slate-800 truncate">{skill.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold flex-shrink-0 ${importanceColor(skill.importance)}`}>
          {t(`skillGap.${skill.importance}`)}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        {/* Level bars */}
        <div className="flex flex-col gap-1 w-36">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{t('skillGap.yourLevel')}</span>
            <span className="font-medium">{skill.candidateLevel}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div
              className={`h-1.5 rounded-full transition-all ${
                (skill.candidateLevel ?? 0) >= (skill.requiredLevel ?? 0) ? 'bg-emerald-500' : 'bg-brand-400'
              }`}
              style={{ width: `${skill.candidateLevel ?? 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{t('skillGap.requiredLevel')}</span>
            <span className="font-medium">{skill.requiredLevel}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${skill.requiredLevel ?? 0}%` }} />
          </div>
        </div>

        {/* Status badge */}
        <span className={`rounded-lg px-2.5 py-1 text-xs font-medium w-16 text-center ${cfg.textColor} ${cfg.bgColor}`}>
          {t(`skillGap.${cfg.label}`)}
        </span>
      </div>
    </div>
  );
}

// ─── Critical Gap Card ────────────────────────────────────────────────────────

function CriticalGapCard({ skill }: { skill: SkillGapItem }) {
  const { t } = useTranslation();
  const cfg = statusConfig(skill.status);
  return (
    <Card className={`border ${cfg.border} ${cfg.bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${cfg.textColor}`}>{skill.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t('skillGap.gapScore')}: {skill.gapScore ?? 0} pts · {skill.category}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${importanceColor(skill.importance)}`}>
          {t(`skillGap.${skill.importance}`)}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/70">
        <div
          className={`h-1.5 rounded-full ${cfg.color} transition-all`}
          style={{ width: `${skill.candidateLevel ?? 0}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{skill.candidateLevel}% {t('skillGap.yourLevel')}</span>
        <span>{skill.requiredLevel}% {t('skillGap.requiredLevel')}</span>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SkillGapPage() {
  const { t } = useTranslation();

  const [selectedProfileId, setSelectedProfileId] = useState('jd-1');
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'strong' | 'present' | 'gap' | 'missing'>('all');
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  // Load job profiles
  const { data: profiles = [], isPending: isProfilesLoading } = useQuery({
    queryKey: ['jobRequirementProfiles'],
    queryFn: getJobRequirementProfiles,
  });

  // Load candidate profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getCandidateProfile,
  });

  const analyzeMutation = useMutation({
    mutationFn: (jobProfileId: string) =>
      analyzeSkillGap({
        jobProfileId,
        candidateSkills: profile?.skills ?? undefined,
      }),
    onSuccess: (data) => {
      setAnalysis(data);
      setFilterCategory('all');
      setShowFullBreakdown(false);
    },
  });

  const filteredSkills = useMemo(() => {
    if (!analysis) return [];
    if (filterCategory === 'all') return analysis.skillBreakdown;
    return analysis.skillBreakdown.filter((s) => s.status === filterCategory);
  }, [analysis, filterCategory]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const readiness = analysis ? readinessConfig(analysis.readinessLevel) : null;

  const categories: Array<{ value: typeof filterCategory; label: string; count?: number }> = [
    { value: 'all', label: t('common.all'), count: analysis?.skillBreakdown.length },
    { value: 'strong', label: t('skillGap.strong'), count: analysis?.skillBreakdown.filter((s) => s.status === 'strong').length },
    { value: 'present', label: t('skillGap.present'), count: analysis?.skillBreakdown.filter((s) => s.status === 'present').length },
    { value: 'gap', label: t('skillGap.gap'), count: analysis?.skillBreakdown.filter((s) => s.status === 'gap').length },
    { value: 'missing', label: t('skillGap.missing'), count: analysis?.skillBreakdown.filter((s) => s.status === 'missing').length },
  ];

  if (isProfilesLoading) {
    return (
      <>
        <PageTitle title={t('skillGap.title')} subtitle={t('skillGap.subtitle')} />
        <Loading />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title={t('skillGap.title')}
        subtitle={t('skillGap.subtitle')}
        action={
          analysis && (
            <Button
              variant="secondary"
              onClick={() => {
                // Clear cache and re-analyze
                try {
                  localStorage.removeItem(`careerpilot-skill-gap-cache-${selectedProfileId}`);
                } catch { /* ignore */ }
                setAnalysis(null);
                analyzeMutation.mutate(selectedProfileId);
              }}
            >
              <RefreshCw size={15} />
              {t('skillGap.reanalyze')}
            </Button>
          )
        }
      />

      {/* Job Profile Selector */}
      <Card className="mb-6">
        <p className="mb-3 text-sm font-medium text-slate-700">{t('skillGap.selectJobProfile')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              id={`job-profile-${p.id}`}
              onClick={() => setSelectedProfileId(p.id)}
              className={`rounded-xl border p-4 text-left transition   ${
                selectedProfileId === p.id
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-slate-200 bg-surface hover:border-brand-300'
              }`}
            >
              <p className="text-sm font-medium text-slate-800">{p.title}</p>
              <p className="mt-1 text-xs text-slate-500">{p.company} · {p.level}</p>
              <p className="mt-2 text-[11px] text-slate-400">{p.requiredSkills.length} required skills</p>
            </button>
          ))}
        </div>

        {/* Candidate Skills Preview */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="mb-2 text-xs font-semibold text-slate-600">{t('skillGap.candidateSkills')}:</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.slice(0, 12).map((skill) => (
                <span key={skill} className="rounded-full bg-surface border border-slate-200 px-2.5 py-1 text-xs text-slate-600 font-medium">
                  {skill}
                </span>
              ))}
              {profile.skills.length > 12 && (
                <span className="text-xs text-slate-400 self-center">+{profile.skills.length - 12} more</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button
            id="analyze-skill-gap-btn"
            variant="primary"
            onClick={() => analyzeMutation.mutate(selectedProfileId)}
            disabled={analyzeMutation.isPending}
            className="w-full sm:w-auto"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t('skillGap.analyzing')}
              </>
            ) : (
              <>
                <Lightbulb size={15} />
                {t('skillGap.analyzeNow')}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {analyzeMutation.isPending && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <p className="text-sm font-medium">{t('skillGap.analyzing')}</p>
            <p className="text-xs text-slate-400">
              Analyzing against {selectedProfile?.title} at {selectedProfile?.company}…
            </p>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && !analyzeMutation.isPending && (
        <div className="space-y-5">
          {/* Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Overall Match */}
            <Card className={`border-0  ${readiness?.from} ${readiness?.to} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold opacity-80">{t('skillGap.overallMatch')}</p>
                  <p className="text-4xl font-semibold mt-1">{analysis.overallMatchScore}%</p>
                </div>
                <Target size={36} className="opacity-30" />
              </div>
              <p className="mt-3 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-center">
                {t(`skillGap.${readiness?.label}`)}
              </p>
            </Card>

            {/* Critical Gaps */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{t('skillGap.criticalGaps')}</span>
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <p className="text-4xl font-semibold text-slate-900">{analysis.criticalGaps.length}</p>
              <p className="mt-2 text-xs text-slate-500">
                {analysis.criticalGaps.length === 0
                  ? t('skillGap.noGaps')
                  : `Top: ${analysis.criticalGaps.slice(0, 2).map((g) => g.name).join(', ')}`}
              </p>
            </Card>

            {/* Estimated Weeks */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{t('skillGap.estimatedWeeks')}</span>
                <TrendingUp size={18} className="text-brand-400" />
              </div>
              <p className="text-4xl font-semibold text-slate-900">{analysis.estimatedWeeksToReady}w</p>
              <p className="mt-2 text-xs text-slate-500">{t('skillGap.weeksToReady').replace('{n}', String(analysis.estimatedWeeksToReady))}</p>
            </Card>
          </div>

          {/* Critical Gaps Section */}
          {analysis.criticalGaps.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-base font-medium text-slate-800">
                <AlertCircle size={18} className="text-red-500" />
                {t('skillGap.criticalGaps')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.criticalGaps.map((skill) => (
                  <CriticalGapCard key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {analysis.quickWins.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-base font-medium text-slate-800">
                <Zap size={18} className="text-amber-500" />
                {t('skillGap.quickWins')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.quickWins.map((skill) => (
                  <Card key={skill.name} className="border-amber-200 bg-amber-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-800">{skill.name}</p>
                        <p className="mt-1 text-xs text-amber-600">{skill.category} · Gap: {skill.gapScore} pts</p>
                      </div>
                      <Zap size={16} className="text-amber-500 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan */}
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-base font-medium text-slate-800">
              <MessageSquare size={18} className="text-brand-600" />
              {t('skillGap.actionPlan')}
            </h2>
            <div className="space-y-3">
              {analysis.actionPlan.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-medium">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Full Skill Breakdown */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-medium text-slate-800">
                <Layers size={18} className="text-slate-400" />
                {t('skillGap.skillBreakdown')}
              </h2>
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filterCategory === cat.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                    {cat.count !== undefined && (
                      <span className="ml-1 opacity-70">({cat.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {(showFullBreakdown ? filteredSkills : filteredSkills.slice(0, 6)).map((skill) => (
                <SkillRow key={skill.name} skill={skill} />
              ))}
            </div>

            {filteredSkills.length > 6 && (
              <button
                onClick={() => setShowFullBreakdown(!showFullBreakdown)}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"
              >
                {showFullBreakdown ? (
                  <>
                    <ChevronUp size={15} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={15} /> Show all {filteredSkills.length} skills
                  </>
                )}
              </button>
            )}
          </div>

          {/* CTA */}
          <Card className="border-brand-200 bg-brand-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-600 p-2">
                  <Route size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-800">{t('skillGap.goToRoadmap')}</p>
                  <p className="text-xs text-brand-600 mt-1">
                    Get a week-by-week learning plan tailored to bridge these gaps.
                  </p>
                </div>
              </div>
              <Link to="/candidate/learning">
                <Button variant="primary" className="flex-shrink-0">
                  {t('skillGap.goToRoadmap')}
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
