import { ZodError } from 'zod';
import { SqlError } from './sql';

export type DomainError = {
  code: string;
  message: string;
  details?: string[];
};

export type AppError =
  | { type: 'auth'; kind: 'missing' | 'invalid' }
  | { type: 'sql'; error: SqlError }
  | { type: 'validation'; error: ZodError }
  | { type: 'domain'; error: DomainError }
  | { type: 'server'; code: number; message: string };
