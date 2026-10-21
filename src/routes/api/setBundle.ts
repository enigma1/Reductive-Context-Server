/* File: src/routes/api/setBundle.ts
  Updates the database tables of an existing bundle
*/
import fs from 'node:fs/promises';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  apiCallAuth,
  safeResolve,
  appErrors,
  estimateTokens,
} from '>/services';
import { SetBundleContract, SetBundleResponse } from '>/contracts';
import { getLanguageFromFilename } from '>/config';
import { extractSignatures } from '>/signatures';
import { getDb, execute, queryOne } from '>/db';
import type {
  BundlesRow,
  BundleFilesInsertCols,
  BundlePathsInsertCols,
} from '>/types';

export const setBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<SetBundleResponse> => {
      const { requestSchema, responseSchema } = SetBundleContract;
      const { paths, rootPaths, prompt, bundleId } = requestSchema.parse(
        req.body,
      );

      const sqlBundle = `SELECT * FROM bundles WHERE bundle_id = ?`;
      const bundleMain = queryOne<BundlesRow>(sqlBundle, bundleId);
      if (!bundleMain) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'Bundle not found',
        });
      }

      // Rebuild bundle content only if paths were provided
      let bundleContent = bundleMain.bundle_content;
      let inputTokens = bundleMain.input_tokens;
      const fileRecords: BundleFilesInsertCols = [];

      if (paths) {
        const sections: string[] = [];

        for (const node of paths) {
          const resolved = safeResolve(`${node.path}/${node.name}`);
          if (!resolved) {
            throw appErrors.domain(
              'invalid_filename_or_path',
              `Invalid path: ${node.path}/${node.name}`,
            );
          }

          const content = await fs.readFile(resolved, 'utf-8');
          const lines = content.split('\n');

          let extracted: string;
          let startLine: number | undefined;
          let endLine: number | undefined;

          if (node.ranges?.length) {
            const parts = node.ranges.map((r) => {
              startLine = Math.min(startLine ?? Infinity, r.startLine);
              endLine = Math.max(endLine ?? 0, r.endLine);
              return lines.slice(r.startLine - 1, r.endLine).join('\n');
            });
            extracted = parts.join('\n\n');
          } else {
            extracted = content;
          }

          if (node.mode === 'signature') {
            extracted = extractSignatures(resolved, extracted);
          }

          const fext = getLanguageFromFilename({
            view: 'markdown',
            filePath: node.name,
          });

          sections.push(
            `#### \`${node.path}/${node.name}\`` +
              (node.ranges?.length ? ` (lines ${startLine}–${endLine})` : '') +
              `\n\n\`\`\`${fext}\n${extracted}\n\`\`\`\n`,
          );

          fileRecords.push({
            filePath: `${node.path}/${node.name}`,
            startLine,
            endLine,
          });
        }

        bundleContent = sections.join('\n');
        inputTokens = estimateTokens(bundleContent);
      }

      const db = getDb();
      db.transaction(() => {
        // Update prompt (always) + content/tokens (only if paths provided)
        execute(
          `UPDATE bundles SET prompt = ?, bundle_content = ?, input_tokens = ? WHERE bundle_id = ?`,
          prompt,
          bundleContent,
          inputTokens,
          bundleId,
        );

        // Replace bundle_files only if paths were provided
        if (paths) {
          execute(`DELETE FROM bundle_files WHERE bundle_id = ?`, bundleId);
          const sqlFiles = `INSERT INTO bundle_files (bundle_id, file_path, start_line, end_line) VALUES (?, ?, ?, ?)`;
          for (const f of fileRecords) {
            execute(
              sqlFiles,
              bundleId,
              f.filePath,
              f.startLine ?? null,
              f.endLine ?? null,
            );
          }
        }

        // Replace bundle_paths only if rootPaths were provided
        if (rootPaths) {
          execute(`DELETE FROM bundle_paths WHERE bundle_id = ?`, bundleId);
          const sqlPaths = `INSERT INTO bundle_paths (bundle_id, root_path, depth) VALUES (?, ?, ?)`;
          const pathRecords: BundlePathsInsertCols =
            rootPaths.length === 0
              ? [{ path: '' }]
              : rootPaths.map((n) => ({ path: n.path, depth: n.depth }));
          for (const p of pathRecords) {
            execute(sqlPaths, bundleId, p.path, p.depth ?? null);
          }
        }
      })();

      return responseSchema.parse({
        ok: true,
        message: 'Bundle updated successfully',
        bundleId,
        inputTokens,
      });
    },
  });
