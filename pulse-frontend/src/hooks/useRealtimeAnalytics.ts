import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '@/providers/SocketProvider';
import { useSocketStore } from '@/stores/socketStore';
import { queryKeys } from '@/config/queryKeys';
import { ANALYTICS_DELAY_MS } from '@/config/constants';
import type { PollAnalytics } from '@/types/analytics';
import type { ResponseCountPayload, PollExpiredPayload } from '@/types/socket';

interface UseRealtimeAnalyticsOptions {
  pollId: string;
  enabled?: boolean;
}

export function useRealtimeAnalytics({
  pollId,
  enabled = true,
}: UseRealtimeAnalyticsOptions) {
  const { socket } = useSocketContext();
  const { activeUsers, responseCounts } = useSocketStore();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics(pollId) });
    }, 2000); // respect ~2s BullMQ delay
  }, [queryClient, pollId]);

  useEffect(() => {
    if (!enabled || !pollId) return;

    const handleResponseCount = (data: ResponseCountPayload) => {
      if (data.pollId !== pollId) return;

      // Update analytics cache optimistically with new count
      queryClient.setQueryData<PollAnalytics>(
        queryKeys.analytics(pollId),
        (old) => {
          if (!old) return old;
          return { ...old, totalResponses: data.count };
        },
      );

      debouncedRefetch();
    };

    const handlePollExpired = (data: PollExpiredPayload) => {
      if (data.pollId !== pollId) return;
      setIsExpired(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics(pollId) });
        queryClient.invalidateQueries({ queryKey: ['results'] });
        queryClient.invalidateQueries({ queryKey: ['poll'] });
      }, ANALYTICS_DELAY_MS);
    };

    socket.on('response:count', handleResponseCount);
    socket.on('poll:expired', handlePollExpired);

    return () => {
      socket.off('response:count', handleResponseCount);
      socket.off('poll:expired', handlePollExpired);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, pollId, socket, debouncedRefetch, queryClient]);

  return {
    activeUsers: activeUsers[pollId] ?? 0,
    responseCount: responseCounts[pollId] ?? 0,
    isExpired,
  };
}
