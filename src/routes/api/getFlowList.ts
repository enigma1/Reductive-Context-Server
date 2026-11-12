/* File: src/routes/api/getFlowList.ts
  Return all workflows from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetFlowListContract, type GetFlowListResponse } from '>/contracts';
import { getColumns, queryRows } from '>/db';
import { Primitive } from '>/types';

export const getFlowList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetFlowListResponse> => {
      const { responseSchema } = GetFlowListContract;

      const { cols } = getColumns('mcp_services');
      const columnsOrder = ['flow_name', 'flow_icon', 'status', 'sort_order'];

      const rows = queryRows<Primitive>(`
        SELECT ${columnsOrder.join(', ')}
        FROM flow_palette
        ORDER BY sort_order, flow_name
      `);

      return responseSchema.parse({
        ok: true,
        message: 'List of flows retrieved',
        cols,
        columnsOrder,
        rows,
      });
    },
  });
