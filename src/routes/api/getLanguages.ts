import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetLanguagesResponse, GetLanguagesContract } from '>/contracts';
import { extToLanguage } from '>/config';

export const getLanguages = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetLanguagesResponse> => {
      const { responseSchema } = GetLanguagesContract;
      return responseSchema.parse({
        ok: true,
        message: 'Languages Supported Sent',
        languages: extToLanguage,
      });
    },
  });
