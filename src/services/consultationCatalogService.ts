import { apiClient } from './apiClient';
import { submitSePayForm, type SePayCheckout } from './subscriptionService';

export interface ConsultationServiceItem {
  id: string;
  service_code: string;
  display_name: string;
  description: string;
  delivery_mode: 'ASYNC' | 'LIVE';
  duration_minutes: number | null;
  price: number;
  currency: string;
  is_active: boolean;
  sessions_count?: number;
  is_session_pack?: boolean;
}
export interface ConsultationOrder {
  id: string;
  service_name: string;
  amount: number;
  currency: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  payment_order_id: string;
  payment_status: string;
  thread_id: string | null;
  created_at: string;
  duration_minutes?: number | null;
  sessions_total?: number;
  sessions_remaining?: number;
  is_session_pack?: boolean;
}
export const consultationMoney = (value: number | string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
export const listConsultationServices = (admin = false) =>
  apiClient
    .get<ConsultationServiceItem[]>(
      admin ? '/admin/consultation-services' : '/consultation-services',
    )
    .then((r) => r.data);
export const listConsultationOrders = () =>
  apiClient.get<ConsultationOrder[]>('/consultation-orders').then((r) => r.data);
export async function saveConsultationService(item: ConsultationServiceItem) {
  const body = {
    serviceCode: item.service_code,
    displayName: item.display_name,
    description: item.description,
    deliveryMode: item.delivery_mode,
    durationMinutes: item.delivery_mode === 'LIVE' ? item.duration_minutes : null,
    price: Number(item.price),
    isActive: item.is_active,
    sessionsCount: item.sessions_count ?? 1,
    isSessionPack: item.is_session_pack ?? item.delivery_mode === 'LIVE',
  };
  return item.id
    ? apiClient.put('/admin/consultation-services/' + item.id, body)
    : apiClient.post('/admin/consultation-services', body);
}
export const createConsultationOrder = (
  serviceId: string,
  subject?: string,
  description?: string,
) =>
  apiClient
    .post<ConsultationOrder>('/consultation-orders', { serviceId, subject, description })
    .then((r) => r.data);
export const cancelConsultationOrder = (id: string) =>
  apiClient.post('/consultation-orders/' + id + '/cancel');
export async function payConsultationOrder(paymentId: string) {
  const { data } = await apiClient.post<SePayCheckout>(
    '/payments/orders/' + paymentId + '/sepay-checkout',
  );
  submitSePayForm(data);
}
