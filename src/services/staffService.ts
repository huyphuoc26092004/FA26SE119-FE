/** API riêng của Staff (StaffOperationsController, /api/v1/staff/**; ADMIN, MANAGER, STAFF đều gọi được). */
import { apiClient } from './apiClient';
import { num, obj, rows, str, type ApiRow } from './candidateMappers';

export interface StaffDashboard {
  activeJobs: number;
  pendingJobs: number;
  expiredOrInvalidJobs: number;
  duplicateJobGroups: number;
  activeResumeTemplates: number;
  inactiveResumeTemplates: number;
  activeConsultants: number;
  totalConsultantRatings: number;
  averageConsultantRating: number | null;
  pendingRatingAppeals: number;
  forwardedRatingAppeals: number;
  resolvedRatingAppeals: number;
}

export async function getStaffDashboard(): Promise<StaffDashboard> {
  const row = obj((await apiClient.get<unknown>('/staff/dashboard')).data);
  const avg = row.average_consultant_rating ?? row.averageConsultantRating;
  return {
    activeJobs: num(row.active_jobs ?? row.activeJobs),
    pendingJobs: num(row.pending_jobs ?? row.pendingJobs),
    expiredOrInvalidJobs: num(row.expired_or_invalid_jobs ?? row.expiredOrInvalidJobs),
    duplicateJobGroups: num(row.duplicate_job_groups ?? row.duplicateJobGroups),
    activeResumeTemplates: num(row.active_resume_templates ?? row.activeResumeTemplates),
    inactiveResumeTemplates: num(row.inactive_resume_templates ?? row.inactiveResumeTemplates),
    activeConsultants: num(row.active_consultants ?? row.activeConsultants),
    totalConsultantRatings: num(row.total_consultant_ratings ?? row.totalConsultantRatings),
    averageConsultantRating: avg === null || avg === undefined ? null : num(avg),
    pendingRatingAppeals: num(row.pending_rating_appeals ?? row.pendingRatingAppeals),
    forwardedRatingAppeals: num(row.forwarded_rating_appeals ?? row.forwardedRatingAppeals),
    resolvedRatingAppeals: num(row.resolved_rating_appeals ?? row.resolvedRatingAppeals),
  };
}

export interface StaffConsultant {
  id: string;
  name: string;
  email: string;
  status: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  upcomingBookings: number;
  averageRating: number | null;
  ratingCount: number;
}

const toConsultant = (row: ApiRow): StaffConsultant => ({
  id: str(row.user_id ?? row.id),
  name: str(row.full_name),
  email: str(row.email),
  status: str(row.status),
  totalBookings: num(row.total_bookings),
  completedBookings: num(row.completed_bookings),
  cancelledBookings: num(row.cancelled_bookings),
  upcomingBookings: num(row.upcoming_bookings),
  averageRating: row.average_rating === null || row.average_rating === undefined ? null : num(row.average_rating),
  ratingCount: num(row.rating_count),
});

/** GET /staff/consultants?search=&limit=&offset= */
export async function getStaffConsultants(search: string, offset = 0, limit = 20): Promise<StaffConsultant[]> {
  return rows((await apiClient.get<unknown>('/staff/consultants', { params: { search, limit, offset } })).data).map(toConsultant);
}

export interface StaffConsultantRating {
  id: string;
  rating: number;
  comment: string;
  isRemoved: boolean;
  createdAt: string;
  candidateName: string;
  consultantName: string;
  subject: string;
  startsAt: string;
  /** Trạng thái báo cáo đánh giá nếu tư vấn viên đã báo cáo (PENDING, STAFF_APPROVED, ...). */
  appealStatus: string;
}

const toRating = (row: ApiRow): StaffConsultantRating => ({
  id: str(row.id),
  rating: num(row.rating),
  comment: str(row.comment),
  isRemoved: row.is_removed === true,
  createdAt: str(row.created_at),
  candidateName: str(row.candidate_name),
  consultantName: str(row.consultant_name),
  subject: str(row.subject ?? row.target_role),
  startsAt: str(row.starts_at),
  appealStatus: str(row.appeal_status).toUpperCase(),
});

/** GET /staff/consultant-ratings?consultantId=&rating=&includeRemoved=&limit=&offset= */
export async function getStaffConsultantRatings(params: {
  consultantId?: string;
  rating?: number;
  includeRemoved?: boolean;
  offset?: number;
  limit?: number;
}): Promise<StaffConsultantRating[]> {
  const { consultantId, rating, includeRemoved = false, offset = 0, limit = 20 } = params;
  const { data } = await apiClient.get<unknown>('/staff/consultant-ratings', {
    params: { consultantId: consultantId || undefined, rating: rating || undefined, includeRemoved, limit, offset },
  });
  return rows(data).map(toRating);
}

export type FeedbackSource = 'CONSULTATION' | 'MATCHING' | 'ASSISTANT';

export interface StaffFeedback {
  id: string;
  source: FeedbackSource | string;
  userName: string;
  email: string;
  rating: number | null;
  text: string;
  createdAt: string;
}

/** GET /staff/feedback?source=&limit=&offset= */
export async function getStaffFeedback(source: FeedbackSource | '', offset = 0, limit = 20): Promise<StaffFeedback[]> {
  const { data } = await apiClient.get<unknown>('/staff/feedback', { params: { source: source || undefined, limit, offset } });
  return rows(data).map((row) => ({
    id: str(row.id),
    source: str(row.source),
    userName: str(row.full_name),
    email: str(row.email),
    rating: row.rating === null || row.rating === undefined ? null : num(row.rating),
    text: str(row.feedback_text),
    createdAt: str(row.created_at),
  }));
}

/**
 * GET /staff/consultants/{id}/ratings — các buổi tư vấn đã được ứng viên đánh giá của một tư vấn viên.
 * BE chưa có endpoint lịch tư vấn cho Staff (GET /manager/consultants/{id}/bookings chỉ ADMIN/MANAGER),
 * nên buổi chưa có đánh giá, trạng thái buổi và Google Meet không có ở đây.
 */
export async function getStaffConsultantSessions(
  consultantId: string,
  params: { rating?: number; includeRemoved?: boolean; offset?: number; limit?: number } = {},
): Promise<StaffConsultantRating[]> {
  const { rating, includeRemoved = false, offset = 0, limit = 20 } = params;
  const { data } = await apiClient.get<unknown>(`/staff/consultants/${encodeURIComponent(consultantId)}/ratings`, {
    params: { rating: rating || undefined, includeRemoved, limit, offset },
  });
  return rows(data).map(toRating);
}
