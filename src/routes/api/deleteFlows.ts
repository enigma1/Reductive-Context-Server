/* File: src/routes/api/deleteFlows.ts
  Removes workflows from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { DeleteFlowsContract, type DeleteFlowsResponse } from '>/contracts';
import { execute } from '>/db';

export const deleteFlows = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<DeleteFlowsResponse> => {
      const { requestSchema, responseSchema } = DeleteFlowsContract;
      const { flowNames } = requestSchema.parse(req.body);
      const placeholders = flowNames.map(() => '?').join(', ');
      const sql = `DELETE FROM ai_flows WHERE flow_name IN (${placeholders})`;
      const result = execute(sql, ...flowNames);

      if (result.changes !== flowNames.length) {
        return responseSchema.parse({
          ok: false,
          message: `Warning: ${result.changes} flow(s) were removed`,
        });
      }
      return responseSchema.parse({
        ok: true,
        message: 'Flows removed',
      });
    },
  });
