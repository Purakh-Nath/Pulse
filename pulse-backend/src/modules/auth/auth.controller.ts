import type { Request, Response, NextFunction } from 'express';
import {
  generateOAuthParams,
  buildAuthorizationUrl,
  exchangeCode,
  fetchUserInfo,
} from '../../services/oidc';
import { applyAuthLimit } from '../../services/rateLimiter';
import {
  upsertUserFromOidc,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from './auth.service';
import { ok } from '../../utils/response';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors';
import type { AuthenticatedRequest } from '../../shared/types';

const COOKIE_BASE = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
};

const OAUTH_STATE_COOKIE   = 'oauth_state';
const OAUTH_NONCE_COOKIE   = 'oauth_nonce';
const OAUTH_VERIFIER_COOKIE = 'oauth_cv';

//  GET /auth/login 

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await applyAuthLimit(req);
    const params = generateOAuthParams();
    const url = buildAuthorizationUrl(params);

    res.cookie(OAUTH_STATE_COOKIE,    params.state,        { ...COOKIE_BASE, maxAge: 10 * 60 * 1000 });
    res.cookie(OAUTH_NONCE_COOKIE,    params.nonce,        { ...COOKIE_BASE, maxAge: 10 * 60 * 1000 });
    res.cookie(OAUTH_VERIFIER_COOKIE, params.codeVerifier, { ...COOKIE_BASE, maxAge: 10 * 60 * 1000 });

    res.redirect(url);
  } catch (err) { next(err); }
}

// GET /auth/callback

export async function callback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies  = req.cookies as Record<string, string>;
    const state    = cookies[OAUTH_STATE_COOKIE];
    const nonce    = cookies[OAUTH_NONCE_COOKIE];
    const verifier = cookies[OAUTH_VERIFIER_COOKIE];

    [OAUTH_STATE_COOKIE, OAUTH_NONCE_COOKIE, OAUTH_VERIFIER_COOKIE].forEach((c) =>
      res.clearCookie(c)
    );

    if (!state || !nonce || !verifier) throw new UnauthorizedError('OAuth state missing');

    const tokenSet = await exchangeCode(req.query as Record<string, string>, {
      state, nonce, codeVerifier: verifier, codeChallenge: '',
    });

    const userInfo = await fetchUserInfo(tokenSet);
    const user     = await upsertUserFromOidc(userInfo);
    const tokens   = await issueTokenPair({
      id: user.id, email: user.email, name: user.name, avatar: user.avatar,
    });

    res.cookie('access_token',  tokens.accessToken,  { ...COOKIE_BASE, maxAge: tokens.expiresIn * 1000 });
    res.cookie('refresh_token', tokens.refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) { next(err); }
}

// POST /auth/refresh

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies  = req.cookies as Record<string, string>;
    const oldToken = cookies['refresh_token'];
    if (!oldToken) throw new UnauthorizedError('No refresh token');

    const { accessToken, refreshToken, expiresIn, user } = await rotateRefreshToken(oldToken);

    res.cookie('access_token',  accessToken,  { ...COOKIE_BASE, maxAge: expiresIn * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });

    ok(res, { user });
  } catch (err) { next(err); }
}

//  POST /auth/logout

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = req.cookies as Record<string, string>;
    const token   = cookies['refresh_token'];
    if (token) await revokeRefreshToken(token);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    ok(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

// POST /auth/logout-all

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authed = req as AuthenticatedRequest;
    await revokeAllUserSessions(authed.user.id);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    ok(res, { message: 'All sessions revoked' });
  } catch (err) { next(err); }
}

// GET /auth/me

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authed = req as AuthenticatedRequest;
    ok(res, { user: authed.user });
  } catch (err) { next(err); }
}
