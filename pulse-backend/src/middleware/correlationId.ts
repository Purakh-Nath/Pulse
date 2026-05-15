import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import type { MaybeAuthRequest } from '../shared/types';

export function correlationIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const id =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    randomBytes(8).toString('hex');

  (req as MaybeAuthRequest).correlationId = id;
  next();
}
