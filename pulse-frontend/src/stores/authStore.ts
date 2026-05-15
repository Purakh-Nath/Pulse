import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasChecked: boolean;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHasChecked: (checked: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasChecked: false,

    setUser: (user) =>
      set({ user, isAuthenticated: !!user, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    setHasChecked: (hasChecked) => set({ hasChecked }),

    clearAuth: () =>
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasChecked: true,
      }),
  })),
);
