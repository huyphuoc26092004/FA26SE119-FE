import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Globe2,
  Loader2,
  Route,
  Lightbulb,
  Star,
  Target,
  Video,
  Zap,
} from 'lucide-react';
import {
  getLearningRoadmapTemplates,
  getPersonalizedRoadmap,
  getLearningResources,
} from '../../mocks/services/mockService';
import type { LearningRoadmap, LearningResource, RoadmapPhase } from '../../types/assessment';
import { Button, Card, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { Link } from 'react-router-dom';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phaseColorClasses(color: string) {
  switch (color) {
    case 'blue': return { bg: 'bg-brand-50', border: 'border-brand-200', text: 'text-brand-800', accent: 'bg-brand-600', badge: 'bg-brand-100 text-brand-700' };
    case 'violet': return { bg: 'bg-brand-50', border: 'border-brand-200', text: 'text-brand-800', accent: 'bg-brand-600', badge: 'bg-brand-100 text-brand-700' };
    case 'emerald': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
    case 'amber': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', accent: 'bg-amber-600', badge: 'bg-amber-100 text-amber-700' };
    default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', accent: 'bg-slate-600', badge: 'bg-slate-100 text-slate-700' };
  }
}

function resourceTypeIcon(type: LearningResource['type']) {
  switch (type) {
    case 'course': return <GraduationCap size={14} className="text-brand-600" />;
    case 'docs': return <FileText size={14} className="text-emerald-600" />;
    case 'book': return <BookOpen size={14} className="text-amber-600" />;
    case 'article': return <Globe2 size={14} className="text-slate-500" />;
    case 'video': return <Video size={14} className="text-red-500" />;
    case 'certification': return <Award size={14} className="text-brand-600" />;
    default: return <Zap size={14} className="text-orange-500" />;
  }
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

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: LearningResource }) {
  const { t } = useTranslation();
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      id={`resource-${resource.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm transition hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {resourceTypeIcon(resource.type)}
          <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700 transition">
            {resource.title}
          </span>
        </div>
        <ExternalLink size={14} className="text-slate-400 flex-shrink-0 group-hover:text-brand-500 transition" />
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {t(`learningRoadmap.${resourceTypeKey(resource.type)}`)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${resource.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {resource.isFree ? t('learningRoadmap.free') : t('learningRoadmap.paid')}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 flex items-center gap-1">
          <Clock size={10} />
          {resource.duration}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{resource.provider}</span>
        <div className="flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-slate-700">{resource.rating.toFixed(1)}</span>
        </div>
      </div>

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

// ─── Phase Card ───────────────────────────────────────────────────────────────

function PhaseCard({ phase, phaseIndex }: { phase: RoadmapPhase; phaseIndex: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(phaseIndex === 0);
  const colors = phaseColorClasses(phase.color);

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Phase Header */}
      <button
        id={`phase-${phase.id}`}
        className="w-full text-left p-5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colors.accent} text-white text-sm font-semibold`}>
              {phaseIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-base font-medium ${colors.text}`}>{phase.title}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors.badge}`}>
                  {phase.weekRange}
                </span>
                {phase.completed && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={11} />
                    {t('learningRoadmap.completed')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{phase.goal}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {phase.skills.slice(0, 2).map((skill) => (
                <span key={skill} className="rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {skill.split(' ')[0]}
                </span>
              ))}
              {phase.skills.length > 2 && (
                <span className="text-xs text-slate-400 self-center">+{phase.skills.length - 2}</span>
              )}
            </div>
            {expanded ? (
              <ChevronUp size={18} className="text-slate-500" />
            ) : (
              <ChevronDown size={18} className="text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {/* Phase Body */}
      {expanded && (
        <div className="border-t border-white/60 bg-white/60 p-5 space-y-5">
          {/* Skills */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600 uppercase tracking-wider">{t('learningRoadmap.skills')}</p>
            <div className="flex flex-wrap gap-2">
              {phase.skills.map((skill) => (
                <span key={skill} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${colors.badge}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Milestone */}
          <div className="rounded-xl bg-surface p-4 border border-slate-100">
            <div className="flex items-start gap-2">
              <Target size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1">{t('learningRoadmap.milestone')}</p>
                <p className="text-sm text-slate-700">{phase.milestone}</p>
              </div>
            </div>
          </div>

          {/* Resources */}
          {phase.resources && phase.resources.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                {t('learningRoadmap.resources')} ({phase.resources.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {phase.resources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Resource Library View ────────────────────────────────────────────────────

function ResourceLibrary() {
  const { t } = useTranslation();
  const [skillFilter, setSkillFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<LearningResource['type'] | 'all'>('all');

  const { data: resources = [], isPending } = useQuery({
    queryKey: ['learningResources'],
    queryFn: () => getLearningResources(),
  });

  const filtered = useMemo(() => {
    let list = resources;
    if (skillFilter.trim()) {
      const q = skillFilter.toLowerCase();
      list = list.filter(
        (r) => r.skill.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.tags.some((t) => t.includes(q))
      );
    }
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);
    return list;
  }, [resources, skillFilter, typeFilter]);

  const types: Array<{ value: typeof typeFilter; label: string }> = [
    { value: 'all', label: t('common.all') },
    { value: 'course', label: t('learningRoadmap.typeCourse') },
    { value: 'docs', label: t('learningRoadmap.typeDocs') },
    { value: 'book', label: t('learningRoadmap.typeBook') },
    { value: 'certification', label: t('learningRoadmap.typeCertification') },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium text-slate-800 flex items-center gap-2">
        <BookOpen size={18} className="text-slate-400" />
        {t('learningRoadmap.allResources')} ({filtered.length})
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('learningRoadmap.filterBySkill')}
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-surface pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => setTypeFilter(type.value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                typeFilter === type.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-slate-500">No resources match your filter.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((res) => (
            <ResourceCard key={res.id} resource={res} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LearningRoadmapPage() {
  const { t } = useTranslation();

  const [selectedTemplateId, setSelectedTemplateId] = useState('roadmap-fe-senior');
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'library'>('roadmap');

  const { data: templates = [], isPending: isTemplatesLoading } = useQuery({
    queryKey: ['roadmapTemplates'],
    queryFn: getLearningRoadmapTemplates,
  });

  const generateMutation = useMutation({
    mutationFn: (templateId: string) =>
      getPersonalizedRoadmap({ targetRoleId: templateId }),
    onSuccess: (data) => setRoadmap(data),
  });


  // Progress stats
  const completedPhases = roadmap?.phases.filter((p) => p.completed).length ?? 0;
  const totalPhases = roadmap?.phases.length ?? 0;
  const progressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  if (isTemplatesLoading) {
    return (
      <>
        <PageTitle title={t('learningRoadmap.title')} subtitle={t('learningRoadmap.subtitle')} />
        <Loading />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title={t('learningRoadmap.title')}
        subtitle={t('learningRoadmap.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <Link to="/candidate/assessment">
              <Button variant="secondary">
                <Zap size={15} />
                {t('nav.skillAssessment')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {[
          { value: 'roadmap', label: t('nav.learningRoadmap'), icon: <Route size={15} /> },
          { value: 'library', label: t('learningRoadmap.allResources'), icon: <BookOpen size={15} /> },
        ].map((tab) => (
          <button
            key={tab.value}
            id={`tab-${tab.value}`}
            onClick={() => setActiveTab(tab.value as typeof activeTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Library tab */}
      {activeTab === 'library' && <ResourceLibrary />}

      {/* Roadmap tab */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Track Selector */}
          <Card>
            <p className="mb-3 text-sm font-medium text-slate-700">{t('learningRoadmap.selectRoadmap')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  id={`template-${template.id}`}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setRoadmap(null);
                  }}
                  className={`rounded-xl border p-4 text-left transition  hover:shadow-sm ${
                    selectedTemplateId === template.id
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-slate-200 bg-surface hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{template.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{template.targetRole}</p>
                    </div>
                    <span className="rounded-full bg-brand-50 border border-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                      {template.totalWeeks} {t('learningRoadmap.weeks')}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.phases.map((p) => (
                      <span key={p.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                        {p.title}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                id="generate-roadmap-btn"
                variant="primary"
                onClick={() => generateMutation.mutate(selectedTemplateId)}
                disabled={generateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t('learningRoadmap.generating')}
                  </>
                ) : (
                  <>
                    <Lightbulb size={15} />
                    {t('learningRoadmap.generateRoadmap')}
                  </>
                )}
              </Button>
              <Link to="/candidate/assessment">
                <Button variant="secondary">
                  <Zap size={15} />
                  {t('skillAssessment.title')}
                </Button>
              </Link>
            </div>
          </Card>

          {/* No roadmap yet */}
          {!roadmap && !generateMutation.isPending && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center gap-4 py-10 text-slate-400">
                <Route size={40} className="opacity-40" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">{t('learningRoadmap.noRoadmap')}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    AI will tailor a learning path based on your profile and skill gaps.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Loading roadmap */}
          {generateMutation.isPending && (
            <Card>
              <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
                <Loader2 size={32} className="animate-spin text-brand-500" />
                <p className="text-sm font-medium">{t('learningRoadmap.generating')}</p>
              </div>
            </Card>
          )}

          {/* Roadmap Display */}
          {roadmap && !generateMutation.isPending && (
            <div className="space-y-5">
              {/* Roadmap Header */}
              <Card className="border-0 bg-brand-600 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white/20 p-3">
                      <Route size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold opacity-80">{t('learningRoadmap.aiRecommended')}</p>
                      <p className="text-xl font-semibold">{roadmap.title}</p>
                      <p className="text-sm opacity-80">{roadmap.targetRole}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-70">{t('learningRoadmap.totalWeeks')}</p>
                    <p className="text-3xl font-semibold">{roadmap.totalWeeks}w</p>
                    <p className="text-xs opacity-70">
                      {t('learningRoadmap.generatedAt')} {new Date(roadmap.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {totalPhases > 0 && (
                  <div className="mt-5">
                    <div className="mb-1 flex items-center justify-between text-xs opacity-80">
                      <span>{t('learningRoadmap.progress')}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/20">
                      <div
                        className="h-2 rounded-full bg-white/70 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Phases */}
              <div className="space-y-4">
                {roadmap.phases.map((phase, idx) => (
                  <PhaseCard key={phase.id} phase={phase} phaseIndex={idx} />
                ))}
              </div>

              {/* CTA to Skill Gap */}
              <Card className="border-brand-200 bg-brand-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-600 p-2">
                      <MessageSquare size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-800">
                        Personalize with your skill gap data
                      </p>
                      <p className="mt-1 text-xs text-brand-600">
                        Run a skill gap analysis to get an even more targeted roadmap.
                      </p>
                    </div>
                  </div>
                  <Link to="/candidate/skill-gap">
                    <Button variant="secondary" className="flex-shrink-0 border-brand-300 text-brand-700 hover:bg-brand-100">
                      {t('nav.skillAssessment')} →
                      <ArrowUpRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
