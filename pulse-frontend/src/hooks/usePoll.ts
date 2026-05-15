import { useQuery } from '@tanstack/react-query';
import { pollsService } from '@/api/polls';
import { queryKeys } from '@/config/queryKeys';

export function usePoll(slug: string) {
  return useQuery({
    queryKey: queryKeys.poll(slug),
    queryFn: () => pollsService.getPollBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 30, // 30s
    refetchOnMount: 'always',
  });
}
