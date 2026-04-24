import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3100',
  withCredentials: true,
});

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type LogoutHandler = () => void;

const authState: {
  getAccessToken: TokenGetter;
  refreshAccessToken: RefreshHandler;
  onLogout: LogoutHandler;
  refreshPromise: Promise<string | null> | null;
} = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onLogout: () => undefined,
  refreshPromise: null,
};

export function configureApiAuthHandlers(handlers: {
  getAccessToken: TokenGetter;
  refreshAccessToken: RefreshHandler;
  onLogout: LogoutHandler;
}) {
  authState.getAccessToken = handlers.getAccessToken;
  authState.refreshAccessToken = handlers.refreshAccessToken;
  authState.onLogout = handlers.onLogout;
}

api.interceptors.request.use(async (config) => {
  const token = authState.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as {
      headers: Record<string, string>;
      _retry?: boolean;
      url?: string;
    };

    const requestUrl = typeof originalRequest?.url === 'string' ? originalRequest.url : '';
    const isAuthEndpoint = requestUrl.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!authState.refreshPromise) {
        authState.refreshPromise = authState.refreshAccessToken();
      }

      const newAccessToken = await authState.refreshPromise;
      authState.refreshPromise = null;

      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }

      authState.onLogout();
    }

    if (error.response?.status === 403) {
      const data = (error.response.data || {}) as { message?: unknown };
      const rawMessage =
        typeof data.message === 'string'
          ? data.message
          : Array.isArray(data.message)
            ? data.message.join(', ')
            : '';

      if (!rawMessage || /forbidden|denied|permission/i.test(rawMessage)) {
        error.response.data = {
          ...error.response.data,
          message: 'Access denied. You do not have permission to perform this action.',
        };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
