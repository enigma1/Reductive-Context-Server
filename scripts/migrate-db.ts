/* File: scripts/migrate-db.ts
  SQL script to migrate a table for sqlite3 database
*/
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/db';

const table = process.argv[2];
const filename = process.argv[3];

if (!table || !filename) {
  console.error('Usage: npm run db:migrate -- <table_name> <script.sql>');
  process.exit(1);
}

const migrate = () => {
  const db = getDb();
  const sql = readFileSync(path.resolve(process.cwd(), filename), 'utf-8');

  // Replace the table name in the CREATE statement with a temp name
  const createSql = sql.replace(
    new RegExp(`CREATE TABLE\\s+(IF NOT EXISTS\\s+)?${table}\\b`, 'i'),
    `CREATE TABLE ${table}_new`,
  );

  db.transaction(() => {
    db.exec(createSql);

    // Get shared columns in the NEW table's order
    const newCols = db.prepare(`PRAGMA table_info(${table}_new)`).all() as {
      name: string;
    }[];
    const oldCols = db.prepare(`PRAGMA table_info(${table})`).all() as {
      name: string;
    }[];

    const shared = newCols
      .filter((c) => oldCols.some((o) => o.name === c.name))
      .map((c) => c.name);

    const colList = shared.join(', ');
    db.exec(
      `INSERT INTO ${table}_new (${colList}) SELECT ${colList} FROM ${table}`,
    );

    db.exec(`DROP TABLE ${table}`);
    db.exec(`ALTER TABLE ${table}_new RENAME TO ${table}`);
  })();

  console.log(`Migrated: ${table} ---> ${db.name}`);
  db.close();
};

migrate();
