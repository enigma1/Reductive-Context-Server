/* File: src/routes/api/createBundle.ts
  Creates a bundle populating all associated bundle tables in the databse
*/
import fs from 'node:fs/promises';
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  apiCallAuth,
  safeResolve,
  appErrors,
  estimateTokens,
} from '>/services';
import { CreateBundleResponse, CreateBundleContract } from '>/contracts';
import { getLanguageFromFilename } from '>/config';
import { getDb, execute } from '>/db';
import { extractSignatures } from '>/signatures';
import type { BundleFilesInsertCols, BundlePathsInsertCols } from '>/types';

export const createBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<CreateBundleResponse> => {
      const { requestSchema, responseSchema } = CreateBundleContract;
      const { rootPaths, paths, prompt } = requestSchema.parse(req.body);
      const sections: string[] = [];
      const fileRecords: BundleFilesInsertCols = [];
      const pathRecords: BundlePathsInsertCols = [];

      if (rootPaths.length === 0) {
        pathRecords.push({
          path: '',
        });
      } else {
        for (const node of rootPaths) {
          pathRecords.push({
            path: node.path,
            depth: node.depth,
          });
        }
      }

      for (const node of paths) {
        const resolved = safeResolve(`${node.path}/${node.name}`);
        if (!resolved) {
          throw appErrors.domain({
            code: 'invalid_filename_or_path',
            message: `Invalid path: ${node.path}/${node.name}`,
          });
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
      const bundleContent = sections.join('\n');
      const inputTokens = estimateTokens(bundleContent);

      const db = getDb();
      const insertBundle = db.transaction(() => {
        const sqlBundle = `INSERT INTO bundles (prompt, bundle_content, input_tokens) VALUES (?, ?, ?)`;
        const insertBundle = execute(
          sqlBundle,
          prompt,
          bundleContent,
          inputTokens,
        );

        const bundleId = Number(insertBundle.lastInsertRowid);
        const sqlFilesBundle = `INSERT INTO bundle_files (bundle_id, file_path, start_line, end_line) VALUES (?, ?, ?, ?)`;
        for (const f of fileRecords) {
          execute(
            sqlFilesBundle,
            bundleId,
            f.filePath,
            f.startLine ?? null,
            f.endLine ?? null,
          );
        }
        const sqlPathsBundle = `INSERT INTO bundle_paths (bundle_id, root_path, depth) VALUES (?, ?, ?)`;
        for (const f of pathRecords) {
          execute(sqlPathsBundle, bundleId, f.path, f.depth ?? null);
        }
        return bundleId;
      });
      const bundleId = insertBundle();

      return responseSchema.parse({
        ok: true,
        message: 'Bundle created successfully',
        bundleId,
        inputTokens: inputTokens,
      });
    },
  });
