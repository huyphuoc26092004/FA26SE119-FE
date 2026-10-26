import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConsultantDashboardStats,
  getConsultationRequests,
  updateConsultationStatus,
} from '../../services/consultationService';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import {
  Card,
  Empty,
  Pill,
  Screen,
  SectionTitle,
  Skeleton,
  StatGrid,
  useToast,
} from '../MobileKit';
import { RequestCard } from './MobileConsultantRequests';

const copy = {
  vi: {
    hello: (n: string) => `Chào ${n}`,
    today: (n: number) => `Bạn có ${n} buổi tư vấn đang chờ diễn ra.`,
    stats: ['Chờ xác nhận', 'Đã hẹn lịch', 'Hoàn tất', 'Hài lòng'],
    reviews: (n: number) => `${n} đánh giá`,
    response: (t: string) => `Phản hồi ${t}`,
    week: 'Lịch tuần này',
    sessions: (n: number) => `${n} buổi`,
    pending: 'Yêu cầu mới',
    upcoming: 'Sắp diễn ra',
    seeAll: 'Xem tất cả',
    accept: 'Nhận yêu cầu',
    accepted: (name: string) => `Đã nhận yêu cầu của ${name}`,
    noPending: 'Không có yêu cầu mới.',
    noUpcoming: 'Chưa có buổi nào sắp tới.',
  },
  en: {
    hello: (n: string) => `Hi ${n}`,
    today: (n: number) => `You have ${n} sessions coming up.`,
    stats: ['Pending', 'Scheduled', 'Completed', 'Satisfaction'],
    reviews: (n: number) => `${n} reviews`,
    response: (t: string) => `Replies in ${t}`,
    week: 'This week',
    sessions: (n: number) => `${n} sessions`,
    pending: 'New requests',
    upcoming: 'Coming up',
    seeAll: 'See all',
    accept: 'Accept',
    accepted: (name: string) => `Accepted ${name}'s request`,
    noPending: 'No new requests.',
    noUpcoming: 'No upcoming sessions.',
  },
};

export default function MobileConsultantHome() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: stats } = useQuery({
    queryKey: ['consultant-stats'],
    queryFn: getConsultantDashboardStats,
  });
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['consultation-requests'],
    queryFn: () => getConsultationRequests({ sortBy: 'newest' }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      updateConsultationStatus(id, 'SCHEDULED', 'Cố vấn đã tiếp nhận nhanh từ Bảng điều khiển.'),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      toast.show(c.accepted(updated.candidate.name));
    },
  });

  const pending = requests.filter((r) => r.status === 'PENDING').slice(0, 3);
  const upcoming = requests
    .filter((r) => r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS')
    .sort((a, b) => a.meeting.scheduledAt.localeCompare(b.meeting.scheduledAt))
    .slice(0, 3);
  const firstName = (user?.name ?? '').split(/\s+/).slice(-1)[0] || '';

  return (
    <Screen>
      <Card className="bg-night text-white border-night">
        <p className="text-[22px] font-medium leading-tight">{c.hello(firstName)}</p>
        <p className="mt-1 text-[14px] text-white/70">{c.today(stats?.todaySessionsCount ?? 0)}</p>
        {stats && (
          <p className="mt-3 text-[12px] text-white/60">
            {c.reviews(stats.totalReviews)} · {c.response(stats.avgResponseTime)}
          </p>
        )}
      </Card>

      {stats ? (
        <StatGrid
          items={[
            { label: c.stats[0], value: stats.pendingCount, to: '/consultant/consultations' },
            { label: c.stats[1], value: stats.scheduledCount, to: '/consultant/consultations' },
            { label: c.stats[2], value: stats.completedCount },
            { label: c.stats[3], value: `${stats.satisfactionRate}/5` },
          ]}
        />
      ) : (
        <Skeleton rows={1} />
      )}

      {stats && stats.weeklySchedule.length > 0 && (
        <>
          <SectionTitle title={c.week} />
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {stats.weeklySchedule.map((d) => (
              <div
                key={d.date}
                className={`w-[72px] shrink-0 rounded-2xl border px-2 py-3 text-center ${
                  d.count > 0 ? 'border-ink bg-ink text-white' : 'border-border bg-surface text-ink'
                }`}
              >
                <p className="text-[12px] opacity-70">{d.dayOfWeek.replace(/\s*\(.*\)/, '')}</p>
                <p className="mt-0.5 text-[17px] font-medium tabular-nums">{d.date.slice(-2)}</p>
                <p className="mt-1 text-[11px] opacity-70">{c.sessions(d.count)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle
        title={c.pending}
        action={{ label: c.seeAll, to: '/consultant/consultations' }}
      />
      {isLoading ? (
        <Skeleton rows={2} />
      ) : pending.length === 0 ? (
        <Empty title={c.noPending} />
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="space-y-2">
              <RequestCard request={r} />
              <div className="flex justify-end">
                <Pill
                  onClick={() => acceptMutation.mutate(r.id)}
                  disabled={acceptMutation.isPending}
                  active
                >
                  {c.accept}
                </Pill>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionTitle title={c.upcoming} />
      {upcoming.length === 0 ? (
        <Empty title={c.noUpcoming} />
      ) : (
        <div className="space-y-3">
          {upcoming.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
      {toast.node}
    </Screen>
  );
}
