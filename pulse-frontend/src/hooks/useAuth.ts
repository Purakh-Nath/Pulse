import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/config/queryKeys';

// Primary auth hook - bootstraps session state from /auth/me
// Must be called once at the app root

export function useAuth() {
  const { user, isAuthenticated, setUser, clearAuth, setHasChecked , hasChecked} =
    useAuthStore();

  const { data, isError, isFetching } = useQuery({
    queryKey: queryKeys.me,
    queryFn: authService.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
    enabled: !hasChecked || !user,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
      setHasChecked(true);
    }
  }, [data, setUser, setHasChecked]);

  useEffect(() => {
    if (isError) {
      clearAuth();
    }
  }, [isError, clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading: isFetching && !user,
  };
}
