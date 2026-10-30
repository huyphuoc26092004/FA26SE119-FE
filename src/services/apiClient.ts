import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { authErrorMessage } from './authService';

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh at a time: parallel 401s wait for the same rotated token.
let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // Pages show `error.message`; use the backend's ProblemDetail text instead of "Request failed…".
    if (axios.isAxiosError(error) && error.response && error.response.status !== 401) {
      error.message = authErrorMessage(error, error.message);
    }
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) return Promise.reject(error);
    const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    // A wrong current password on /me/password is a 401 too; it must not end the session.
    const isAuthCall = config.url?.startsWith('/auth/') || config.url === '/me/password';
    if (!config._retried && !isAuthCall && useAuthStore.getState().refreshToken) {
      refreshing ??= useAuthStore.getState().refreshSession().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        config._retried = true;
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      }
    }
    if (!isAuthCall) useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);
