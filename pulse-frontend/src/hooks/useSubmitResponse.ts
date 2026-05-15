import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { responsesService } from '@/api/responses';
import { queryKeys } from '@/config/queryKeys';
import type { SubmitResponseInput } from '@/types/poll';
import type { PollAnalytics } from '@/types/analytics';
import { ANALYTICS_DELAY_MS } from '@/config/constants';

interface UseSubmitResponseOptions {
  pollId: string;
  onSuccess?: () => void;
}

export function useSubmitResponse({ pollId, onSuccess }: UseSubmitResponseOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitResponseInput) =>
      responsesService.submitResponse(pollId, data),

    onMutate: async (_data) => {
      // Cancel in-flight analytics queries
      await queryClient.cancelQueries({ queryKey: queryKeys.analytics(pollId) });

      // Snapshot current analytics for rollback
      const snapshot = queryClient.getQueryData<PollAnalytics>(
        queryKeys.analytics(pollId),
      );

      // Optimistically update analytics counts
      if (snapshot) {
        queryClient.setQueryData<PollAnalytics>(
          queryKeys.analytics(pollId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              totalResponses: old.totalResponses + 1,
            };
          },
        );
      }

      return { snapshot };
    },

    onError: (_err, _variables, context) => {
      // Rollback optimistic update
      if (context?.snapshot) {
        queryClient.setQueryData(
          queryKeys.analytics(pollId),
          context.snapshot,
        );
      }
      toast.error('Failed to submit response. Please try again.');
    },

    onSuccess: () => {
      // Delay refetch to account for BullMQ eventual consistency (~2s)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics(pollId) });
      }, ANALYTICS_DELAY_MS);

      onSuccess?.();
    },
  });
}
