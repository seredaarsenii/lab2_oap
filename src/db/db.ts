import { mkdir, readFile } from 'node:fs/promises';
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
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = await readFile(schemaPath, 'utf8');
  await database.exec(schemaSql);
  await applyMigration(database, '001_init_schema', async () => undefined);
  await applyMigration(database, '002_add_report_category_column', migrateReportCategoryColumn);
  await applyMigration(database, '003_add_reports_status_created_at_index', async db => {
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
       ON reports(status, created_at)`
    );
  });
  console.log('[DB] Schema initialized');
}

async function applyMigration(
  database: AppDatabase,
  id: string,
  change: (database: AppDatabase) => Promise<void>
) {
  const applied = await database.get<{ id: string }>(
    'SELECT id FROM schema_migrations WHERE id = ?',
    id
  );

  if (applied) {
    return;
  }

  await change(database);
  await database.run('INSERT INTO schema_migrations (id) VALUES (?)', id);
  console.log(`[DB] Migration applied: ${id}`);
}

async function migrateReportCategoryColumn(database: AppDatabase) {
  const columns = await database.all<{ name: string }[]>('PRAGMA table_info(reports)');
  const hasCategoryId = columns.some(column => column.name === 'category_id');

  if (!hasCategoryId) {
    await database.exec(
      'ALTER TABLE reports ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL'
    );
    console.log('[DB] Added reports.category_id column');
  }
}
