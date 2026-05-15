import { createHash, createHmac, randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { getRedis, RedisKeys, RedisTTL } from './redis';
import { logger } from '../config/logger';
import type { AnonIdentity } from '../shared/types';

const ANON_COOKIE  = 'pulse_anon';
const COOKIE_TTL   = 30 * 24 * 60 * 60 * 1000; // 30 days ms

function hmac(data: string): string {
  return createHmac('sha256', env.ANON_TOKEN_SECRET).update(data).digest('hex');
}

function hashId(input: string): string {
  return hmac(input).slice(0, 32);
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`ip:${ip}:${env.ANON_TOKEN_SECRET}`).digest('hex').slice(0, 16);
}

// Signed cookie token

function sign(raw: string): string {
  const sig = hmac(raw).slice(0, 8);
  return `${raw}.${sig}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const raw = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (hmac(raw).slice(0, 8) !== sig) return null;
  return raw;
}

function readOrSetCookie(req: Request, res: Response): string {
  const existing = (req.cookies as Record<string, string>)?.[ANON_COOKIE];
  if (existing) {
    const raw = verify(existing);
    if (raw) return hashId(raw);
  }
  const raw = randomBytes(16).toString('hex');
  res.cookie(ANON_COOKIE, sign(raw), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_TTL,
    path: '/',
  });
  return hashId(raw);
}

// Device fingerprint

function fingerprintId(req: Request): string {
  const parts = [
    req.headers['user-agent'] ?? '',
    req.headers['accept-language'] ?? '',
    req.headers['accept-encoding'] ?? '',
    req.headers['sec-ch-ua-platform'] ?? '',
    req.headers['sec-ch-ua'] ?? '',
  ];
  return hashId(parts.join('||'));
}

// IP heuristic

function ipId(req: Request): string {
  const ip =
    ((req.headers['x-forwarded-for'] as string) ?? '').split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  return hashIp(ip);
}

// Redis session fallback

async function redisSessionId(req: Request): Promise<string | null> {
  const hdr = req.headers['x-session-id'] as string | undefined;
  if (!hdr) return null;
  const key = `anon:session:${hashId(hdr)}`;
  try {
    const redis = getRedis();
    let id = await redis.get(key);
    if (!id) {
      id = randomBytes(12).toString('hex');
      await redis.setEx(key, 86400, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Public API

export async function resolveAnonIdentity(req: Request, res: Response): Promise<AnonIdentity> {
  // Layer 1 - signed cookie (most stable)
  try {
    return { anonId: readOrSetCookie(req, res), source: 'cookie' };
  } catch (err) {
    logger.debug({ err }, 'Cookie layer failed');
  }

  // Layer 2 - device fingerprint
  const fp = fingerprintId(req);
  if (fp) return { anonId: fp, source: 'fingerprint' };

  // Layer 3 - Redis session token
  const sid = await redisSessionId(req);
  if (sid) return { anonId: hashId(sid), source: 'session' };

  // Layer 4 - IP heuristic (soft only)
  return { anonId: ipId(req), source: 'ip' };
}

export async function hasAnonResponded(pollId: string, anonId: string): Promise<boolean> {
  const val = await getRedis().exists(RedisKeys.anonPollResponse(pollId, anonId));
  return val === 1;
}

export async function markAnonResponded(pollId: string, anonId: string): Promise<void> {
  await getRedis().setEx(RedisKeys.anonPollResponse(pollId, anonId), RedisTTL.anonToken, '1');
}