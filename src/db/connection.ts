import BetterSqlite3, { type Database } from 'better-sqlite3';
import envPaths from 'env-paths';
import { mkdirSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { runMigrations } from './migrations.js';

export type { Database };

export interface OpenDatabaseResult {
  db: Database;
  startupError?: string;
}

export function openDatabase(): OpenDatabaseResult {
  const paths = envPaths('todo-tui');
  const dbPath = `${paths.data}/tasks.db`;

  // Ensure the data directory exists
  mkdirSync(dirname(dbPath), { recursive: true });

  let db!: Database;
  let startupError: string | undefined;

  try {
    db = new BetterSqlite3(dbPath);
  } catch (err) {
    // NOTADB or file-open error — corrupt database
    const message = err instanceof Error ? err.message : String(err);
    startupError = `Database corrupted (${message}). Starting with a fresh empty database.`;

    // Remove the corrupted file and re-open a fresh one
    try {
      unlinkSync(dbPath);
    } catch {
      // ignore unlink errors — better-sqlite3 will overwrite
    }

    db = new BetterSqlite3(dbPath);
  }

  // Apply pragmas on every connection open
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return { db, startupError };
}
