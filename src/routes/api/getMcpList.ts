/* File: src/routes/api/getMcpList.ts
  List all MCP services from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetMcpListContract, type GetMcpListResponse } from '>/contracts';
import { getColumns, queryRows } from '>/db';
import type { Primitive } from '>/types';

export const getMcpList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetMcpListResponse> => {
      const { responseSchema } = GetMcpListContract;
      const { cols, columnsOrder } = getColumns('mcp_services');

      const rows = queryRows<Primitive>(`
        SELECT mcp_name, mcp_transport, mcp_icon, status, sort_order
        FROM mcp_services
        ORDER BY sort_order, mcp_name
      `);

      console.log('------------------------------>', columnsOrder, cols, rows);
      return responseSchema.parse({
        ok: true,
        message: 'MCP list retrieved',
        cols,
        columnsOrder,
        rows,
      });
    },
  });
