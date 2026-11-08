/* File: src/routes/api/createFlow.ts
  Creates a new workflow in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { CreateFlowContract, type CreateFlowResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { appErrors } from '>/services';

export const createFlow = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<CreateFlowResponse> => {
      const { requestSchema, responseSchema } = CreateFlowContract;
      const { flowName, flowIcon, nodes, edges } = requestSchema.parse(req.body);

      const existing = queryOne<{ flow_name: string }>(
        `SELECT flow_name FROM ai_flows WHERE flow_name = ?`,
        flowName,
      );
      if (existing) {
        throw appErrors.sql({
          code: 'conflict',
          message: `Flow "${flowName}" already exists`,
        });
      }

      const sql = `
        INSERT INTO ai_flows (flow_name, flow_icon, nodes_json, edges_json)
        VALUES (?, ?, ?, ?)
      `;

      execute(
        sql,
        flowName,
        flowIcon || null,
        JSON.stringify(nodes),
        JSON.stringify(edges),
      );

      return responseSchema.parse({
        ok: true,
        message: 'Flow created',
      });
    },
  });
