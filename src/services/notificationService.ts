/** Thông báo cá nhân (/notifications), thông báo hệ thống (/announcements) và quản lý thông báo của admin. */
import { apiClient } from './apiClient';
import { type ApiRow, rows, str } from './candidateMappers';
import { formatDateTime } from './supportService';

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  referenceType: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnouncementTargetType = 'ALL' | 'ROLE' | 'USER';

export interface AnnouncementTarget {
  type: AnnouncementTargetType;
  role?: 'CANDIDATE' | 'CAREER_CONSULTANT' | 'ADMIN';
  userId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  publishAt: string;
  expiresAt: string;
  /** Giá trị ISO gốc để điền lại form. */
  expiresAtIso: string;
  createdAt: string;
  targets: AnnouncementTarget[];
}

const toNotification = (row: ApiRow): UserNotification => ({
  id: str(row.id),
  type: str(row.type),
  title: str(row.title),
  content: str(row.content),
  referenceType: str(row.reference_type),
  referenceId: str(row.reference_id),
  isRead: Boolean(row.is_read),
  createdAt: formatDateTime(row.created_at),
});

const toAnnouncement = (row: ApiRow): Announcement => ({
  id: str(row.id),
  title: str(row.title),
  content: str(row.content),
  status: (str(row.status) || 'DRAFT') as AnnouncementStatus,
  publishAt: formatDateTime(row.publish_at),
  expiresAt: formatDateTime(row.expires_at),
  expiresAtIso: str(row.expires_at),
  createdAt: formatDateTime(row.created_at),
  targets: rows(row.targets).map((t) => ({
    type: (str(t.target_type ?? t.type) || 'ALL') as AnnouncementTargetType,
    role: (str(t.target_role ?? t.role) || undefined) as AnnouncementTarget['role'],
    userId: str(t.target_user_id ?? t.userId) || undefined,
  })),
});

export async function getNotifications(unreadOnly = false): Promise<UserNotification[]> {
  const { data } = await apiClient.get<ApiRow[]>('/notifications', { params: { unreadOnly } });
  return data.map(toNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}

/** Thông báo hệ thống đang hiệu lực dành cho người dùng hiện tại. */
export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiRow[]>('/announcements');
  return data.map(toAnnouncement);
}

// ---- Admin ----

export interface AnnouncementInput {
  title: string;
  content: string;
  /** ISO, phải ở tương lai; để trống là không hết hạn. */
  expiresAt?: string;
  targets: AnnouncementTarget[];
}

const announcementBody = (input: AnnouncementInput) => ({
  title: input.title.trim(),
  content: input.content.trim(),
  expiresAt: input.expiresAt || null,
  targets: input.targets.map((t) => ({ type: t.type, role: t.type === 'ROLE' ? t.role : null, userId: t.type === 'USER' ? t.userId : null })),
});

export async function getAdminAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiRow[]>('/admin/announcements');
  return data.map(toAnnouncement);
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const { data } = await apiClient.post<ApiRow>('/admin/announcements', announcementBody(input));
  return toAnnouncement(data);
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement> {
  const { data } = await apiClient.put<ApiRow>(`/admin/announcements/${id}`, announcementBody(input));
  return toAnnouncement(data);
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
  const { data } = await apiClient.post<ApiRow>(`/admin/announcements/${id}/publish`);
  return toAnnouncement(data);
}

export async function archiveAnnouncement(id: string): Promise<Announcement> {
  const { data } = await apiClient.post<ApiRow>(`/admin/announcements/${id}/archive`);
  return toAnnouncement(data);
}
