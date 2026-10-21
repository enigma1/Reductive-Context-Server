import { z } from 'zod';

export const AiStatusSchema = z.object({
  active: z.boolean(),
  model: z.string(),
});

export const TimingRangeSchema = z.object({
  startedAt: z.string(),
  completedAt: z.string(),
});
export type TimingRange = z.infer<typeof TimingRangeSchema>;

export const TokenUsageSchema = z.object({
  input: z.number().int().nonnegative().default(0),
  output: z.number().int().nonnegative().default(0),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const CapabilityDecisionSchema = z.object({
  capabilityId: z.string().optional(),
  parameters: z.object({
    database: z.string().optional(),
    table: z.string().optional(),
  }),
});

export type CapabilityDecision = z.infer<typeof CapabilityDecisionSchema>;
export type CapabilityParameterName = keyof CapabilityDecision['parameters'];
export type DecisionParameters = Record<
  CapabilityParameterName,
  string | undefined
>;

export const ResolutionSchema = z.object({
  satisfied: z.boolean(),
  condition: z.string().optional(),
  reason: z.string().optional(),
  value: z.string().optional(),
});

export type Resolution = z.infer<typeof ResolutionSchema>;

const bundleScope = ['current', 'thread'];
export const QueryScopeSchema = z.enum(bundleScope);
export type QueryScope = z.infer<typeof QueryScopeSchema>;

export type BundleScope = (typeof bundleScope)[number];

export const FrontRequestSchema = z
  .object({
    completed: z.boolean(),
    summary: z.string(),
    reasoning: z.string(),
    files: z.array(
      z.object({
        path: z.string(),
        content: z.string(),
        isNew: z.boolean(),
      }),
    ),
    clarification: z.string().optional(),
  })
  .refine((v) => !(v.clarification && v.files.length > 0), {
    message: 'Cannot have both clarification and files',
  });

export type FrontRequest = z.infer<typeof FrontRequestSchema>;

export const ContextAssessmentSchema = z.object({
  status: z.enum(['sufficient', 'missing_context']),
  missing: z.array(
    z.object({
      question: z.string(),
      reason: z.string(),
      suggestedPaths: z.array(z.string()),
    }),
  ),
});

export type ContextAssessment = z.infer<typeof ContextAssessmentSchema>;
