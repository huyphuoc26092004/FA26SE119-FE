import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import {
  Avatar,
  Headline,
  PriorityText,
  StatusText,
  Toast,
  UnderlineTabs,
  fieldLabel,
  formatDateTime,
  pad2,
  smallPrimary,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../components/consultation/ConsultantKit';
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

const copy = {
  vi: {
    crumbHome: 'Bảng điều khiển',
    crumb: 'Yêu cầu tư vấn',
    eyebrow: 'Yêu cầu tư vấn',
    line1: (n: number) => `${n} yêu cầu được giao.`,
    line2: (n: number) => (n > 0 ? `${n} đang chờ bạn tiếp nhận.` : 'Không còn yêu cầu nào chờ duyệt.'),
    intro: 'Lọc theo trạng thái, chủ đề hoặc độ ưu tiên. Tiếp nhận nhanh ngay trên danh sách hoặc mở chi tiết để chuẩn bị buổi tư vấn.',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tên, email, vị trí mục tiêu hoặc chủ đề… rồi nhấn Enter',
    clearSearch: 'Xoá tìm kiếm',
    topic: 'Chủ đề',
    allTopics: 'Tất cả chủ đề',
    topics: {
      CV_REVIEW: 'Tối ưu CV & ATS',
      CAREER_ORIENTATION: 'Định hướng & chuyển ngành',
      MOCK_INTERVIEW: 'Phỏng vấn thử',
      SALARY_NEGOTIATION: 'Định giá & đàm phán lương',
      SKILL_ROADMAP: 'Lộ trình kỹ năng',
    } as Record<ConsultationTopic, string>,
    priority: 'Ưu tiên',
    allPriorities: 'Tất cả mức độ',
    sort: 'Sắp xếp',
    sorts: { newest: 'Mới nhất', oldest: 'Cũ nhất', scheduled: 'Theo giờ hẹn', priority: 'Theo ưu tiên' },
    all: 'Tất cả',
    reset: 'Đặt lại bộ lọc',
    showing: (a: number, b: number) => `Hiển thị ${a} / ${b} yêu cầu`,
    cols: { candidate: 'Ứng viên', request: 'Yêu cầu', time: 'Lịch hẹn', status: 'Trạng thái' },
    minutes: 'phút',
    accept: 'Tiếp nhận',
    join: 'Vào họp',
    details: 'Chi tiết',
    emptyTitle: 'Không có yêu cầu phù hợp.',
    emptyDesc: 'Thử đổi từ khoá hoặc bỏ bớt bộ lọc để xem toàn bộ danh sách.',
    accepted: (id: string, name: string) => `Đã tiếp nhận yêu cầu ${id} của ${name}.`,
  },
  en: {
    crumbHome: 'Dashboard',
    crumb: 'Consultation requests',
    eyebrow: 'Consultation requests',
    line1: (n: number) => `${n} assigned requests.`,
    line2: (n: number) => (n > 0 ? `${n} waiting for you.` : 'Nothing left to review.'),
    intro: 'Filter by status, topic or priority. Accept straight from the list, or open a request to prepare the session.',
    search: 'Search',
    searchPlaceholder: 'Name, email, target role or topic… then press Enter',
    clearSearch: 'Clear search',
    topic: 'Topic',
    allTopics: 'All topics',
    topics: {
      CV_REVIEW: 'CV & ATS',
      CAREER_ORIENTATION: 'Career direction',
      MOCK_INTERVIEW: 'Mock interview',
      SALARY_NEGOTIATION: 'Salary negotiation',
      SKILL_ROADMAP: 'Skill roadmap',
    } as Record<ConsultationTopic, string>,
    priority: 'Priority',
    allPriorities: 'All priorities',
    sort: 'Sort',
    sorts: { newest: 'Newest', oldest: 'Oldest', scheduled: 'Meeting time', priority: 'Priority' },
    all: 'All',
    reset: 'Reset filters',
    showing: (a: number, b: number) => `Showing ${a} of ${b} requests`,
    cols: { candidate: 'Candidate', request: 'Request', time: 'Session', status: 'Status' },
    minutes: 'min',
    accept: 'Accept',
    join: 'Join',
    details: 'Details',
    emptyTitle: 'No matching requests.',
    emptyDesc: 'Try another keyword or clear some filters.',
    accepted: (id: string, name: string) => `Accepted request ${id} from ${name}.`,
  },
};

const STATUS_TABS: (ConsultationStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];
const TOPICS: ConsultationTopic[] = [
  'CV_REVIEW',
  'CAREER_ORIENTATION',
  'MOCK_INTERVIEW',
  'SALARY_NEGOTIATION',
  'SKILL_ROADMAP',
];

const rowGrid =
  'lg:grid-cols-[2.5rem_minmax(0,1.35fr)_minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_auto]';

export default function ConsultationListPage() {
  const { t, isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
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
      showToast(c.accepted(updated.id, updated.candidate.name));
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
      ALL: requests.length,
      PENDING: requests.filter((r) => r.status === 'PENDING').length,
      SCHEDULED: requests.filter((r) => r.status === 'SCHEDULED').length,
      IN_PROGRESS: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      COMPLETED: requests.filter((r) => r.status === 'COMPLETED').length,
      CANCELLED: requests.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [requests]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  const hasFilters = statusParam !== 'ALL' || priorityParam !== 'ALL' || topicParam !== 'ALL' || !!queryParam;
  const statusLabel = (s: ConsultationStatus | 'ALL') =>
    s === 'ALL'
      ? c.all
      : {
          PENDING: t('consultation.pending'),
          SCHEDULED: t('consultation.scheduled'),
          IN_PROGRESS: t('consultation.inProgress'),
          COMPLETED: t('consultation.completed'),
          CANCELLED: t('consultation.cancelled'),
        }[s];

  return (
    <div className="pb-[clamp(3rem,6vw,5rem)]">
      <Toast message={toastMessage} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-slate-500">
        <Link to="/consultant" className="transition-colors hover:text-brand">
          {c.crumbHome}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-ink">{c.crumb}</span>
      </nav>

      <Headline
        eyebrow={c.eyebrow}
        line1={c.line1(requests.length)}
        line2={c.line2(counts.PENDING)}
        intro={c.intro}
      />

      {/* Filters */}
      <section className="mt-[clamp(2rem,4vw,3rem)] grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className={fieldLabel}>{c.search}</span>
          <span className="relative block">
            <Search size={16} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFilterChange('q', searchQuery);
              }}
              placeholder={c.searchPlaceholder}
              className={`${underlineInput} pl-7 pr-8`}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={c.clearSearch}
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange('q', '');
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </span>
        </label>

        <label className="block">
          <span className={fieldLabel}>{c.topic}</span>
          <select
            value={topicParam}
            onChange={(e) => handleFilterChange('topic', e.target.value)}
            className={underlineSelect}
          >
            <option value="ALL">{c.allTopics}</option>
            {TOPICS.map((tp) => (
              <option key={tp} value={tp}>
                {c.topics[tp]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={fieldLabel}>{c.priority}</span>
          <select
            value={priorityParam}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={underlineSelect}
          >
            <option value="ALL">{c.allPriorities}</option>
            <option value="URGENT">{t('consultation.urgent')}</option>
            <option value="HIGH">{t('consultation.high')}</option>
            <option value="NORMAL">{t('consultation.normal')}</option>
          </select>
        </label>

        <label className="block">
          <span className={fieldLabel}>{c.sort}</span>
          <select
            value={sortParam}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className={underlineSelect}
          >
            <option value="newest">{c.sorts.newest}</option>
            <option value="oldest">{c.sorts.oldest}</option>
            <option value="scheduled">{c.sorts.scheduled}</option>
            <option value="priority">{c.sorts.priority}</option>
          </select>
        </label>
      </section>

      {/* Status tabs */}
      <div className="mt-8">
        <UnderlineTabs
          size="lg"
          value={statusParam}
          onChange={(v) => handleFilterChange('status', v)}
          tabs={STATUS_TABS.map((s) => ({ value: s, label: statusLabel(s), count: counts[s] }))}
        />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 py-4 text-[13px] text-slate-500">
        <span>{c.showing(filteredList.length, requests.length)}</span>
        {hasFilters && (
          <button type="button" onClick={handleResetFilters} className={`${textLink} text-[13px] text-slate-600`}>
            {c.reset}
          </button>
        )}
      </div>

      {/* List */}
      {filteredList.length === 0 ? (
        <div className="border-y border-ink py-16 text-center">
          <p className="text-[clamp(1.25rem,2vw,1.5rem)] text-ink">{c.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{c.emptyDesc}</p>
          <button type="button" onClick={handleResetFilters} className={`${textLink} mt-5 text-ink`}>
            {c.reset}
          </button>
        </div>
      ) : (
        <div className="border-t border-ink">
          <div
            className={`hidden gap-x-6 border-b border-border py-3 text-[13px] text-slate-500 lg:grid ${rowGrid}`}
          >
            <span>#</span>
            <span>{c.cols.candidate}</span>
            <span>{c.cols.request}</span>
            <span>{c.cols.time}</span>
            <span>{c.cols.status}</span>
            <span className="sr-only">Actions</span>
          </div>

          <ol>
            {filteredList.map((req, idx) => {
              const live = req.status === 'SCHEDULED' || req.status === 'IN_PROGRESS';
              return (
                <li
                  key={req.id}
                  className={`grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-border py-5 lg:items-center lg:gap-x-6 ${rowGrid}`}
                >
                  <span className="pt-2.5 text-xs tabular-nums text-slate-400 lg:pt-0">{pad2(idx + 1)}</span>

                  {/* Candidate */}
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={req.candidate.avatar} name={req.candidate.name} />
                    <div className="min-w-0">
                      <Link
                        to={`/consultant/consultations/${req.id}`}
                        className="block truncate text-[16px] text-ink transition-colors hover:text-brand"
                      >
                        {req.candidate.name}
                      </Link>
                      <p className="truncate text-[13px] text-slate-500">
                        {req.candidate.currentTitle} <span className="text-slate-400">→</span>{' '}
                        <span className="text-brand">{req.candidate.targetRole}</span>
                      </p>
                    </div>
                  </div>

                  {/* Request */}
                  <div className="col-start-2 min-w-0 lg:col-start-auto">
                    <p className="text-sm text-ink">
                      {req.topicLabel}
                      <span className="ml-2 text-xs tabular-nums text-slate-400">{req.id}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-slate-500">{req.targetGoal}</p>
                    {req.candidate.attachedResumeName && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {req.candidate.attachedResumeName}
                        {req.candidate.attachedResumeScore && (
                          <span className="text-ink"> · ATS {req.candidate.attachedResumeScore}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="col-start-2 text-[13px] lg:col-start-auto">
                    <p className="tabular-nums text-ink">{formatDateTime(req.meeting.scheduledAt, locale)}</p>
                    <p className="text-slate-500">
                      {req.meeting.durationMinutes} {c.minutes} · {req.candidate.location}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-start-2 flex flex-wrap gap-x-3 lg:col-start-auto lg:flex-col lg:gap-0.5">
                    <StatusText status={req.status} lang={lang} />
                    <PriorityText priority={req.priority} lang={lang} />
                  </div>

                  {/* Actions */}
                  <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 lg:col-start-auto lg:justify-end">
                    {req.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => acceptMutation.mutate(req.id)}
                        disabled={acceptMutation.isPending}
                        className={smallPrimary}
                      >
                        {c.accept}
                      </button>
                    )}
                    {live && (
                      <a
                        href={req.meeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`${textLink} text-brand`}
                      >
                        {c.join}
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <Link to={`/consultant/consultations/${req.id}`} className={`${textLink} text-ink`}>
                      {c.details}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
