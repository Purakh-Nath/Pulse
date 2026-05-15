import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type Socket } from 'socket.io-client';
import { connectSocket, getSocket } from '@/sockets/socket';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/config/queryKeys';
import type {
  PresenceUpdatePayload,
  ResponseCountPayload,
  PollExpiredPayload,
  PollPublishedPayload,
} from '@/types/socket';

interface SocketContextValue {
  socket: Socket;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setConnected, setActiveUsers, setResponseCount } = useSocketStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('presence:update', (data: PresenceUpdatePayload) => {
      setActiveUsers(data.pollId, data.activeUsers);
    });

    socket.on('response:count', (data: ResponseCountPayload) => {
      setResponseCount(data.pollId, data.count);
    });

    socket.on('poll:expired', (_data: PollExpiredPayload) => {
      // Invalidate poll queries when expired
      queryClient.invalidateQueries({
        queryKey: ['poll'],
      });
    });

    socket.on('poll:published', (data: PollPublishedPayload) => {
      // Invalidate results and analytics queries immediately when publish completes
      queryClient.invalidateQueries({
        queryKey: queryKeys.results(data.pollId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics(data.pollId),
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('presence:update');
      socket.off('response:count');
      socket.off('poll:expired');
      socket.off('poll:published');
    };
  }, [isAuthenticated, setConnected, setActiveUsers, setResponseCount, queryClient]);

  const socket = getSocket();

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
