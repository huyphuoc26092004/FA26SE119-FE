import { apiClient } from './apiClient';
import { num, rows, str, type ApiRow } from './candidateMappers';

export type AppealStatus = 'PENDING' | 'STAFF_APPROVED' | 'STAFF_REJECTED' | 'ACCEPTED' | 'REJECTED';
export type StaffVerdict = 'APPROVED' | 'REJECTED';

export interface RatingAppeal {
  id: string;
  bookingId: string;
  consultantName: string;
  candidateName: string;
  rating: number;
  comment: string;
  reason: string;
  evidenceUrl: string;
  createdAt: string;
  status: AppealStatus;
  decisionReason: string;
  reviewedAt: string;
  staffStatus: StaffVerdict | null;
  staffReason: string;
  staffName: string;
  staffReviewedAt: string;
}

const APPEAL_STATUSES: readonly string[] = ['PENDING', 'STAFF_APPROVED', 'STAFF_REJECTED', 'ACCEPTED', 'REJECTED'];

export function toRatingAppeal(row: ApiRow): RatingAppeal {
  const rawStaff = str(row.staff_decision ?? row.staffDecision).toUpperCase();
  const status = str(row.status).toUpperCase();
  return {
    id: str(row.id),
    bookingId: str(row.booking_id ?? row.bookingId),
    consultantName: str(row.consultant_name ?? row.consultantName),
    candidateName: str(row.candidate_name ?? row.candidateName),
    rating: num(row.rating),
    comment: str(row.comment),
    reason: str(row.reason),
    evidenceUrl: str(row.evidence_url ?? row.evidenceUrl),
    createdAt: str(row.created_at ?? row.createdAt),
    status: APPEAL_STATUSES.includes(status) ? status as AppealStatus : 'PENDING',
    decisionReason: str(row.decision_reason ?? row.decisionReason),
    reviewedAt: str(row.reviewed_at ?? row.reviewedAt),
    staffStatus: rawStaff === 'APPROVED' || rawStaff === 'REJECTED' ? rawStaff : null,
    staffReason: str(row.staff_decision_reason ?? row.staffDecisionReason),
    staffName: str(row.staff_reviewer_name ?? row.staffReviewerName),
    staffReviewedAt: str(row.staff_reviewed_at ?? row.staffReviewedAt),
  };
}

/** Bước hiện tại của một báo cáo, dùng chung cho tư vấn viên, Staff và Manager. */
export function appealStage(appeal: Pick<RatingAppeal, 'status'> | undefined) {
  if (!appeal) return 'none' as const;
  if (appeal.status === 'PENDING') return 'staff' as const;
  if (appeal.status === 'STAFF_APPROVED') return 'manager' as const;
  return 'closed' as const;
}

const bookingAppealPath = (bookingId: string) =>
  `/consultation-bookings/${encodeURIComponent(bookingId)}/rating-appeal`;

export const getBookingRatingAppeals = async (bookingId: string) =>
  rows((await apiClient.get<unknown>(bookingAppealPath(bookingId))).data).map(toRatingAppeal);

export const submitRatingAppeal = async (bookingId: string, reason: string, evidenceUrl: string) =>
  toRatingAppeal((await apiClient.post<ApiRow>(bookingAppealPath(bookingId), { reason, evidenceUrl })).data);

export const getManagerRatingAppeals = async () =>
  rows((await apiClient.get<unknown>('/manager/rating-appeals')).data).map(toRatingAppeal);

export const decideRatingAppeal = (id: string, decision: 'ACCEPTED' | 'REJECTED', reason: string) =>
  apiClient.post(`/manager/rating-appeals/${encodeURIComponent(id)}/decision`, { decision, reason });

export const getStaffRatingAppeals = async (status?: AppealStatus) =>
  rows((await apiClient.get<unknown>('/staff/rating-appeals', { params: { status } })).data).map(toRatingAppeal);

export const reviewRatingAppeal = (id: string, decision: StaffVerdict, reason: string) =>
  apiClient.post(`/staff/rating-appeals/${encodeURIComponent(id)}/preliminary-decision`, { decision, reason });

export interface AppealHistoryEntry {
  id: string;
  actorName: string;
  actorRole: string;
  stage: string;
  fromStatus: string;
  toStatus: string;
  decision: string;
  reason: string;
  createdAt: string;
}

/** GET /{staff|manager}/rating-appeals/{id}/history — từng bước: SUBMISSION, PRELIMINARY_REVIEW, FINAL_REVIEW. */
export const getRatingAppealHistory = async (scope: 'staff' | 'manager', id: string): Promise<AppealHistoryEntry[]> =>
  rows((await apiClient.get<unknown>(`/${scope}/rating-appeals/${encodeURIComponent(id)}/history`)).data).map((row) => ({
    id: str(row.id),
    actorName: str(row.actor_name ?? row.actorName),
    actorRole: str(row.actor_role ?? row.actorRole),
    stage: str(row.stage),
    fromStatus: str(row.from_status ?? row.fromStatus),
    toStatus: str(row.to_status ?? row.toStatus),
    decision: str(row.decision),
    reason: str(row.reason),
    createdAt: str(row.created_at ?? row.createdAt),
  }));
