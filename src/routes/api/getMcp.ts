/* File: src/routes/api/getMcp.ts
  Retrieves details of a specific MCP from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetMcpContract, type GetMcpResponse } from '>/contracts';
import { queryOne } from '>/db';
import { appErrors } from '>/services';
import { recordSnakeToCamel } from '>/utils';
import { McpTransports } from '>/contracts';

interface McpRow {
  mcp_name: string;
  mcp_transport: McpTransports;
  mcp_icon?: string;
  mcp_json: string;
  sort_order: number;
  status: number;
}

export const getMcp = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetMcpResponse> => {
      const { requestSchema, responseSchema } = GetMcpContract;
      const { name } = requestSchema.parse(req.body);
      const sql = `SELECT * FROM ai_mcps WHERE mcp_name = ?`;
      const row = queryOne<McpRow>(sql, name);
      if (!row) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'MCP not found',
        });
      }
      const camel = recordSnakeToCamel(row);
      return responseSchema.parse({
        ok: true,
        message: 'MCP retrieved',
        mcpName: camel.mcpName,
        mcpTransport: camel.mcpTransport,
        mcpIcon: camel.mcpIcon || undefined,
        mcpJson: camel.mcpJson,
        sortOrder: camel.sortOrder,
        status: Boolean(camel.status),
      });
    },
  });
