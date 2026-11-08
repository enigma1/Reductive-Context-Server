/* File: src/routes/api/getMcpList.ts
  List all MCP services from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetMcpListContract, type GetMcpListResponse } from '>/contracts';
import { queryRecords } from '>/db';
import { McpTransports } from '>/contracts';
import { recordSnakeToCamel } from '>/utils';
import type { McpListRow } from '>/types';

export const getMcpList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetMcpListResponse> => {
      const { responseSchema } = GetMcpListContract;

      const sql = `SELECT mcp_name, mcp_transport, mcp_icon, status, sort_order FROM mcp_services ORDER BY sort_order, mcp_name`;
      const rows = queryRecords<McpListRow>(sql);
      const services = rows.map((row) => {
        const { mcpIcon, ...rest } = recordSnakeToCamel(row);
        return {
          ...rest,
          mcpIcon: mcpIcon || undefined,
        };
      });

      return responseSchema.parse({
        ok: true,
        message: 'MCP list retrieved',
        services,
      });
    },
  });
