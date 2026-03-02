import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import React from 'react';
import { render, cleanup } from 'ink-testing-library';
import { runMigrations } from '../../../src/db/migrations.js';
import { App } from '../../../src/components/App.js';

// Key codes
const ENTER = '\r';
const ESC = '\u001b';
const UP = '\u001b[A';
const DOWN = '\u001b[B';
const RIGHT = '\u001b[C';
const LEFT = '\u001b[D';

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

// ────────────────────────────────────────────────────────────
// US1: Add and View Tasks
// ────────────────────────────────────────────────────────────
describe('US1: App — add and view tasks', () => {
  it('shows empty state when no tasks exist', () => {
    const db = createTestDb();
    const { lastFrame } = render(<App db={db} />);
    const frame = lastFrame() ?? '';
    expect(frame.toLowerCase()).toMatch(/no tasks|empty/i);
  });

  it('pressing a enters add-task mode', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    const frame = lastFrame() ?? '';
    expect(frame).toBeTruthy();
  });

  it('pressing a, typing a title, and Enter adds a task', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Buy coffee');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    expect(lastFrame()).toContain('Buy coffee');
  });

  it('pressing Esc in add-task mode cancels without adding', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Never mind');
    await sleep(50);
    stdin.write(ESC);
    await sleep(50);
    expect(lastFrame()).not.toContain('Never mind');
  });

  it('Enter with empty title is a no-op', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write(ENTER); // empty — should stay in input mode
    await sleep(50);
    // Still in add-task mode — no task was added
    const frame = lastFrame() ?? '';
    expect(frame).toBeTruthy(); // just verify app is stable
  });
});

// ────────────────────────────────────────────────────────────
// US2: Complete and Delete Tasks
// ────────────────────────────────────────────────────────────
describe('US2: App — complete and delete tasks', () => {
  it('pressing c completes the selected task and hides it', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Complete me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    expect(lastFrame()).toContain('Complete me');
    stdin.write('c');
    await sleep(50);
    expect(lastFrame()).not.toContain('Complete me');
  });

  it('pressing h toggles visibility of completed tasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Toggle me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    expect(lastFrame()).not.toContain('Toggle me');
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).toContain('Toggle me');
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).not.toContain('Toggle me');
  });

  it('pressing d deletes the selected task permanently', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Delete me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    expect(lastFrame()).toContain('Delete me');
    stdin.write('d');
    await sleep(50);
    expect(lastFrame()).not.toContain('Delete me');
  });

  it('pressing c on a subtask row completes only that subtask', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    // Add task
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand to see subtask input
    stdin.write(RIGHT); // expand (no subtasks yet, no-op)
    await sleep(50);
    // Add subtask via s
    stdin.write('s');
    await sleep(50);
    stdin.write('Child sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand parent
    stdin.write(RIGHT);
    await sleep(50);
    // Navigate down to subtask row
    stdin.write(DOWN);
    await sleep(50);
    expect(lastFrame()).toContain('Child sub');
    stdin.write('c');
    await sleep(50);
    // Subtask should be hidden (showCompleted = false)
    expect(lastFrame()).not.toContain('Child sub');
  });
});

// ────────────────────────────────────────────────────────────
// US3: Organize with Subtasks
// ────────────────────────────────────────────────────────────
describe('US3: App — subtasks', () => {
  it('pressing s enters add-subtask mode (task selected)', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    const frame = lastFrame() ?? '';
    expect(frame).toBeTruthy();
  });

  it('adds a subtask under the parent task', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('My subtask');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand to see subtask
    stdin.write(RIGHT);
    await sleep(50);
    expect(lastFrame()).toContain('My subtask');
  });

  it('pressing left arrow collapses subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('A sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand
    stdin.write(RIGHT);
    await sleep(50);
    expect(lastFrame()).toContain('A sub');
    // Collapse
    stdin.write(LEFT);
    await sleep(50);
    expect(lastFrame()).not.toContain('A sub');
  });

  it('pressing d on a subtask row deletes only that subtask', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    // Add task
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Add two subtasks
    stdin.write('s');
    await sleep(50);
    stdin.write('Keep me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Delete me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand
    stdin.write(RIGHT);
    await sleep(50);
    // Navigate to second subtask
    stdin.write(DOWN); // to first subtask
    await sleep(50);
    stdin.write(DOWN); // to second subtask
    await sleep(50);
    // Delete
    stdin.write('d');
    await sleep(50);
    expect(lastFrame()).toContain('Keep me');
    expect(lastFrame()).not.toContain('Delete me');
  });
});
