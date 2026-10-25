import { ZodError } from 'zod';
import { AppError, SqlError, DomainError } from '>/types';

export const appErrors = {
  authMissing: () => ({
    type: 'auth',
    kind: 'missing',
  }),

  authInvalid: () => ({
    type: 'auth',
    kind: 'invalid',
  }),

  sql: (error: SqlError) => ({
    type: 'sql',
    error,
  }),

  validation: (error: ZodError) => ({
    type: 'validation',
    error,
  }),
  domain: (error: DomainError) => ({
    type: 'domain',
    error,
  }),
} satisfies {
  authMissing: () => AppError;
  authInvalid: () => AppError;
  sql: (error: SqlError) => AppError;
  validation: (error: ZodError) => AppError;
  domain: (error: DomainError) => AppError;
};

export const errorResolver = (e: unknown): AppError => {
  if (typeof e === 'object' && e !== null && 'type' in e) {
    return e as AppError;
  }

  const err = e as any;

  // Fastify HTTP errors
  if (err?.statusCode) {
    if (err.statusCode === 401) {
      return appErrors.authInvalid();
    }

    if (err.statusCode === 404) {
      return appErrors.domain({ code: '404', message: err.message });
    }

    return appErrors.domain({
      code: String(err.statusCode),
      message: err.message,
    });
  }

  // Zod
  if (err instanceof ZodError) {
    return appErrors.validation(err);
  }

  // DB Error
  if (err?.sqlState || err?.code) {
    return appErrors.sql({
      code: String(err.code || 'sql_error'),
      message: err.message || 'Database error',
      details: err.details,
    });
  }

  return appErrors.domain({
    code: '500',
    message: err?.message ?? 'Unknown error',
  });
};
