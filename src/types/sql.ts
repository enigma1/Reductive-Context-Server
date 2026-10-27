export type SqlColumn = {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: string | null;
  pk: number;
};

export type SqlError = {
  code: string;
  message: string;
  details?: string[];
};

export type BundlesRow = {
  bundle_id: number;
  bundle_content: string;
  prompt: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
  last_modified: string;
};

export type BundleConversationRow = {
  id: number;
  bundle_id: number;
  prompt: string;
  reasoning: string;
  summary: string;
  files_json: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
};

export type BundlePathsRow = {
  bundle_id: number;
  root_path: string;
  depth: number;
};

export type BundleFilesRow = {
  bundle_id: number;
  file_path: string;
  content_mode: string;
  start_line?: number;
  end_line?: number;
};

export type BundleFilesInsertCols = {
  filePath: string;
  startLine?: number;
  endLine?: number;
}[];

export type BundlePathsInsertCols = {
  path: string;
  depth?: number;
}[];

export type RoleListRow = {
  role_name: string;
  role_main: string;
};

export type RoleRow = RoleListRow & {
  content_rules: string;
  content_examples: string;
  scope_prompt: string;
  scope_rules: string;
  scope_examples: string;
};

export type ColShape = {
  name: string;
  type: string;
};
