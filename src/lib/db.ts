import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { initializeDatabase } from './schema';

// Type alias for the sql.js Database
type SqlJsDatabase = ReturnType<ReturnType<typeof initSqlJs extends Promise<infer T> ? T : never>['Database']['prototype']['constructor']>;

const DB_PATH = path.resolve(process.cwd(), 'fintrack.db');
const WASM_PATH = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');

let dbInstance: any | null = null;
let sqlPromise: Promise<any> | null = null;

export function saveDatabase(db: any) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function createDatabase(): Promise<any> {
  const SQL = await initSqlJs({
    locateFile: () => WASM_PATH,
  });

  let db: any;

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  initializeDatabase(db);
  saveDatabase(db);

  return db;
}

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  if (!sqlPromise) {
    sqlPromise = createDatabase().then((db) => {
      dbInstance = db;
      return db;
    });
  }

  return sqlPromise;
}

export function runQuery(db: any, sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase(db);
}

export function getOne<T = any>(db: any, sql: string, params: any[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const row: any = {};
    columns.forEach((col: string, i: number) => {
      row[col] = values[i];
    });
    stmt.free();
    return row as T;
  }

  stmt.free();
  return null;
}

export function getAll<T = any>(db: any, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    const row: any = {};
    columns.forEach((col: string, i: number) => {
      row[col] = values[i];
    });
    results.push(row as T);
  }

  stmt.free();
  return results;
}

export function runInsert(db: any, sql: string, params: any[] = []): number {
  db.run(sql, params);
  const result = getOne<{ id: number }>(db, 'SELECT last_insert_rowid() as id');
  saveDatabase(db);
  return result?.id ?? 0;
}
