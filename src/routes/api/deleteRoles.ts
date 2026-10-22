/* File: src/routes/api/deleteRoles.ts
  Removes roles from the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { DeleteRolesContract, type DeleteRolesResponse } from '>/contracts';
import { execute } from '>/db';

export const deleteRoles = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<DeleteRolesResponse> => {
      const { requestSchema, responseSchema } = DeleteRolesContract;
      const { roleNames } = requestSchema.parse(req.body);
      const placeholders = roleNames.map(() => '?').join(', ');
      const sql = `DELETE FROM roles WHERE role_name IN (${placeholders})`;
      const result = execute(sql, ...roleNames);

      if (result.changes !== roleNames.length) {
        return responseSchema.parse({
          ok: false,
          message: `Warning: ${result.changes} role(s) were removed`,
        });
      }
      return responseSchema.parse({
        ok: true,
        message: 'Roles removed',
      });
    },
  });
