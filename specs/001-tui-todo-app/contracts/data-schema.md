# Data Schema Contract

**Feature**: Terminal Todo App (001-tui-todo-app)  
**Date**: 2026-03-02  
**Storage**: SQLite, file at `{env-paths('todo-tui').data}/tasks.db`

This document defines the authoritative SQLite schema. The database layer MUST implement this schema exactly. Migrations that alter this schema MUST increment `PRAGMA user_version` and be backward compatible or include an explicit rollback path (Constitution IV).

---

## Schema Version

```sql
PRAGMA user_version = 1;
```

---

## Startup Pragmas

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

Both pragmas MUST be applied on every connection open, before any query.

---

## Tables

### `tasks`

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL CHECK(length(title) > 0),
  status     TEXT    NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active', 'complete')),
  position   INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

### `subtasks`

```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL CHECK(length(title) > 0),
  status     TEXT    NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active', 'complete')),
  position   INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

---

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_status  ON subtasks(status);
```

---

## Invariants

1. `title` is never empty — enforced at DB level via `CHECK(length(title) > 0)` and at application layer before write
2. `status` has exactly two values: `active` | `complete` — enforced at DB level
3. `subtasks.task_id` always references a valid `tasks.id` — enforced by `FOREIGN KEY` + `PRAGMA foreign_keys = ON`
4. When a task is deleted, all its subtasks are deleted atomically — enforced by `ON DELETE CASCADE`
5. When a task is completed, all its subtasks are completed in a single database transaction:
   ```sql
   BEGIN;
   UPDATE tasks    SET status = 'complete' WHERE id = ?;
   UPDATE subtasks SET status = 'complete' WHERE task_id = ?;
   COMMIT;
   ```

---

## Query Patterns

### Load all items (default — active only)

```sql
SELECT * FROM tasks    WHERE status = 'active'   ORDER BY position ASC;
SELECT * FROM subtasks WHERE status = 'active'   ORDER BY task_id ASC, position ASC;
```

### Load all items (with completed visible)

```sql
SELECT * FROM tasks    ORDER BY position ASC;
SELECT * FROM subtasks ORDER BY task_id ASC, position ASC;
```

### Insert task

```sql
INSERT INTO tasks (title, status, position, created_at)
VALUES (?, 'active', (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks), ?);
```

### Insert subtask

```sql
INSERT INTO subtasks (task_id, title, status, position, created_at)
VALUES (?, ?, 'active',
        (SELECT COALESCE(MAX(position), 0) + 1 FROM subtasks WHERE task_id = ?),
        ?);
```

### Complete a task (and subtasks)

```sql
BEGIN;
UPDATE tasks    SET status = 'complete' WHERE id = ?;
UPDATE subtasks SET status = 'complete' WHERE task_id = ?;
COMMIT;
```

### Complete a subtask only

```sql
UPDATE subtasks SET status = 'complete' WHERE id = ?;
```

### Delete (hard) a task — cascade handles subtasks

```sql
DELETE FROM tasks WHERE id = ?;
```

### Delete (hard) a subtask only

```sql
DELETE FROM subtasks WHERE id = ?;
```
