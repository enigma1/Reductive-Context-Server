import { OutgoingHttpHeaders } from 'node:http';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Command } from '@langchain/langgraph';
import { ResumeBundleContract } from '>/contracts';
import { execute } from '>/db';
import { promptGraph, type GenerateCodeUpdate } from '>/ai';
import { apiCallStream } from '>/services';

export const resumeBundle = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallStream({
    req,
    rsp,
    fn: async () => {
      const { requestSchema } = ResumeBundleContract;
      const { bundleId, bundleContent, prompt } = requestSchema.parse(req.body);

      const llmContext = `## Prompt\n\n${prompt}\n\n${bundleContent}`;
      rsp.raw.writeHead(200, {
        ...rsp.getHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      } as OutgoingHttpHeaders);

      const stream = await promptGraph.stream(
        new Command({ resume: llmContext }),
        {
          configurable: { thread_id: String(bundleId) },
          streamMode: 'updates',
        },
      );

      for await (const chunk of stream) {
        if ('generateCode' in chunk) {
          const update = chunk.generateCode as GenerateCodeUpdate;
          rsp.raw.write(
            `data: ${JSON.stringify({ node: 'generateCode', frontRequest: update.frontRequest })}\n\n`,
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
          continue;
        }
      }

      rsp.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      rsp.raw.end();
    },
  });
