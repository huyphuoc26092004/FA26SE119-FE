import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Video,
  ExternalLink,
  ArrowRight,
  FileText,
  Compass,
  DollarSign,
  Route,
  Clock,
  MapPin,
  X,
  Check,
} from 'lucide-react';
import { Card, PageTitle, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getConsultationRequests,
  updateConsultationStatus,
} from '../../services/consultationService';
import type {
  ConsultationStatus,
  ConsultationPriority,
  ConsultationTopic,
} from '../../types/consultation';
import { useTranslation } from '../../i18n';

export default function ConsultationListPage() {
  const { t, isVietnamese } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // URL state sync for filter
  const statusParam = (searchParams.get('status') as ConsultationStatus | 'ALL') || 'ALL';
  const priorityParam = (searchParams.get('priority') as ConsultationPriority | 'ALL') || 'ALL';
  const topicParam = (searchParams.get('topic') as ConsultationTopic | 'ALL') || 'ALL';
  const queryParam = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') as 'newest' | 'oldest' | 'scheduled' | 'priority') || 'newest';

  const [searchQuery, setSearchQuery] = useState(queryParam);

  const {
    data: requests = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['consultation-requests'],
    queryFn: () => getConsultationRequests(),
  });

  // Quick accept mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      updateConsultationStatus(id, 'SCHEDULED', 'Cố vấn đã tiếp nhận nhanh từ danh sách.'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      showToast(
        isVietnamese
          ? `Đã tiếp nhận yêu cầu #${updated.id} của ứng viên ${updated.candidate.name}!`
          : `Accepted request #${updated.id} from ${updated.candidate.name}!`
      );
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  // Filtered and sorted data
  const filteredList = useMemo(() => {
    let list = [...requests];

    if (statusParam !== 'ALL') {
      list = list.filter((r) => r.status === statusParam);
    }

    if (priorityParam !== 'ALL') {
      list = list.filter((r) => r.priority === priorityParam);
    }

    if (topicParam !== 'ALL') {
      list = list.filter((r) => r.topic === topicParam);
    }

    if (queryParam.trim()) {
      const q = queryParam.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.candidate.name.toLowerCase().includes(q) ||
          r.candidate.email.toLowerCase().includes(q) ||
          r.candidate.targetRole.toLowerCase().includes(q) ||
          r.topicLabel.toLowerCase().includes(q) ||
          r.targetGoal.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortParam === 'priority') {
        const priorityOrder: Record<ConsultationPriority, number> = {
          URGENT: 3,
          HIGH: 2,
          NORMAL: 1,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortParam === 'scheduled') {
        return new Date(a.meeting.scheduledAt).getTime() - new Date(b.meeting.scheduledAt).getTime();
      }
      if (sortParam === 'oldest') {
        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      }
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });

    return list;
  }, [requests, statusParam, priorityParam, topicParam, queryParam, sortParam]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      scheduled: requests.filter((r) => r.status === 'SCHEDULED').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      cancelled: requests.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [requests]);

  const getTopicIcon = (topic: ConsultationTopic) => {
    switch (topic) {
      case 'CV_REVIEW':
        return <FileText size={15} className="text-brand-600" />;
      case 'CAREER_ORIENTATION':
        return <Compass size={15} className="text-amber-600" />;
      case 'MOCK_INTERVIEW':
        return <Video size={15} className="text-emerald-600" />;
      case 'SALARY_NEGOTIATION':
        return <DollarSign size={15} className="text-brand-600" />;
      case 'SKILL_ROADMAP':
        return <Route size={15} className="text-brand-600" />;
      default:
        return <FileText size={15} className="text-brand-600" />;
    }
  };

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge tone="amber">{t('consultation.pending')}</Badge>;
      case 'SCHEDULED':
        return <Badge tone="blue">{t('consultation.scheduled')}</Badge>;
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('consultation.inProgress')}
          </span>
        );
      case 'COMPLETED':
        return <Badge tone="green">{t('consultation.completed')}</Badge>;
      case 'CANCELLED':
        return <Badge tone="gray">{t('consultation.cancelled')}</Badge>;
    }
  };

  const getPriorityBadge = (priority: ConsultationPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
            <AlertCircle size={12} />
            {t('consultation.urgent')}
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
            {t('consultation.high')}
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {t('consultation.normal')}
          </span>
        );
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/consultant" className="hover:text-brand-600 transition">
          {t('nav.dashboard')}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{t('consultation.listTitle')}</span>
      </nav>

      {/* Header */}
      <PageTitle
        title={t('consultation.listTitle')}
        subtitle={t('consultation.listSubtitle')}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="blue">
              {t('consultation.totalRequestsCount').replace('{count}', String(requests.length))}
            </Badge>
          </div>
        }
      />

      {/* Search & Status Filters */}
      <Card className="p-4 sm:p-5 space-y-4">
        {/* Search Bar & Secondary Dropdowns */}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFilterChange('q', searchQuery);
              }}
              placeholder={t('consultation.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:bg-surface"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange('q', '');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Topic Filter */}
          <div className="lg:col-span-3">
            <select
              value={topicParam}
              onChange={(e) => handleFilterChange('topic', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{t('consultation.allTopics')}</option>
              <option value="CV_REVIEW">Tối ưu CV & ATS</option>
              <option value="CAREER_ORIENTATION">Định hướng & Chuyển ngành</option>
              <option value="MOCK_INTERVIEW">Phỏng vấn thử chuyên sâu</option>
              <option value="SALARY_NEGOTIATION">Định giá & Đàm phán lương</option>
              <option value="SKILL_ROADMAP">Lộ trình kỹ năng & Gap</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="lg:col-span-2">
            <select
              value={priorityParam}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{t('consultation.allPriorities')}</option>
              <option value="URGENT">{t('consultation.urgent')}</option>
              <option value="HIGH">{t('consultation.high')}</option>
              <option value="NORMAL">{t('consultation.normal')}</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortParam}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="newest">{t('consultation.sortNewest')}</option>
              <option value="oldest">{t('consultation.sortOldest')}</option>
              <option value="scheduled">{t('consultation.sortScheduled')}</option>
              <option value="priority">{t('consultation.sortPriority')}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <button
            onClick={() => handleFilterChange('status', 'ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {t('consultation.allStatuses')} ({counts.all})
          </button>
          <button
            onClick={() => handleFilterChange('status', 'PENDING')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
          >
            {t('consultation.pending')} ({counts.pending})
          </button>
          <button
            onClick={() => handleFilterChange('status', 'SCHEDULED')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'SCHEDULED'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
          >
            {t('consultation.scheduled')} ({counts.scheduled})
          </button>
          <button
            onClick={() => handleFilterChange('status', 'IN_PROGRESS')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'IN_PROGRESS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
          >
            {t('consultation.inProgress')} ({counts.inProgress})
          </button>
          <button
            onClick={() => handleFilterChange('status', 'COMPLETED')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'COMPLETED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {t('consultation.completed')} ({counts.completed})
          </button>
          <button
            onClick={() => handleFilterChange('status', 'CANCELLED')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${statusParam === 'CANCELLED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {t('consultation.cancelled')} ({counts.cancelled})
          </button>

          {(statusParam !== 'ALL' ||
            priorityParam !== 'ALL' ||
            topicParam !== 'ALL' ||
            queryParam) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <X size={14} />
                <span>{t('consultation.resetFilter')}</span>
              </button>
            )}
        </div>
      </Card>

      {/* Requests List */}
      {filteredList.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Filter size={24} />
          </div>
          <h3 className="text-base font-medium text-slate-900">{t('consultation.emptyTitle')}</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {t('consultation.emptyDesc')}
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleResetFilters}>
              {t('consultation.resetFilter')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {isVietnamese
                ? `Hiển thị ${filteredList.length} trên tổng số ${requests.length} yêu cầu`
                : `Showing ${filteredList.length} of ${requests.length} requests`}
            </span>
          </div>

          <div className="grid gap-4">
            {filteredList.map((req) => (
              <Card
                key={req.id}
                className="transition-all hover:border-brand-200 border-slate-200/90"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Column: Candidate & Main Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={req.candidate.avatar}
                      alt={req.candidate.name}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />

                    <div className="min-w-0 space-y-1.5">
                      {/* Top Header Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/consultant/consultations/${req.id}`}
                          className="font-medium text-base text-slate-900 hover:text-brand-600 transition"
                        >
                          {req.candidate.name}
                        </Link>
                        <span className="font-mono text-xs text-slate-400">#{req.id}</span>
                        {getPriorityBadge(req.priority)}
                        {getStatusBadge(req.status)}
                      </div>

                      {/* Candidate Roles & Location */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {req.candidate.currentTitle}
                        </span>
                        <span>→</span>
                        <span className="font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          {req.candidate.targetRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {req.candidate.location}
                        </span>
                      </div>

                      {/* Topic Pill & Goal */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {getTopicIcon(req.topic)}
                          <span>{req.topicLabel}</span>
                        </span>
                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                          "{req.targetGoal}"
                        </p>
                      </div>

                      {/* Attached CV & Scheduled info */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        {req.candidate.attachedResumeName && (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                            <FileText size={12} className="text-brand-500" />
                            <span className="truncate max-w-[180px]">
                              {req.candidate.attachedResumeName}
                            </span>
                            {req.candidate.attachedResumeScore && (
                              <span className="font-medium text-emerald-700 bg-emerald-50 px-1 rounded">
                                ATS {req.candidate.attachedResumeScore}/100
                              </span>
                            )}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock size={12} />
                          <span>
                            {new Date(req.meeting.scheduledAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>({req.meeting.durationMinutes} phút)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                    {/* Quick Accept for Pending */}
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => acceptMutation.mutate(req.id)}
                        disabled={acceptMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-brand-700 transition cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{t('consultation.acceptRequest')}</span>
                      </button>
                    )}

                    {/* Join Meeting for Scheduled/In-Progress */}
                    {(req.status === 'SCHEDULED' || req.status === 'IN_PROGRESS') && (
                      <a
                        href={req.meeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <Video size={14} />
                        <span>{t('consultation.joinMeeting')}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}

                    {/* View Details Link */}
                    <Link to={`/consultant/consultations/${req.id}`}>
                      <Button variant="secondary" className="px-4 py-2.5 text-xs">
                        <span>{t('consultation.viewDetails')}</span>
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
