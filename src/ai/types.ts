import { AIMessage } from '@langchain/core/messages';
import type {
  FrontRequest,
  QueryScope,
  TimingRange,
  TokenUsage,
} from '>/contracts';

export type ClassifyScopeUpdate = {
  queryScope: QueryScope;
  tokenUsage: TokenUsage;
  scopeTiming: TimingRange;
};

export type GenerateContentUpdate = {
  frontRequest: FrontRequest;
  userClarification?: string;
  tokenUsage: TokenUsage;
  messages?: AIMessage[];
  contentTiming: TimingRange;
};

export type AskUserUpdate = {
  userClarification: string;
};
