import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth, appErrors } from '>/services';
import { OpenRouterModels, GetOpenRouterModelsResponse } from '>/types';

let cached: OpenRouterModels | null = null;
let ts = 0;
const TTL = 10 * 60 * 1000;

const getModels = async (): Promise<OpenRouterModels> => {
  if (cached && Date.now() - ts < TTL) return cached;

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`OpenRouter: ${res.status}`);

  const data = (await res.json()) as { data?: OpenRouterModels };
  cached = data.data ?? [];
  ts = Date.now();
  return cached;
};

export const getOpenRouterModels = async (
  req: FastifyRequest,
  rsp: FastifyReply,
) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetOpenRouterModelsResponse> => {
      const data = await getModels();

      const models = (data ?? []).filter(
        (model) =>
          // model.architecture?.modality === 'text->text' &&
          model.supported_parameters?.includes('response_format') &&
          !model.id.startsWith('~'),
      );

      return {
        ok: true,
        message: 'OpenRouter models retrieved',
        models,
      };
    },
  });
