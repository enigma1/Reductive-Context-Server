import { ZodError } from 'zod';
import { AppError, SqlError } from '>/types';

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
  domain: (code: string, message: string) => ({
    type: 'domain',
    code,
    message,
  }),
  server: (code: number, message: string) => ({
    type: 'server',
    code,
    message,
  }),
} satisfies {
  authMissing: () => AppError;
  authInvalid: () => AppError;
  sql: (error: SqlError) => AppError;
  validation: (error: ZodError) => AppError;
  domain: (code: string, message: string) => AppError;
  server: (code: number, message: string) => AppError;
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
      return appErrors.server(404, err.message);
    }

    return appErrors.server(err.statusCode, err.message);
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

  return appErrors.server(500, err?.message ?? 'Unknown error');
};
