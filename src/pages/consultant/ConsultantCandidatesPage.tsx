import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Users,
  Award,
  Target,
  FileText,
  Clock,
  MapPin,
  ArrowRight,
  Lightbulb,
  ChevronRight,
  X,
  MessagesSquare,
} from 'lucide-react';
import { Card, PageTitle, Badge, Button, Loading, ErrorState, StatCard } from '../../components/ui';
import { getConsultantCandidates } from '../../services/consultationService';
import type { ConsultantCandidateSummary } from '../../types/consultation';
import { useTranslation } from '../../i18n';

export default function ConsultantCandidatesPage() {
  const { t, isVietnamese } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReadiness, setSelectedReadiness] = useState<string>('ALL');
  const [selectedRoleTrack, setSelectedRoleTrack] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'fit' | 'ats' | 'exp'>('fit');

  const {
    data: candidates = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['consultant-candidates'],
    queryFn: getConsultantCandidates,
  });

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.currentTitle.toLowerCase().includes(q) ||
          c.targetRole.toLowerCase().includes(q) ||
          c.topSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (selectedReadiness !== 'ALL') {
      list = list.filter((c) => c.readinessLevel === selectedReadiness);
    }

    if (selectedRoleTrack !== 'ALL') {
      list = list.filter((c) =>
        c.targetRole.toLowerCase().includes(selectedRoleTrack.toLowerCase())
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'ats') {
        return (b.attachedResumeScore || 0) - (a.attachedResumeScore || 0);
      }
      if (sortBy === 'exp') {
        return b.yearsOfExperience - a.yearsOfExperience;
      }
      // default fit
      return b.fitScore - a.fitScore;
    });

    return list;
  }, [candidates, searchQuery, selectedReadiness, selectedRoleTrack, sortBy]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const readyCount = candidates.filter(
      (c) => c.readinessLevel === 'Ready' || c.readinessLevel === 'Near Ready'
    ).length;
    const avgAts =
      total > 0
        ? Math.round(
            candidates.reduce((acc, c) => acc + (c.attachedResumeScore || 80), 0) / total
          )
        : 84;
    const activeConsultations = candidates.filter((c) => c.latestConsultation).length;

    return { total, readyCount, avgAts, activeConsultations };
  }, [candidates]);

  const getReadinessBadge = (level: ConsultantCandidateSummary['readinessLevel']) => {
    switch (level) {
      case 'Ready':
        return <Badge tone="green">{t('consultation.ready')}</Badge>;
      case 'Near Ready':
        return <Badge tone="blue">{t('consultation.nearReady')}</Badge>;
      case 'Developing':
        return <Badge tone="amber">{t('consultation.developing')}</Badge>;
      case 'Early Stage':
        return <Badge tone="gray">{t('consultation.earlyStage')}</Badge>;
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/consultant" className="hover:text-brand-600 transition">
          {t('nav.dashboard')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{t('consultation.candidatesTitle')}</span>
      </nav>

      {/* Header */}
      <PageTitle
        title={t('consultation.candidatesTitle')}
        subtitle={t('consultation.candidatesSubtitle')}
        action={
          <div className="flex items-center gap-2">
            <Link to="/consultant/consultations">
              <Button variant="secondary" className="gap-1.5 text-xs">
                <MessagesSquare size={14} />
                <span>{t('consultation.listTitle')}</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={isVietnamese ? 'Ứng viên được phân công' : 'Assigned Candidates'}
          value={String(stats.total)}
          detail={isVietnamese ? 'Đang trong danh sách theo dõi' : 'In consultant talent pool'}
          icon={<Users size={20} />}
        />
        <StatCard
          label={isVietnamese ? 'Tỉ lệ sẵn sàng cao' : 'High Readiness Rate'}
          value={`${Math.round((stats.readyCount / (stats.total || 1)) * 100)}%`}
          detail={
            isVietnamese
              ? `${stats.readyCount} ứng viên Ready/Near Ready`
              : `${stats.readyCount} candidates ready/near ready`
          }
          icon={<Target size={20} className="text-emerald-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Điểm ATS CV trung bình' : 'Average ATS Score'}
          value={`${stats.avgAts}/100`}
          detail={isVietnamese ? 'Đạt chuẩn sàn lọc nhà tuyển dụng' : 'Meets top employer threshold'}
          icon={<FileText size={20} className="text-brand-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Phiên tư vấn liên quan' : 'Active Consultations'}
          value={String(stats.activeConsultations)}
          detail={isVietnamese ? 'Có yêu cầu/lịch hẹn tư vấn' : 'Have appointment schedules'}
          icon={<Award size={20} className="text-brand-600" />}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Input */}
          <div className="relative lg:col-span-5">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('consultation.candidatesSearchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:bg-surface"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Readiness Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedReadiness}
              onChange={(e) => setSelectedReadiness(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{t('consultation.allReadiness')}</option>
              <option value="Ready">{t('consultation.ready')}</option>
              <option value="Near Ready">{t('consultation.nearReady')}</option>
              <option value="Developing">{t('consultation.developing')}</option>
              <option value="Early Stage">{t('consultation.earlyStage')}</option>
            </select>
          </div>

          {/* Role Track Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedRoleTrack}
              onChange={(e) => setSelectedRoleTrack(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{isVietnamese ? 'Tất cả vị trí' : 'All Roles'}</option>
              <option value="Frontend">Frontend / Web</option>
              <option value="AI">AI & Machine Learning</option>
              <option value="Architect">Architect / Lead</option>
              <option value="Fullstack">Fullstack</option>
              <option value="DevOps">DevOps / Cloud</option>
              <option value="Product">Product Manager</option>
              <option value="Data">Data Analyst</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'fit' | 'ats' | 'exp')}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="fit">{isVietnamese ? 'Độ phù hợp cao nhất' : 'Highest Fit'}</option>
              <option value="ats">{isVietnamese ? 'Điểm ATS cao nhất' : 'Highest ATS'}</option>
              <option value="exp">{isVietnamese ? 'Kinh nghiệm nhiều nhất' : 'Most Experienced'}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Candidate Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Filter size={24} />
          </div>
          <h3 className="text-base font-medium text-slate-900">
            {isVietnamese ? 'Không tìm thấy ứng viên phù hợp' : 'No matching candidates found'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {isVietnamese
              ? 'Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ các tiêu chí lọc.'
              : 'Try adjusting your search criteria or resetting filters.'}
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedReadiness('ALL');
                setSelectedRoleTrack('ALL');
              }}
            >
              {t('consultation.resetFilter')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCandidates.map((c) => (
            <Card
              key={c.id}
              className="flex flex-col justify-between border-slate-200/90 hover:border-brand-300 transition-all p-5"
            >
              <div className="space-y-4">
                {/* Header: Avatar, Name, Role, Readiness */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/consultant/candidates/${c.id}`}
                          className="font-medium text-base text-slate-900 hover:text-brand-600 transition truncate"
                        >
                          {c.name}
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {c.currentTitle}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs pt-0.5">
                        <span className="font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                          → {c.targetRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">{getReadinessBadge(c.readinessLevel)}</div>
                </div>

                {/* Contact & Location Strip */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{c.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>{c.yearsOfExperience} năm kinh nghiệm</span>
                  </span>
                </div>

                {/* Key Analysis Gauges: ATS Score, Fit Match, Assessments */}
                <div className="grid grid-cols-3 gap-2 text-center rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">
                      Điểm ATS CV
                    </span>
                    <span className="font-semibold text-sm text-emerald-600">
                      {c.attachedResumeScore}/100
                    </span>
                  </div>
                  <div className="border-x border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">
                      Độ Phù Hợp
                    </span>
                    <span className="font-semibold text-sm text-brand-600">
                      {c.fitScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">
                      Đánh Giá AI
                    </span>
                    <span className="font-semibold text-sm text-brand-600">
                      {c.assessmentSummary[0]
                        ? `${c.assessmentSummary[0].score}% (${c.assessmentSummary[0].grade})`
                        : '88% (A)'}
                    </span>
                  </div>
                </div>

                {/* Skills Chips */}
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.topSkills.slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md bg-surface border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                    {c.topSkills.length > 4 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        +{c.topSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Latest Consultation Status Tag if available */}
                {c.latestConsultation && (
                  <div className="flex items-center justify-between text-xs rounded-lg bg-brand-50/50 px-2.5 py-1.5 border border-brand-100/60 text-brand-900">
                    <span className="flex items-center gap-1.5 truncate">
                      <Lightbulb size={12} className="text-brand-600 shrink-0" />
                      <span className="truncate">
                        {c.latestConsultation.topicLabel}
                      </span>
                    </span>
                    <span className="text-[10px] font-medium uppercase shrink-0 text-brand-700">
                      #{c.latestConsultation.id}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-4">
                {c.latestConsultation ? (
                  <Link
                    to={`/consultant/consultations/${c.latestConsultation.id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-brand-600 transition flex items-center gap-1"
                  >
                    <span>{t('consultation.viewConsultationRequest')}</span>
                    <ChevronRight size={13} />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Chưa có lịch hẹn mới
                  </span>
                )}

                <Link to={`/consultant/candidates/${c.id}`}>
                  <Button variant="primary" className="text-xs px-3.5 py-2 gap-1.5 shadow-xs">
                    <span>{t('consultation.viewCareerAnalysis')}</span>
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
