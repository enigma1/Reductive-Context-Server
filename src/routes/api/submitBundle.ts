import { createHash } from 'node:crypto';
import { OutgoingHttpHeaders } from 'node:http';
import { FastifyRequest, FastifyReply } from 'fastify';
import { HumanMessage } from '@langchain/core/messages';
import { execute } from '>/db';
import {
  promptGraph,
  type ClassifyScopeUpdate,
  type GenerateCodeUpdate,
} from '>/ai';
import { apiCallStream, appErrors, countTokens } from '>/services';
import { SubmitBundleContract } from '>/contracts';

export const submitBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallStream({
    req,
    rsp,
    fn: async (sessionData) => {
      const { requestSchema } = SubmitBundleContract;
      const { bundleId, bundleContent, prompt } = requestSchema.parse(req.body);

      // Compose the full context sent to the LLM
      const llmContext = `## Prompt\n\n${prompt}\n\n${bundleContent}`;

      const inputTokens = countTokens({
        text: llmContext,
        model: sessionData.aiStatus.model,
      });
      const bundleSql = `
        UPDATE bundles
        SET bundle_content = ?, prompt = ?, input_tokens = ?, last_modified = datetime('now')
        WHERE bundle_id = ?
      `;
      const result = execute(
        bundleSql,
        bundleContent,
        prompt,
        inputTokens,
        bundleId,
      );

      if (!result || result.changes === 0) {
        throw appErrors.sql({
          code: 'not_found',
          message: 'Bundle not found',
        });
      }

      // 2. Stream LLM response
      rsp.raw.writeHead(200, {
        ...rsp.getHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      } as OutgoingHttpHeaders);

      try {
        const stream = await promptGraph.stream(
          {
            messages: [new HumanMessage(llmContext)],
            queryScope: 'thread',
            frontRequest: {
              completed: false,
              summary: '',
              reasoning: '',
              files: [],
            },
          },
          {
            configurable: { thread_id: String(bundleId) }, // reuse bundleId as the thread
            streamMode: 'updates',
          },
        );

        for await (const chunk of stream) {
          // const [node, update] = Object.entries(chunk)[0] as [string, any];

          if ('classifyScope' in chunk) {
            const update = chunk.classifyScope as ClassifyScopeUpdate;
            rsp.raw.write(
              `data: ${JSON.stringify({ node: 'classifyScope', scope: update.queryScope })}\n\n`,
            );
          }

          if ('generateCode' in chunk) {
            const hash = createHash('sha256')
              .update(llmContext)
              .digest('hex')
              .slice(0, 16);
            const update = chunk.generateCode as GenerateCodeUpdate;
            rsp.raw.write(
              `data: ${JSON.stringify({ node: 'generateCode', frontRequest: update.frontRequest })}\n\n`,
            );

            const responseSql = `
              INSERT INTO bundle_conversations
              (bundle_id, summary, reasoning, clarification, files_json, input_tokens, output_tokens, prompt, content_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            execute(
              responseSql,
              bundleId,
              update.frontRequest.summary,
              update.frontRequest.reasoning,
              update.frontRequest.clarification ?? null,
              JSON.stringify(update.frontRequest.files),
              update.tokenUsage.input,
              update.tokenUsage.output,
              prompt,
              hash,
            );

            const updateTokensSql = `
              UPDATE bundles SET input_tokens = input_tokens + ?, output_tokens = output_tokens + ?
              WHERE bundle_id = ?
            `;

            execute(
              updateTokensSql,
              update.tokenUsage.input,
              update.tokenUsage.output,
              bundleId,
            );
          }
        }
        rsp.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (err) {
        rsp.raw.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      }

      rsp.raw.end();
    },
  });
