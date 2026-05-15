export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_REVOKED = 'SESSION_REVOKED',
  CSRF_INVALID = 'CSRF_INVALID',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  POLL_EXPIRED = 'POLL_EXPIRED',
  POLL_INACTIVE = 'POLL_INACTIVE',
  DUPLICATE_RESPONSE = 'DUPLICATE_RESPONSE',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = ErrorCode.UNAUTHORIZED) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = ErrorCode.CONFLICT) {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, ErrorCode.RATE_LIMITED);
    this.retryAfter = retryAfter;
  }
}

export class PollExpiredError extends AppError {
  constructor() {
    super('This poll has expired', 410, ErrorCode.POLL_EXPIRED);
  }
}

export class DuplicateResponseError extends AppError {
  constructor() {
    super('You have already responded to this poll', 409, ErrorCode.DUPLICATE_RESPONSE);
  }
}
