/* File: src/routes/api/getRole.ts
  List all roles from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetRoleListContract, type GetRoleListResponse } from '>/contracts';
import { queryRecords } from '>/db';
import { RoleListRow } from '>/types';
import { recordSnakeToCamel } from '>/utils';

export const getRoleList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetRoleListResponse> => {
      const { responseSchema } = GetRoleListContract;

      const sqlRoles = `SELECT role_name, role_main, role_icon, status, sort_order FROM ai_roles ORDER BY sort_order, role_name asc`;
      const rows = queryRecords<RoleListRow>(sqlRoles);
      const roles = rows.map((roleRow) => {
        const { roleName, roleIcon, ...rest } = recordSnakeToCamel(roleRow);
        return {
          ...rest,
          name: roleName,
          roleIcon: roleIcon || undefined,
        };
      });

      return responseSchema.parse({
        ok: true,
        message: 'Roles list retrieved',
        roles,
      });
    },
  });
