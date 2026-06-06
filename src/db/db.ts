import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';

type AppDatabase = Database<sqlite3.Database, sqlite3.Statement>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

export const dbPath = path.join(rootDir, 'data', 'lab3.db');

let db: AppDatabase | null = null;

export async function getDb() {
  if (!db) {
    await mkdir(path.dirname(dbPath), { recursive: true });
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await db.exec('PRAGMA foreign_keys = ON;');
  }

  return db;
}

export async function initDb() {
  const database = await getDb();
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await runMigrations(database);
  console.log('[DB] Schema initialized');
}

async function runMigrations(database: AppDatabase) {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = (await readdir(migrationsDir))
    .filter(file => /^\d+_.+\.sql$/.test(file))
    .sort();

  for (const file of files) {
    const applied = await database.get<{ id: string }>(
      'SELECT id FROM schema_migrations WHERE id = ?',
      file
    );

    if (applied) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await database.exec('BEGIN TRANSACTION;');

    try {
      await database.exec(sql);
      await database.run('INSERT INTO schema_migrations (id) VALUES (?)', file);
      await database.exec('COMMIT;');
      console.log(`[DB] Migration applied: ${file}`);
    } catch (error) {
      await database.exec('ROLLBACK;');
      throw error;
    }
  }
}
