import api from './axios';

import type { SubmitResponseInput } from '@/types/poll';

export const responsesService = {
  async submitResponse(
    pollId: string,
    data: SubmitResponseInput,
  ): Promise<void> {
    await api.post(`/polls/${pollId}/responses`, data);
  },
};
