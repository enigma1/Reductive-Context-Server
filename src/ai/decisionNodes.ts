import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AIMessage } from '@langchain/core/messages';
import {
  type FrontRequest,
  FrontRequestSchema,
  QueryScopeSchema,
  QueryScope,
} from '>/contracts';
import { aiModel, envConfig } from '>/config';
import { promptState } from './state';
import type { GenerateCodeUpdate, ClassifyScopeUpdate } from './types';

const promptDir = `${envConfig.aiRoles}/${envConfig.aiProfile}`;

const scopeRules = readFileSync(
  resolve(promptDir, 'scopeRules.md'),
  'utf8',
).trim();
const scopeExamples = readFileSync(
  resolve(promptDir, 'scopeExamples.md'),
  'utf8',
).trim();
const scopePrompt = readFileSync(resolve(promptDir, 'scopePrompt.md'), 'utf8')
  .replace('{RULES}', scopeRules)
  .replace('{EXAMPLES}', scopeExamples)
  .trim();

const codeRules = readFileSync(
  resolve(promptDir, 'contentRules.md'),
  'utf8',
).trim();
const codeExamples = readFileSync(
  resolve(promptDir, 'contentExamples.md'),
  'utf8',
).trim();

const codePrompt = readFileSync(resolve(promptDir, 'role.md'), 'utf8')
  .replace('{RULES}', codeRules)
  .replace('{EXAMPLES}', codeExamples)
  .trim();

const scopeClassifier = aiModel.withStructuredOutput(QueryScopeSchema, {
  includeRaw: true,
});
const codeGenerator = aiModel.withStructuredOutput(FrontRequestSchema, {
  includeRaw: true,
});

export const classifyScopeNode = async (
  state: typeof promptState.State,
): Promise<ClassifyScopeUpdate> => {
  const currentMessage = state.messages.at(-1);
  const currentRequest = String(currentMessage?.content ?? '');

  const startedAt = Temporal.Now.instant();

  const result = await scopeClassifier.invoke([
    { role: 'system', content: scopePrompt },
    { role: 'user', content: currentRequest },
  ]);

  const parsed = String(result.parsed) as QueryScope;
  const raw = result.raw as AIMessage;

  const completedAt = Temporal.Now.instant();
  return {
    queryScope: parsed,
    tokenUsage: {
      input: raw.usage_metadata?.input_tokens ?? 0,
      output: raw.usage_metadata?.output_tokens ?? 0,
    },
    scopeTiming: {
      startedAt: startedAt.toString(),
      completedAt: completedAt.toString(),
    },
  };
};

type CodeGeneratorInvoke = {
  parsed: FrontRequest;
  raw: AIMessage;
};

export const generateCodeNode = async (
  state: typeof promptState.State,
): Promise<GenerateCodeUpdate> => {
  const currentMessage = state.messages.at(-1);
  const currentRequest = String(currentMessage?.content ?? '');

  let userPrompt = `CURRENT USER REQUEST: ${currentRequest}`;

  if (state.queryScope === 'thread') {
    const previousMessages = state.messages.slice(0, -1);

    userPrompt = [
      'CONVERSATION HISTORY:',
      ...previousMessages.map((message) => {
        const role = message.type;
        const content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);

        return `${role.toUpperCase()}:\n${content}`;
      }),
      '',
      'CURRENT USER REQUEST:',
      currentRequest,
    ].join('\n\n');
  } else {
    userPrompt = currentRequest;
  }

  const startedAt = Temporal.Now.instant();
  const { raw, parsed } = (await codeGenerator.invoke([
    {
      role: 'system',
      content: codePrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ])) as CodeGeneratorInvoke;

  const completedAt = Temporal.Now.instant();
  const answer = parsed.completed
    ? 'Here is my response for this bundle:'
    : 'Incomplete';

  return {
    frontRequest: parsed,
    tokenUsage: {
      input: raw.usage_metadata?.input_tokens ?? 0,
      output: raw.usage_metadata?.output_tokens ?? 0,
    },
    messages: [
      new AIMessage({
        content: answer,
        additional_kwargs: {
          frontRequest: parsed,
        },
      }),
    ],
    codeTiming: {
      startedAt: startedAt.toString(),
      completedAt: completedAt.toString(),
    },
  };
};
