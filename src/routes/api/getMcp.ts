/* File: src/routes/api/getMcp.ts
  Retrieves details of a specific MCP from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetMcpContract, type GetMcpResponse } from '>/contracts';
import { queryOne } from '>/db';
import { appErrors } from '>/services';
import { recordSnakeToCamel } from '>/utils';
import type { McpRow } from '>/types';

export const getMcp = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetMcpResponse> => {
      const { requestSchema, responseSchema } = GetMcpContract;
      const { name } = requestSchema.parse(req.body);
      const sql = `SELECT * FROM mcp_services WHERE mcp_name = ?`;
      const row = queryOne<McpRow>(sql, name);
      if (!row) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'MCP not found',
        });
      }
      const mcp = recordSnakeToCamel(row);
      const result = {
        ok: true,
        message: 'MCP retrieved',
        mcpName: mcp.mcpName,
        mcpSummary: mcp.mcpSummary || 'no summary provided',
        mcpTransport: mcp.mcpTransport,
        mcpIcon: mcp.mcpIcon || undefined,
        mcpJson: mcp.mcpJson,
        sortOrder: mcp.sortOrder,
        status: mcp.status,
      };
      return responseSchema.parse(result);
    },
  });
