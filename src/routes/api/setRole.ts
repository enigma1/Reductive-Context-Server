/* File: src/routes/api/setRole.ts
  Updates an existing role in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { SetRoleContract, type SetRoleResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { RoleRow } from '>/types';
import { appErrors } from '>/services';

export const setRole = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<SetRoleResponse> => {
      const { requestSchema, responseSchema } = SetRoleContract;
      const {
        name,
        roleMain,
        contentRules,
        contentExamples,
        scopePrompt,
        scopeRules,
        scopeExamples,
      } = requestSchema.parse(req.body);
      const sqlRole = `SELECT * FROM ai_roles WHERE role_name = ?`;
      const roleRow = queryOne<RoleRow>(sqlRole, name);
      if (!roleRow) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'AI Role not found',
        });
      }

      const sqlSetRole = `
        UPDATE ai_roles SET role_main = ?, content_rules = ?, content_examples = ?,
        scope_prompt = ?, scope_rules = ?, scope_examples = ?
        WHERE role_name = ?
      `;

      const result = execute(
        sqlSetRole,
        roleMain,
        contentRules,
        contentExamples,
        scopePrompt,
        scopeRules,
        scopeExamples,
        name,
      );

      if (!result || result.changes === 0) {
        throw appErrors.sql({
          code: 'not_found',
          message: `Could not update Role ${name} - does it exist?`,
        });
      }

      return responseSchema.parse({
        ok: true,
        message: 'Role updated',
      });
    },
  });
