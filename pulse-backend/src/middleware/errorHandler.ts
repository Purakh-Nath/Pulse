import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode, ValidationError } from '../shared/errors';
import { logger } from '../config/logger';
import type { MaybeAuthRequest } from '../shared/types';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = (req as MaybeAuthRequest).correlationId ?? 'unknown';

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
    res.status(422).json({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR, message: 'Validation failed', details },
      correlationId,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, correlationId }, 'Operational error');
    } else {
      logger.warn({ code: err.code, message: err.message, correlationId }, 'App error');
    }

    const body: Record<string, unknown> = {
      success: false,
      error: { code: err.code, message: err.message },
      correlationId,
    };
    if (err.details) (body.error as Record<string, unknown>)['details'] = err.details;

    // Rate limit - add Retry-After header
    if ('retryAfter' in err && typeof err.retryAfter === 'number') {
      res.set('Retry-After', String(err.retryAfter));
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown errors
  logger.error({ err, correlationId }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' },
    correlationId,
  });
};

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: ErrorCode.NOT_FOUND, message: `Route ${req.method} ${req.path} not found` },
  });
}
