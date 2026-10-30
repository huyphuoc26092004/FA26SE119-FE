/** Tài khoản cá nhân dùng chung cho mọi vai trò: /me, /me/password, /me/sessions. */
import { apiClient } from './apiClient';
import { type ApiRow, str } from './candidateMappers';
import { formatDateTime } from './supportService';

export interface AccountProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  preferredLanguage: 'vi' | 'en';
  githubUrl: string;
  role: string;
  authProvider: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface LoginSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

const toAccount = (row: ApiRow): AccountProfile => ({
  id: str(row.id),
  email: str(row.email),
  fullName: str(row.full_name),
  avatarUrl: str(row.avatar_url),
  preferredLanguage: str(row.preferred_language) === 'en' ? 'en' : 'vi',
  githubUrl: str(row.github_url),
  role: str(row.role),
  authProvider: str(row.auth_provider) || 'EMAIL',
  createdAt: formatDateTime(row.created_at),
  lastLoginAt: formatDateTime(row.last_login_at),
});

export async function getAccount(): Promise<AccountProfile> {
  const { data } = await apiClient.get<ApiRow>('/me');
  return toAccount(data);
}

/** PUT /me cần đủ fullName; các trường khác để trống sẽ bị xoá. */
export async function updateAccount(input: { fullName: string; avatarUrl?: string; preferredLanguage?: 'vi' | 'en'; githubUrl?: string }): Promise<AccountProfile> {
  const { data } = await apiClient.put<ApiRow>('/me', {
    fullName: input.fullName.trim(),
    avatarUrl: input.avatarUrl?.trim() || null,
    preferredLanguage: input.preferredLanguage ?? 'vi',
    githubUrl: input.githubUrl?.trim() || null,
  });
  return toAccount(data);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/me/password', { currentPassword, newPassword });
}

/** Các phiên đăng nhập (refresh token còn hạn). */
export async function getLoginSessions(): Promise<LoginSession[]> {
  const { data } = await apiClient.get<ApiRow[]>('/me/sessions');
  return data.map((row) => ({ id: str(row.id), createdAt: formatDateTime(row.created_at), expiresAt: formatDateTime(row.expires_at) }));
}

export async function revokeLoginSession(id: string): Promise<void> {
  await apiClient.delete(`/me/sessions/${id}`);
}

/** Xoá mềm tài khoản của chính mình (DELETE /me). */
export async function deleteOwnAccount(): Promise<void> {
  await apiClient.delete('/me');
}
