import { eq, and, lt } from 'drizzle-orm';
import { getDb, schema } from '../../db/client';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  generateFamily,
} from '../../services/jwt';
import { getRedis, RedisKeys } from '../../services/redis';
import type { OidcUserInfo } from '../../services/oidc';
import {
  UnauthorizedError,
  ErrorCode,
  ConflictError,
} from '../../shared/errors';
import { logger } from '../../config/logger';
import type { AuthUser } from '../../shared/types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Upsert user from OIDC 

export async function upsertUserFromOidc(info: OidcUserInfo): Promise<typeof schema.users.$inferSelect> {
  const db = getDb();

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.googleId, info.sub),
  });

  if (existing) {
    // Update name/avatar on re-login
    const [updated] = await db
      .update(schema.users)
      .set({ name: info.name, avatar: info.picture, updatedAt: new Date() })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      googleId: info.sub,
      email: info.email,
      name: info.name,
      avatar: info.picture,
    })
    .returning();

  return created!;
}

export async function issueTokenPair(user: AuthUser): Promise<TokenPair> {
  const db = getDb();
  const family = generateFamily();
  const payload = { sub: user.id, email: user.email, name: user.name };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload, family),
  ]);

  await db.insert(schema.refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt: getRefreshTokenExpiry(),
  });

  return { accessToken, refreshToken, expiresIn: 900 }; // 15 min
}

export async function rotateRefreshToken(oldToken: string): Promise<TokenPair & { user: AuthUser }> {
  const db = getDb();
  const redis = getRedis();

  const payload = await verifyRefreshToken(oldToken);
  const oldHash = hashToken(oldToken);

  // Check family revocation (reuse detection)
  const familyRevoked = await redis.exists(RedisKeys.revokedFamily(payload.family ?? ''));
  if (familyRevoked) {
    throw new UnauthorizedError('Refresh token family revoked — please re-login', ErrorCode.SESSION_REVOKED);
  }

  const tokenRecord = await db.query.refreshTokens.findFirst({
    where: and(
      eq(schema.refreshTokens.tokenHash, oldHash),
      eq(schema.refreshTokens.userId, payload.sub)
    ),
  });

  if (!tokenRecord || tokenRecord.revokedAt) {
    // Token reuse detected - revoke entire family
    await redis.setEx(RedisKeys.revokedFamily(payload.family ?? ''), 7 * 86400, '1');
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.family, payload.family ?? ''));
    throw new UnauthorizedError('Refresh token reuse detected', ErrorCode.SESSION_REVOKED);
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired', ErrorCode.TOKEN_EXPIRED);
  }

  // Revoke old token
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, tokenRecord.id));

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, payload.sub) });
  if (!user) throw new UnauthorizedError('User not found');

  const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
  const tokens = await issueTokenPair(authUser);

  return { ...tokens, user: authUser };
}

// Logout 

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const db = getDb();
  const hash = hashToken(refreshToken);
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.tokenHash, hash));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await getDb()
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.userId, userId));
  logger.info({ userId }, 'All user sessions revoked');
}

export async function pruneExpiredTokens(): Promise<void> {
  await getDb()
    .delete(schema.refreshTokens)
    .where(lt(schema.refreshTokens.expiresAt, new Date()));
}
