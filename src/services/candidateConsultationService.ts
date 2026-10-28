import type { CandidateProfile, Resume } from '../types/domain';
import type { ConsultationPriority, ConsultationRequest, ConsultationTopic } from '../types/consultation';
import { pending, notConnected } from './apiPending';

export const DEFAULT_CONSULTANT = {
  id: '2',
  name: 'Taylor Lee',
  title: 'Career Consultant',
  bio: 'Executive Recruiter & Tech HR Advisor, chuyên tư vấn CV, phỏng vấn và định hướng cho khối công nghệ.',
  bioEn: 'Executive recruiter and tech HR advisor focused on CVs, interviews and career direction in tech.',
  responseTime: '24',
};

export const CONSULTATION_TOPIC_LABELS: Record<ConsultationTopic, { vi: string; en: string }> = {
  CV_REVIEW: { vi: 'Tối ưu hóa CV & ATS', en: 'CV & ATS review' },
  CAREER_ORIENTATION: { vi: 'Định hướng nghề nghiệp', en: 'Career direction' },
  MOCK_INTERVIEW: { vi: 'Chuẩn bị phỏng vấn', en: 'Interview prep' },
  SALARY_NEGOTIATION: { vi: 'Đàm phán lương', en: 'Salary negotiation' },
  SKILL_ROADMAP: { vi: 'Lộ trình kỹ năng', en: 'Skill roadmap' },
};

// TODO(api): GET /api/v1/consultations
export async function getMyConsultations(candidateId: string): Promise<ConsultationRequest[]> {
  return pending([], 'GET /api/v1/consultations', candidateId);
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

// TODO(api): POST /api/v1/consultations
export async function createConsultationRequest(input: NewConsultationInput): Promise<ConsultationRequest> {
  return notConnected('POST /api/v1/consultations', input);
}

// TODO(api): POST /api/v1/consultations/{id}/messages
export async function sendCandidateMessage(id: string, content: string): Promise<ConsultationRequest> {
  return notConnected('POST /api/v1/consultations/{id}/messages', id, content);
}

// TODO(api): POST /api/v1/consultations/{id}/close
export async function cancelConsultationRequest(id: string): Promise<ConsultationRequest> {
  return notConnected('POST /api/v1/consultations/{id}/close', id);
}

// TODO(api): BE chưa có API
export async function rateConsultation(id: string, stars: number, comment: string): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, stars, comment);
}
