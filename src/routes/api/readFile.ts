import fs from 'node:fs/promises';
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth, safeResolve, appErrors } from '>/services';
import {
  type ReadFileResponse,
  ReadFileRequestSchema,
  ReadFileResponseSchema,
} from '>/contracts';

export const readFile = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<ReadFileResponse> => {
      const { path, name } = ReadFileRequestSchema.parse(req.body);
      const userPath = `${path}/${name}`;
      const resolved = safeResolve(userPath);
      if (!resolved) {
        throw appErrors.domain(
          'invalid_filename_or_path',
          'Invalid Filename or Directory requested',
        );
      }

      const content = await fs.readFile(resolved, 'utf-8');
      return ReadFileResponseSchema.parse({
        ok: true,
        message: 'File contents retrieved successfully',
        content,
      });
    },
  });
