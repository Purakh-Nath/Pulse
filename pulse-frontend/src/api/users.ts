import api from './axios';
import type { ApiSuccess } from '@/types/api';
import type { UserProfile } from '@/types/auth';

export const usersService = {
  async getMe(): Promise<UserProfile> {
    const response = await api.get<ApiSuccess<UserProfile>>('/users/me');
    return response.data.data;
  },

  async updateMe(data: { name?: string }): Promise<UserProfile> {
    const response = await api.patch<ApiSuccess<UserProfile>>('/users/me', data);
    return response.data.data;
  },
};
