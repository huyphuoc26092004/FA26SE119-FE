import { apiClient } from './apiClient';
export interface WorkShift {
 id: string; starts_at: string; ends_at: string;
 lunch_starts_at: string | null; lunch_ends_at: string | null; cancelled_at: string | null;
}
export interface ShiftInput {
 consultantId: string; fromDate: string; toDate: string; startsAt: string; endsAt: string;
 lunchStartsAt: string | null; lunchEndsAt: string | null; weekdays: string[];
}
export const listWorkShifts = (consultantId: string, from: string, to: string) =>
 apiClient.get<WorkShift[]>('/consultant-work-shifts', { params: { consultantId, from, to } }).then(r => r.data);
export const saveWorkShift = (input: ShiftInput, id?: string) => id
 ? apiClient.put('/consultant-work-shifts/' + id, input)
 : apiClient.post('/consultant-work-shifts', input);
export const cancelWorkShift = (id: string) => apiClient.delete('/consultant-work-shifts/' + id);
export const getConsultantSlots = (id: string, from: string, to: string) =>
 apiClient.get<{ starts_at: string; ends_at: string }[]>('/consultants/' + id + '/slots',
 { params: { from, to, durationMinutes: 60 } }).then(r => r.data);
