import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, hasChecked } = useAuthStore();

  // If still loading, don't redirect yet
  if (isLoading || !hasChecked) return <Outlet />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
