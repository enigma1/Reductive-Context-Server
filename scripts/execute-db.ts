/* File: scripts/execute-db.ts
  Execute an SQL script for the sqllite3 databases
*/
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/db';

const filename = process.argv[2];

if (!filename) {
  console.error('Usage: npm run db:execute -- <scripts/reductive-context.sql>');
  process.exit(1);
}

const init = () => {
  const db = getDb();
  const sql = readFileSync(path.resolve(process.cwd(), filename), 'utf-8');
  db.exec(sql);
  console.log('DB Execute:', filename, '--->', db.name);
  db.close();
};

init();
