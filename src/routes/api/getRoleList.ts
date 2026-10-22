/* File: src/routes/api/getRole.ts
  List all roles from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetRoleListContract, type GetRoleListResponse } from '>/contracts';
import { queryRecords } from '>/db';
import { RoleListRow } from '>/types';

export const getRoleList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetRoleListResponse> => {
      const { responseSchema } = GetRoleListContract;

      const sqlRoles = `SELECT role_name, role_main FROM ai_roles`;
      const rows = queryRecords<RoleListRow>(sqlRoles);
      const roles = rows.map((row) => {
        return {
          name: row.role_name,
          roleMain: row.role_main,
        };
      });

      return responseSchema.parse({
        ok: true,
        message: 'Roles list retrieved',
        roles,
      });
    },
  });
