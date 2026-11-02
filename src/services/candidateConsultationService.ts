import type { CandidateProfile, Resume } from '../types/domain';
import type { ConsultationPriority, ConsultationRequest, ConsultationTopic } from '../types/consultation';
import { apiClient } from './apiClient';
import { notConnected } from './apiPending';
import { type ApiRow } from './candidateMappers';
import { DIRECT_CHAT_SUBJECT, DIRECT_CHAT_TYPE, TOPIC_LABELS, buildDescription, toConsultationRequest } from './consultationMappers';

export const DEFAULT_CONSULTANT = {
  id: '',
  name: 'Đội ngũ cố vấn CCV',
  title: 'Career Consultant',
  bio: 'Quản trị viên sẽ phân công một cố vấn phù hợp với chủ đề bạn chọn. Cố vấn xem hồ sơ, CV và trao đổi trực tiếp với bạn tại đây.',
  bioEn: 'An admin assigns a consultant who fits your topic. They review your profile and CV and talk with you here.',
  responseTime: '24',
};

export const CONSULTATION_TOPIC_LABELS = TOPIC_LABELS;

const MESSAGE_PAGE = 100;

async function loadThread(row: ApiRow): Promise<ConsultationRequest> {
  const { data: messages } = await apiClient.get<ApiRow[]>(`/consultations/${row.id}/messages`, { params: { limit: MESSAGE_PAGE, latest: true } });
  return toConsultationRequest(row, { messages });
}

/** Cuộc tư vấn của ứng viên đang đăng nhập (backend tự lọc theo người gọi). */
export async function getMyConsultations(candidateId: string): Promise<ConsultationRequest[]> {
  const { data } = await apiClient.get<ApiRow[]>('/consultations');
  const mine = data.filter((row) => !candidateId || String(row.candidate_user_id) === candidateId);
  return Promise.all(mine.map(loadThread));
}

export interface NewConsultationInput {
  candidateId: string;
  profile?: CandidateProfile;
  resume?: Resume;
  topic: ConsultationTopic;
  priority: ConsultationPriority;
  preferredSlot: string; // ISO start time
  goal: string;
}

export async function createConsultationRequest(input: NewConsultationInput): Promise<ConsultationRequest> {
  const description = buildDescription(input.goal || TOPIC_LABELS[input.topic].vi, {
    preferredSlot: input.preferredSlot,
    resumeId: input.resume?.id,
    resumeTitle: input.resume?.name,
    priority: input.priority,
  });
  const { data } = await apiClient.post<ApiRow>('/consultations', {
    subject: TOPIC_LABELS[input.topic].vi,
    requestType: input.topic,
    description: description.slice(0, 10000),
  });
  return toConsultationRequest(data, { messages: [] });
}

export async function sendCandidateMessage(id: string, content: string): Promise<ConsultationRequest> {
  await apiClient.post(`/consultations/${id}/messages`, { content });
  const { data } = await apiClient.get<ApiRow>(`/consultations/${id}`);
  return loadThread(data);
}

/** Ứng viên đóng cuộc tư vấn (backend chưa phân biệt hủy và hoàn tất). */
export async function cancelConsultationRequest(id: string): Promise<ConsultationRequest> {
  const { data } = await apiClient.post<ApiRow>(`/consultations/${id}/close`);
  return loadThread(data);
}

// TODO(api): POST /api/v1/consultations/{id}/rating (BE chưa có API)
export async function rateConsultation(id: string, stars: number, comment: string): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, stars, comment);
}

/** Đọc lại một cuộc tư vấn kèm tin nhắn (dùng để làm mới khung chat). */
export async function getMyConsultation(id: string): Promise<ConsultationRequest> {
  const { data } = await apiClient.get<ApiRow>(`/consultations/${id}`);
  return loadThread(data);
}

/**
 * Chat trực tiếp: tạo một cuộc tư vấn loại DIRECT_CHAT với tin nhắn đầu tiên làm mô tả,
 * rồi gửi chính tin đó vào cuộc trò chuyện. Có `consultantId` thì cố vấn nhận ngay,
 * không có thì chờ quản trị viên phân công như yêu cầu thường.
 */
export async function startDirectChat(firstMessage: string, topic?: ConsultationTopic, consultantId?: string): Promise<ConsultationRequest> {
  const content = firstMessage.trim().slice(0, 10000);
  const { data } = await apiClient.post<ApiRow>('/consultations', {
    subject: topic ? `${DIRECT_CHAT_SUBJECT.vi} · ${TOPIC_LABELS[topic].vi}` : DIRECT_CHAT_SUBJECT.vi,
    requestType: DIRECT_CHAT_TYPE,
    description: content,
    ...(consultantId ? { consultantId } : {}),
  });
  await apiClient.post(`/consultations/${data.id}/messages`, { content });
  return loadThread(data);
}

export interface AvailableConsultant {
  id: string;
  name: string;
  avatarUrl: string;
  /** Số cuộc tư vấn đang mở cố vấn đang phụ trách. */
  openThreads: number;
  lastLoginAt: string;
}

/** Cố vấn đang hoạt động, ít việc nhất trước (GET /consultations/consultants). */
export async function getAvailableConsultants(): Promise<AvailableConsultant[]> {
  const { data } = await apiClient.get<ApiRow[]>('/consultations/consultants');
  return data.map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.full_name ?? ''),
    avatarUrl: String(row.avatar_url ?? ''),
    openThreads: Number(row.open_threads ?? 0),
    lastLoginAt: String(row.last_login_at ?? ''),
  }));
}
