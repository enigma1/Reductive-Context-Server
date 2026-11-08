/* File: src/routes/api/getFlowList.ts
  Return all workflows from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetFlowListContract, type GetFlowListResponse } from '>/contracts';
import { queryRecords } from '>/db';
import { recordSnakeToCamel } from '>/utils';
import { FlowListRow } from '>/types';

export const getFlowList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetFlowListResponse> => {
      const { responseSchema } = GetFlowListContract;

      const sql = `SELECT flow_name, flow_icon, status, sort_order FROM flow_palette ORDER BY sort_order, flow_name`;
      const rows = queryRecords<FlowListRow>(sql);
      const flows = rows.map((flowRow) => {
        const { flowIcon, ...rest } = recordSnakeToCamel(flowRow);
        return {
          ...rest,
          flowIcon: flowIcon || undefined,
        };
      });
      return responseSchema.parse({
        ok: true,
        message: 'Flow list retrieved',
        flows,
      });
    },
  });
