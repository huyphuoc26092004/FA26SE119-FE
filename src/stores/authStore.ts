import { create } from 'zustand';
import type { User, UserRole } from '../types/domain';
import {
  mockLogin,
  mockRegister,
  mockVerifyOtp,
  mockResendOtp,
  mockForgotPassword,
  mockResetPassword,
} from '../mocks/services/mockService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  pendingVerificationEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ otp: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  setPendingVerificationEmail: (email: string | null) => void;
  logout: () => void;
  setUser: (user: User) => void;
  restoreSession: () => void;
}

const KEY = 'careerpilot-demo-session';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  role: null,
  pendingVerificationEmail: null,

  login: async (email, password) => {
    const session = await mockLogin(email, password);
    sessionStorage.setItem(KEY, JSON.stringify(session));
    set({ ...session, isAuthenticated: true, role: session.user.role });
  },

  register: async (name, email, password, role) => {
    const res = await mockRegister({ name, email, password, role });
    set({ pendingVerificationEmail: email });
    return { otp: res.otp };
  },

  verifyOtp: async (email, otp) => {
    const res = await mockVerifyOtp(email, otp);
    const session = { user: res.user, accessToken: res.accessToken };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    set({ ...session, isAuthenticated: true, role: res.user.role, pendingVerificationEmail: null });
  },

  resendOtp: async (email) => {
    const res = await mockResendOtp(email);
    return res.otp;
  },

  forgotPassword: async (email) => {
    const res = await mockForgotPassword(email);
    return res.otp;
  },

  resetPassword: async (email, otp, newPassword) => {
    await mockResetPassword({ email, otp, newPassword });
  },

  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),

  logout: () => {
    sessionStorage.removeItem(KEY);
    set({ user: null, accessToken: null, isAuthenticated: false, role: null });
  },

  setUser: (user) => set({ user, role: user.role }),

  restoreSession: () => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as { user: User; accessToken: string };
      if (!session.accessToken.startsWith('mock-') || !session.user?.role) return;
      set({ ...session, isAuthenticated: true, role: session.user.role });
    } catch {
      sessionStorage.removeItem(KEY);
    }
  },
}));

