import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetPathsContract, GetPathsResponse } from '>/contracts';
import { safeResolve, scanDir, convertFolderTreeToText } from '>/services';

export const getPaths = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetPathsResponse> => {
      const { requestSchema, responseSchema } = GetPathsContract;
      const { paths } = requestSchema.parse(req.body);

      const textTrees: Record<string, string> = {};
      const filePaths: Record<string, string[]> = {};
      const unresolved: string[] = [];

      for (const { path: userPath, depth } of paths) {
        const resolved = safeResolve(userPath);
        if (!resolved) {
          unresolved.push(userPath);
          continue;
        }
        const {
          scanResult,
          unresolved: subUnresolved,
          folders,
        } = await scanDir(resolved, depth);
        Object.assign(filePaths, scanResult);
        textTrees[userPath] = convertFolderTreeToText(folders, userPath);
        unresolved.push(...subUnresolved);
      }

      return responseSchema.parse({
        ok: true,
        message: 'Paths resolved',
        paths: filePaths,
        unresolved,
        textTrees,
      });
    },
  });
