/* File: src/routes/api/setFlow.ts
  Updates an existing workflow in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { SetFlowContract, type SetFlowResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { appErrors } from '>/services';

export const setFlow = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<SetFlowResponse> => {
      const { requestSchema, responseSchema } = SetFlowContract;
      const { orgName, flowName, flowIcon, nodes, edges } = requestSchema.parse(req.body);

      const existing = queryOne<{ flow_name: string }>(
        `SELECT flow_name FROM ai_flows WHERE flow_name = ?`,
        orgName,
      );
      if (!existing) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'Flow not found',
        });
      }

      const sql = `
        UPDATE ai_flows SET flow_name = ?, flow_icon = ?, nodes_json = ?, edges_json = ?
        WHERE flow_name = ?
      `;

      const result = execute(
        sql,
        flowName,
        flowIcon || null,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        orgName,
      );

      if (!result || result.changes === 0) {
        throw appErrors.sql({
          code: 'not_found',
          message: `Could not update Flow ${flowName} - does it exist?`,
        });
      }

      return responseSchema.parse({
        ok: true,
        message: 'Flow updated',
      });
    },
  });
