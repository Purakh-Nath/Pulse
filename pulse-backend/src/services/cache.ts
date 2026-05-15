// lightweight in-process mutex - no external dependency
class Mutex {
  private _queue: (() => void)[] = [];
  private _locked = false;

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this._acquire();
    try {
      return await fn();
    } finally {
      this._release();
    }
  }

  private _acquire(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => this._queue.push(resolve));
  }

  private _release(): void {
    const next = this._queue.shift();
    if (next) next();
    else this._locked = false;
  }
}

import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/client';
import { getRedis, RedisKeys, RedisTTL } from './redis';
import { logger } from '../config/logger';

// Per-key mutexes for local in-process stampede prevention
const mutexes = new Map<string, Mutex>();

function getMutex(key: string): Mutex {
  let m = mutexes.get(key);
  if (!m) {
    m = new Mutex();
    mutexes.set(key, m);
  }
  return m;
}

// Stale-while-revalidate cached fetch
// Returns cached value immediately (even if stale) and revalidates in background.

export async function cachedFetch<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  staleGraceSec = 30
): Promise<T> {
  const redis = getRedis();

  try {
    const raw = await redis.get(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { value: T; expiresAt: number };
      const isStale = Date.now() > parsed.expiresAt - staleGraceSec * 1000;

      if (!isStale) return parsed.value;

      // Stale - return immediately, revalidate in background
      setImmediate(async () => {
        const lockKey = `revalidate:lock:${cacheKey}`;
        const gotLock = await redis.set(lockKey, '1', { NX: true, EX: 10 });
        if (!gotLock) return;
        try {
          const fresh = await fetcher();
          await redis.setEx(
            cacheKey,
            ttlSeconds + staleGraceSec,
            JSON.stringify({ value: fresh, expiresAt: Date.now() + ttlSeconds * 1000 })
          );
        } catch (err) {
          logger.warn({ err, cacheKey }, 'Background revalidation failed');
        } finally {
          await redis.del(lockKey);
        }
      });

      return parsed.value;
    }
  } catch (err) {
    logger.warn({ err, cacheKey }, 'Cache read failed, fetching directly');
  }

  // Cache miss - use local mutex to prevent stampede
  return getMutex(cacheKey).runExclusive(async () => {
    // Double-check after acquiring lock
    try {
      const raw2 = await redis.get(cacheKey);
      if (raw2) return (JSON.parse(raw2) as { value: T }).value;
    } catch { /* ignore */ }

    const value = await fetcher();

    try {
      await redis.setEx(
        cacheKey,
        ttlSeconds + staleGraceSec,
        JSON.stringify({ value, expiresAt: Date.now() + ttlSeconds * 1000 })
      );
    } catch (err) {
      logger.warn({ err, cacheKey }, 'Cache write failed');
    }

    return value;
  });
}

// Redis distributed lock

export async function withRedisLock<T>(
  lockKey: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  const lockVal = Math.random().toString(36).slice(2);

  let acquired = await redis.set(lockKey, lockVal, { NX: true, EX: ttlSeconds });
  if (!acquired) {
    await new Promise((r) => setTimeout(r, 200));
    acquired = await redis.set(lockKey, lockVal, { NX: true, EX: ttlSeconds });
    if (!acquired) throw new Error(`Could not acquire Redis lock: ${lockKey}`);
  }

  try {
    return await fn();
  } finally {
    const current = await redis.get(lockKey);
    if (current === lockVal) await redis.del(lockKey);
  }
}

//In-flight request deduplication

const inflightMap = new Map<string, Promise<unknown>>();

export async function deduplicateInflight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightMap.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inflightMap.delete(key));
  inflightMap.set(key, promise);
  return promise;
}

// Cache invalidation

export async function invalidatePollCache(pollId: string): Promise<void> {
  const redis = getRedis();
  const poll = await getDb().query.polls.findFirst({
    where: eq(schema.polls.id, pollId),
    columns: { slug: true },
  });

  const keys = [
    RedisKeys.pollMeta(pollId),
    RedisKeys.analyticsSnapshot(pollId),
    RedisKeys.publishedResult(pollId),
  ];

  if (poll?.slug) {
    keys.push(RedisKeys.pollBySlug(poll.slug));
  }

  await Promise.allSettled(keys.map((key) => redis.del(key)));
}

export async function warmPollCache(pollId: string, data: unknown): Promise<void> {
  await getRedis().setEx(
    RedisKeys.pollMeta(pollId),
    RedisTTL.pollMeta,
    JSON.stringify(data)
  );
}
