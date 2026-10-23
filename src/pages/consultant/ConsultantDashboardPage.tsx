import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  Video,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  FileText,
  Compass,
  DollarSign,
  Route,
  Lightbulb,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Card, PageTitle, StatCard, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getConsultantDashboardStats,
  getConsultationRequests,
  updateConsultationStatus,
} from '../../services/consultationService';
import type { ConsultationRequest, ConsultationTopic } from '../../types/consultation';
import { useTranslation } from '../../i18n';

export default function ConsultantDashboardPage() {
  const { t, isVietnamese } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SCHEDULED'>('PENDING');
  const [isOnline, setIsOnline] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery({
    queryKey: ['consultant-stats'],
    queryFn: getConsultantDashboardStats,
  });

  const {
    data: requests,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
  } = useQuery({
    queryKey: ['consultation-requests'],
    queryFn: () => getConsultationRequests({ sortBy: 'newest' }),
  });

  // Quick accept mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      updateConsultationStatus(id, 'SCHEDULED', 'Cố vấn đã tiếp nhận nhanh từ Bảng điều khiển.'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      showToast(
        isVietnamese
          ? `Đã tiếp nhận yêu cầu #${updated.id} của ứng viên ${updated.candidate.name}!`
          : `Accepted request #${updated.id} from ${updated.candidate.name}!`
      );
    },
  });

  if (isStatsLoading || isRequestsLoading) return <Loading />;
  if (isStatsError || isRequestsError) return <ErrorState />;

  const currentStats = stats!;
  const allRequests = requests || [];

  const filteredRequests = allRequests.filter((r) => {
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS';
    return true;
  });

  const nextSession = allRequests.find(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'SCHEDULED'
  );

  const getTopicIcon = (topic: ConsultationTopic) => {
    switch (topic) {
      case 'CV_REVIEW':
        return <FileText size={16} className="text-brand-600" />;
      case 'CAREER_ORIENTATION':
        return <Compass size={16} className="text-amber-600" />;
      case 'MOCK_INTERVIEW':
        return <Video size={16} className="text-emerald-600" />;
      case 'SALARY_NEGOTIATION':
        return <DollarSign size={16} className="text-brand-600" />;
      case 'SKILL_ROADMAP':
        return <Route size={16} className="text-brand-600" />;
      default:
        return <FileText size={16} className="text-brand-600" />;
    }
  };

  const getStatusBadge = (status: ConsultationRequest['status']) => {
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

  const getPriorityBadge = (priority: ConsultationRequest['priority']) => {
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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <PageTitle
        title={t('consultation.dashboardTitle')}
        subtitle={t('consultation.dashboardSubtitle')}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
              />
              {isOnline ? t('consultation.onlineStatus') : 'Đang tạm nghỉ (Offline)'}
            </button>
            <Button
              variant="primary"
              onClick={() => navigate('/consultant/consultations')}
              className="gap-2"
            >
              <Calendar size={16} />
              <span>{t('consultation.listTitle')}</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        }
      />

      {/* KPI Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/consultant/consultations" className="block transition-transform">
          <StatCard
            label={t('consultation.assignedRequests')}
            value={String(currentStats.totalAssigned)}
            detail={isVietnamese ? '+2 yêu cầu mới hôm nay' : '+2 new requests today'}
            icon={<FileText size={20} />}
          />
        </Link>
        <Link
          to="/consultant/consultations"
          className="block transition-transform"
        >
          <StatCard
            label={t('consultation.pendingReview')}
            value={String(currentStats.pendingCount)}
            detail={
              currentStats.pendingCount > 0
                ? isVietnamese
                  ? 'Có yêu cầu khẩn cấp'
                  : 'Urgent requests awaiting'
                : isVietnamese
                  ? 'Đã duyệt hết'
                  : 'All caught up'
            }
            icon={<AlertCircle size={20} className="text-amber-600" />}
          />
        </Link>
        <div className="block">
          <StatCard
            label={t('consultation.todaySessionsCount')}
            value={String(currentStats.todaySessionsCount)}
            detail={isVietnamese ? '2 phiên Google Meet' : '2 Google Meet sessions'}
            icon={<Clock size={20} className="text-brand-600" />}
          />
        </div>
        <div className="block">
          <StatCard
            label={t('consultation.completedSessions')}
            value={String(currentStats.completedCount)}
            detail={
              isVietnamese
                ? `Tỉ lệ hoàn thành ${currentStats.completionRate}%`
                : `${currentStats.completionRate}% completion rate`
            }
            icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          />
        </div>
        <div className="block">
          <StatCard
            label={t('consultation.satisfactionScore')}
            value={`${currentStats.satisfactionRate} ★`}
            detail={`${currentStats.totalReviews} ${t('consultation.reviewsCount')}`}
            icon={<Star size={20} className="text-amber-500 fill-amber-500" />}
          />
        </div>
      </div>

      {/* Spotlight Next Session Banner */}
      {nextSession && (
        <Card className="border-brand-200 bg-brand-600 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white border border-white/20">
                <Video size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {nextSession.status === 'IN_PROGRESS'
                      ? isVietnamese
                        ? 'Đang diễn ra ngay bây giờ'
                        : 'Happening Right Now'
                      : isVietnamese
                        ? 'Phiên tư vấn kế tiếp hôm nay'
                        : 'Upcoming Session Today'}
                  </span>
                  <span className="text-xs text-brand-100 font-medium">
                    {new Date(nextSession.meeting.scheduledAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({nextSession.meeting.durationMinutes} phút)
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-medium text-white">
                  {nextSession.candidate.name} · {nextSession.topicLabel}
                </h3>
                <p className="text-xs text-brand-100 line-clamp-1 mt-0.5">
                  Mục tiêu: {nextSession.targetGoal}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={nextSession.meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-xs font-medium text-brand-800 shadow-sm transition hover:bg-brand-50 cursor-pointer"
              >
                <Video size={15} />
                <span>{t('consultation.joinMeeting')}</span>
                <ExternalLink size={13} />
              </a>
              <Link to={`/consultant/consultations/${nextSession.id}`}>
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer">
                  <span>{t('consultation.viewDetails')}</span>
                  <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        {/* Left Column: Assigned Requests Management & Schedule */}
        <div className="space-y-6">
          {/* Requests Section */}
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-medium text-slate-900">
                  {t('consultation.urgentRequests')}
                </h2>
                <p className="text-xs text-slate-500">
                  {isVietnamese
                    ? 'Danh sách các yêu cầu tư vấn cần duyệt và chuẩn bị nội dung'
                    : 'Consultation requests requiring confirmation and review'}
                </p>
              </div>
              {/* Tab Pills */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('PENDING')}
                  className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                    activeTab === 'PENDING'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('consultation.pending')} ({currentStats.pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('SCHEDULED')}
                  className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                    activeTab === 'SCHEDULED'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('consultation.scheduled')} ({currentStats.scheduledCount})
                </button>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                    activeTab === 'ALL'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('common.all')} ({allRequests.length})
                </button>
              </div>
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                {t('consultation.emptyTitle')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRequests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={req.candidate.avatar}
                        alt={req.candidate.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">
                            {req.candidate.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">#{req.id}</span>
                          {getPriorityBadge(req.priority)}
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                          {getTopicIcon(req.topic)}
                          <span className="truncate">{req.topicLabel}</span>
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {isVietnamese ? 'Mục tiêu: ' : 'Goal: '}
                          {req.targetGoal}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => acceptMutation.mutate(req.id)}
                          disabled={acceptMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition cursor-pointer disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>{t('consultation.acceptQuick')}</span>
                        </button>
                      )}
                      <Link to={`/consultant/consultations/${req.id}`}>
                        <Button variant="secondary" className="px-3 py-2 text-xs">
                          {t('consultation.viewDetails')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-3 text-center">
              <Link
                to="/consultant/consultations"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <span>
                  {isVietnamese
                    ? `Xem tất cả ${allRequests.length} yêu cầu tư vấn`
                    : `View all ${allRequests.length} consultation requests`}
                </span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* Weekly Schedule Preview */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-600" />
                <h2 className="text-base font-medium text-slate-900">
                  {t('consultation.weeklySchedule')}
                </h2>
              </div>
              <Badge tone="blue">
                {isVietnamese ? 'Tuần này · 5 phiên' : 'This week · 5 sessions'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              {currentStats.weeklySchedule.map((day) => (
                <div
                  key={day.date}
                  className={`rounded-xl border p-3 ${
                    day.date === '2026-10-19'
                      ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-400/30'
                      : 'border-slate-200/80 bg-white'
                  }`}
                >
                  <p className="text-xs font-medium text-slate-700">{day.dayOfWeek}</p>
                  <p className="text-[11px] text-slate-400">{day.date}</p>

                  <div className="mt-2 space-y-1.5">
                    {day.sessions.length === 0 ? (
                      <span className="block text-[11px] italic text-slate-400">
                        {isVietnamese ? 'Trống lịch' : 'No sessions'}
                      </span>
                    ) : (
                      day.sessions.map((sess) => (
                        <Link
                          key={sess.id}
                          to={`/consultant/consultations/${sess.id}`}
                          className="block rounded-lg bg-surface p-2 text-xs shadow-xs border border-slate-100 hover:border-brand-300 transition"
                        >
                          <span className="block font-medium text-slate-800 truncate">
                            {sess.candidateName}
                          </span>
                          <span className="block text-[10px] text-brand-600 font-medium">
                            {sess.time}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Consultant Profile, Topic Distribution & Reviews */}
        <div className="space-y-6">
          {/* Consultant Profile Card */}
          <Card className="border border-slate-200/90 bg-surface">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-lg font-medium text-white shadow-sm">
                TL
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-medium text-slate-900">Taylor Lee</h3>
                  <ShieldCheck size={16} className="text-brand-600" />
                </div>
                <p className="text-xs text-slate-500">{t('consultation.consultantBio')}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-center">
              <div className="rounded-xl bg-surface p-2.5 border border-slate-100">
                <span className="text-xs text-slate-500">
                  {isVietnamese ? 'Phản hồi trung bình' : 'Avg Response'}
                </span>
                <p className="font-medium text-slate-800 text-sm">{currentStats.avgResponseTime}</p>
              </div>
              <div className="rounded-xl bg-surface p-2.5 border border-slate-100">
                <span className="text-xs text-slate-500">
                  {isVietnamese ? 'Ứng viên hài lòng' : 'Satisfaction'}
                </span>
                <p className="font-medium text-emerald-600 text-sm">
                  {currentStats.completionRate}%
                </p>
              </div>
            </div>
          </Card>

          {/* AI Consultant Coaching Insights */}
          <Card className="border-amber-200/80 bg-amber-50/50">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Lightbulb size={18} className="text-amber-600" />
              <h3 className="font-medium text-sm">
                {isVietnamese ? 'Gợi ý Trợ lý AI cho Cố vấn' : 'AI Career Assistant Insights'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isVietnamese
                ? 'Ứng viên Alex Morgan (CR-2026-081) có điểm ATS 84/100, bị thiếu số liệu định lượng về Performance. Bạn nên gợi ý ứng viên mô tả chỉ số FCP, LCP và giảm % bundle size trong dự án React lớn.'
                : 'Candidate Alex Morgan (CR-2026-081) scored 84/100 ATS with missing quantitative metrics. Recommend focusing on Core Web Vitals (FCP, LCP) and bundle size optimization in STAR format.'}
            </p>
            <div className="mt-3">
              <Link
                to="/consultant/consultations/CR-2026-081"
                className="text-xs font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
              >
                <span>{isVietnamese ? 'Mở hồ sơ Alex Morgan' : 'Open Alex Morgan profile'}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Topics Distribution */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-brand-600" />
                <span>{t('consultation.topicDistribution')}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {currentStats.topicDistribution.map((item) => (
                <div key={item.topic}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-medium text-slate-800">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Candidate Testimonials */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
                <Users size={16} className="text-brand-600" />
                <span>{t('consultation.recentReviews')}</span>
              </h3>
              <span className="text-xs text-amber-600 font-medium">4.95 / 5.0 ★</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">Đặng Thanh Tùng</span>
                  <span className="text-amber-500 font-medium">★★★★★</span>
                </div>
                <p className="text-slate-600 italic">
                  "Lời khuyên đàm phán offer của Chuyên gia cực kỳ sắc bén! Em đã chốt thành công gói
                  đãi ngộ tăng 8% base kèm sign-on bonus."
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Offer Lead Fullstack</span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">Nguyễn Thị Mai Linh</span>
                  <span className="text-amber-500 font-medium">★★★★★</span>
                </div>
                <p className="text-slate-600 italic">
                  "Buổi mock interview giúp em tự tin trả lời sự cố hệ thống SRE bằng tiếng Anh. Rất
                  cảm ơn anh Taylor Lee!"
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">DevOps Mock Interview</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
