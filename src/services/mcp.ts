import { MCPAdapter } from '@langchain/mcp-adapters';

/* jsons for 3 separate cases to use
1) Internal Case part of the existing application
{
  "command": "node",
  "args": ["./mcp-servers/db-server.js"],
  "env": { "DB_PATH": "./data/app.db" }
}

2) CLI case part of the system the application runs on
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-cron"],
  "env": {}
}
  or some custom script somewhere in the local system
  {
  "command": "/usr/local/bin/my-tool-mcp",
  "args": ["--config", "/etc/my-tool/mcp.json"],
  "env": { "LOG_LEVEL": "info" }
}

3) Remote network service
{
  "type": "http",
  "url": "https://mcp.internal.example.com/postgres",
  "headers": { "Authorization": "Bearer sk_mcp_..." }
}
*/

interface McpRow {
  mcp_name: string;
  mcp_json: string;
  mcp_transport: string;
  mcp_icon: Buffer | null;
}

interface McpConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  headers?: Record<string, string>;
}

export const mcpProcess = async (rows: McpRow[]) => {
  // Build the servers config from the db rows
  const servers: Record<string, object> = {};
  for (const row of rows) {
    servers[row.mcp_name] = JSON.parse(row.mcp_json);
  }

  const adapter = new MCPAdapter({ servers });
  const tools = await adapter.listTools();

  return { adapter, tools };
};

// Usage in agent:
// const { adapter, tools } = await mcpProcess(rows);
// const agent = createAgent({ model, tools, systemPrompt });
// const result = await agent.invoke({ messages: [...] });
// await adapter.close(); // when done
