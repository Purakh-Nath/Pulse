import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  type: 'access' | 'refresh';
  family?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  correlationId: string;
}

export interface MaybeAuthRequest extends Request {
  user?: AuthUser;
  correlationId: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
  correlationId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type PollStatus = 'draft' | 'active' | 'expired' | 'closed';
export type ResponsesMode = 'anonymous' | 'authenticated';

export interface AnonIdentity {
  anonId: string;
  source: 'cookie' | 'fingerprint' | 'session' | 'ip';
}

export interface AnalyticsUpdate {
  totalResponses: number;
  questions: {
    questionId: string;
    options: { optionId: string; count: number; percentage: number }[];
  }[];
  updatedAt: string;
}
