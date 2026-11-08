/* File: scripts/select-db.ts
  Show table structure and rows for a given table name
*/
import path from 'node:path';
import { getDb } from '../src/db';

const table = process.argv[2];

if (!table) {
  console.error('Usage: npm run db:select -- <table_name>');
  process.exit(1);
}

const select = () => {
  const db = getDb();

  // Show structure
  const schema = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { sql: string } | undefined;

  if (!schema) {
    console.error(`Table not found: ${table}`);
    db.close();
    process.exit(1);
  }

  console.log(schema.sql + ';');
  // Show rows
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<
    string,
    unknown
  >[];

  if (rows.length === 0) {
    console.log('(no rows)');
  } else {
    console.log(`\nFound ${rows.length} row(s)`);
    let idx = 1;
    for (const row of rows) {
      console.log(`\n---> Row-${idx} <---\n`);
      for (const [key, val] of Object.entries(row)) {
        const display =
          typeof val === 'string' && val.length > 58
            ? val.slice(0, 55) + '...'
            : String(val);
        console.log(`  ${key.padEnd(20)} ${display}`);
      }
      idx++;
    }
  }

  db.close();
};

select();
