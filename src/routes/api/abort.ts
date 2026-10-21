import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { dbSession } from '>/db';
import { BasicResponse } from '>/contracts';

export const abortSql = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (sessionData): Promise<BasicResponse> => {
      await dbSession.refresh(sessionData);
      return {
        ok: true,
        message: 'Abort is not implemented',
      };
    },
  });
