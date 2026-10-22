/* File: src/routes/api/getRole.ts
  Retrieves details of a specific role from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetRoleContract, type GetRoleResponse } from '>/contracts';
import { queryOne } from '>/db';
import { RoleRow } from '>/types';
import { appErrors } from '>/services';
import { recordSnakeToCamel } from '>/utils';

export const getRole = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetRoleResponse> => {
      const { requestSchema, responseSchema } = GetRoleContract;
      const { name } = requestSchema.parse(req.body);
      const sqlRole = `SELECT * FROM ai_roles WHERE role_name = ?`;
      const roleRow = queryOne<RoleRow>(sqlRole, name);
      if (!roleRow) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'AI Role not found',
        });
      }
      const { roleName, ...rest } = recordSnakeToCamel(roleRow);
      return responseSchema.parse({
        ok: true,
        message: 'Role retrieved',
        ...rest,
        name: roleName,
      });
    },
  });
