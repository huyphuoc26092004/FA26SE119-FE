import type { ConsultationRequest, ConsultationStatus, ConsultationPriority, ConsultationTopic, ConsultantDashboardStats, ConsultantFeedback, ConsultationMessage, ConsultationMeetingInfo, ConsultantCandidateSummary, CandidateCareerAnalysis, ConsultationAdvicePillars } from '../types/consultation';
import { pending, notConnected } from './apiPending';

export interface ConsultationFilterParams {
  status?: ConsultationStatus | 'ALL';
  priority?: ConsultationPriority | 'ALL';
  topic?: ConsultationTopic | 'ALL';
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'scheduled' | 'priority';
}

// TODO(api): BE chưa có API
export async function getConsultantDashboardStats(): Promise<ConsultantDashboardStats> {
  return notConnected('BE chưa có API');
}

// TODO(api): GET /api/v1/consultations
export async function getConsultationRequests(params: ConsultationFilterParams = {}): Promise<ConsultationRequest[]> {
  return pending([], 'GET /api/v1/consultations', params);
}

// TODO(api): GET /api/v1/consultations/{id}
export async function getConsultationRequestById(id: string): Promise<ConsultationRequest | null> {
  return pending(null, 'GET /api/v1/consultations/{id}', id);
}

// TODO(api): POST /api/v1/consultations/{id}/close
export async function updateConsultationStatus(id: string, newStatus: ConsultationStatus, actionNote?: string): Promise<ConsultationRequest> {
  return notConnected('POST /api/v1/consultations/{id}/close', id, newStatus, actionNote);
}

// TODO(api): BE chưa có API
export async function saveConsultantPrivateNotes(id: string, notes: string, rubric?: {
    cvQuality: number;
    technicalDepth: number;
    communication: number;
    marketReadiness: number;
  }): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, notes, rubric);
}

// TODO(api): BE chưa có API
export async function saveConsultantFeedback(id: string, feedback: ConsultantFeedback): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, feedback);
}

// TODO(api): BE chưa có API
export async function saveConsultationAdvice(id: string, advice: ConsultationAdvicePillars): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, advice);
}

// TODO(api): BE chưa có API
export async function saveCandidateCareerAdvice(candidateId: string, advice: ConsultationAdvicePillars): Promise<ConsultationAdvicePillars> {
  return notConnected('BE chưa có API', candidateId, advice);
}

// TODO(api): POST /api/v1/consultations/{id}/resumes/{resumeId}/analyze
export function generateAiConsultationAdviceDraft(candidateName: string, targetRole: string, topic: ConsultationTopic): ConsultationAdvicePillars {
  return notConnected('POST /api/v1/consultations/{id}/resumes/{resumeId}/analyze', candidateName, targetRole, topic);
}

// TODO(api): POST /api/v1/consultations/{id}/messages
export async function sendConsultationMessage(id: string, content: string, senderRole: 'CAREER_CONSULTANT' | 'CANDIDATE' = 'CAREER_CONSULTANT'): Promise<ConsultationMessage> {
  return notConnected('POST /api/v1/consultations/{id}/messages', id, content, senderRole);
}

// TODO(api): BE chưa có API
export async function updateMeetingSchedule(id: string, meetingUpdate: Partial<ConsultationMeetingInfo>): Promise<ConsultationRequest> {
  return notConnected('BE chưa có API', id, meetingUpdate);
}

// TODO(api): BE chưa có API
export function resetConsultationData(): void {
  pending(undefined, 'BE chưa có API');
}

// TODO(api): GET /api/v1/consultations
export async function getConsultantCandidates(): Promise<ConsultantCandidateSummary[]> {
  return pending([], 'GET /api/v1/consultations');
}

// TODO(api): GET /api/v1/consultations/{id}/candidate-profile
export async function getCandidateCareerAnalysis(candidateId: string): Promise<CandidateCareerAnalysis | null> {
  return pending(null, 'GET /api/v1/consultations/{id}/candidate-profile', candidateId);
}
