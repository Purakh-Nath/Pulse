import type { Request, Response, NextFunction } from 'express';
import { submitResponse } from './responses.service';
import { resolveAnonIdentity } from '../../services/anon';
import { applySubmitLimit } from '../../services/rateLimiter';
import { ok } from '../../utils/response';
import type { MaybeAuthRequest } from '../../shared/types';

export async function submit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authed = req as MaybeAuthRequest;
    const pollId = req.params['pollId']!;

    // Resolve identity for rate limiting key
    const anonIdentity = authed.user ? undefined : await resolveAnonIdentity(req, res);
    const limitKey = authed.user?.id ?? anonIdentity?.anonId ?? req.ip ?? 'unknown';

    await applySubmitLimit(req, `${pollId}:${limitKey}`);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? '';

    const result = await submitResponse({
      pollId,
      input: req.body,
      user: authed.user,
      anonIdentity,
      ip,
    });

    ok(res, result, 201);
  } catch (err) { next(err); }
}
