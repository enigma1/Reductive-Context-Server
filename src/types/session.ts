import type { JsonObject } from './entities';
import type { AiStatus } from './frontEnd';

export type SessionData = {
  sessionId: string; // the generated UUID
  lastSqlActivity: number;
  dateMarked: number;
  conversationId: string; // ai conversation Id
  preferences: JsonObject;
  aiStatus: AiStatus;
  username?: string;
};
