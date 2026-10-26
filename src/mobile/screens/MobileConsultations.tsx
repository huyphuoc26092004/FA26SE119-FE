import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Video } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  CONSULTATION_TOPIC_LABELS,
  DEFAULT_CONSULTANT,
  getMyConsultations,
} from '../../services/candidateConsultationService';
import type { ConsultationStatus } from '../../types/consultation';
import { useTranslation } from '../../i18n';
import { BigLink, Card, Empty, Screen, SectionTitle, Skeleton, Tag } from '../MobileKit';

const copy = {
  vi: {
    advisor: 'Cố vấn của bạn',
    reply: (h: string) => `Thường phản hồi trong ${h} giờ`,
    request: 'Gửi yêu cầu tư vấn',
    mine: 'Yêu cầu của bạn',
    empty: 'Bạn chưa gửi yêu cầu nào.',
    status: {
      PENDING: 'Chờ xác nhận',
      SCHEDULED: 'Đã hẹn lịch',
      IN_PROGRESS: 'Đang tư vấn',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã huỷ',
    } as Record<ConsultationStatus, string>,
    minutes: 'phút',
  },
  en: {
    advisor: 'Your advisor',
    reply: (h: string) => `Usually replies within ${h}h`,
    request: 'Request a session',
    mine: 'Your requests',
    empty: 'You have not sent any request yet.',
    status: {
      PENDING: 'Pending',
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    } as Record<ConsultationStatus, string>,
    minutes: 'min',
  },
};

const statusTone: Record<ConsultationStatus, 'brand' | 'warn' | 'neutral' | 'danger'> = {
  PENDING: 'warn',
  SCHEDULED: 'brand',
  IN_PROGRESS: 'brand',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

export default function MobileConsultations() {
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const candidateId = useAuthStore((s) => s.user?.id) || '1';
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-consultations', candidateId],
    queryFn: () => getMyConsultations(candidateId),
  });

  return (
    <Screen>
      <Card className="bg-night text-white border-night">
        <p className="text-[13px] text-white/60">{c.advisor}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/40 text-[14px]">
            TL
          </span>
          <div className="min-w-0">
            <p className="text-[17px] font-medium">{DEFAULT_CONSULTANT.name}</p>
            <p className="text-[13px] text-white/70">{c.reply(DEFAULT_CONSULTANT.responseTime)}</p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-white/80">
          {isVietnamese ? DEFAULT_CONSULTANT.bio : DEFAULT_CONSULTANT.bioEn}
        </p>
      </Card>

      <BigLink to="/candidate/consultations/new">{c.request}</BigLink>

      <SectionTitle title={c.mine} />
      {isLoading ? (
        <Skeleton rows={2} />
      ) : requests.length === 0 ? (
        <Empty title={c.empty} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const when = r.meeting?.scheduledAt ? new Date(r.meeting.scheduledAt) : null;
            return (
              <Card key={r.id} to={`/candidate/consultations/${r.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium leading-snug text-ink">
                    {CONSULTATION_TOPIC_LABELS[r.topic]?.[isVietnamese ? 'vi' : 'en'] ??
                      r.topicLabel}
                  </p>
                  <Tag tone={statusTone[r.status]}>{c.status[r.status]}</Tag>
                </div>
                {r.targetGoal && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-600">
                    {r.targetGoal}
                  </p>
                )}
                {when && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-[12px] text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock size={14} aria-hidden="true" />
                      {when.toLocaleString(locale, {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Video size={14} aria-hidden="true" />
                      {r.meeting.platform} · {r.meeting.durationMinutes} {c.minutes}
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
