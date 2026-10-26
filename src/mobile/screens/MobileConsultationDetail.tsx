import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ExternalLink, Send, Video } from 'lucide-react';
import ConsultationDetailsPage from '../../pages/consultant/ConsultationDetailsPage';
import {
  getConsultationRequestById,
  saveConsultantPrivateNotes,
  sendConsultationMessage,
  updateConsultationStatus,
} from '../../services/consultationService';
import type { ConsultationStatus } from '../../types/consultation';
import { useTranslation } from '../../i18n';
import {
  consultationStatusLabel,
  consultationStatusTone,
  formatSession,
  priorityLabel,
} from '../consultationLabels';
import {
  ActionBar,
  Avatar,
  BigButton,
  Card,
  Empty,
  InfoRow,
  PillLink,
  Screen,
  SectionTitle,
  Sheet,
  Skeleton,
  Tag,
  useToast,
} from '../MobileKit';

const copy = {
  vi: {
    notFound: 'Không tìm thấy yêu cầu.',
    meeting: 'Buổi tư vấn',
    time: 'Thời gian',
    platform: 'Nền tảng',
    code: 'Mã phòng',
    join: 'Vào phòng họp',
    request: 'Nội dung yêu cầu',
    goal: 'Mục tiêu',
    notes: 'Ghi chú của ứng viên',
    questions: 'Câu hỏi',
    obstacles: 'Khó khăn hiện tại',
    privateNotes: 'Ghi chú riêng',
    privateHint: 'Chỉ bạn thấy ghi chú này.',
    save: 'Lưu ghi chú',
    saved: 'Đã lưu ghi chú',
    messages: 'Tin nhắn',
    noMessages: 'Chưa có tin nhắn.',
    typeMessage: 'Nhập tin nhắn…',
    full: 'Soạn tư vấn chi tiết',
    profile: 'Hồ sơ ứng viên',
    next: {
      PENDING: 'Nhận yêu cầu',
      SCHEDULED: 'Bắt đầu tư vấn',
      IN_PROGRESS: 'Hoàn tất buổi tư vấn',
    } as Partial<Record<ConsultationStatus, string>>,
    cancel: 'Huỷ lịch',
    cancelTitle: 'Huỷ buổi tư vấn này?',
    cancelBody: 'Ứng viên sẽ thấy yêu cầu chuyển sang trạng thái Đã huỷ.',
    confirmCancel: 'Huỷ lịch',
    keep: 'Giữ lại',
    updated: (s: string) => `Đã chuyển sang: ${s}`,
    minutes: 'phút',
  },
  en: {
    notFound: 'Request not found.',
    meeting: 'Session',
    time: 'Time',
    platform: 'Platform',
    code: 'Room code',
    join: 'Join meeting',
    request: 'Request',
    goal: 'Goal',
    notes: 'Candidate notes',
    questions: 'Questions',
    obstacles: 'Current obstacles',
    privateNotes: 'Private notes',
    privateHint: 'Only you can see these notes.',
    save: 'Save notes',
    saved: 'Notes saved',
    messages: 'Messages',
    noMessages: 'No messages yet.',
    typeMessage: 'Type a message…',
    full: 'Write full advice',
    profile: 'Candidate profile',
    next: {
      PENDING: 'Accept request',
      SCHEDULED: 'Start session',
      IN_PROGRESS: 'Complete session',
    } as Partial<Record<ConsultationStatus, string>>,
    cancel: 'Cancel',
    cancelTitle: 'Cancel this session?',
    cancelBody: 'The candidate will see the request as cancelled.',
    confirmCancel: 'Cancel session',
    keep: 'Keep it',
    updated: (s: string) => `Moved to: ${s}`,
    minutes: 'min',
  },
};

// Same notes the web page writes into the timeline for each step.
const NEXT_STEP: Partial<Record<ConsultationStatus, { status: ConsultationStatus; note: string }>> =
  {
    PENDING: { status: 'SCHEDULED', note: 'Chuyên gia đã duyệt lịch tư vấn.' },
    SCHEDULED: { status: 'IN_PROGRESS', note: 'Bắt đầu phòng tư vấn trực tuyến.' },
    IN_PROGRESS: { status: 'COMPLETED', note: 'Hoàn tất phiên tư vấn.' },
  };

/** `?view=full` opens the full web page (advice builder, rubric) inside the app. */
export default function MobileConsultationDetail() {
  const [params] = useSearchParams();
  return params.get('view') === 'full' ? <ConsultationDetailsPage /> : <DetailScreen />;
}

function DetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-GB';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [notes, setNotes] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['consultation-detail', id],
    queryFn: () => getConsultationRequestById(id || ''),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: ConsultationStatus; note?: string }) =>
      updateConsultationStatus(id!, status, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      setCancelOpen(false);
      toast.show(c.updated(consultationStatusLabel[lang][updated.status]));
    },
  });

  const notesMutation = useMutation({
    mutationFn: (text: string) => saveConsultantPrivateNotes(id!, text, request?.evaluationRubric),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      toast.show(c.saved);
    },
  });

  const messageMutation = useMutation({
    mutationFn: (content: string) => sendConsultationMessage(id!, content, 'CAREER_CONSULTANT'),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['consultation-detail', id] });
    },
  });

  if (isLoading) {
    return (
      <Screen>
        <Skeleton />
      </Screen>
    );
  }
  if (!request) {
    return (
      <Screen>
        <Empty title={c.notFound} />
      </Screen>
    );
  }

  const next = NEXT_STEP[request.status];
  const canCancel = request.status === 'PENDING' || request.status === 'SCHEDULED';
  const notesValue = notes ?? request.consultantPrivateNotes ?? '';

  return (
    <Screen>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={request.candidate.name} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-medium text-ink">{request.candidate.name}</p>
            <p className="truncate text-[13px] text-slate-600">
              {request.candidate.currentTitle} → {request.candidate.targetRole}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone={consultationStatusTone[request.status]}>
            {consultationStatusLabel[lang][request.status]}
          </Tag>
          <Tag>{request.topicLabel}</Tag>
          {request.priority !== 'NORMAL' && (
            <Tag tone={request.priority === 'URGENT' ? 'danger' : 'warn'}>
              {priorityLabel[lang][request.priority]}
            </Tag>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PillLink to={`/consultant/candidates/${request.candidate.id}`}>{c.profile}</PillLink>
          <PillLink to={`/consultant/consultations/${request.id}?view=full`}>{c.full}</PillLink>
        </div>
      </Card>

      <Card>
        <p className="text-[15px] font-medium text-ink">{c.meeting}</p>
        <div className="mt-1 divide-y divide-border">
          <InfoRow label={c.time}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={14} aria-hidden="true" />
              {formatSession(request.meeting.scheduledAt, locale)}
            </span>
          </InfoRow>
          <InfoRow label={c.platform}>
            <span className="inline-flex items-center gap-1.5">
              <Video size={14} aria-hidden="true" />
              {request.meeting.platform} · {request.meeting.durationMinutes} {c.minutes}
            </span>
          </InfoRow>
          {request.meeting.meetingCode && (
            <InfoRow label={c.code}>{request.meeting.meetingCode}</InfoRow>
          )}
        </div>
        {request.meeting.meetingUrl && (
          <a
            href={request.meeting.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-ink/25 text-[15px] text-ink active:bg-slate-100"
          >
            {c.join}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
      </Card>

      <Card>
        <p className="text-[15px] font-medium text-ink">{c.request}</p>
        <Block title={c.goal} text={request.targetGoal} />
        <Block title={c.notes} text={request.candidateNotes} />
        {request.candidateQuestions.length > 0 && (
          <div className="mt-3">
            <p className="text-[12px] text-slate-500">{c.questions}</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-[14px] leading-6 text-ink">
              {request.candidateQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>
        )}
        <Block title={c.obstacles} text={request.currentObstacles} />
      </Card>

      <Card>
        <p className="text-[15px] font-medium text-ink">{c.privateNotes}</p>
        <p className="text-[12px] text-slate-500">{c.privateHint}</p>
        <textarea
          value={notesValue}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-[15px] leading-6 text-ink outline-none focus:border-ink"
        />
        <BigButton
          tone="secondary"
          className="mt-3"
          disabled={notesMutation.isPending}
          onClick={() => notesMutation.mutate(notesValue)}
        >
          {c.save}
        </BigButton>
      </Card>

      <SectionTitle title={c.messages} />
      <Card>
        {request.messages.length === 0 ? (
          <p className="text-[14px] text-slate-500">{c.noMessages}</p>
        ) : (
          <div className="space-y-3">
            {request.messages.map((m) => {
              const mine = m.senderRole === 'CAREER_CONSULTANT';
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 ${
                      mine ? 'bg-ink text-white' : 'bg-slate-100 text-ink'
                    }`}
                  >
                    {m.content}
                    <p className={`mt-1 text-[11px] ${mine ? 'text-white/60' : 'text-slate-500'}`}>
                      {m.senderName} · {m.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <form
          className="mt-3 flex items-center gap-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) messageMutation.mutate(message.trim());
          }}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={c.typeMessage}
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-canvas px-4 text-[15px] text-ink outline-none focus:border-ink"
          />
          <button
            type="submit"
            aria-label="Gửi"
            disabled={!message.trim() || messageMutation.isPending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </form>
      </Card>

      {(next || canCancel) && (
        <ActionBar>
          {canCancel && (
            <BigButton
              tone="danger"
              className={next ? 'w-auto px-5' : ''}
              onClick={() => setCancelOpen(true)}
            >
              {c.cancel}
            </BigButton>
          )}
          {next && (
            <BigButton
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(next)}
            >
              {c.next[request.status]}
            </BigButton>
          )}
        </ActionBar>
      )}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <p className="text-[18px] font-medium text-ink">{c.cancelTitle}</p>
        <p className="mt-1 text-[14px] leading-6 text-slate-600">{c.cancelBody}</p>
        <div className="mt-5 space-y-2.5">
          <BigButton
            tone="danger"
            disabled={statusMutation.isPending}
            onClick={() =>
              statusMutation.mutate({ status: 'CANCELLED', note: 'Chuyên gia đã hủy lịch tư vấn.' })
            }
          >
            {c.confirmCancel}
          </BigButton>
          <BigButton tone="secondary" onClick={() => setCancelOpen(false)}>
            {c.keep}
          </BigButton>
        </div>
      </Sheet>
      {toast.node}
    </Screen>
  );
}

function Block({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="mt-3">
      <p className="text-[12px] text-slate-500">{title}</p>
      <p className="mt-0.5 text-[14px] leading-6 text-ink">{text}</p>
    </div>
  );
}
