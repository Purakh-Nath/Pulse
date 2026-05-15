import { useInfiniteQuery } from '@tanstack/react-query';
import { pollsService } from '@/api/polls';
import { queryKeys } from '@/config/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

interface UseInfinitePollsOptions {
  status?: string;
  limit?: number;
}

export function useInfinitePolls({ status, limit = DEFAULT_PAGE_SIZE }: UseInfinitePollsOptions = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.polls({ status, limit }),
    queryFn: ({ pageParam = 1 }) =>
      pollsService.getPolls({ page: pageParam as number, limit, status }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}
