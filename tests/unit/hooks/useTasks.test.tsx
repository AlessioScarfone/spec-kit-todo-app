import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { Box, Text } from 'ink';
import { render, cleanup } from 'ink-testing-library';
import { runMigrations } from '../../../src/db/migrations.js';
import { useTasks } from '../../../src/hooks/useTasks.js';

afterEach(() => {
  cleanup();
});

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared test helper: renders the hook and captures a ref to its return value
// ─────────────────────────────────────────────────────────────────────────────
type HookState = ReturnType<typeof useTasks>;

function HookCapture({ db, stateRef }: { db: ReturnType<typeof Database>; stateRef: { current: HookState | null } }) {
  const state = useTasks(db);
  stateRef.current = state;
  return (
    <Box flexDirection="column">
      <Text>{`tasks:${state.tasks.length}`}</Text>
      <Text>{`showCompleted:${state.showCompleted}`}</Text>
      <Text>{`inputMode:${state.inputMode}`}</Text>
      <Text>{`expanded:${state.expandedTaskIds.size}`}</Text>
      <Text>{`subs:${state.tasks[0] != null ? (state.subtasksMap[state.tasks[0].id]?.length ?? 0) : 0}`}</Text>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// US1: Initial load, addTask, empty state
// ────────────────────────────────────────────────────────────
describe('US1: useTasks initial load', () => {
  it('starts with empty task list', () => {
    const db = createTestDb();
    const { lastFrame } = render(<HookCapture db={db} stateRef={{ current: null }} />);
    expect(lastFrame()).toContain('tasks:0');
  });

  it('shows tasks that already exist in the DB', () => {
    const db = createTestDb();
    db.prepare(`INSERT INTO tasks (title, status, position, created_at) VALUES ('Existing', 'active', 1, ?)`).run(Date.now());
    const { lastFrame } = render(<HookCapture db={db} stateRef={{ current: null }} />);
    expect(lastFrame()).toContain('tasks:1');
  });

  it('addTask updates the task list', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('tasks:0');
    stateRef.current!.addTask('New Task');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('tasks:1');
  });

  it('empty DB returns empty task list (empty state)', () => {
    const db = createTestDb();
    const { lastFrame } = render(<HookCapture db={db} stateRef={{ current: null }} />);
    expect(lastFrame()).toContain('tasks:0');
  });
});

// ────────────────────────────────────────────────────────────
// US2: completeTask / deleteTask / toggleShowCompleted
// ────────────────────────────────────────────────────────────
describe('US2: useTasks mutations', () => {
  it('completeTask removes task from active list', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Done later');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.completeTask(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('tasks:0');
  });

  it('deleteTask removes task permanently', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Delete me');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.deleteTask(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('tasks:0');
  });

  it('toggleShowCompleted reveals completed tasks', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Finish me');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.completeTask(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('tasks:0');
    stateRef.current!.toggleShowCompleted();
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('showCompleted:true');
    expect(lastFrame()).toContain('tasks:1');
  });

  it('completeSubtask completes only that subtask', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.toggleExpand(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addSubtask(taskId, 'Sub 1');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addSubtask(taskId, 'Sub 2');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const subId = stateRef.current!.subtasksMap[taskId][0].id;
    stateRef.current!.completeSubtask(subId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    // Active subtasks should be 1 (Sub 2)
    const activeSubs = stateRef.current!.subtasksMap[taskId] ?? [];
    expect(activeSubs).toHaveLength(1);
    expect(activeSubs[0].title).toBe('Sub 2');
  });
});

// ────────────────────────────────────────────────────────────
// US3: addSubtask / deleteSubtask / toggleExpand / expandedTaskIds
// ────────────────────────────────────────────────────────────
describe('US3: useTasks subtask management', () => {
  it('addSubtask stores and returns subtasks when expanded', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.toggleExpand(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('expanded:1');
    stateRef.current!.addSubtask(taskId, 'Child 1');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('subs:1');
  });

  it('deleteSubtask removes only the selected subtask', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.toggleExpand(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addSubtask(taskId, 'Keep');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addSubtask(taskId, 'Delete me');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('subs:2');
    const subId = stateRef.current!.subtasksMap[taskId][1].id;
    stateRef.current!.deleteSubtask(subId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('subs:1');
  });

  it('toggleExpand adds and removes taskId from expandedTaskIds', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { lastFrame, rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.toggleExpand(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('expanded:1');
    stateRef.current!.toggleExpand(taskId);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(lastFrame()).toContain('expanded:0');
  });
});

// ────────────────────────────────────────────────────────────
// 002: activeSubtaskCounts
// ────────────────────────────────────────────────────────────
describe('002: activeSubtaskCounts', () => {
  it('(a) is {} when no tasks exist', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    render(<HookCapture db={db} stateRef={stateRef} />);
    expect(stateRef.current!.activeSubtaskCounts).toEqual({});
  });

  it('(b) reflects active count after addSubtask', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.addSubtask(taskId, 'Sub 1');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(stateRef.current!.activeSubtaskCounts[taskId]).toBe(1);
  });

  it('(c) decrements after completeSubtask', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.addSubtask(taskId, 'Sub A');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addSubtask(taskId, 'Sub B');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(stateRef.current!.activeSubtaskCounts[taskId]).toBe(2);
    // Get a subtask id by querying db directly
    const subs = (db as any).prepare('SELECT * FROM subtasks WHERE task_id = ? AND status = ?').all(taskId, 'active');
    stateRef.current!.completeSubtask(subs[0].id);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    expect(stateRef.current!.activeSubtaskCounts[taskId]).toBe(1);
  });

  it('(d) is absent/0 after all subtasks of a task are completed', () => {
    const db = createTestDb();
    const stateRef = { current: null as HookState | null };
    const { rerender } = render(<HookCapture db={db} stateRef={stateRef} />);
    stateRef.current!.addTask('Parent');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const taskId = stateRef.current!.tasks[0].id;
    stateRef.current!.addSubtask(taskId, 'Only sub');
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const subs = (db as any).prepare('SELECT * FROM subtasks WHERE task_id = ? AND status = ?').all(taskId, 'active');
    stateRef.current!.completeSubtask(subs[0].id);
    rerender(<HookCapture db={db} stateRef={stateRef} />);
    const count = stateRef.current!.activeSubtaskCounts[taskId] ?? 0;
    expect(count).toBe(0);
  });
});
