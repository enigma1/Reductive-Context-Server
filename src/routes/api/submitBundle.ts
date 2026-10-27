import { createHash } from 'node:crypto';
import { OutgoingHttpHeaders } from 'node:http';
import { FastifyRequest, FastifyReply } from 'fastify';
import { HumanMessage } from '@langchain/core/messages';
import { execute } from '>/db';
import {
  promptGraph,
  type ClassifyScopeUpdate,
  type GenerateContentUpdate,
} from '>/ai';
import { apiCallStream, appErrors, countTokens } from '>/services';
import { SubmitBundleContract } from '>/contracts';

export const submitBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallStream({
    req,
    rsp,
    fn: async (sessionData) => {
      const { requestSchema } = SubmitBundleContract;
      const { bundleId, bundleContent, prompt, textTrees } =
        requestSchema.parse(req.body);

      const contextSection =
        textTrees && Object.keys(textTrees).length > 0
          ? `\n\n## Operating Context\n\n${Object.entries(textTrees)
              .map(([root, tree]) => `### ${root}\n\n\`\`\`\n${tree}\n\`\`\``)
              .join('\n\n')}`
          : '';

      // Compose the full context sent to the LLM
      const llmContext = `## Prompt\n\n${prompt}\n\n${bundleContent}${contextSection}`;

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

          if ('generateContent' in chunk) {
            const update = chunk.generateContent as GenerateContentUpdate;

            if (update.frontRequest.clarification) {
              // Clarification path — no files, no DB insert for a "response"
              rsp.raw.write(
                `data: ${JSON.stringify({ node: 'generateContent', clarification: update.frontRequest.clarification })}\n\n`,
              );
              // Still track tokens
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
              continue; // skip the normal response insert + done event
            }

            const hash = createHash('sha256')
              .update(llmContext)
              .digest('hex')
              .slice(0, 16);

            rsp.raw.write(
              `data: ${JSON.stringify({ node: 'generateContent', frontRequest: update.frontRequest })}\n\n`,
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

        // Stream ended, check if paused at an interrupt
        const state = await promptGraph.getState({
          configurable: { thread_id: String(bundleId) },
        });

        if (state.next.length > 0) {
          // Graph is paused (at askUser) — tell the frontend
          rsp.raw.write(
            `data: ${JSON.stringify({ awaitingClarification: true })}\n\n`,
          );
        } else {
          rsp.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      } catch (err) {
        rsp.raw.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      }
      rsp.raw.end();
    },
  });
