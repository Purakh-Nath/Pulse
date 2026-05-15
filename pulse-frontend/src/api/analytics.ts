import api from './axios';
import type { ApiSuccess } from '@/types/api';
import type {
  PollAnalytics,
  PollResults,
  AnalyticsCountResponse,
} from '@/types/analytics';

export const analyticsService = {
  async getAnalytics(pollId: string): Promise<PollAnalytics> {
    const response = await api.get<ApiSuccess<PollAnalytics>>(
      `/polls/${pollId}/analytics`,
    );
    return response.data.data;
  },

  async getAnalyticsCount(
    pollId: string,
  ): Promise<AnalyticsCountResponse> {
    const response = await api.get<ApiSuccess<AnalyticsCountResponse>>(
      `/polls/${pollId}/analytics/count`,
    );
    return response.data.data;
  },

  async getResults(pollId: string): Promise<PollResults> {
    const response = await api.get<ApiSuccess<PollResults>>(
      `/polls/${pollId}/results`,
    );
    return response.data.data;
  },

  async publishResults(pollId: string): Promise<PollResults> {
    const response = await api.post<ApiSuccess<PollResults>>(
      `/polls/${pollId}/results/publish`,
    );
    return response.data.data;
  },
};
