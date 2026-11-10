/* File: src/routes/api/createMcp.ts
  Creates a new MCP service in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { CreateMcpContract, type CreateMcpResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { appErrors } from '>/services';

export const createMcp = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<CreateMcpResponse> => {
      const { requestSchema, responseSchema } = CreateMcpContract;
      const { mcpName, mcpTransport, mcpIcon, mcpJson, sortOrder, status } =
        requestSchema.parse(req.body);

      const existing = queryOne<{ mcp_name: string }>(
        `SELECT mcp_name FROM mcp_services WHERE mcp_name = ?`,
        mcpName,
      );
      if (existing) {
        throw appErrors.sql({
          code: 'conflict',
          message: `MCP "${mcpName}" already exists`,
        });
      }

      const sqlCreate = `
        INSERT INTO mcp_services (mcp_name, mcp_transport, mcp_icon, mcp_json, sort_order, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      execute(
        sqlCreate,
        mcpName,
        mcpTransport,
        mcpIcon || null,
        mcpJson,
        sortOrder,
        status ? 1 : 0,
      );

      return responseSchema.parse({
        ok: true,
        message: 'MCP created',
      });
    },
  });
