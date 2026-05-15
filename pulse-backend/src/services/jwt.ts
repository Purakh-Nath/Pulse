import { SignJWT, jwtVerify } from 'jose';
import { createHash, createHmac, randomBytes } from 'crypto';
import { env } from '../config/env';
import type { JwtPayload } from '../shared/types';
import { UnauthorizedError, ErrorCode } from '../shared/errors';

const ACCESS_SECRET  = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

function parseExpirySeconds(s: string): number {
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) throw new Error(`Bad expiry format: ${s}`);
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(m[1]!) * (units[m[2]!] ?? 1);
}

export async function signAccessToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .setJti(randomBytes(16).toString('hex'))
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(
  payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>,
  family: string
): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh', family })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .setJti(randomBytes(16).toString('hex'))
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
    return payload as unknown as JwtPayload;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('expired')) throw new UnauthorizedError('Access token expired', ErrorCode.TOKEN_EXPIRED);
    throw new UnauthorizedError('Invalid access token', ErrorCode.TOKEN_INVALID);
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload & { family: string }> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, { algorithms: ['HS256'] });
    return payload as unknown as JwtPayload & { family: string };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('expired')) throw new UnauthorizedError('Refresh token expired', ErrorCode.TOKEN_EXPIRED);
    throw new UnauthorizedError('Invalid refresh token', ErrorCode.TOKEN_INVALID);
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + parseExpirySeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000);
}

export function getAccessTokenExpirySeconds(): number {
  return parseExpirySeconds(env.JWT_ACCESS_EXPIRES_IN);
}

export function generateFamily(): string {
  return randomBytes(16).toString('hex');
}

export function hmac(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}
