import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { getRedis } from './redis';
import { RateLimitError } from '../shared/errors';
import type { Request } from 'express';

let _globalLimiter: RateLimiterRedis | RateLimiterMemory;
let _submitLimiter: RateLimiterRedis | RateLimiterMemory;
let _analyticsLimiter: RateLimiterRedis | RateLimiterMemory;
let _authLimiter: RateLimiterRedis | RateLimiterMemory;

export function initRateLimiters(): void {
  const redis = getRedis();
  const base = { storeClient: redis, useRedisPackage: true } as const;

  _globalLimiter    = new RateLimiterMemory({ points: 200, duration: 60 });
  _analyticsLimiter = new RateLimiterMemory({ points: 30,  duration: 60 });

  _authLimiter = new RateLimiterRedis({
    ...base,
    keyPrefix: 'rl:auth',
    points: 10,
    duration: 60,
    blockDuration: 300,
  });

  _submitLimiter = new RateLimiterRedis({
    ...base,
    keyPrefix: 'rl:submit',
    points: 5,
    duration: 60,
    blockDuration: 120,
  });
}

function getKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? '').split(',')[0]?.trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}

async function consume(limiter: RateLimiterRedis | RateLimiterMemory, key: string): Promise<void> {
  try {
    await limiter.consume(key);
  } catch (res: unknown) {
    const retryAfter = typeof res === 'object' && res !== null && 'msBeforeNext' in res
      ? Math.ceil((res as { msBeforeNext: number }).msBeforeNext / 1000)
      : undefined;
    throw new RateLimitError('Rate limit exceeded', retryAfter);
  }
}

export async function applyGlobalLimit(req: Request): Promise<void> {
  await consume(_globalLimiter, getKey(req));
}

export async function applySubmitLimit(req: Request, identifier: string): Promise<void> {
  await consume(_submitLimiter, identifier);
}

export async function applyAnalyticsLimit(req: Request): Promise<void> {
  await consume(_analyticsLimiter, getKey(req));
}

export async function applyAuthLimit(req: Request): Promise<void> {
  await consume(_authLimiter, getKey(req));
}
