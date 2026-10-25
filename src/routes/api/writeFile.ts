import fs from 'node:fs/promises';
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth, safeResolve, appErrors } from '>/services';
import {
  type WriteFileResponse,
  WriteFileRequestSchema,
  WriteFileResponseSchema,
} from '>/contracts';

export const writeFile = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<WriteFileResponse> => {
      const { path, name, content } = WriteFileRequestSchema.parse(req.body);
      const userPath = `${path}/${name}`;
      const resolved = safeResolve(userPath);
      if (!resolved) {
        throw appErrors.domain({
          code: 'invalid_filename_or_path',
          message: 'Invalid Filename or Directory requested',
        });
      }

      await fs.writeFile(resolved, content, 'utf-8');

      return WriteFileResponseSchema.parse({
        ok: true,
        message: 'File updated successfully',
      });
    },
  });
