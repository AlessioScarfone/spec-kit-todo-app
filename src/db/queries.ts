import type { Database } from 'better-sqlite3';
import type { Task, Subtask } from '../types.js';

// ──────────────────────────────────────
// Task queries
// ──────────────────────────────────────

export function getAllTasks(db: Database, showCompleted = false): Task[] {
  const sql = showCompleted
    ? 'SELECT * FROM tasks ORDER BY position ASC'
    : "SELECT * FROM tasks WHERE status = 'active' ORDER BY position ASC";
  return db.prepare(sql).all() as Task[];
}

export function insertTask(db: Database, title: string): Task {
  const stmt = db.prepare(
    `INSERT INTO tasks (title, status, position, created_at)
     VALUES (?, 'active', (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks), ?)`
  );
  const info = stmt.run(title, Date.now());
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) as Task;
}

export function completeTask(db: Database, id: number): void {
  const complete = db.transaction(() => {
    db.prepare("UPDATE tasks SET status = 'complete' WHERE id = ?").run(id);
    db.prepare("UPDATE subtasks SET status = 'complete' WHERE task_id = ?").run(id);
  });
  complete();
}

export function reactivateTask(db: Database, id: number): void {
  db.prepare("UPDATE tasks SET status = 'active' WHERE id = ?").run(id);
}

export function deleteTask(db: Database, id: number): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// ──────────────────────────────────────
// Subtask queries
// ──────────────────────────────────────

export function getSubtasksForTask(
  db: Database,
  taskId: number,
  showCompleted = false
): Subtask[] {
  const sql = showCompleted
    ? 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC'
    : "SELECT * FROM subtasks WHERE task_id = ? AND status = 'active' ORDER BY position ASC";
  return db.prepare(sql).all(taskId) as Subtask[];
}

export function insertSubtask(db: Database, taskId: number, title: string): Subtask {
  const stmt = db.prepare(
    `INSERT INTO subtasks (task_id, title, status, position, created_at)
     VALUES (?, ?, 'active',
             (SELECT COALESCE(MAX(position), 0) + 1 FROM subtasks WHERE task_id = ?),
             ?)`
  );
  const info = stmt.run(taskId, title, taskId, Date.now());
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(info.lastInsertRowid) as Subtask;
}

export function completeSubtask(db: Database, id: number): void {
  db.prepare("UPDATE subtasks SET status = 'complete' WHERE id = ?").run(id);
}

export function reactivateSubtask(db: Database, id: number): void {
  db.prepare("UPDATE subtasks SET status = 'active' WHERE id = ?").run(id);
}

export function deleteSubtask(db: Database, id: number): void {
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
}

// ──────────────────────────────────────
// Aggregate queries
// ──────────────────────────────────────

export function getSubtaskRatioCounts(
  db: Database,
  taskIds: number[]
): Record<number, { active: number; total: number }> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(', ');
  const rows = db
    .prepare(
      `SELECT task_id,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
       FROM subtasks
       WHERE task_id IN (${placeholders})
       GROUP BY task_id`
    )
    .all(...taskIds) as { task_id: number; total: number; active: number }[];
  const result: Record<number, { active: number; total: number }> = {};
  for (const row of rows) {
    result[row.task_id] = { active: row.active, total: row.total };
  }
  return result;
}
