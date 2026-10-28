import axios from 'axios';
import { apiClient } from './apiClient';
import type { User, UserRole } from '../types/domain';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface RegisterResponse {
  message: string;
  expiresIn?: number;
  developmentCode?: string;
}

interface ProfileResponse {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  status: string;
  email_verified_at?: string | null;
  created_at?: string | null;
}

interface ProblemDetail {
  status?: number;
  detail?: string;
  errors?: string[];
}

const toUser = (profile: ProfileResponse): User => ({
  id: profile.id,
  name: profile.full_name,
  email: profile.email,
  role: profile.role,
  isVerified: Boolean(profile.email_verified_at),
  avatar: profile.avatar_url ?? undefined,
  createdAt: profile.created_at ?? undefined,
});

const knownMessages: Record<string, string> = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Verify your email or contact support about your account status':
    'Tài khoản chưa xác minh email hoặc đang bị khóa. Vui lòng xác minh email trước khi đăng nhập.',
  'Wait 60 seconds before requesting a new code': 'Vui lòng đợi 60 giây trước khi yêu cầu mã mới.',
  'Verification attempt limit reached; request a new code': 'Bạn đã nhập sai quá số lần cho phép. Hãy gửi lại mã mới.',
  'AI is disabled. Enable Ollama and start its local container with the configured model.':
    'Backend đang tắt AI (AI_ENABLED=false). Bật Ollama và đặt AI_ENABLED=true trong .env của backend rồi chạy lại.',
};

/** Turns an Axios/ProblemDetail error from the backend into a message the auth pages can show. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không kết nối được backend. Hãy kiểm tra backend đang chạy và VITE_API_BASE_URL.';
    }
    const data = error.response.data as ProblemDetail | undefined;
    if (error.response.status === 409) return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.';
    if (data?.errors?.length) return data.errors.join('\n');
    if (data?.detail) return knownMessages[data.detail] ?? data.detail;
  }
  return error instanceof Error ? error.message : fallback;
}

export const authService = {
  register: (body: { email: string; password: string; fullName: string; preferredLanguage: 'vi' | 'en' }) =>
    apiClient.post<RegisterResponse>('/auth/register', body).then((res) => res.data),

  verifyEmail: (email: string, code: string) =>
    apiClient.post<{ message: string }>('/auth/verify-email', { email, code }).then((res) => res.data),

  resendCode: (email: string) =>
    apiClient.post<RegisterResponse>('/auth/resend-code', { email }).then((res) => res.data),

  login: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { email, password }).then((res) => res.data),

  // Plain axios so a failed refresh never re-enters the apiClient 401 interceptor.
  refresh: (refreshToken: string) =>
    axios
      .post<AuthTokens>(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((res) => res.data),

  logout: () => apiClient.post<{ message: string }>('/auth/logout').then((res) => res.data),

  me: () => apiClient.get<ProfileResponse>('/me').then((res) => toUser(res.data)),
};
