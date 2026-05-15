import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt';
import { UnauthorizedError, ErrorCode } from '../shared/errors';
import type { AuthenticatedRequest, MaybeAuthRequest } from '../shared/types';

function extractToken(req: Request): string | null {
  // HTTP-only cookie (preferred)
  const cookieToken = (req.cookies as Record<string, string>)?.['access_token'];
  if (cookieToken) return cookieToken;

  // Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

// Require auth — 401 if missing

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Authentication required', ErrorCode.UNAUTHORIZED));
  }
  try {
    const payload = await verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Optional auth — sets user if token present
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      (req as MaybeAuthRequest).user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch {
      // ignore user stays unauthenticated
    }
  }
  next();
}

//  Ownership guard 

export function requireOwnership(getOwnerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authed = req as AuthenticatedRequest;
    const ownerId = getOwnerId(req);
    if (!ownerId || ownerId !== authed.user?.id) {
      return next(new UnauthorizedError('Forbidden', ErrorCode.FORBIDDEN));
    }
    next();
  };
}
