/* File src/db/sql.ts
  sqlite3 database instantiation, wrappers and helper functions
*/
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { envConfig } from '>/config';
import { appErrors } from '>/services';
import { SqlColumn } from '>/types';

export const sanitizeDbName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64);
  return cleaned.endsWith('.db') ? cleaned : `${cleaned}.db`;
};

const checkpointPath = path.resolve(
  process.cwd(),
  envConfig.sqlCheckpoints || './sql/data/checkpoints.db',
);
fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
export const checkpointer = SqliteSaver.fromConnString(checkpointPath);

type SqlInstance = InstanceType<typeof Database>;
let sqlName: string = envConfig.sqlName || './sql/data/reductive.db';

const dbDir = path.resolve(process.cwd(), envConfig.sqlPath || './data');
fs.mkdirSync(dbDir, { recursive: true });

const connections = new Map<string, SqlInstance>();

const getDb = () => {
  const existing = connections.get(sqlName);
  if (existing) return existing;

  const dbPath = path.resolve(dbDir, sqlName);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  connections.set(sqlName, db);
  return db;
};

const setDb = (dbName: string): SqlInstance | null => {
  const safe = sanitizeDbName(dbName);
  if (!safe || safe === '.db') {
    throw appErrors.sql({
      code: 'invalid_db_name',
      message: 'Invalid database name',
    });
  }
  sqlName = safe;
  return getDb();
};

const query = <T>(sql: string, ...params: unknown[]): T[] =>
  getDb()
    .prepare(sql)
    .all(...params) as T[];

const queryRows = <T>(sql: string, ...params: unknown[]): T[][] =>
  getDb()
    .prepare(sql)
    .raw()
    .all(...params) as T[][];

const queryOne = <T>(sql: string, ...params: unknown[]): T | undefined =>
  getDb()
    .prepare(sql)
    .get(...params) as T;

const execute = (sql: string, ...params: unknown[]) =>
  getDb()
    .prepare(sql)
    .run(...params);

const getTables = () =>
  getDb()
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    .all();

const getColumns = (table: string) =>
  query<SqlColumn>(`SELECT * FROM pragma_table_info(?)`, table);

const closeDb = (): boolean => {
  if (connections.size === 0) return false;
  for (const db of connections.values()) db.close();
  connections.clear();
  return true;
};

export {
  getDb,
  setDb,
  getTables,
  getColumns,
  query,
  queryRows,
  queryOne,
  execute,
  closeDb,
};

// Typical Consumer of the db api
// import { query, queryOne, execute } from '>/services/db';
// // SELECT all
// const bundles = query<BundleRow>(`SELECT * FROM bundles WHERE output_tokens > ?`, 1000);
// // SELECT one
// const bundle = queryOne<BundleRow>(`SELECT * FROM bundles WHERE bundle_id = ?`, id);
// // INSERT/UPDATE/DELETE
// execute(`UPDATE bundles SET last_modified = datetime('now') WHERE bundle_id = ?`, id);
