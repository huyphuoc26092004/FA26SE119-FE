import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { authErrorMessage } from './authService';

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _authSessionVersion?: number;
  _authUserId?: string;
};

apiClient.interceptors.request.use((config) => {
  const session = useAuthStore.getState();
  const request = config as AuthRequestConfig;
  if (request._retried && (request._authSessionVersion !== session.sessionVersion
    || request._authUserId !== session.user?.id)) {
    throw new axios.CanceledError('The authentication session changed before this request could be retried.', config);
  }
  const token = session.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!request._retried) {
    request._authSessionVersion = session.sessionVersion;
    request._authUserId = session.user?.id;
  }
  return config;
});

// One refresh at a time: parallel 401s wait for the same rotated token.
let refreshing: { sessionKey: string; promise: Promise<string | null> } | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // Pages show `error.message`; use the backend's ProblemDetail text instead of "Request failed…".
    if (axios.isAxiosError(error) && error.response && error.response.status !== 401) {
      error.message = authErrorMessage(error, error.message);
    }
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) return Promise.reject(error);
    const config = error.config as AuthRequestConfig;
    // A wrong current password on /me/password is a 401 too; it must not end the session.
    const isAuthCall = config.url?.startsWith('/auth/') || config.url === '/me/password';
    const session = useAuthStore.getState();
    const activeAuthorization = session.accessToken ? `Bearer ${session.accessToken}` : null;
    if (!isAuthCall && (config._authSessionVersion !== session.sessionVersion || config._authUserId !== session.user?.id)) {
      return Promise.reject(error);
    }
    // Another request in the same login may already have rotated the expired access token.
    if (!isAuthCall && !config._retried && session.accessToken
      && (config.headers.Authorization ?? null) !== activeAuthorization) {
      config._retried = true;
      config.headers.Authorization = activeAuthorization;
      return apiClient(config);
    }
    if (!config._retried && !isAuthCall && session.refreshToken) {
      const sessionKey = `${session.sessionVersion}:${session.user?.id ?? ''}:${session.refreshToken}`;
      if (!refreshing || refreshing.sessionKey !== sessionKey) {
        const next = { sessionKey, promise: session.refreshSession() };
        next.promise = next.promise.finally(() => { if (refreshing === next) refreshing = null; });
        refreshing = next;
      }
      const token = await refreshing.promise;
      const current = useAuthStore.getState();
      if (current.sessionVersion !== session.sessionVersion || current.user?.id !== session.user?.id
        || (token ? current.accessToken !== token : current.refreshToken !== session.refreshToken)) {
        return Promise.reject(error);
      }
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
