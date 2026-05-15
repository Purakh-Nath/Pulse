import { useEffect, useCallback } from 'react';
import { useSocketContext } from '@/providers/SocketProvider';
import { useSocketStore } from '@/stores/socketStore';

interface UseSocketRoomOptions {
  pollId: string;
  enabled?: boolean;
  onExpired?: () => void;
}

export function useSocketRoom({
  pollId,
  enabled = true,
  onExpired,
}: UseSocketRoomOptions) {
  const { socket } = useSocketContext();
  const { activeUsers, responseCounts } = useSocketStore();

  const join = useCallback(() => {
    if (socket.connected && pollId) {
      socket.emit('poll:join', { pollId });
    }
  }, [socket, pollId]);

  const leave = useCallback(() => {
    if (socket.connected && pollId) {
      socket.emit('poll:leave', { pollId });
    }
  }, [socket, pollId]);

  useEffect(() => {
    if (!enabled || !pollId) return;

    join();

    // Handle reconnects
    socket.on('connect', join);

    if (onExpired) {
      socket.on('poll:expired', (data: { pollId: string }) => {
        if (data.pollId === pollId) onExpired();
      });
    }

    return () => {
      leave();
      socket.off('connect', join);
      if (onExpired) {
        socket.off('poll:expired');
      }
    };
  }, [enabled, pollId, join, leave, socket, onExpired]);

  return {
    activeUsers: activeUsers[pollId] ?? 0,
    responseCount: responseCounts[pollId] ?? 0,
    isConnected: socket.connected,
  };
}
