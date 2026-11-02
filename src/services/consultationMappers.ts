/**
 * Chuyển dữ liệu tư vấn của backend (consultation_threads, consultation_messages,
 * candidate-profile) sang kiểu FE. Backend chỉ lưu chủ đề, loại yêu cầu và mô tả,
 * nên FE ghi thời gian mong muốn, CV đính kèm và độ ưu tiên vào cuối mô tả rồi đọc lại.
 */
import type {
  ConsultationCandidate,
  ConsultationMessage,
  ConsultationPriority,
  ConsultationRequest,
  ConsultationStatus,
  ConsultationTimelineEvent,
  ConsultationTopic,
} from '../types/consultation';
import { type ApiRow, num, obj, rows, str, texts } from './candidateMappers';

export const TOPIC_LABELS: Record<ConsultationTopic, { vi: string; en: string }> = {
  CV_REVIEW: { vi: 'Tối ưu hóa CV & ATS', en: 'CV & ATS review' },
  CAREER_ORIENTATION: { vi: 'Định hướng nghề nghiệp', en: 'Career direction' },
  MOCK_INTERVIEW: { vi: 'Chuẩn bị phỏng vấn', en: 'Interview prep' },
  SALARY_NEGOTIATION: { vi: 'Đàm phán lương', en: 'Salary negotiation' },
  SKILL_ROADMAP: { vi: 'Lộ trình kỹ năng', en: 'Skill roadmap' },
};

const TOPICS = Object.keys(TOPIC_LABELS) as ConsultationTopic[];

/** request_type của cuộc chat trực tiếp (backend lưu tự do, tối đa 50 ký tự). */
export const DIRECT_CHAT_TYPE = 'DIRECT_CHAT';
export const DIRECT_CHAT_SUBJECT = { vi: 'Trò chuyện trực tiếp', en: 'Direct chat' };
const META_MARK = '\n\n---\n';

export interface RequestMeta {
  preferredSlot?: string;
  resumeId?: string;
  resumeTitle?: string;
  priority?: ConsultationPriority;
}

/** Ghép mục tiêu với các trường FE-only để lưu vào `description`. */
export function buildDescription(goal: string, meta: RequestMeta): string {
  const lines = [
    meta.preferredSlot && `Thời gian mong muốn: ${meta.preferredSlot}`,
    meta.resumeId && `CV đính kèm: ${meta.resumeTitle ?? ''} [${meta.resumeId}]`,
    meta.priority && meta.priority !== 'NORMAL' && `Ưu tiên: ${meta.priority}`,
  ].filter(Boolean);
  return lines.length ? `${goal.trim()}${META_MARK}${lines.join('\n')}` : goal.trim();
}

export function parseDescription(text: string): { goal: string } & RequestMeta {
  const at = text.lastIndexOf(META_MARK);
  if (at < 0) return { goal: text };
  const meta: RequestMeta = {};
  for (const line of text.slice(at + META_MARK.length).split('\n')) {
    const [key, ...rest] = line.split(': ');
    const value = rest.join(': ').trim();
    if (key === 'Thời gian mong muốn') meta.preferredSlot = value;
    if (key === 'Ưu tiên' && ['URGENT', 'HIGH', 'NORMAL'].includes(value)) meta.priority = value as ConsultationPriority;
    if (key === 'CV đính kèm') {
      const m = /^(.*)\[([^\]]+)\]$/.exec(value);
      if (m) {
        meta.resumeTitle = m[1].trim() || undefined;
        meta.resumeId = m[2];
      }
    }
  }
  return { goal: text.slice(0, at), ...meta };
}

/** OPEN chưa phân công = chờ, OPEN đã có consultant = đang tư vấn, CLOSED = hoàn tất. */
export function toConsultationStatus(row: ApiRow): ConsultationStatus {
  if (str(row.status) === 'CLOSED') return 'COMPLETED';
  return row.consultant_user_id ? 'IN_PROGRESS' : 'PENDING';
}

export function toConsultationMessage(row: ApiRow, candidateUserId: string): ConsultationMessage {
  const sender = str(row.sender_user_id);
  return {
    id: str(row.id),
    senderId: sender,
    senderName: str(row.full_name),
    senderRole: sender === candidateUserId ? 'CANDIDATE' : 'CAREER_CONSULTANT',
    content: str(row.content),
    timestamp: str(row.sent_at),
    readAt: str(row.read_at) || undefined,
  };
}

const emptyCandidate = (id: string, name = ''): ConsultationCandidate => ({
  id,
  name,
  email: '',
  phone: '',
  avatar: '',
  location: '',
  currentTitle: '',
  targetRole: '',
  experienceLevel: '',
  yearsOfExperience: 0,
  topSkills: [],
});

/** Kết quả GET /consultations/{id}/candidate-profile thành thông tin ứng viên. */
export function toConsultationCandidate(profileRow: ApiRow, fallbackId: string): ConsultationCandidate {
  const user = obj(profileRow.candidate);
  const profile = obj(profileRow.career_profile);
  const resume = obj(profileRow.resume);
  const data = obj(resume.structured_data);
  const skills = rows(profile.skills).map((s) => str(s.name));
  return {
    ...emptyCandidate(str(user.id) || fallbackId, str(user.full_name)),
    email: str(data.email),
    phone: str(data.phone),
    location: str(profile.preferred_location ?? data.location),
    currentTitle: str(profile.current_job_title),
    targetRole: str(profile.target_job_title),
    yearsOfExperience: num(profile.years_experience),
    experienceLevel: num(profile.years_experience) ? `${num(profile.years_experience)} năm` : '',
    topSkills: skills.length ? skills.slice(0, 8) : texts(data.skills).slice(0, 8),
    attachedResumeId: str(resume.id) || undefined,
    attachedResumeName: str(resume.title) || undefined,
    github: str(data.github) || undefined,
    linkedIn: str(data.linkedin) || undefined,
    bio: str(profile.career_goal ?? data.summary) || undefined,
  };
}

export function toConsultationRequest(
  row: ApiRow,
  extra: { messages?: ApiRow[]; candidate?: ConsultationCandidate; candidateName?: string; consultantName?: string } = {},
): ConsultationRequest {
  const id = str(row.id);
  const candidateUserId = str(row.candidate_user_id);
  const topic = TOPICS.includes(str(row.request_type) as ConsultationTopic) ? (str(row.request_type) as ConsultationTopic) : 'CAREER_ORIENTATION';
  const { goal, preferredSlot, resumeId, resumeTitle, priority } = parseDescription(str(row.request_description));
  const status = toConsultationStatus(row);
  const messages = (extra.messages ?? []).map((m) => toConsultationMessage(m, candidateUserId));
  const consultantName =
    extra.consultantName ?? messages.find((m) => m.senderRole === 'CAREER_CONSULTANT')?.senderName ?? (row.consultant_user_id ? 'Cố vấn được phân công' : '');
  const candidate = extra.candidate ?? emptyCandidate(candidateUserId, extra.candidateName ?? messages.find((m) => m.senderRole === 'CANDIDATE')?.senderName ?? '');
  if (resumeId && !candidate.attachedResumeId) {
    candidate.attachedResumeId = resumeId;
    candidate.attachedResumeName = resumeTitle;
  }
  const timeline: ConsultationTimelineEvent[] = [
    { id: `${id}-created`, status: 'PENDING', title: 'Gửi yêu cầu tư vấn', description: str(row.subject), timestamp: str(row.created_at), actor: candidate.name || 'Ứng viên' },
  ];
  if (row.consultant_user_id) {
    timeline.push({ id: `${id}-assigned`, status: 'IN_PROGRESS', title: 'Đã phân công cố vấn', description: consultantName, timestamp: messages[0]?.timestamp ?? str(row.created_at), actor: 'Quản trị viên' });
  }
  if (row.closed_at) {
    timeline.push({ id: `${id}-closed`, status: 'COMPLETED', title: 'Đã đóng cuộc tư vấn', description: '', timestamp: str(row.closed_at), actor: '' });
  }
  return {
    id,
    channel: str(row.request_type) === DIRECT_CHAT_TYPE ? 'CHAT' : 'REQUEST',
    candidate,
    consultantId: str(row.consultant_user_id),
    consultantName,
    topic,
    topicLabel: str(row.subject) || TOPIC_LABELS[topic].vi,
    priority: priority ?? ((['URGENT', 'HIGH'].includes(str(row.priority)) ? str(row.priority) : 'NORMAL') as ConsultationPriority),
    status,
    requestedAt: str(row.created_at),
    targetGoal: goal,
    candidateNotes: goal,
    candidateQuestions: [],
    currentObstacles: '',
    // Backend chưa có lịch hẹn; giữ thời gian ứng viên đề xuất, chưa có link họp.
    meeting: {
      platform: 'Google Meet',
      meetingUrl: '',
      meetingCode: '',
      scheduledAt: preferredSlot ?? str(row.created_at),
      durationMinutes: 45,
    },
    messages,
    timeline,
  };
}
