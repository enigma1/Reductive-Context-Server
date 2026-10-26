/* File: src/routes/api/getBundle.ts
  Given a valid bundleId
  The route returns the complete bundle details from all associated bundle tables in database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { queryRecords, queryOne } from '>/db';
import { apiCallAuth, appErrors, getTree } from '>/services';
import { GetBundleResponse, GetBundleContract } from '>/contracts';
import {
  BundlesRow,
  BundleConversationRow,
  BundlePathsRow,
  BundleFilesRow,
} from '>/types';

export const getBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetBundleResponse> => {
      const { requestSchema, responseSchema } = GetBundleContract;
      const { bundleId } = requestSchema.parse(req.body);
      const sqlBundle = `SELECT * FROM bundles WHERE bundle_id = ?`;
      const bundleMain = queryOne<BundlesRow>(sqlBundle, bundleId);
      if (!bundleMain) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'Bundle not found',
        });
      }

      const sqlBundleConversation = `SELECT * FROM bundle_conversations WHERE bundle_id = ?`;
      const bundleConversations =
        queryRecords<BundleConversationRow>(sqlBundleConversation, bundleId) ??
        [];

      const { bundle_id, bundle_content, prompt, input_tokens, output_tokens } =
        bundleMain;

      const sqlBundlePaths = `SELECT * FROM bundle_paths WHERE bundle_id = ?`;
      const bundlePaths =
        queryRecords<BundlePathsRow>(sqlBundlePaths, bundleId) ?? [];

      const entries = await Promise.all(
        bundlePaths
          .filter((row) => row.root_path)
          .map(
            async (row) =>
              [row.root_path, await getTree(row.root_path, row.depth)] as const,
          ),
      );
      const textTrees: Record<string, string> = Object.fromEntries(entries);

      const sqlBundleFiles = `SELECT * FROM bundle_files WHERE bundle_id = ?`;
      const bundleFiles =
        queryRecords<BundleFilesRow>(sqlBundleFiles, bundleId) ?? [];

      // Transform response to camelCase
      const conversations = bundleConversations.map((c) => ({
        prompt: c.prompt,
        summary: c.summary,
        reasoning: c.reasoning,
        filesJson: c.files_json,
        createdAt: c.created_at,
        inputTokens: c.input_tokens,
        outputTokens: c.output_tokens,
      }));

      const rootPaths = bundlePaths.map((p) => ({
        depth: p.depth ?? undefined,
        path: p.root_path,
      }));

      const userFiles = bundleFiles.map((uf) => ({
        filePath: uf.file_path,
        contentMode: uf.content_mode,
        startLine: uf.start_line ?? undefined,
        endLine: uf.end_line ?? undefined,
      }));

      return responseSchema.parse({
        ok: true,
        message: 'Bundle retrieved successfully',
        bundleId: bundle_id,
        bundleContent: bundle_content,
        prompt,
        conversations,
        rootPaths,
        textTrees,
        userFiles,
        inputTokens: input_tokens,
        outputTokens: output_tokens,
      });
    },
  });
