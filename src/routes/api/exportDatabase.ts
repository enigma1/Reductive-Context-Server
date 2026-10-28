import { createGzip } from 'node:zlib';
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallStream } from '>/services';
import { getEnvKey } from '>/config';
import { setDb, getColumns, queryRecords } from '>/db/sql';
import { ExportDatabaseContract } from '>/contracts';

export const exportDatabase = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallStream({
    req,
    rsp,
    fn: async () => {
      const { requestSchema } = ExportDatabaseContract;
      const { dbName } = requestSchema.parse(req.body);

      const origin =
        getEnvKey('REFLECT_ORIGIN') === '1'
          ? req.headers.origin
          : getEnvKey('FRONTEND_ORIGIN');

      const raw = rsp.raw;
      raw.setHeader('Content-Type', 'application/gzip');
      raw.setHeader(
        'Content-Disposition',
        `attachment; filename="${dbName}.sql.gz"`,
      );
      raw.setHeader('Access-Control-Allow-Origin', origin!);
      raw.setHeader('Access-Control-Allow-Credentials', 'true');
      raw.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      const gzip = createGzip();
      gzip.pipe(raw);
      gzip.write(`-- SQL Export for database: ${dbName}\n\n`);

      const db = setDb(dbName)!;
      gzip.write('PRAGMA foreign_keys = OFF;\n');
      gzip.write('BEGIN TRANSACTION;\n\n');

      // schema + data
      const tables = queryRecords<{ name: string; sql: string | null }>(
        `SELECT name, sql FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      );

      for (const { name, sql } of tables) {
        if (sql) gzip.write(`${sql};\n\n`);

        const cols = getColumns(name);
        const colNames = cols.map((c) => `"${c.name}"`).join(', ');

        // iterate keeps memory flat for large tables
        for (const row of db.prepare(`SELECT * FROM "${name}"`).iterate()) {
          const values = cols
            .map((c) => {
              const v = (row as Record<string, unknown>)[c.name];
              if (v === null) return 'NULL';
              if (typeof v === 'number') return String(v);
              if (v instanceof Uint8Array)
                return `X'${Buffer.from(v).toString('hex')}'`;
              return `'${String(v).replace(/'/g, "''")}'`;
            })
            .join(', ');

          gzip.write(
            `INSERT INTO "${name}" (${colNames}) VALUES (${values});\n`,
          );
        }
        gzip.write('\n');
      }

      // indexes / views / triggers
      const extras = queryRecords<{ name: string; sql: string | null }>(
        `SELECT name, sql FROM sqlite_master
         WHERE type IN ('index','view','trigger')
           AND name NOT LIKE 'sqlite_%'
         ORDER BY type, name`,
      );
      for (const { sql } of extras) {
        if (sql) gzip.write(`${sql};\n\n`);
      }

      gzip.write('COMMIT;\n');
      gzip.write('PRAGMA foreign_keys = ON;\n');
      gzip.end();
    },
  });
