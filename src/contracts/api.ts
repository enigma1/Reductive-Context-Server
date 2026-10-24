/* File: src/contracts/api.ts
  API validation contracts and types
*/
import { z } from 'zod';
import { AiStatusSchema } from './ai';

export const BasicResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  // aiStatus: AiStatusSchema,
});
export type BasicResponse = z.infer<typeof BasicResponseSchema>;

const ColumnSchema = z.object({
  type: z.string(),
  name: z.string(),
});
export const BasicRowsShapeSchema = z.object({
  rows: z.array(z.unknown()),
  cols: z.record(z.string(), ColumnSchema),
  columnsOrder: z.array(z.string()),
});
export type BasicRowsShape = z.infer<typeof BasicRowsShapeSchema>;

export const TableDataSchema = z.object({
  columnsOrder: z.array(z.string()),
  rows: z.array(z.array(z.json())),
});
export type TableData = z.infer<typeof TableDataSchema>;

export const DelayedRequestSchema = z.object({
  delay: z.number().int().nonnegative(),
});

export const DelayedResponseSchema = z.object({ ...BasicResponseSchema.shape });

export type DelayedRequest = z.infer<typeof DelayedRequestSchema>;
export type DelayedResponse = z.infer<typeof DelayedResponseSchema>;

export const LoadSettingsResponseSchema = BasicResponseSchema.extend({
  theme: z.string(),
});

export type LoadSettingsResponse = z.infer<typeof LoadSettingsResponseSchema>;

export const SaveSettingsRequestSchema = z.object({
  theme: z.string(),
});
export type SaveSettingsRequest = z.infer<typeof SaveSettingsRequestSchema>;

// Scan Folder/Files
// Request is a list of paths the user requested for this prompt
// Response is record of strings with a string array
export const FolderPathSchema = z.object({
  path: z.string(),
  depth: z.number().int().positive().optional(),
});
export type FolderPath = z.infer<typeof FolderPathSchema>;

export const GetPathsRequestSchema = z.object({
  paths: z.array(FolderPathSchema),
  fileTypes: z.array(z.string()).optional(),
});
export type GetPathsRequest = z.infer<typeof GetPathsRequestSchema>;

export const GetPathsResponseSchema = BasicResponseSchema.extend({
  paths: z.record(z.string(), z.array(z.string())),
  unresolved: z.array(z.string()),
  textTrees: z.record(z.string(), z.string()),
});
export type GetPathsResponse = z.infer<typeof GetPathsResponseSchema>;

export const GetPathsContract = {
  requestSchema: GetPathsRequestSchema,
  responseSchema: GetPathsResponseSchema,
};

export const ReadFileRequestSchema = z.object({
  path: z.string(),
  name: z.string(),
});
export type ReadFileRequest = z.infer<typeof ReadFileRequestSchema>;

export const ReadFileResponseSchema = BasicResponseSchema.extend({
  content: z.string(),
});
export type ReadFileResponse = z.infer<typeof ReadFileResponseSchema>;

export const ReadFileContract = {
  requestSchema: ReadFileRequestSchema,
  responseSchema: ReadFileResponseSchema,
};

export const WriteFileRequestSchema = z.object({
  path: z.string(),
  name: z.string(),
  content: z.string(),
});
export type WriteFileRequest = z.infer<typeof WriteFileRequestSchema>;

export const WriteFileResponseSchema = BasicResponseSchema;
export type WriteFileResponse = z.infer<typeof WriteFileResponseSchema>;
export const WriteFileContract = {
  requestSchema: WriteFileRequestSchema,
  responseSchema: WriteFileResponseSchema,
};

const contentMode = ['content', 'signature'] as const;
export type FileMode = (typeof contentMode)[number];

const ContentRangeSchema = z.object({
  startLine: z.number().int().min(1),
  endLine: z.number().int().min(1),
});
export type ContentRange = z.infer<typeof ContentRangeSchema>;

export const FileNodeSchema = z.object({
  path: z.string(),
  name: z.string(),
  mode: z.enum(contentMode).optional(),
  ranges: z.array(ContentRangeSchema).optional(),
});
export type FileNode = z.infer<typeof FileNodeSchema>;

export const CreateBundleRequestSchema = z.object({
  rootPaths: z.array(FolderPathSchema),
  paths: z.array(FileNodeSchema),
  prompt: z.string().min(10),
});

export type CreateBundleRequest = z.infer<typeof CreateBundleRequestSchema>;

export const CreateBundleResponseSchema = BasicResponseSchema.extend({
  inputTokens: z.number().int().nonnegative(),
  bundleId: z.number(),
});
export type CreateBundleResponse = z.infer<typeof CreateBundleResponseSchema>;

export const CreateBundleContract = {
  requestSchema: CreateBundleRequestSchema,
  responseSchema: CreateBundleResponseSchema,
};

export const GetBundleRequestSchema = z.object({
  bundleId: z.number(),
});
export type GetBundleRequest = z.infer<typeof GetBundleRequestSchema>;

export const ConversationSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  prompt: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  filesJson: z.string(),
  createdAt: z.string(),
});

export const RootPathSchema = z.object({
  path: z.string(),
  depth: z.number().positive().optional(),
});
export type RootPath = z.infer<typeof RootPathSchema>;

export const UserFileSchema = ContentRangeSchema.partial().extend({
  filePath: z.string(),
  contentMode: z.enum(contentMode),
});
export type UserFile = z.infer<typeof UserFileSchema>;

export const GetBundleResponseSchema = BasicResponseSchema.extend({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  bundleId: z.number().int().positive(),
  bundleContent: z.string(),
  prompt: z.string(),
  conversations: z.array(ConversationSchema),
  rootPaths: z.array(RootPathSchema),
  userFiles: z.array(UserFileSchema),
});
export type GetBundleResponse = z.infer<typeof GetBundleResponseSchema>;

export const GetBundleContract = {
  requestSchema: GetBundleRequestSchema,
  responseSchema: GetBundleResponseSchema,
};

export const SetBundleRequestSchema = z.object({
  bundleId: z.number().int().positive(),
  prompt: z.string(),
  rootPaths: z.array(FolderPathSchema).optional(),
  paths: z.array(FileNodeSchema).optional(),
});
export type SetBundleRequest = z.infer<typeof SetBundleRequestSchema>;

export const SetBundleResponseSchema = BasicResponseSchema.extend({
  inputTokens: z.number(),
  bundleId: z.number(),
});
export type SetBundleResponse = z.infer<typeof SetBundleResponseSchema>;

export const SetBundleContract = {
  requestSchema: SetBundleRequestSchema,
  responseSchema: SetBundleResponseSchema,
};

export const SubmitBundleRequestSchema = z.object({
  bundleId: z.number(),
  bundleContent: z.string(),
  prompt: z.string(),
});
export type SubmitBundleRequest = z.infer<typeof SubmitBundleRequestSchema>;

export const SubmitBundleResponseSchema = BasicResponseSchema.extend({
  inputTokens: z.number(),
  bundleId: z.number(),
});
export type SubmitBundleResponse = z.infer<typeof SubmitBundleResponseSchema>;

export const SubmitBundleContract = {
  requestSchema: SubmitBundleRequestSchema,
  responseSchema: SubmitBundleResponseSchema,
};

export const ResumeBundleRequestSchema = SubmitBundleRequestSchema;
export type ResumeBundleRequest = z.infer<typeof ResumeBundleRequestSchema>;

export const ResumeBundleResponseSchema = SubmitBundleResponseSchema;
export type ResumeBundleResponse = z.infer<typeof ResumeBundleResponseSchema>;

export const ResumeBundleContract = {
  requestSchema: ResumeBundleRequestSchema,
  responseSchema: ResumeBundleResponseSchema,
};

export const GetTableDataRequestSchema = z.object({
  table: z.string(),
});
export type GetTableDataRequest = z.infer<typeof GetTableDataRequestSchema>;

export const GetTableDataResponseSchema = z.object({
  ...BasicResponseSchema.shape,
  ...TableDataSchema.shape,
});
export type GetTableDataResponse = z.infer<typeof GetTableDataResponseSchema>;

export const GetTableDataContract = {
  requestSchema: GetTableDataRequestSchema,
  responseSchema: GetTableDataResponseSchema,
};

export const GetBundleListRequestSchema = z.void();
export type GetBundleListRequest = z.infer<typeof GetBundleListRequestSchema>;

export const GetBundleListResponseSchema = BasicResponseSchema.extend({
  ...BasicRowsShapeSchema.shape,
});

export type GetBundleListResponse = z.infer<typeof GetBundleListResponseSchema>;

export const GetBundleListContract = {
  requestSchema: GetBundleListRequestSchema,
  responseSchema: GetBundleListResponseSchema,
};

export const DeleteBundlesRequestSchema = z.object({
  bundleIds: z.array(z.number()).min(1),
});
export type DeleteBundlesRequest = z.infer<typeof DeleteBundlesRequestSchema>;

export const DeleteBundlesResponseSchema = BasicResponseSchema;
export type DeleteBundlesResponse = z.infer<typeof DeleteBundlesResponseSchema>;

export const DeleteBundlesContract = {
  requestSchema: DeleteBundlesRequestSchema,
  responseSchema: DeleteBundlesResponseSchema,
};

export const AssistantRoleSchema = z.object({
  name: z.string().min(1),
  roleMain: z.string(),
});

export const AssistantRoleDetailedSchema = AssistantRoleSchema.extend({
  contentRules: z.string(),
  contentExamples: z.string(),
  scopePrompt: z.string(),
  scopeRules: z.string(),
  scopeExamples: z.string(),
});

export const CreateRoleRequestSchema = AssistantRoleDetailedSchema;
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

export const CreateRoleResponseSchema = BasicResponseSchema;
export type CreateRoleResponse = z.infer<typeof CreateRoleResponseSchema>;

export const CreateRoleContract = {
  requestSchema: CreateRoleRequestSchema,
  responseSchema: CreateRoleResponseSchema,
};

export const GetRoleListRequestSchema = z.void();
export type GetRoleListRequest = z.infer<typeof GetRoleListRequestSchema>;
export const GetRoleListResponseSchema = BasicResponseSchema.extend({
  roles: z.array(AssistantRoleSchema),
});

export type GetRoleListResponse = z.infer<typeof GetRoleListResponseSchema>;

export const GetRoleListContract = {
  requestSchema: GetRoleListRequestSchema,
  responseSchema: GetRoleListResponseSchema,
};

export const GetRoleRequestSchema = z.object({
  name: z.string().min(1),
});
export type GetRoleRequest = z.infer<typeof GetRoleRequestSchema>;

export const GetRoleResponseSchema = BasicResponseSchema.extend({
  ...AssistantRoleDetailedSchema.shape,
});
export type GetRoleResponse = z.infer<typeof GetRoleResponseSchema>;

export const GetRoleContract = {
  requestSchema: GetRoleRequestSchema,
  responseSchema: GetRoleResponseSchema,
};

export const SetRoleRequestSchema = AssistantRoleDetailedSchema.extend({
  orgName: z.string().min(1),
});

export type SetRoleRequest = z.infer<typeof SetRoleRequestSchema>;

export const SetRoleResponseSchema = BasicResponseSchema;
export type SetRoleResponse = z.infer<typeof SetRoleResponseSchema>;

export const SetRoleContract = {
  requestSchema: SetRoleRequestSchema,
  responseSchema: SetRoleResponseSchema,
};

export const DeleteRolesRequestSchema = z.object({
  roleNames: z.array(z.string()).min(1),
});
export type DeleteRolesRequest = z.infer<typeof DeleteRolesRequestSchema>;

export const DeleteRolesResponseSchema = BasicResponseSchema;
export type DeleteRolesResponse = z.infer<typeof DeleteRolesResponseSchema>;

export const DeleteRolesContract = {
  requestSchema: DeleteRolesRequestSchema,
  responseSchema: DeleteRolesResponseSchema,
};

export const GetLanguagesRequestSchema = z.void();
export type GetLanguagesRequest = z.infer<typeof GetLanguagesRequestSchema>;

const LanguageEntrySchema = z.object({
  monaco: z.string(),
  markdown: z.string(),
});
export const GetLanguagesResponseSchema = z.object({
  languages: z.record(z.string(), LanguageEntrySchema),
});
export type GetLanguagesResponse = z.infer<typeof GetLanguagesResponseSchema>;

export const GetLanguagesContract = {
  requestSchema: GetLanguagesRequestSchema,
  responseSchema: GetLanguagesResponseSchema,
};
