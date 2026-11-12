/* File: src/routes/api/getRole.ts
  List all roles from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetRoleListContract, type GetRoleListResponse } from '>/contracts';
import { queryRows, getColumns } from '>/db';
import { Primitive } from '>/types';
import { recordSnakeToCamel } from '>/utils';

export const getRoleList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetRoleListResponse> => {
      const { responseSchema } = GetRoleListContract;
      const { cols } = getColumns('ai_roles');
      const columnsOrder = [
        'role_name',
        'role_main',
        'role_icon',
        'status',
        'sort_order',
      ];

      const rows = queryRows<Primitive>(`
        SELECT ${columnsOrder.join(', ')}
        FROM ai_roles
        ORDER BY sort_order, role_name
      `);

      return responseSchema.parse({
        ok: true,
        message: 'Roles list retrieved',
        cols,
        columnsOrder,
        rows,
      });
    },
  });
