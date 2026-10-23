import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import {
  Avatar,
  Headline,
  PriorityText,
  SectionHead,
  StatRow,
  StatusText,
  ThinBar,
  Toast,
  UnderlineTabs,
  formatTime,
  pad2,
  primaryButton,
  smallPrimary,
  textLink,
} from '../../components/consultation/ConsultantKit';
import {
  getConsultantDashboardStats,
  getConsultationRequests,
  updateConsultationStatus,
} from '../../services/consultationService';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    eyebrow: 'Bảng điều khiển cố vấn',
    hello: 'Chào Taylor,',
    sessionsToday: (n: number) => (n > 0 ? `hôm nay có ${n} phiên tư vấn.` : 'hôm nay chưa có phiên nào.'),
    pendingLine: (n: number) => (n > 0 ? `${n} yêu cầu đang chờ bạn.` : 'Bạn đã xử lý hết yêu cầu.'),
    intro: 'Tiếp nhận yêu cầu mới, chuẩn bị trước mỗi phiên và gửi lời khuyên cho ứng viên ngay sau buổi tư vấn.',
    openList: 'Mở danh sách yêu cầu',
    candidates: 'Hồ sơ ứng viên',
    online: 'Đang trực tuyến',
    offline: 'Đang tạm nghỉ',
    toggleHint: 'Bấm để đổi trạng thái',
    stats: {
      assigned: 'Được giao',
      assignedDetail: '+2 yêu cầu mới hôm nay',
      pending: 'Chờ tiếp nhận',
      pendingSome: 'Có yêu cầu khẩn cấp',
      pendingNone: 'Đã duyệt hết',
      today: 'Phiên hôm nay',
      todayDetail: '2 phiên Google Meet',
      done: 'Đã hoàn tất',
      doneDetail: (r: number) => `Tỉ lệ hoàn thành ${r}%`,
      rating: 'Độ hài lòng',
      ratingDetail: (n: number) => `${n} lượt đánh giá`,
    },
    nowLive: 'Đang diễn ra',
    next: 'Phiên kế tiếp',
    minutes: 'phút',
    goal: 'Mục tiêu',
    joinMeeting: 'Vào phòng họp',
    details: 'Chi tiết',
    requests: 'Yêu cầu cần xử lý',
    tabs: { PENDING: 'Chờ tiếp nhận', SCHEDULED: 'Đã xếp lịch', ALL: 'Tất cả' },
    empty: 'Không có yêu cầu nào ở mục này.',
    accept: 'Tiếp nhận',
    viewAll: (n: number) => `Xem tất cả ${n} yêu cầu`,
    week: 'Lịch trong tuần',
    weekMeta: (n: number) => `${n} phiên`,
    today: 'Hôm nay',
    free: 'Trống lịch',
    profile: 'Hồ sơ cố vấn',
    bio: 'Cố vấn phát triển sự nghiệp công nghệ, hơn 8 năm tuyển dụng và đồng hành cùng Tech Lead.',
    avgResponse: 'Phản hồi trung bình',
    satisfaction: 'Ứng viên hài lòng',
    tipTitle: 'Gợi ý trước phiên',
    tip: 'Alex Morgan (CR-2026-081) đạt ATS 84/100 nhưng thiếu số liệu định lượng về hiệu năng. Nên gợi ý ứng viên mô tả FCP, LCP và mức giảm bundle size trong dự án React lớn.',
    tipLink: 'Mở hồ sơ Alex Morgan',
    topics: 'Phân bổ chủ đề',
    reviews: 'Đánh giá gần đây',
    accepted: (id: string, name: string) => `Đã tiếp nhận yêu cầu ${id} của ${name}.`,
  },
  en: {
    eyebrow: 'Consultant dashboard',
    hello: 'Hi Taylor,',
    sessionsToday: (n: number) => (n > 0 ? `you have ${n} sessions today.` : 'no sessions today yet.'),
    pendingLine: (n: number) => (n > 0 ? `${n} requests are waiting for you.` : 'All requests handled.'),
    intro: 'Accept new requests, prepare before each session and send your advice right after the meeting.',
    openList: 'Open request list',
    candidates: 'Candidate profiles',
    online: 'Online',
    offline: 'Away',
    toggleHint: 'Click to switch status',
    stats: {
      assigned: 'Assigned',
      assignedDetail: '+2 new requests today',
      pending: 'Awaiting review',
      pendingSome: 'Urgent requests waiting',
      pendingNone: 'All caught up',
      today: 'Sessions today',
      todayDetail: '2 Google Meet sessions',
      done: 'Completed',
      doneDetail: (r: number) => `${r}% completion rate`,
      rating: 'Satisfaction',
      ratingDetail: (n: number) => `${n} reviews`,
    },
    nowLive: 'Happening now',
    next: 'Next session',
    minutes: 'min',
    goal: 'Goal',
    joinMeeting: 'Join meeting',
    details: 'Details',
    requests: 'Requests to handle',
    tabs: { PENDING: 'Awaiting review', SCHEDULED: 'Scheduled', ALL: 'All' },
    empty: 'Nothing in this tab.',
    accept: 'Accept',
    viewAll: (n: number) => `View all ${n} requests`,
    week: 'This week',
    weekMeta: (n: number) => `${n} sessions`,
    today: 'Today',
    free: 'Free',
    profile: 'Your profile',
    bio: 'Tech career consultant, 8+ years of hiring and coaching Tech Leads.',
    avgResponse: 'Avg response',
    satisfaction: 'Satisfaction',
    tipTitle: 'Before your next session',
    tip: 'Alex Morgan (CR-2026-081) scored 84/100 ATS but lacks quantified performance results. Suggest describing FCP, LCP and bundle size reductions in a large React project.',
    tipLink: 'Open Alex Morgan profile',
    topics: 'Topic mix',
    reviews: 'Recent reviews',
    accepted: (id: string, name: string) => `Accepted request ${id} from ${name}.`,
  },
};

const REVIEWS = [
  {
    name: 'Đặng Thanh Tùng',
    stars: 5,
    quote:
      'Lời khuyên đàm phán offer của chuyên gia cực kỳ sắc bén! Em đã chốt thành công gói đãi ngộ tăng 8% base kèm sign-on bonus.',
    context: 'Offer Lead Fullstack',
  },
  {
    name: 'Nguyễn Thị Mai Linh',
    stars: 5,
    quote:
      'Buổi mock interview giúp em tự tin trả lời sự cố hệ thống SRE bằng tiếng Anh. Rất cảm ơn anh Taylor Lee!',
    context: 'DevOps Mock Interview',
  },
];

export default function ConsultantDashboardPage() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
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
      showToast(c.accepted(updated.id, updated.candidate.name));
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

  const nextSession = allRequests.find((r) => r.status === 'IN_PROGRESS' || r.status === 'SCHEDULED');
  const weekTotal = currentStats.weeklySchedule.reduce((sum, d) => sum + d.sessions.length, 0);

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)] pb-[clamp(3rem,6vw,5rem)]">
      <Toast message={toastMessage} />

      {/* Headline */}
      <Headline
        eyebrow={
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            title={c.toggleHint}
            className="inline-flex items-center gap-2 text-[13px] transition-colors hover:text-ink"
          >
            <span>{c.eyebrow}</span>
            <span className="text-slate-400">·</span>
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-slate-400'}`} aria-hidden />
            <span className={isOnline ? 'text-brand' : 'text-slate-500'}>{isOnline ? c.online : c.offline}</span>
          </button>
        }
        line1={
          <>
            {c.hello} {c.sessionsToday(currentStats.todaySessionsCount)}
          </>
        }
        line2={c.pendingLine(currentStats.pendingCount)}
        intro={c.intro}
      >
        <button type="button" onClick={() => navigate('/consultant/consultations')} className={primaryButton}>
          {c.openList}
          <ArrowRight size={16} />
        </button>
        <Link to="/consultant/candidates" className={`${textLink} text-ink`}>
          {c.candidates}
        </Link>
      </Headline>

      {/* KPI row */}
      <StatRow
        items={[
          {
            label: c.stats.assigned,
            value: currentStats.totalAssigned,
            detail: c.stats.assignedDetail,
          },
          {
            label: c.stats.pending,
            value: currentStats.pendingCount,
            detail: currentStats.pendingCount > 0 ? c.stats.pendingSome : c.stats.pendingNone,
          },
          { label: c.stats.today, value: currentStats.todaySessionsCount, detail: c.stats.todayDetail },
          {
            label: c.stats.done,
            value: currentStats.completedCount,
            detail: c.stats.doneDetail(currentStats.completionRate),
          },
          {
            label: c.stats.rating,
            value: (
              <>
                {currentStats.satisfactionRate}
                <span className="text-[0.5em] text-slate-400">/5</span>
              </>
            ),
            detail: c.stats.ratingDetail(currentStats.totalReviews),
          },
        ]}
      />

      {/* Next session */}
      {nextSession && (
        <section className="grid gap-6 border-y border-ink py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar src={nextSession.candidate.avatar} name={nextSession.candidate.name} size="lg" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-slate-600">
                <span className={nextSession.status === 'IN_PROGRESS' ? 'text-brand' : ''}>
                  {nextSession.status === 'IN_PROGRESS' ? c.nowLive : c.next}
                </span>
                <span className="text-slate-400">·</span>
                <span className="tabular-nums">{formatTime(nextSession.meeting.scheduledAt)}</span>
                <span className="text-slate-400">·</span>
                <span>
                  {nextSession.meeting.durationMinutes} {c.minutes}
                </span>
              </p>
              <h2 className="mt-1 text-[clamp(1.375rem,2.4vw,1.875rem)] font-normal leading-tight tracking-[-0.015em] text-ink">
                {nextSession.candidate.name}
                <span className="text-slate-400"> · </span>
                <span className="text-brand">{nextSession.topicLabel}</span>
              </h2>
              <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                {c.goal}: {nextSession.targetGoal}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href={nextSession.meeting.meetingUrl} target="_blank" rel="noreferrer" className={primaryButton}>
              {c.joinMeeting}
              <ExternalLink size={15} />
            </a>
            <Link to={`/consultant/consultations/${nextSession.id}`} className={`${textLink} text-ink`}>
              {c.details}
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-x-[clamp(2rem,4vw,4.5rem)] gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,23rem)]">
        {/* Main column */}
        <div className="min-w-0 space-y-14">
          {/* 01 Requests */}
          <section>
            <SectionHead index="01" title={c.requests} />
            <UnderlineTabs
              value={activeTab}
              onChange={setActiveTab}
              tabs={[
                { value: 'PENDING', label: c.tabs.PENDING, count: currentStats.pendingCount },
                { value: 'SCHEDULED', label: c.tabs.SCHEDULED, count: currentStats.scheduledCount },
                { value: 'ALL', label: c.tabs.ALL, count: allRequests.length },
              ]}
            />

            {filteredRequests.length === 0 ? (
              <p className="border-b border-border py-10 text-center text-sm text-slate-500">{c.empty}</p>
            ) : (
              <ol>
                {filteredRequests.slice(0, 5).map((req, idx) => (
                  <li
                    key={req.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-border py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="w-6 pt-0.5 text-xs tabular-nums text-slate-400 sm:pt-0">{pad2(idx + 1)}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <Link
                          to={`/consultant/consultations/${req.id}`}
                          className="text-[17px] text-ink transition-colors hover:text-brand"
                        >
                          {req.candidate.name}
                        </Link>
                        <span className="text-xs tabular-nums text-slate-400">{req.id}</span>
                        <StatusText status={req.status} lang={lang} />
                        {req.priority !== 'NORMAL' && <PriorityText priority={req.priority} lang={lang} />}
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{req.topicLabel}</p>
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">
                        {c.goal}: {req.targetGoal}
                      </p>
                    </div>
                    <div className="col-start-2 flex items-center gap-x-5 sm:col-start-auto">
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
                      <Link to={`/consultant/consultations/${req.id}`} className={`${textLink} text-ink`}>
                        {c.details}
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <Link to="/consultant/consultations" className={`${textLink} mt-5 text-slate-700`}>
              {c.viewAll(allRequests.length)}
              <ArrowRight size={14} />
            </Link>
          </section>

          {/* 02 Weekly schedule */}
          <section>
            <SectionHead index="02" title={c.week} meta={c.weekMeta(weekTotal)} />
            <div className="grid grid-cols-1 sm:grid-cols-5">
              {currentStats.weeklySchedule.map((day) => {
                const isToday = day.date === '2026-10-19';
                return (
                  <div
                    key={day.date}
                    className={`border-b border-border py-4 sm:min-h-44 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0 ${
                      isToday ? 'sm:shadow-[inset_0_2px_0_var(--color-brand)]' : ''
                    }`}
                  >
                    <p className={`text-sm ${isToday ? 'text-brand' : 'text-ink'}`}>
                      {day.dayOfWeek.replace(' (Hôm nay)', '')}
                      {isToday && <span className="ml-1.5 text-xs">· {c.today}</span>}
                    </p>
                    <p className="text-xs tabular-nums text-slate-400">{day.date}</p>
                    <div className="mt-3 space-y-3">
                      {day.sessions.length === 0 ? (
                        <span className="block text-[13px] text-slate-400">{c.free}</span>
                      ) : (
                        day.sessions.map((sess) => (
                          <Link key={sess.id} to={`/consultant/consultations/${sess.id}`} className="group block">
                            <span className="block text-xs tabular-nums text-brand">{sess.time}</span>
                            <span className="block truncate text-sm text-ink transition-colors group-hover:text-brand">
                              {sess.candidateName}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Aside */}
        <aside className="min-w-0 space-y-12">
          {/* Profile */}
          <section>
            <SectionHead index="03" title={c.profile} />
            <div className="flex items-center gap-3 pt-5">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-sm text-white">TL</span>
              <div>
                <p className="text-[17px] text-ink">Taylor Lee</p>
                <p className="text-[13px] text-slate-500">Career consultant</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{c.bio}</p>
            <dl className="mt-4 border-t border-border text-sm">
              <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
                <dt className="text-slate-600">{c.avgResponse}</dt>
                <dd className="text-ink">{currentStats.avgResponseTime}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
                <dt className="text-slate-600">{c.satisfaction}</dt>
                <dd className="text-brand">{currentStats.completionRate}%</dd>
              </div>
            </dl>
          </section>

          {/* Tip */}
          <section>
            <SectionHead index="04" title={c.tipTitle} />
            <p className="border-l-2 border-brand py-1 pl-4 mt-5 text-sm leading-7 text-slate-700">{c.tip}</p>
            <Link to="/consultant/consultations/CR-2026-081" className={`${textLink} mt-4 text-ink`}>
              {c.tipLink}
              <ArrowRight size={14} />
            </Link>
          </section>

          {/* Topic mix */}
          <section>
            <SectionHead index="05" title={c.topics} />
            <ul>
              {currentStats.topicDistribution.map((item) => (
                <li key={item.topic} className="border-b border-border py-3.5">
                  <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="tabular-nums text-ink">
                      {item.count}
                      <span className="ml-1.5 text-xs text-slate-400">{item.percentage}%</span>
                    </span>
                  </div>
                  <ThinBar value={item.percentage} />
                </li>
              ))}
            </ul>
          </section>

          {/* Reviews */}
          <section>
            <SectionHead index="06" title={c.reviews} meta="4.95/5" />
            <ul>
              {REVIEWS.map((r) => (
                <li key={r.name} className="border-b border-border py-5">
                  <p className="text-sm leading-7 text-slate-700">“{r.quote}”</p>
                  <p className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                    <span className="text-ink">
                      {r.name}
                      <span className="text-slate-400"> · {r.context}</span>
                    </span>
                    <span className="tabular-nums text-brand">{r.stars}/5</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
