import type { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../services/jwt';
import { getRedis, RedisKeys } from '../services/redis';
import { setSocketServer } from './rooms';
import { logger } from '../config/logger';
import { applyAnalyticsLimit } from '../services/rateLimiter';
import type { AuthUser } from '../shared/types';

interface SocketData {
  user?: AuthUser;
  pollRooms: Set<string>;
}

//Socket Auth Middleware

function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token =
    (socket.handshake.auth?.token as string) ||
    (socket.handshake.headers?.authorization?.replace('Bearer ', '') ?? '');

  if (!token) {
    // Allow unauthenticated (for public poll viewers)
    (socket.data as SocketData).pollRooms = new Set();
    return next();
  }

  verifyAccessToken(token)
    .then((payload) => {
      (socket.data as SocketData).user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
      (socket.data as SocketData).pollRooms = new Set();
      next();
    })
    .catch(() => {
      // Non-fatal - allow connection as anonymous
      (socket.data as SocketData).pollRooms = new Set();
      next();
    });
}

// Connection rate limiting 

const connectionCounts = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 10;

function connectionLimitMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const ip = socket.handshake.address;
  const count = connectionCounts.get(ip) ?? 0;
  if (count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Too many connections'));
  }
  connectionCounts.set(ip, count + 1);
  socket.on('disconnect', () => {
    const c = connectionCounts.get(ip) ?? 1;
    connectionCounts.set(ip, Math.max(0, c - 1));
  });
  next();
}

// Presence tracking 

async function trackPresence(pollId: string, socketId: string, joined: boolean): Promise<number> {
  const redis = getRedis();
  const key = RedisKeys.socketCount(pollId);
  if (joined) {
    await redis.sAdd(`${key}:members`, socketId);
  } else {
    await redis.sRem(`${key}:members`, socketId);
  }
  const count = await redis.sCard(`${key}:members`);
  await redis.setEx(key, 3600, String(count));
  return count;
}

// Debounced analytics broadcast

const broadcastTimers = new Map<string, NodeJS.Timeout>();

export function scheduleBroadcast(io: Server, pollId: string, delayMs = 500): void {
  const existing = broadcastTimers.get(pollId);
  if (existing) clearTimeout(existing);

  broadcastTimers.set(
    pollId,
    setTimeout(async () => {
      broadcastTimers.delete(pollId);
      try {
        const redis = getRedis();
        const total = await redis.get(RedisKeys.totalResponses(pollId));
        if (total === null) return;

        io.to(`poll:${pollId}`).emit('response:count', {
          pollId,
          count: parseInt(total),
        });
      } catch (err) {
        logger.warn({ err, pollId }, 'Broadcast failed');
      }
    }, delayMs)
  );
}

// Main Socket setup

export function setupSockets(io: Server): void {
  setSocketServer(io);

  io.use(connectionLimitMiddleware);
  io.use(authMiddleware);

  io.on('connection', (socket) => {
    const data = socket.data as SocketData;
    logger.debug({ socketId: socket.id, userId: data.user?.id }, 'Socket connected');

    // Join poll room
    socket.on('poll:join', async ({ pollId }: { pollId: string }) => {
      if (!pollId || typeof pollId !== 'string') return;
      await socket.join(`poll:${pollId}`);
      data.pollRooms.add(pollId);

      const count = await trackPresence(pollId, socket.id, true);
      io.to(`poll:${pollId}`).emit('presence:update', { pollId, activeUsers: count });

      // Send current count immediately on join
      const redis = getRedis();
      const total = await redis.get(RedisKeys.totalResponses(pollId));
      socket.emit('response:count', { pollId, count: parseInt(total ?? '0') });
    });

    // Leave poll room
    socket.on('poll:leave', async ({ pollId }: { pollId: string }) => {
      await socket.leave(`poll:${pollId}`);
      data.pollRooms.delete(pollId);
      const count = await trackPresence(pollId, socket.id, false);
      io.to(`poll:${pollId}`).emit('presence:update', { pollId, activeUsers: count });
    });

    // Heartbeat
    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));

    //Disconnect 
    socket.on('disconnect', async () => {
      for (const pollId of data.pollRooms) {
        const count = await trackPresence(pollId, socket.id, false).catch(() => 0);
        io.to(`poll:${pollId}`).emit('presence:update', { pollId, activeUsers: count });
      }
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  logger.info('Socket.io handlers registered');
}
