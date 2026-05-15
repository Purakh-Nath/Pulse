import type { Response } from 'express';
import type { ApiResponse, PaginatedResult } from '../shared/types';

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

export function paginated<T>(res: Response, result: PaginatedResult<T>): void {
  res.status(200).json({
    success: true,
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    },
  });
}

export function noContent(res: Response): void {
  res.status(204).send();
}
