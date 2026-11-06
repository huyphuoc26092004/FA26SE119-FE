import { apiClient } from './apiClient';

export interface ConsultantProfile {
  user_id?: string;
  bio: string;
  target_roles: string[];
}

export interface ConsultantSummary extends ConsultantProfile {
  id: string;
  full_name: string;
  average_rating: number;
  rating_count: number;
  completed_count: number;
}

export interface BusySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  description?: string;
}

export interface ConsultantAvailability extends BusySlot {
  type: 'BOOKING' | 'BUSY';
}

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';

export interface ConsultationBooking {
  id: string;
  candidate_user_id: string;
  consultant_user_id: string;
  candidate_name: string;
  consultant_name: string;
  credit_order_id: string;
  target_role: string;
  subject: string;
  description: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  status: BookingStatus;
  thread_id: string;
  credit_refunded: boolean;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  rating_created_at: string | null;
}

export interface NewBooking {
  consultantId: string;
  targetRole: string;
  subject: string;
  description: string;
  startsAt: string;
  creditOrderId: string;
}

export const listConsultants = (targetRole: string) =>
  apiClient
    .get<ConsultantSummary[]>('/consultants', { params: { targetRole } })
    .then((r) => r.data);

export const getConsultantAvailability = (id: string, from: string, to: string) =>
  apiClient
    .get<ConsultantAvailability[]>(`/consultants/${id}/availability`, {
      params: { from, to },
    })
    .then((r) => r.data);

export const listBookings = () =>
  apiClient.get<ConsultationBooking[]>('/consultation-bookings').then((r) => r.data);

export const createBooking = (input: NewBooking) =>
  apiClient.post<ConsultationBooking>('/consultation-bookings', input).then((r) => r.data);

export const bookingAction = (id: string, action: 'accept' | 'decline' | 'cancel' | 'complete') =>
  apiClient.post<ConsultationBooking>(`/consultation-bookings/${id}/${action}`).then((r) => r.data);

export const rateBooking = (id: string, rating: number, comment: string) =>
  apiClient
    .post<ConsultationBooking>(`/consultation-bookings/${id}/rating`, { rating, comment })
    .then((r) => r.data);

export const getMyConsultantProfile = () =>
  apiClient.get<ConsultantProfile>('/consultants/me/profile').then((r) => r.data);

export const saveMyConsultantProfile = (targetRoles: string[], bio: string) =>
  apiClient
    .put<ConsultantProfile>('/consultants/me/profile', { targetRoles, bio })
    .then((r) => r.data);

export const listMyBusySlots = () =>
  apiClient.get<BusySlot[]>('/consultants/me/busy').then((r) => r.data);

export const createBusySlot = (input: { startsAt: string; endsAt: string; description: string }) =>
  apiClient.post<BusySlot>('/consultants/me/busy', input).then((r) => r.data);

export const deleteBusySlot = (id: string) => apiClient.delete(`/consultants/me/busy/${id}`);
