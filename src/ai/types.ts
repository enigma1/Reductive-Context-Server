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

export type GenerateCodeUpdate = {
  frontRequest: FrontRequest;
  tokenUsage: TokenUsage;
  messages: AIMessage[];
  codeTiming: TimingRange;
};
