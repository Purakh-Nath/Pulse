import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../config/logger';

type RedisClient = ReturnType<typeof createClient>;

let _client: RedisClient;
let _subscriber: RedisClient;

export function getRedis(): RedisClient {
  return _client;
}

export function getRedisSubscriber(): RedisClient {
  return _subscriber;
}

export async function initRedis(): Promise<void> {
  const opts = {
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) return new Error('Redis max retries reached');
        return Math.min(retries * 150, 3000);
      },
    },
  };

  _client = createClient(opts);
  _subscriber = _client.duplicate();

  _client.on('error', (err) => logger.error({ err }, 'Redis client error'));
  _client.on('connect', () => logger.info('Redis connected'));
  _client.on('reconnecting', () => logger.warn('Redis reconnecting'));

  _subscriber.on('error', (err) => logger.error({ err }, 'Redis subscriber error'));

  await Promise.all([_client.connect(), _subscriber.connect()]);

  try {
    await _client.configSet('maxmemory-policy', 'noeviction');
    logger.info('Redis configured with maxmemory-policy=noeviction for BullMQ');
  } catch (err) {
    logger.warn({ err }, 'Unable to set Redis maxmemory-policy; ensure Redis is configured with noeviction for BullMQ');
  }

  logger.info('Redis initialized');
}

export async function closeRedis(): Promise<void> {
  await Promise.all([_client?.quit(), _subscriber?.quit()]);
  logger.info('Redis closed');
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await _client.ping();
    return true;
  } catch {
    return false;
  }
}

// Key Registry

export const RedisKeys = {
  pollMeta:              (id: string) => `poll:meta:${id}`,
  pollBySlug:            (slug: string) => `poll:slug:${slug}`,
  analyticsSnapshot:     (id: string) => `analytics:snapshot:${id}`,
  totalResponses:        (id: string) => `analytics:total:${id}`,
  questionOptionCount:   (pollId: string, qId: string, oId: string) => `analytics:opt:${pollId}:${qId}:${oId}`,
  activeUsers:           (id: string) => `analytics:active:${id}`,
  publishedResult:       (id: string) => `result:published:${id}`,
  anonPollResponse:      (pollId: string, anonId: string) => `anon:resp:${pollId}:${anonId}`,
  rateLimitSubmit:       (id: string) => `rl:submit:${id}`,
  rateLimitAnalytics:    (id: string) => `rl:analytics:${id}`,
  analyticsLock:         (id: string) => `lock:analytics:${id}`,
  analyticsInflight:     (id: string) => `inflight:analytics:${id}`,
  socketCount:           (id: string) => `socket:count:${id}`,
  revokedFamily:         (f: string)  => `token:revoked:family:${f}`,
};

export const RedisTTL = {
  pollMeta:          300,          // 5 min
  analyticsSnapshot: 30,           // 30 sec
  publishedResult:   600,          // 10 min
  anonToken:         60 * 60 * 24 * 30, // 30 days
  analyticsLock:     10,           // 10 sec
};
