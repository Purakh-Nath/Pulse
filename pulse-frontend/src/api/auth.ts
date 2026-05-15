import api from './axios';
import type { ApiSuccess } from '@/types/api';
import type { AuthUser } from '@/types/auth';
import { API_BASE_URL, API_PREFIX } from '@/config/constants';

export const authService = {
  /**
   * Initiates OAuth flow — redirect to backend which redirects to Google
   */
  initiateLogin() {
    window.location.href = `${API_BASE_URL}${API_PREFIX}/auth/login`;
  },

  /**
   * Get current session user (relies on HTTP-only cookie)
   */
  async getMe(): Promise<AuthUser> {
    const response = await api.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
    return response.data.data.user;
  },

  /**
   * Refresh the access token
   */
  async refresh(): Promise<AuthUser> {
    const response = await api.post<ApiSuccess<{ user: AuthUser }>>('/auth/refresh');
    return response.data.data.user;
  },

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Logout all sessions
   */
  async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all');
  },
};
