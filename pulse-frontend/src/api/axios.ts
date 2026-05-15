import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_PREFIX } from '@/config/constants';

const BASE_URL = `${API_BASE_URL}${API_PREFIX}`;

// Track if we're refreshing to prevent infinite loops
let isRefreshing = false;
let refreshSubscribers: Array<(token?: string) => void> = [];

function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // MANDATORY: sends HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — nothing special needed (cookies are auto-sent)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(() => {
            resolve(api(originalRequest));
          });
          // Timeout fallback
          setTimeout(() => reject(error), 10000);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        isRefreshing = false;
        onRefreshed();

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        const { useAuthStore } = await import('@/stores/authStore');
        useAuthStore.getState().clearAuth();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
