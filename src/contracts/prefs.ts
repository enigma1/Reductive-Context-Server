import { z } from 'zod';

const noTrim = (name: string) =>
  z
    .string()
    .refine(
      (v) => v === v.trim(),
      `${name} must not contain leading or trailing whitespace`,
    );

const SidebarVisibilitySchema = z.object({
  sideDatabases: z.boolean(),
  sideTables: z.boolean(),
  sideQueries: z.boolean(),
});

const StorageConfigSchema = z.object({
  backPort: z.number().int().min(1).max(65535),
  hiddenColumns: z.record(z.string(), z.boolean()),
  sidebarVisibility: SidebarVisibilitySchema,
  headerVisibility: z.boolean(),
  theme: z.string(),
  sidebarWidth: z.number().int().nonnegative(),
  frontPort: z.number().int(),
});

export const UserPrefsSchema = StorageConfigSchema.extend({});

export type UserPrefs = z.infer<typeof UserPrefsSchema>;
