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
  label: z.string().optional(),
});

const ColumnRecordSchema = z.record(z.string(), ColumnSchema);
export type ColumnRecords = z.infer<typeof ColumnRecordSchema>;

const CommonColumnsSchema = z.object({
  status: z.number().min(0).max(1).default(1),
  sortOrder: z.number().int(),
});
export type CommonColumns = z.infer<typeof CommonColumnsSchema>;

export const BasicColumnsSchema = z.object({
  cols: ColumnRecordSchema,
  columnsOrder: z.array(z.string()),
});
export type BasicColumns = z.infer<typeof BasicColumnsSchema>;

export const BasicRowsSchema = z.object({
  ...BasicColumnsSchema.shape,
  rows: z.array(z.json()),
});
export type BasicRows = z.infer<typeof BasicRowsSchema>;

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
  textTrees: z.record(z.string(), z.string()),
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
  textTrees: z.record(z.string(), z.string()).optional(),
  roleName: z.string().min(1),
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
  ...BasicRowsSchema.shape,
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
  ...CommonColumnsSchema.shape,
  name: z.string().min(1),
  roleMain: z.string(),
});

export const AssistantRoleDetailedSchema = AssistantRoleSchema.extend({
  contentRules: z.string(),
  contentExamples: z.string(),
  scopePrompt: z.string(),
  scopeRules: z.string(),
  scopeExamples: z.string(),
  roleIcon: z.string().optional(),
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
  ...BasicRowsSchema.shape,
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

export const ActivateRoleRequestSchema = z.object({
  roleName: z.string().optional(),
});

export type ActivateRoleRequest = z.infer<typeof ActivateRoleRequestSchema>;

export const ActivateRoleResponseSchema = BasicResponseSchema;
export type ActivateRoleResponse = z.infer<typeof ActivateRoleResponseSchema>;

export const ActivateRoleContract = {
  requestSchema: ActivateRoleRequestSchema,
  responseSchema: ActivateRoleResponseSchema,
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

const mcpListMode = ['enabled', 'all'] as const;
export type McpListMode = z.infer<typeof mcpListMode>;

const mcpTransports = ['http', 'internal', 'external'] as const;
export type McpTransports = z.infer<typeof mcpTransports>;

export const McpShortSchema = z.object({
  ...CommonColumnsSchema.shape,
  mcpName: z.string().min(1),
  mcpSummary: z.string().min(1),
  mcpTransport: z.enum(mcpTransports),
  mcpIcon: z.string().optional(),
});
export const McpDetailedSchema = z.object({
  ...McpShortSchema.shape,
  mcpJson: z.string().min(20),
});

export const CreateMcpRequestSchema = z.object({
  ...McpDetailedSchema.shape,
});
export type CreateMcpRequest = z.infer<typeof CreateMcpRequestSchema>;

export const CreateMcpResponseSchema = BasicResponseSchema;
export type CreateMcpResponse = z.infer<typeof CreateMcpResponseSchema>;

export const CreateMcpContract = {
  requestSchema: CreateMcpRequestSchema,
  responseSchema: CreateMcpResponseSchema,
};

export const GetMcpListRequestSchema = z.void();

export type GetMcpListRequest = z.infer<typeof GetMcpListRequestSchema>;
export const GetMcpListResponseSchema = BasicResponseSchema.extend({
  ...BasicRowsSchema.shape,
});
export type GetMcpListResponse = z.infer<typeof GetMcpListResponseSchema>;

export const GetMcpListContract = {
  requestSchema: GetMcpListRequestSchema,
  responseSchema: GetMcpListResponseSchema,
};

export const GetMcpRequestSchema = z.object({
  name: z.string().min(1),
});
export type GetMcpRequest = z.infer<typeof GetMcpRequestSchema>;

export const GetMcpResponseSchema = BasicResponseSchema.extend({
  ...McpDetailedSchema.shape,
});
export type GetMcpResponse = z.infer<typeof GetMcpResponseSchema>;

export const GetMcpContract = {
  requestSchema: GetMcpRequestSchema,
  responseSchema: GetMcpResponseSchema,
};

export const SetMcpRequestSchema = McpDetailedSchema.extend({
  orgName: z.string().min(1),
});
export type SetMcpRequest = z.infer<typeof SetMcpRequestSchema>;

export const SetMcpResponseSchema = BasicResponseSchema;
export type SetMcpResponse = z.infer<typeof SetMcpResponseSchema>;

export const SetMcpContract = {
  requestSchema: SetMcpRequestSchema,
  responseSchema: SetMcpResponseSchema,
};

export const DeleteMcpsRequestSchema = z.object({
  mcpNames: z.array(z.string()).min(1),
});
export type DeleteMcpsRequest = z.infer<typeof DeleteMcpsRequestSchema>;

export const DeleteMcpsResponseSchema = BasicResponseSchema;
export type DeleteMcpsResponse = z.infer<typeof DeleteMcpsResponseSchema>;

export const DeleteMcpsContract = {
  requestSchema: DeleteMcpsRequestSchema,
  responseSchema: DeleteMcpsResponseSchema,
};

const FlowNodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('role'),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({ roleName: z.string() }),
  }),
  z.object({
    id: z.string(),
    type: z.literal('mcp'),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({ mcpName: z.string() }),
  }),
]);
export type FlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});
export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

export const FlowShortSchema = z.object({
  ...CommonColumnsSchema.shape,
  flowName: z.string(),
  flowIcon: z.base64().optional(),
});

export const FlowFullSchema = z.object({
  ...FlowShortSchema.shape,
  nodes: z.array(FlowNodeSchema).min(1),
  edges: z.array(FlowNodeSchema).min(1),
});

export const CreateFlowRequestSchema = FlowFullSchema;
export type CreateFlowRequest = z.infer<typeof CreateFlowRequestSchema>;

export const CreateFlowResponseSchema = BasicResponseSchema;
export type CreateFlowResponse = z.infer<typeof CreateFlowResponseSchema>;

export const CreateFlowContract = {
  requestSchema: CreateFlowRequestSchema,
  responseSchema: CreateFlowResponseSchema,
};

export const GetFlowRequestSchema = z.object({
  name: z.string().min(1),
});
export type GetFlowRequest = z.infer<typeof GetFlowRequestSchema>;

export const GetFlowResponseSchema = BasicResponseSchema.extend({
  ...FlowFullSchema.shape,
});
export type GetFlowResponse = z.infer<typeof GetFlowResponseSchema>;

export const GetFlowContract = {
  requestSchema: GetFlowRequestSchema,
  responseSchema: GetFlowResponseSchema,
};

export const GetFlowListRequestSchema = z.void();
export type GetFlowListRequest = z.infer<typeof GetFlowListRequestSchema>;
export const GetFlowListResponseSchema = BasicResponseSchema.extend({
  ...BasicRowsSchema.shape,
});

export type GetFlowListResponse = z.infer<typeof GetFlowListResponseSchema>;

export const GetFlowListContract = {
  requestSchema: GetFlowListRequestSchema,
  responseSchema: GetFlowListResponseSchema,
};

export const SetFlowRequestSchema = FlowFullSchema.extend({
  orgName: z.string().min(1),
});
export type SetFlowRequest = z.infer<typeof SetFlowRequestSchema>;

export const SetFlowResponseSchema = BasicResponseSchema;
export type SetFlowResponse = z.infer<typeof SetFlowResponseSchema>;

export const SetFlowContract = {
  requestSchema: SetFlowRequestSchema,
  responseSchema: SetFlowResponseSchema,
};

export const DeleteFlowsRequestSchema = z.object({
  flowNames: z.array(z.string()).min(1),
});
export type DeleteFlowsRequest = z.infer<typeof DeleteFlowsRequestSchema>;

export const DeleteFlowsResponseSchema = BasicResponseSchema;
export type DeleteFlowsResponse = z.infer<typeof DeleteFlowsResponseSchema>;

export const DeleteFlowsContract = {
  requestSchema: DeleteFlowsRequestSchema,
  responseSchema: DeleteFlowsResponseSchema,
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

export const ExportDatabaseRequestSchema = z.object({
  dbName: z.string().min(1).optional(),
});
export type ExportDatabaseRequest = z.infer<typeof ExportDatabaseRequestSchema>;

export const ExportDatabaseResponseSchema = z.void();
export type ExportDatabaseResponse = z.infer<
  typeof ExportDatabaseResponseSchema
>;

export const ExportDatabaseContract = {
  requestSchema: ExportDatabaseRequestSchema,
  responseSchema: ExportDatabaseResponseSchema,
};
