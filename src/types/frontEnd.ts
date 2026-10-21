import type { PromptData, PromptHistory } from './prompt';
import type { OpenRouterModels } from './models';
import type { UserPrefs, BasicRowsShape, BasicResponse } from '>/contracts';

export type ApiResponse<T> = {
  data: T;
  effects?: {
    sessionId?: string;
    headers?: Record<string, string>;
    status?: number;
  };
};

export type PrimeObject<T = any> = T extends any[] | Function
  ? never
  : T extends object
    ? Record<string, T>
    : never;

export type BasicDataResponse = BasicResponse & BasicRowsShape;

export type AiStatus = {
  active: boolean;
  model: string;
};
export type CheckSessionResponse = BasicResponse;
export type CleanupResponse = BasicResponse;

export type AbortPromptRequest = {};
export type AbortPromptResponse = BasicResponse;

export type SessionRestoreResponse = {
  username: string;
  preferences: Record<string, any>;
};

export type UserShape = {
  user: string;
  host: string;
  password: string;
};

export type SavePreferencesRequest = {
  version: number;
  userPrefs: UserPrefs;
};

export type SavePreferencesResponse = BasicResponse;

export type LoadPreferencesRequest = {
  user: string;
};

export type LoadPreferencesResponse = BasicResponse & {
  userPrefs?: UserPrefs;
};

export type MakePromptRequest = {
  prompt: string;
  conversationId?: string;
};

export type MissingPromptParam = {
  name: string;
  question: string;
};

export type GetPromptsRequest = {
  conversationId: string;
};
export type GetPromptsResponse = BasicResponse & PromptData & PromptHistory;

export type ClearConversationRequest = {
  conversationId: string;
};
export type ClearConversationResponse = BasicResponse;

export type GetOpenRouterModelsResponse = BasicResponse & {
  models: OpenRouterModels;
};
