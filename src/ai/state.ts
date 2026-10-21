import { StateSchema, MessagesValue } from '@langchain/langgraph';
import * as z from 'zod';
import { aiConfig, envConfig } from '>/config';
import {
  FrontRequestSchema,
  QueryScopeSchema,
  FrontRequest,
  TimingRangeSchema,
  TokenUsageSchema,
} from '>/contracts';

export type PromptResult = {
  status: 'needs_information' | 'condition_failed' | 'execute';
  answer: string;
  frontRequest?: FrontRequest;
};

export const promptState = new StateSchema({
  messages: MessagesValue,
  frontRequest: FrontRequestSchema,
  queryScope: QueryScopeSchema,
  tokenUsage: TokenUsageSchema,
  scopeTiming: TimingRangeSchema,
  codeTiming: TimingRangeSchema,
});

let aiStatus = {
  active: false,
  model: aiConfig.model,
};
export const getAiStatus = () => aiStatus;

export const startAiMonitor = () => {
  const check = async () => {
    try {
      aiStatus.model = aiConfig.model;
      await fetch(aiConfig.healthUrl);
      aiStatus.active = true;
    } catch (e) {
      aiStatus.active = false;
    }
  };
  check();
  setInterval(check, envConfig.aiCheckConnectionInterval);
};
