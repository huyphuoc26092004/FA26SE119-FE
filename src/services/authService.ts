import axios from 'axios';
import { apiClient } from './apiClient';
import type { User, UserRole } from '../types/domain';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface GoogleEmailVerification {
  emailVerificationRequired: true;
  email: string;
  verificationCodeSent: boolean;
  developmentCode?: string;
  message?: string;
}

export type GoogleLoginResponse = AuthTokens | GoogleEmailVerification;

// Accept only the two backend contracts; a partial token response must never create a session.
function googleLoginResponse(value: unknown): GoogleLoginResponse {
  const invalid = () => new Error('Phản hồi đăng nhập Google không hợp lệ. Vui lòng thử lại.');
  if (!value || typeof value !== 'object') throw invalid();
  const data = value as Record<string, unknown>;
  if (data.emailVerificationRequired === true) {
    if (
      typeof data.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      typeof data.verificationCodeSent !== 'boolean' ||
      (data.developmentCode !== undefined &&
        (typeof data.developmentCode !== 'string' || !/^\d{6}$/.test(data.developmentCode))) ||
      data.accessToken !== undefined ||
      data.refreshToken !== undefined
    )
      throw invalid();
    return {
      emailVerificationRequired: true,
      email: data.email,
      verificationCodeSent: data.verificationCodeSent,
      ...(typeof data.developmentCode === 'string'
        ? { developmentCode: data.developmentCode }
        : {}),
      ...(typeof data.message === 'string' ? { message: data.message } : {}),
    };
  }
  if (
    data.emailVerificationRequired !== undefined ||
    typeof data.accessToken !== 'string' ||
    !data.accessToken.trim() ||
    typeof data.refreshToken !== 'string' ||
    !data.refreshToken.trim() ||
    typeof data.tokenType !== 'string' ||
    data.tokenType.toLowerCase() !== 'bearer' ||
    typeof data.expiresIn !== 'number' ||
    !Number.isFinite(data.expiresIn) ||
    data.expiresIn <= 0
  )
    throw invalid();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
  };
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
  'Google sign-in is not configured':
    'Backend chưa cấu hình đăng nhập Google. Vui lòng liên hệ quản trị viên.',
  'Invalid Google ID token':
    'Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  'Google ID token claims are invalid':
    'Phiên đăng nhập Google không hợp lệ. Vui lòng đăng nhập lại.',
  'Google token authorized party mismatch':
    'Tài khoản Google không được xác thực cho ứng dụng này.',
  'Google account email is unavailable': 'Không lấy được email đã xác minh từ tài khoản Google.',
  'Google account is suspended or deleted':
    'Tài khoản này đã bị khóa hoặc xóa. Vui lòng liên hệ hỗ trợ.',
  'This email already has an account; use its existing sign-in method':
    'Email này đã đăng ký bằng phương thức khác. Vui lòng dùng cách đăng nhập đã đăng ký hoặc đặt lại mật khẩu.',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Verify your email or contact support about your account status':
    'Tài khoản chưa xác minh email hoặc đang bị khóa. Vui lòng xác minh email trước khi đăng nhập.',
  'Wait 60 seconds before requesting a new code': 'Vui lòng đợi 60 giây trước khi yêu cầu mã mới.',
  'Verification attempt limit reached; request a new code':
    'Bạn đã nhập sai quá số lần cho phép. Hãy gửi lại mã mới.',
  'AI is disabled. Enable Ollama and start its local container with the configured model.':
    'Backend đang tắt AI (AI_ENABLED=false). Bật Ollama và đặt AI_ENABLED=true trong .env của backend rồi chạy lại.',
  'AI token quota exceeded; upgrade your subscription or wait for the next quota period':
    'Bạn đã dùng hết lượt AI của gói hiện tại trong kỳ này. Hãy nâng cấp gói hoặc đợi kỳ sau.',
  'Feature token quota exceeded':
    'Bạn đã dùng hết lượt AI cho tính năng này trong kỳ này. Hãy nâng cấp gói hoặc đợi kỳ sau.',
  'Confirm the CV before analysis': 'Hãy xác nhận (lưu hoàn tất) CV trước khi đánh giá.',
  'Invalid or expired reset token':
    'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy yêu cầu link mới.',
  'New password must contain at least 10 characters': 'Mật khẩu mới cần ít nhất 10 ký tự.',
  'Email delivery is disabled; configure MAIL_ENABLED and SMTP settings':
    'Backend chưa bật gửi email (MAIL_ENABLED). Bật SMTP hoặc AUTH_EXPOSE_DEV_OTP=true khi chạy thử.',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng.',
};

/** Turns an Axios/ProblemDetail error from the backend into a message the auth pages can show. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        const requestPath = error.config?.url?.split(/[?#]/, 1)[0].replace(/\/+$/, '');
        return requestPath?.endsWith('/matching')
          ? 'Đề xuất việc làm đang mất nhiều thời gian hơn dự kiến. Vui lòng thử lại sau.'
          : 'Yêu cầu xử lý quá lâu. Vui lòng thử lại sau.';
      }
      if (error.code === 'ERR_CANCELED') return 'Yêu cầu đã được hủy.';
      return 'Không kết nối được hệ thống. Vui lòng thử lại.';
    }
    const data = error.response.data as ProblemDetail | undefined;
    if (error.response.status === 409 && error.config?.url?.startsWith('/auth/register'))
      return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.';
    if (data?.errors?.length) return data.errors.join('\n');
    if (data?.detail) return knownMessages[data.detail] ?? data.detail;
  }
  return error instanceof Error ? error.message : fallback;
}

export const authService = {
  register: (body: {
    email: string;
    password: string;
    fullName: string;
    preferredLanguage: 'vi' | 'en';
  }) => apiClient.post<RegisterResponse>('/auth/register', body).then((res) => res.data),

  verifyEmail: (email: string, code: string) =>
    apiClient
      .post<{ message: string }>('/auth/verify-email', { email, code })
      .then((res) => res.data),

  resendCode: (email: string) =>
    apiClient.post<RegisterResponse>('/auth/resend-code', { email }).then((res) => res.data),

  login: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { email, password }).then((res) => res.data),

  google: (idToken: string): Promise<GoogleLoginResponse> =>
    apiClient
      .post<unknown>('/auth/google', { idToken })
      .then((res) => googleLoginResponse(res.data)),

  // Plain axios so a failed refresh never re-enters the apiClient 401 interceptor.
  refresh: (refreshToken: string) =>
    axios
      .post<AuthTokens>(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((res) => res.data),

  logout: () => apiClient.post<{ message: string }>('/auth/logout').then((res) => res.data),

  // The backend emails a link to /reset-password?token=…; with AUTH_EXPOSE_DEV_OTP it returns the token instead.
  forgotPassword: (email: string) =>
    apiClient
      .post<{ message: string; expiresIn?: number; developmentToken?: string }>(
        '/auth/forgot-password',
        { email },
      )
      .then((res) => res.data),

  resetPassword: (token: string, newPassword: string) =>
    apiClient
      .post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword,
        newPasswordConfirmation: newPassword,
      })
      .then((res) => res.data),

  me: () => apiClient.get<ProfileResponse>('/me').then((res) => toUser(res.data)),
};
