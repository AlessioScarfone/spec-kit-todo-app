import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../../src/db/migrations.js';
import {
  getAllTasks,
  insertTask,
  completeTask,
  completeSubtask,
  deleteTask,
  insertSubtask,
  deleteSubtask,
  getSubtasksForTask,
  getActiveSubtaskCounts,
  reactivateTask,
  reactivateSubtask,
} from '../../../src/db/queries.js';

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

// ────────────────────────────────────────────────────────────
// US1: getAllTasks + insertTask
// ────────────────────────────────────────────────────────────
describe('US1: getAllTasks / insertTask', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns empty array when no tasks exist', () => {
    expect(getAllTasks(db)).toEqual([]);
  });

  it('inserts a task and retrieves it', () => {
    const task = insertTask(db, 'Buy groceries');
    const all = getAllTasks(db);
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Buy groceries');
    expect(all[0].status).toBe('active');
    expect(all[0].id).toBe(task.id);
  });

  it('preserves insertion order via position', () => {
    insertTask(db, 'First');
    insertTask(db, 'Second');
    insertTask(db, 'Third');
    const all = getAllTasks(db);
    expect(all.map((t) => t.title)).toEqual(['First', 'Second', 'Third']);
  });

  it('only returns active tasks by default', () => {
    const t = insertTask(db, 'Complete me');
    completeTask(db, t.id);
    expect(getAllTasks(db)).toHaveLength(0);
  });

  it('returns completed tasks when showCompleted is true', () => {
    const t = insertTask(db, 'Done');
    completeTask(db, t.id);
    expect(getAllTasks(db, true)).toHaveLength(1);
    expect(getAllTasks(db, true)[0].status).toBe('complete');
  });

  it('blocks empty title at DB level', () => {
    expect(() => insertTask(db, '')).toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// US2: completeTask / completeSubtask / deleteTask
// ────────────────────────────────────────────────────────────
describe('US2: completeTask / completeSubtask / deleteTask', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('completing a task also completes all its subtasks', () => {
    const task = insertTask(db, 'Parent');
    insertSubtask(db, task.id, 'Child 1');
    insertSubtask(db, task.id, 'Child 2');
    completeTask(db, task.id);
    const subtasks = getSubtasksForTask(db, task.id, true);
    expect(subtasks.every((s) => s.status === 'complete')).toBe(true);
  });

  it('completing a subtask only affects that subtask', () => {
    const task = insertTask(db, 'Parent');
    const s1 = insertSubtask(db, task.id, 'Child 1');
    insertSubtask(db, task.id, 'Child 2');
    completeSubtask(db, s1.id);
    const all = getSubtasksForTask(db, task.id, true);
    expect(all.find((s) => s.id === s1.id)?.status).toBe('complete');
    expect(all.filter((s) => s.status === 'active')).toHaveLength(1);
  });

  it('deleting a task removes all its subtasks (cascade)', () => {
    const task = insertTask(db, 'To delete');
    insertSubtask(db, task.id, 'Child');
    deleteTask(db, task.id);
    expect(getAllTasks(db, true)).toHaveLength(0);
    // subtasks should also be gone — try to query with the task_id directly
    const stmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ?');
    expect(stmt.all(task.id)).toHaveLength(0);
  });

  it('getAllTasks with showCompleted returns both active and complete', () => {
    insertTask(db, 'Active');
    const t2 = insertTask(db, 'Done');
    completeTask(db, t2.id);
    const all = getAllTasks(db, true);
    expect(all).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────
// US3: insertSubtask / deleteSubtask / getSubtasksForTask
// ────────────────────────────────────────────────────────────
describe('US3: insertSubtask / deleteSubtask / getSubtasksForTask', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts subtasks under a parent task', () => {
    const task = insertTask(db, 'Parent');
    insertSubtask(db, task.id, 'Sub A');
    insertSubtask(db, task.id, 'Sub B');
    const subs = getSubtasksForTask(db, task.id);
    expect(subs).toHaveLength(2);
    expect(subs[0].title).toBe('Sub A');
  });

  it('subtask position is scoped per parent task', () => {
    const t1 = insertTask(db, 'Task 1');
    const t2 = insertTask(db, 'Task 2');
    insertSubtask(db, t1.id, 'T1-Sub1');
    insertSubtask(db, t2.id, 'T2-Sub1');
    insertSubtask(db, t1.id, 'T1-Sub2');
    const t1Subs = getSubtasksForTask(db, t1.id);
    expect(t1Subs.map((s) => s.title)).toEqual(['T1-Sub1', 'T1-Sub2']);
  });

  it('deletes a subtask without affecting parent or siblings', () => {
    const task = insertTask(db, 'Parent');
    const s1 = insertSubtask(db, task.id, 'Keep');
    const s2 = insertSubtask(db, task.id, 'Delete me');
    deleteSubtask(db, s2.id);
    const subs = getSubtasksForTask(db, task.id);
    expect(subs).toHaveLength(1);
    expect(subs[0].id).toBe(s1.id);
  });

  it('cascade delete removes subtasks when parent task is deleted', () => {
    const task = insertTask(db, 'Parent');
    insertSubtask(db, task.id, 'Child');
    deleteTask(db, task.id);
    const stmt = db.prepare('SELECT * FROM subtasks WHERE task_id = ?');
    expect(stmt.all(task.id)).toHaveLength(0);
  });

  it('getSubtasksForTask returns only active by default', () => {
    const task = insertTask(db, 'Parent');
    const s1 = insertSubtask(db, task.id, 'Active sub');
    const s2 = insertSubtask(db, task.id, 'Completed sub');
    completeSubtask(db, s2.id);
    const active = getSubtasksForTask(db, task.id);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(s1.id);
  });
});

// ────────────────────────────────────────────────────────────
// Performance: SC-002 — 500 rows, getAllTasks < 200ms
// ────────────────────────────────────────────────────────────
describe('Performance (SC-002)', () => {
  it('getAllTasks completes within 200ms for 500 tasks', () => {
    const db = createTestDb();
    const insert = db.prepare(
      `INSERT INTO tasks (title, status, position, created_at) VALUES (?, 'active', ?, ?)`
    );
    const insertMany = db.transaction((n: number) => {
      for (let i = 0; i < n; i++) {
        insert.run(`Task ${i}`, i + 1, Date.now());
      }
    });
    insertMany(500);

    const start = performance.now();
    const results = getAllTasks(db);
    const elapsed = performance.now() - start;

    expect(results).toHaveLength(500);
    expect(elapsed).toBeLessThan(200);
  });
});

// ────────────────────────────────────────────────────────────
// 002: getActiveSubtaskCounts
// ────────────────────────────────────────────────────────────
describe('002: getActiveSubtaskCounts', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('(a) returns {} when taskIds is empty', () => {
    const result = getActiveSubtaskCounts(db, []);
    expect(result).toEqual({});
  });

  it('(b) returns {} when no subtasks exist for given task IDs', () => {
    const task = insertTask(db, 'Task with no subs');
    const result = getActiveSubtaskCounts(db, [task.id]);
    expect(result).toEqual({});
  });

  it('(c) counts only active subtasks per task', () => {
    const task = insertTask(db, 'Task');
    insertSubtask(db, task.id, 'Active 1');
    insertSubtask(db, task.id, 'Active 2');
    const result = getActiveSubtaskCounts(db, [task.id]);
    expect(result[task.id]).toBe(2);
  });

  it('(d) ignores complete subtasks', () => {
    const task = insertTask(db, 'Task');
    const s1 = insertSubtask(db, task.id, 'Active');
    const s2 = insertSubtask(db, task.id, 'To complete');
    completeSubtask(db, s2.id);
    const result = getActiveSubtaskCounts(db, [task.id]);
    expect(result[task.id]).toBe(1);
    void s1;
  });

  it('(e) handles multiple tasks in one call', () => {
    const t1 = insertTask(db, 'Task 1');
    const t2 = insertTask(db, 'Task 2');
    insertSubtask(db, t1.id, 'T1-S1');
    insertSubtask(db, t1.id, 'T1-S2');
    insertSubtask(db, t2.id, 'T2-S1');
    const result = getActiveSubtaskCounts(db, [t1.id, t2.id]);
    expect(result[t1.id]).toBe(2);
    expect(result[t2.id]).toBe(1);
  });

  it('(f) correctly counts 12+ active subtasks without truncation', () => {
    const task = insertTask(db, 'Busy task');
    for (let i = 0; i < 13; i++) {
      insertSubtask(db, task.id, `Sub ${i}`);
    }
    const result = getActiveSubtaskCounts(db, [task.id]);
    expect(result[task.id]).toBe(13);
  });
});

// ────────────────────────────────────────────────────────────
// 004: reactivateTask / reactivateSubtask (T001)
// ────────────────────────────────────────────────────────────
describe('004: reactivateTask / reactivateSubtask', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('(1) reactivateTask sets status = active for a completed task row', () => {
    const task = insertTask(db, 'Completed task');
    completeTask(db, task.id);
    expect(getAllTasks(db, true)[0].status).toBe('complete');
    reactivateTask(db, task.id);
    expect(getAllTasks(db, true)[0].status).toBe('active');
  });

  it('(2) reactivateSubtask sets status = active for a completed subtask row', () => {
    const task = insertTask(db, 'Parent');
    const sub = insertSubtask(db, task.id, 'Completed subtask');
    completeSubtask(db, sub.id);
    expect(getSubtasksForTask(db, task.id, true)[0].status).toBe('complete');
    reactivateSubtask(db, sub.id);
    expect(getSubtasksForTask(db, task.id, true)[0].status).toBe('active');
  });

  it('(3) reactivateTask on an already-active row is a no-op', () => {
    const task = insertTask(db, 'Active task');
    reactivateTask(db, task.id);
    expect(getAllTasks(db)[0].status).toBe('active');
  });

  it('(3b) reactivateSubtask on an already-active row is a no-op', () => {
    const task = insertTask(db, 'Parent');
    const sub = insertSubtask(db, task.id, 'Active subtask');
    reactivateSubtask(db, sub.id);
    expect(getSubtasksForTask(db, task.id)[0].status).toBe('active');
  });

  it('(4) after reactivateTask the row reads back as active on a fresh SELECT', () => {
    const task = insertTask(db, 'Persistence task');
    completeTask(db, task.id);
    reactivateTask(db, task.id);
    // Fresh SELECT via getAllTasks with showCompleted
    const row = (db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) as { status: string });
    expect(row.status).toBe('active');
  });

  it('(5) reactivateSubtask leaves parent task still complete (independent toggle)', () => {
    const task = insertTask(db, 'Parent task');
    const sub = insertSubtask(db, task.id, 'Child subtask');
    // Complete parent (cascades to subtasks)
    completeTask(db, task.id);
    const parentBefore = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) as { status: string };
    expect(parentBefore.status).toBe('complete');
    // Reactivate only the subtask
    reactivateSubtask(db, sub.id);
    // Parent task must still be complete
    const parentAfter = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) as { status: string };
    expect(parentAfter.status).toBe('complete');
    // Subtask is now active
    const subRow = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(sub.id) as { status: string };
    expect(subRow.status).toBe('active');
  });
});
