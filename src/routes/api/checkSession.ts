import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallUnknown } from '>/services';
import type { ApiResponse, CheckSessionResponse } from '>/types';

export const checkSession = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallUnknown({
    req,
    rsp,
    fn: async (): Promise<ApiResponse<CheckSessionResponse>> => {
      // const sessionData = getSessionFromRequest(req);
      return {
        data: {
          ok: true,
          message: 'Session not implemented',
        },
      };
    },
  });
