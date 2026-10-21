import { z } from 'zod';
import { JsonTypes } from '>/types';

const JsonValuesSchema: z.ZodType<JsonTypes> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValuesSchema),
    z.record(z.string(), JsonValuesSchema),
  ]),
);

export const UserProfileSchema = z.enum(['admin', 'editor', 'readOnly']);

export const TokenRowSchema = z.object({
  rowIndex: z.number().int().min(0),
  fingerprint: z.string().trim().min(1),
});
