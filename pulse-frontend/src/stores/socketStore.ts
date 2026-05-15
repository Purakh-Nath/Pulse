import { create } from 'zustand';

interface SocketState {
  connected: boolean;
  activeUsers: Record<string, number>; // pollId -> count
  responseCounts: Record<string, number>; // pollId -> count

  setConnected: (connected: boolean) => void;
  setActiveUsers: (pollId: string, count: number) => void;
  setResponseCount: (pollId: string, count: number) => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>()((set) => ({
  connected: false,
  activeUsers: {},
  responseCounts: {},

  setConnected: (connected) => set({ connected }),

  setActiveUsers: (pollId, count) =>
    set((s) => ({
      activeUsers: { ...s.activeUsers, [pollId]: count },
    })),

  setResponseCount: (pollId, count) =>
    set((s) => ({
      responseCounts: { ...s.responseCounts, [pollId]: count },
    })),

  reset: () =>
    set({ connected: false, activeUsers: {}, responseCounts: {} }),
}));
