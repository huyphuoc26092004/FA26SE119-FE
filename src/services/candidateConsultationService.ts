import type { CandidateProfile, Resume } from '../types/domain';
import type { ConsultationPriority, ConsultationRequest, ConsultationTopic } from '../types/consultation';
import { apiClient } from './apiClient';
import { type ApiRow } from './candidateMappers';
import { TOPIC_LABELS, buildDescription, toConsultationRequest } from './consultationMappers';

export const DEFAULT_CONSULTANT = {
  id: '',
  name: 'Đội ngũ cố vấn CCV',
  title: 'Career Consultant',
  bio: 'Chọn cố vấn phù hợp và khung giờ tư vấn. Sau khi được tiếp nhận, hai bên nhận lịch Google Calendar và tham gia qua Google Meet.',
  bioEn: 'Choose an advisor and time. Once accepted, both participants receive Google Calendar invitations and join through Google Meet.',
  responseTime: '24',
};

export const CONSULTATION_TOPIC_LABELS = TOPIC_LABELS;

const MESSAGE_PAGE = 100;

async function loadThread(row: ApiRow): Promise<ConsultationRequest> {
  if (row.request_type === 'SESSION_BOOKING') return toConsultationRequest(row, { messages: [] });
  const { data: messages } = await apiClient.get<ApiRow[]>(`/consultations/${row.id}/messages`, { params: { limit: MESSAGE_PAGE } });
  return toConsultationRequest(row, { messages });
}

/** Cuộc tư vấn của ứng viên đang đăng nhập (backend tự lọc theo người gọi). */
export async function getMyConsultations(candidateId: string): Promise<ConsultationRequest[]> {
  const { data } = await apiClient.get<ApiRow[]>('/consultations');
  const mine = data.filter((row) => row.request_type !== 'SESSION_BOOKING'
    && (!candidateId || String(row.candidate_user_id) === candidateId));
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

/** Booked sessions expose metadata only; legacy conversations retain their message history. */
export async function getMyConsultation(id: string): Promise<ConsultationRequest> {
  const { data } = await apiClient.get<ApiRow>(`/consultations/${id}`);
  return loadThread(data);
}
