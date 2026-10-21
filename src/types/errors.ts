import { ZodError } from 'zod';
import { SqlError } from './sql';

export type AppError =
  | { type: 'auth'; kind: 'missing' | 'invalid' }
  | { type: 'sql'; error: SqlError }
  | { type: 'validation'; error: ZodError }
  | { type: 'domain'; code: string; message: string }
  | { type: 'server'; code: number; message: string };
