import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { dbSession } from '>/db';
import { ActivateRoleContract, type BasicResponse } from '>/contracts';

export const activateRole = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<BasicResponse> => {
      const { requestSchema, responseSchema } = ActivateRoleContract;
      const { roleName } = requestSchema.parse(req.body);
      // Set or clear the role
      dbSession.setRole(roleName);

      return responseSchema.parse({
        ok: true,
        message: roleName
          ? `Role ${roleName} activated`
          : 'Active Role removed',
      });
    },
  });
