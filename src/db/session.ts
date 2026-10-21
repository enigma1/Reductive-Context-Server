import { v4 as uuidv4 } from 'uuid';
import { envConfig } from '>/config';
import { conversations, startAiMonitor } from '>/ai';
import { getCurrentTimestamp } from '>/utils';
import { SessionData } from '>/types';

export const endSessions: SessionData[] = [];
export const sessionStore = new Map<string, SessionData>();

const startRetirementJanitor = () => {
  setInterval(async () => {
    const now = getCurrentTimestamp();

    let i = 0;

    while (i < endSessions.length) {
      const s = endSessions[i];

      if (now - s.dateMarked < envConfig.retiredSessionRemoval) {
        break;
      }

      await dbSession.release(s);
      i++;
    }
    if (i) {
      endSessions.length -= i;
    }
  }, envConfig.pollRetiredSessionInterval);
};

const startIdleJanitor = () => {
  setInterval(async () => {
    const now = getCurrentTimestamp();
    for (const [sessionId, session] of sessionStore.entries()) {
      const idle = now - session.lastSqlActivity;

      if (idle > envConfig.sqlIdleTimeout) {
        await remove(sessionId, true);
      }
    }
  }, envConfig.pollIdleInterval);
};

export const startPeriodicProcesses = () => {
  startRetirementJanitor();
  startIdleJanitor();
  startAiMonitor();
};

const create = (): SessionData => {
  const sessionId = uuidv4(); // generate unique session ID
  const sessionData: SessionData = {
    sessionId,
    conversationId: conversations.resolveConversationId(),
    // schemas,
    preferences: {},
    lastSqlActivity: getCurrentTimestamp(),
    dateMarked: getCurrentTimestamp(),
    aiStatus: {
      model: '',
      active: false,
    },
  };

  return sessionData;
};

const set = (sessionId: string, session: SessionData) => {
  sessionStore.set(sessionId, session);
};

const get = (sessionId: string | undefined | null) => {
  // if (!sessionId) throw appErrors.authMissing();
  // const data = sessionStore.get(sessionId);
  // if (!data) throw appErrors.authInvalid();
  // return data;
  if (!sessionId) return;
  const data = sessionStore.get(sessionId);
  return data;
};

const remove = async (
  sessionId: string,
  clearSession?: boolean,
): Promise<boolean> => {
  const data = sessionStore.get(sessionId);

  return false;
};

type SessionActivateProps = {
  sessionData: SessionData;
  database?: string;
  refresh?: boolean;
};
const activate = async ({
  sessionData,
  database,
  refresh,
}: SessionActivateProps) => {
  return true;
};

const resetDb = async (sessionData: SessionData) => {};

const refresh = async (sessionData: SessionData) => {
  endSessions.push({
    ...sessionData,
    dateMarked: Date.now(),
  });
  activate({ sessionData, refresh: true });
};

const release = async (sessionData: SessionData) => {};

export const dbSession = {
  create,
  set,
  get,
  remove,
  release,
  refresh,
  activate,
  resetDb,
};
