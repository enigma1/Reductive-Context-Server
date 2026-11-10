-- db/schema.sql
CREATE TABLE
  IF NOT EXISTS bundles (
    bundle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bundle_content TEXT NOT NULL,
    prompt TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime ('now')),
    last_modified TEXT DEFAULT (datetime ('now'))
  );

CREATE TABLE
  IF NOT EXISTS bundle_files (
    bundle_id INTEGER NOT NULL REFERENCES bundles (bundle_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    content_mode TEXT NOT NULL DEFAULT 'content',
    start_line INTEGER,
    end_line INTEGER,
    PRIMARY KEY (bundle_id, file_path)
  );

CREATE TABLE
  IF NOT EXISTS bundle_paths (
    bundle_id INTEGER NOT NULL REFERENCES bundles (bundle_id) ON DELETE CASCADE,
    root_path TEXT NOT NULL DEFAULT '',
    depth INTEGER CHECK (
      depth IS NULL
      OR depth > 0
    ),
    PRIMARY KEY (bundle_id, root_path)
  );

CREATE TABLE
  IF NOT EXISTS bundle_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bundle_id INTEGER NOT NULL REFERENCES bundles (bundle_id) ON DELETE CASCADE,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    prompt TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    summary TEXT NOT NULL,
    reasoning TEXT NOT NULL DEFAULT '',
    clarification TEXT,
    files_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime ('now')),
    role_name TEXT DEFAULT NULL
  );

CREATE TABLE
  IF NOT EXISTS ai_roles (
    role_name TEXT NOT NULL PRIMARY KEY,
    role_main TEXT NOT NULL,
    content_rules TEXT NOT NULL,
    content_examples TEXT NOT NULL,
    scope_prompt TEXT NOT NULL,
    scope_rules TEXT NOT NULL,
    scope_examples TEXT NOT NULL,
    role_icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 1 CHECK (status IN (0, 1))
  );

CREATE TABLE
  IF NOT EXISTS mcp_services (
    mcp_name TEXT NOT NULL DEFAULT '' PRIMARY KEY,
    mcp_summary TEXT NOT NULL DEFAULT '',
    mcp_json TEXT NOT NULL DEFAULT '{}',
    mcp_transport TEXT NOT NULL DEFAULT 'http',
    mcp_icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 1 CHECK (status IN (0, 1))
  );

  IF NOT EXISTS flow_palette (
    flow_name TEXT NOT NULL PRIMARY KEY,
    flow_graph TEXT NOT NULL,
    flow_icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 1 CHECK (status IN (0, 1))
  );

CREATE TABLE
  IF NOT EXISTS flow_refs (
    flow_name TEXT NOT NULL,
    ref_type TEXT NOT NULL CHECK (ref_type IN ('role', 'mcp')),
    ref_name TEXT NOT NULL,
    PRIMARY KEY (flow_name, ref_type, ref_name),
    FOREIGN KEY (flow_name) REFERENCES flow_palette (flow_name) ON DELETE CASCADE
  );