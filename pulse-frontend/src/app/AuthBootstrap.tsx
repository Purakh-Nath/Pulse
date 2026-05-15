import { type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Bootstraps the auth session by calling /auth/me
 * Must be inside QueryProvider + BrowserRouter
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useAuth(); // Runs /auth/me and hydrates auth store
  return <>{children}</>;
}
