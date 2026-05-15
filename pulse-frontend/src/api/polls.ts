import api from './axios';
import type { ApiSuccess, ApiPaginatedSuccess } from '@/types/api';
import type {
  Poll,
  PollSummary,
  CreatePollInput,
  UpdatePollInput,
} from '@/types/poll';

export interface GetPollsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const pollsService = {
  async createPoll(data: CreatePollInput): Promise<Poll> {
    const response = await api.post<ApiSuccess<Poll>>('/polls', data);
    return response.data.data;
  },

  async getPolls(
    params?: GetPollsParams,
  ): Promise<{ data: PollSummary[]; meta: ApiPaginatedSuccess<PollSummary>['meta'] }> {
    const response = await api.get<ApiPaginatedSuccess<PollSummary>>('/polls', {
      params,
    });
    return { data: response.data.data, meta: response.data.meta };
  },

  async getPollBySlug(slug: string): Promise<Poll> {
    const response = await api.get<ApiSuccess<Poll>>(`/polls/slug/${slug}`);
    return response.data.data;
  },

  async getPollById(pollId: string): Promise<Poll> {
    const response = await api.get<ApiSuccess<Poll>>(`/polls/${pollId}`);
    return response.data.data;
  },

  async updatePoll(pollId: string, data: UpdatePollInput): Promise<Poll> {
    const response = await api.patch<ApiSuccess<Poll>>(`/polls/${pollId}`, data);
    return response.data.data;
  },

  async activatePoll(pollId: string): Promise<Poll> {
    const response = await api.post<ApiSuccess<Poll>>(
      `/polls/${pollId}/activate`,
    );
    return response.data.data;
  },
};
