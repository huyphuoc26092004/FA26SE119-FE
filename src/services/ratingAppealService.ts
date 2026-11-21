/**
 * Báo cáo đánh giá tư vấn viên (rating appeal), quy trình 3 bước:
 *   1. Tư vấn viên gửi báo cáo về một đánh giá (POST /consultation-bookings/{id}/rating-appeal — BE đã có).
 *   2. Staff xem xét, đề xuất ẩn hoặc giữ đánh giá, kèm lý do (BE CHƯA CÓ: /staff/rating-appeals…).
 *   3. Manager đọc lý do của Staff rồi chấp thuận hay không (POST /manager/rating-appeals/{id}/decision — BE đã có).
 *
 * Khi BE chưa trả các cột staff_* thì `staffStatus` là null: Manager vẫn duyệt thẳng như cũ để luồng hiện tại không bị chặn.
 */
import axios from 'axios';
import { apiClient } from './apiClient';
import { ApiNotConnectedError } from './apiPending';
import { num, rows, str, type ApiRow } from './candidateMappers';

export type AppealStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
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
  /** Kết quả cuối do Manager chốt. */
  status: AppealStatus;
  decisionReason: string;
  reviewedAt: string;
  /** null = BE chưa có bước Staff; PENDING = chờ Staff; APPROVED/REJECTED = Staff đã đề xuất. */
  staffStatus: 'PENDING' | StaffVerdict | null;
  staffReason: string;
  staffName: string;
  staffReviewedAt: string;
}

const STAFF_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export function toRatingAppeal(row: ApiRow): RatingAppeal {
  const hasStaffStep = 'staff_status' in row || 'staffStatus' in row;
  const rawStaff = str(row.staff_status ?? row.staffStatus).toUpperCase() || 'PENDING';
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
    status: status === 'ACCEPTED' || status === 'REJECTED' ? status : 'PENDING',
    decisionReason: str(row.decision_reason ?? row.decisionReason),
    reviewedAt: str(row.reviewed_at ?? row.reviewedAt),
    staffStatus: hasStaffStep ? ((STAFF_STATUSES as readonly string[]).includes(rawStaff) ? (rawStaff as RatingAppeal['staffStatus']) : 'PENDING') : null,
    staffReason: str(row.staff_reason ?? row.staffReason),
    staffName: str(row.staff_name ?? row.staffName),
    staffReviewedAt: str(row.staff_reviewed_at ?? row.staffReviewedAt),
  };
}

/** Bước hiện tại của một báo cáo, dùng chung cho tư vấn viên, Staff và Manager. */
export function appealStage(appeal: Pick<RatingAppeal, 'status' | 'staffStatus'> | undefined) {
  if (!appeal) return 'none' as const;
  if (appeal.status !== 'PENDING') return 'closed' as const;
  if (appeal.staffStatus === 'PENDING') return 'staff' as const;
  return 'manager' as const;
}

/** Endpoint BE chưa có (404/405) → báo rõ "chưa có API" thay vì lỗi chung. */
async function orNotConnected<T>(endpoint: string, run: () => Promise<T>, ...args: unknown[]): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 404 || status === 405) throw new ApiNotConnectedError(endpoint, args);
    throw error;
  }
}

// ---- Manager (BE đã có) ----

export const getManagerRatingAppeals = async () =>
  rows((await apiClient.get<unknown>('/manager/rating-appeals')).data).map(toRatingAppeal);

export const decideRatingAppeal = (id: string, decision: 'ACCEPTED' | 'REJECTED', reason: string) =>
  apiClient.post(`/manager/rating-appeals/${encodeURIComponent(id)}/decision`, { decision, reason }).then((r) => r.data);

// ---- Staff (BE chưa có — xem tài liệu API BE cần bổ sung) ----

// TODO(api): GET /api/v1/staff/rating-appeals
export const getStaffRatingAppeals = () =>
  orNotConnected('GET /api/v1/staff/rating-appeals', async () =>
    rows((await apiClient.get<unknown>('/staff/rating-appeals')).data).map(toRatingAppeal),
  );

// TODO(api): POST /api/v1/staff/rating-appeals/{id}/review { decision: APPROVED|REJECTED, reason }
export const reviewRatingAppeal = (id: string, decision: StaffVerdict, reason: string) =>
  orNotConnected(
    'POST /api/v1/staff/rating-appeals/{id}/review',
    async () => (await apiClient.post(`/staff/rating-appeals/${encodeURIComponent(id)}/review`, { decision, reason })).data,
    id,
    decision,
    reason,
  );
