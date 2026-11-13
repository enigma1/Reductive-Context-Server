/* File: src/routes/api/getFlow.ts
  Retrieves details of a specific workflow from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import {
  GetFlowContract,
  type GetFlowResponse,
  FlowNode,
  FlowEdge,
} from '>/contracts';
import { queryOne } from '>/db';
import { appErrors } from '>/services';

interface FlowRow {
  flow_name: string;
  flow_icon?: string;
  nodes_json: string;
  edges_json: string;
}

export const getFlow = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetFlowResponse> => {
      const { requestSchema, responseSchema } = GetFlowContract;
      const { name } = requestSchema.parse(req.body);
      const sql = `SELECT * FROM flow_palette WHERE flow_name = ?`;
      const row = queryOne<FlowRow>(sql, name);
      if (!row) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'Flow not found',
        });
      }

      let nodes: FlowNode[] = [];
      let edges: FlowEdge[] = [];
      try {
        nodes = JSON.parse(row.nodes_json);
        edges = JSON.parse(row.edges_json);
      } catch {
        nodes = [];
        edges = [];
      }

      return responseSchema.parse({
        ok: true,
        message: 'Flow retrieved',
        flowName: row.flow_name,
        flowIcon: row.flow_icon || undefined,
        nodes,
        edges,
      });
    },
  });
