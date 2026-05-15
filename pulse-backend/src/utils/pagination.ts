import { z } from 'zod';
import type { PaginationParams, PaginatedResult } from '../shared/types';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function buildPagination(params: PaginationParams) {
  const offset = (params.page - 1) * params.limit;
  return { limit: params.limit, offset };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    hasNext: params.page * params.limit < total,
    hasPrev: params.page > 1,
  };
}
