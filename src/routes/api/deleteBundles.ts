/* File: src/routes/api/deleteBundles.ts
  Removes bundle table entries given an array of bundleIds
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { DeleteBundlesContract, type DeleteBundlesResponse } from '>/contracts';
import { execute } from '>/db';

export const deleteBundles = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<DeleteBundlesResponse> => {
      const { requestSchema, responseSchema } = DeleteBundlesContract;
      const { bundleIds } = requestSchema.parse(req.body);
      const placeholders = bundleIds.map(() => '?').join(', ');
      const sql = `DELETE FROM bundles WHERE bundle_id IN (${placeholders})`;
      const result = execute(sql, ...bundleIds);

      if (result.changes !== bundleIds.length) {
        return responseSchema.parse({
          ok: false,
          message: `Warning: ${result.changes} bundle(s) were removed`,
        });
      }
      return responseSchema.parse({
        ok: true,
        message: 'Bundles removed',
      });
    },
  });
