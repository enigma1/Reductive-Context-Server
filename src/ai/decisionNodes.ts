/* File: src/ai/decisionNodes.ts
  Composition and Execution of nodes passed between application and LLM
*/
import { AIMessage } from '@langchain/core/messages';
import { interrupt } from '@langchain/langgraph';
import {
  type FrontRequest,
  FrontRequestSchema,
  QueryScopeSchema,
  QueryScope,
} from '>/contracts';
import { queryOne, dbSession } from '>/db';
import { appErrors } from '>/services';
import { aiModel } from '>/config';
import type { RoleRow } from '>/types';
import { promptState } from './state';
import type {
  GenerateContentUpdate,
  ClassifyScopeUpdate,
  AskUserUpdate,
} from './types';

const getRole = (roleName?: string) => {
  const name = roleName ?? dbSession.getRole();
  if (!name) {
    throw appErrors.domain({
      code: 'not_found',
      message: 'Role is undefined',
      details: ['You must first specify a role'],
    });
  }

  const dbRole = queryOne<RoleRow>(
    'SELECT * FROM ai_roles WHERE role_name = ?',
    name,
  );
  if (!dbRole) {
    dbSession.setRole();
    throw appErrors.sql({
      code: 'not_found',
      message: 'Role not found',
      details: ['No such role with the given name found in storage'],
    });
  }

  // Interpolate placeholders if they exist in roleMain
  let resolvedRoleMain = dbRole.role_main ?? '';
  if (resolvedRoleMain.includes('{RULES}')) {
    resolvedRoleMain = resolvedRoleMain.replace(
      '{RULES}',
      dbRole.content_rules ?? '',
    );
  }
  if (resolvedRoleMain.includes('{EXAMPLES}')) {
    resolvedRoleMain = resolvedRoleMain.replace(
      '{EXAMPLES}',
      dbRole.content_examples ?? '',
    );
  }

  let resolvedScopePrompt = dbRole.scope_prompt ?? '';
  if (resolvedScopePrompt.includes('{RULES}')) {
    resolvedScopePrompt = resolvedScopePrompt.replace(
      '{RULES}',
      dbRole.scope_rules ?? '',
    );
  }
  if (resolvedScopePrompt.includes('{EXAMPLES}')) {
    resolvedScopePrompt = resolvedScopePrompt.replace(
      '{EXAMPLES}',
      dbRole.scope_examples ?? '',
    );
  }

  return {
    roleName: dbRole.role_name,
    roleMain: resolvedRoleMain,
    contentRules: dbRole.content_rules,
    contentExamples: dbRole.content_examples,
    scopePrompt: resolvedScopePrompt,
    scopeRules: dbRole.scope_rules,
    scopeExamples: dbRole.scope_examples,
  };
};

const scopeClassifier = aiModel.withStructuredOutput(QueryScopeSchema, {
  includeRaw: true,
});
const contentGenerator = aiModel.withStructuredOutput(FrontRequestSchema, {
  includeRaw: true,
});

export const classifyScopeNode = async (
  state: typeof promptState.State,
): Promise<ClassifyScopeUpdate> => {
  const currentMessage = state.messages.at(-1);
  const currentRequest = String(currentMessage?.content ?? '');

  const role = getRole();
  const scopePrompt = role.scopePrompt;

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

type ContentGeneratorInvoke = {
  parsed: FrontRequest;
  raw: AIMessage;
};

export const generateContentNode = async (
  state: typeof promptState.State,
): Promise<GenerateContentUpdate> => {
  const currentMessage = state.messages.at(-1);
  const currentRequest = String(currentMessage?.content ?? '');

  const role = getRole();
  const roleMain = role.roleMain;

  let userPrompt: string;

  if (state.userClarification) {
    // Resume path: the clarification IS the full updated context
    userPrompt = state.userClarification;
  } else if (state.queryScope === 'thread') {
    const previousMessages = state.messages.slice(0, -1);
    userPrompt = [
      'CONVERSATION HISTORY:',
      ...previousMessages.map((m) => {
        const content =
          typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `${m.type.toUpperCase()}:${content}`;
      }),
      '',
      'CURRENT USER REQUEST:',
      currentRequest,
    ].join('\n\n');
  } else {
    userPrompt = currentRequest;
  }

  const startedAt = Temporal.Now.instant();

  const invocationResult = (await contentGenerator.invoke([
    { role: 'system', content: roleMain },
    { role: 'user', content: userPrompt },
  ])) as ContentGeneratorInvoke;

  const { raw, parsed } = invocationResult;
  const completedAt = Temporal.Now.instant();

  // Clarification path: model set `clarification`, no files
  if (parsed.clarification) {
    return {
      frontRequest: parsed,
      tokenUsage: {
        input: raw.usage_metadata?.input_tokens ?? 0,
        output: raw.usage_metadata?.output_tokens ?? 0,
      },
      contentTiming: {
        startedAt: startedAt.toString(),
        completedAt: completedAt.toString(),
      },
    };
  }

  // Success path: reset userClarification so it doesn't leak into next turn
  const answer = parsed.completed
    ? 'Here is my response for this bundle:'
    : 'Incomplete';

  return {
    frontRequest: parsed,
    userClarification: undefined,
    tokenUsage: {
      input: raw.usage_metadata?.input_tokens ?? 0,
      output: raw.usage_metadata?.output_tokens ?? 0,
    },
    messages: [
      new AIMessage({
        content: answer,
        additional_kwargs: { frontRequest: parsed },
      }),
    ],
    contentTiming: {
      startedAt: startedAt.toString(),
      completedAt: completedAt.toString(),
    },
  };
};

export const askUserNode = async (
  state: typeof promptState.State,
): Promise<AskUserUpdate> => {
  const answer = interrupt({
    type: 'clarification',
    question: state.frontRequest?.clarification ?? '',
  }) as string;

  return { userClarification: answer };
};
