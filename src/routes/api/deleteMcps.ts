/* File: src/routes/api/deleteMcps.ts
  Removes MCPs from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { DeleteMcpsContract, type DeleteMcpsResponse } from '>/contracts';
import { execute } from '>/db';

export const deleteMcps = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<DeleteMcpsResponse> => {
      const { requestSchema, responseSchema } = DeleteMcpsContract;
      const { mcpNames } = requestSchema.parse(req.body);
      const placeholders = mcpNames.map(() => '?').join(', ');
      const sql = `DELETE FROM ai_mcps WHERE mcp_name IN (${placeholders})`;
      const result = execute(sql, ...mcpNames);

      if (result.changes !== mcpNames.length) {
        return responseSchema.parse({
          ok: false,
          message: `Warning: ${result.changes} MCP(s) were removed`,
        });
      }
      return responseSchema.parse({
        ok: true,
        message: 'MCPs removed',
      });
    },
  });
