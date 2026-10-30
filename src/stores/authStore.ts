import { create } from 'zustand';
import type { User, UserRole } from '../types/domain';
import { authErrorMessage, authService } from '../services/authService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  pendingVerificationEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ otp: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<string>;
  /** Returns the dev reset token when the backend exposes it, otherwise ''. */
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  setPendingVerificationEmail: (email: string | null) => void;
  refreshSession: () => Promise<string | null>;
  logout: () => void;
  setUser: (user: User) => void;
  restoreSession: () => void;
}

interface StoredSession {
  user: User;
  accessToken: string;
  refreshToken?: string | null;
}

const KEY = 'careerpilot-demo-session';

const saveSession = (session: StoredSession) => sessionStorage.setItem(KEY, JSON.stringify(session));

// Wraps backend calls so pages keep showing `error.message` as before.
async function call<T>(request: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw new Error(authErrorMessage(error, fallback));
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,
  pendingVerificationEmail: null,

  login: async (email, password) => {
    const tokens = await call(() => authService.login(email, password), 'Đăng nhập không thành công');
    // /me needs the new token, so store it before loading the profile.
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    try {
      const user = await call(() => authService.me(), 'Không tải được thông tin tài khoản');
      const session = { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
      saveSession(session);
      set({ ...session, isAuthenticated: true, role: user.role });
    } catch (error) {
      set({ accessToken: null, refreshToken: null });
      throw error;
    }
  },

  // The backend only self-registers candidates, so `role` is not sent.
  register: async (name, email, password) => {
    const res = await call(
      () => authService.register({ email, password, fullName: name, preferredLanguage: 'vi' }),
      'Đăng ký thất bại. Vui lòng thử lại.'
    );
    set({ pendingVerificationEmail: email });
    return { otp: res.developmentCode ?? '' };
  },

  // Real backend verifies only; the user logs in afterwards (no token is returned).
  verifyOtp: async (email, otp) => {
    await call(() => authService.verifyEmail(email, otp), 'Xác thực OTP không thành công');
    set({ pendingVerificationEmail: null });
  },

  resendOtp: async (email) => {
    const res = await call(() => authService.resendCode(email), 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    return res.developmentCode ?? '';
  },

  forgotPassword: async (email) => {
    const res = await call(() => authService.forgotPassword(email), 'Không gửi được link đặt lại mật khẩu.');
    return res.developmentToken ?? '';
  },

  resetPassword: async (token, newPassword) => {
    await call(() => authService.resetPassword(token, newPassword), 'Đặt lại mật khẩu thất bại.');
  },

  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),

  // Rotates the refresh token; returns the new access token, or null when the session is gone.
  refreshSession: async () => {
    const { refreshToken, user } = get();
    if (!refreshToken || !user) return null;
    try {
      const tokens = await authService.refresh(refreshToken);
      saveSession({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return tokens.accessToken;
    } catch {
      return null;
    }
  },

  logout: () => {
    if (get().accessToken) {
      // Best effort: the local session is cleared even if the backend call fails.
      authService.logout().catch(() => undefined);
    }
    sessionStorage.removeItem(KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, role: null });
  },

  setUser: (user) => set({ user, role: user.role }),

  restoreSession: () => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as StoredSession;
      // Sessions left over from the old mock login are not valid backend tokens.
      if (!session.user?.role || session.accessToken.startsWith('mock-')) {
        sessionStorage.removeItem(KEY);
        return;
      }
      set({ ...session, refreshToken: session.refreshToken ?? null, isAuthenticated: true, role: session.user.role });
    } catch {
      sessionStorage.removeItem(KEY);
    }
  },
}));
