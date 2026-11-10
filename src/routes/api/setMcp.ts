/* File: src/routes/api/setMcp.ts
  Updates an existing MCP in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { SetMcpContract, type SetMcpResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { appErrors } from '>/services';

export const setMcp = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<SetMcpResponse> => {
      const { requestSchema, responseSchema } = SetMcpContract;
      const {
        orgName,
        mcpName,
        mcpTransport,
        mcpIcon,
        mcpJson,
        sortOrder,
        status,
      } = requestSchema.parse(req.body);

      const existing = queryOne<{ mcp_name: string }>(
        `SELECT mcp_name FROM mcp_services WHERE mcp_name = ?`,
        orgName,
      );
      if (!existing) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'MCP not found',
        });
      }

      const sql = `
        UPDATE mcp_services SET mcp_name = ?, mcp_transport = ?, mcp_icon = ?, mcp_json = ?, sort_order = ?, status = ?
        WHERE mcp_name = ?
      `;

      const result = execute(
        sql,
        mcpName,
        mcpTransport,
        mcpIcon || null,
        mcpJson,
        sortOrder,
        status ? 1 : 0,
        orgName,
      );

      if (!result || result.changes === 0) {
        throw appErrors.sql({
          code: 'not_found',
          message: `Could not update MCP ${mcpName} - does it exist?`,
        });
      }

      return responseSchema.parse({
        ok: true,
        message: 'MCP updated',
      });
    },
  });
