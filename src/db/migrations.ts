import type { Database } from 'better-sqlite3';

export function runMigrations(db: Database): void {
  const currentVersion = (db.pragma('user_version', { simple: true }) as number);

  if (currentVersion < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT    NOT NULL CHECK(length(title) > 0),
        status     TEXT    NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active', 'complete')),
        position   INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subtasks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title      TEXT    NOT NULL CHECK(length(title) > 0),
        status     TEXT    NOT NULL DEFAULT 'active'
                           CHECK(status IN ('active', 'complete')),
        position   INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_subtasks_status  ON subtasks(status);

      PRAGMA user_version = 1;
    `);
  }
}
