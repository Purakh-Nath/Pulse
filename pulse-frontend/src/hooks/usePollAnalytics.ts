import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/analytics';
import { queryKeys } from '@/config/queryKeys';

export function usePollAnalytics(pollId: string) {
  return useQuery({
    queryKey: queryKeys.analytics(pollId),
    queryFn: () => analyticsService.getAnalytics(pollId),
    enabled: !!pollId,
    staleTime: 1000 * 10, // 10s — analytics changes often
    refetchOnMount: 'always',
    refetchInterval: 1000 * 30, // background refresh every 30s
  });
}
