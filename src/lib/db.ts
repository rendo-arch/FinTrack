import { Pool } from 'pg';
import { initializeDatabase } from './schema';

let pool: Pool | null = null;
let initialized = false;

function formatSql(sql: string): string {
  let paramCount = 0;
  let formatted = sql.replace(/\?/g, () => `$${++paramCount}`);
  formatted = formatted.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  formatted = formatted.replace(/date\('now'\)/gi, 'CURRENT_DATE');
  formatted = formatted.replace(/strftime\('%Y-%m',\s*([^)]+)\)/gi, "to_char($1, 'YYYY-MM')");
  return formatted;
}

export async function getDb(): Promise<Pool> {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!initialized) {
    await initializeDatabase(pool);
    initialized = true;
  }

  return pool;
}

export async function runQuery(db: Pool, sql: string, params: any[] = []): Promise<void> {
  const formattedSql = formatSql(sql);
  await db.query(formattedSql, params);
}

export async function getOne<T = any>(db: Pool, sql: string, params: any[] = []): Promise<T | null> {
  const formattedSql = formatSql(sql);
  const res = await db.query(formattedSql, params);
  return (res.rows[0] as T) || null;
}

export async function getAll<T = any>(db: Pool, sql: string, params: any[] = []): Promise<T[]> {
  const formattedSql = formatSql(sql);
  const res = await db.query(formattedSql, params);
  return (res.rows as T[]) || [];
}

export async function runInsert(db: Pool, sql: string, params: any[] = []): Promise<number> {
  let formattedSql = formatSql(sql);
  if (!/RETURNING\s+id/i.test(formattedSql)) {
    formattedSql += ' RETURNING id';
  }
  const res = await db.query(formattedSql, params);
  return res.rows[0]?.id || 0;
}
