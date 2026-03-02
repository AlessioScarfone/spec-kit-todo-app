import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
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
const TAB = '\t';

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

// ────────────────────────────────────────────────────────────
// 002: subtask count badge
// ────────────────────────────────────────────────────────────
describe('002: subtask count badge', () => {
  it('(a) badge absent when task has no subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Clean task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Clean task');
    // No count badge: the line with the title should not contain a trailing number
    const titleLine = frame.split('\n').find((l: string) => l.includes('Clean task')) ?? '';
    expect(titleLine).not.toMatch(/Clean task\s+\d+/);
  });

  it('(b) badge shows correct count with mixed active/complete subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    // Add task
    stdin.write('a');
    await sleep(50);
    stdin.write('Mixed task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Add 3 subtasks
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub A');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub B');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub C');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Complete one subtask via keyboard: expand → navigate to first subtask → c
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN); // to first subtask
    await sleep(50);
    stdin.write('c'); // complete Sub A
    await sleep(50);
    const frame = lastFrame() ?? '';
    // Badge should show 2 (3 total − 1 completed)
    const titleLine = frame.split('\n').find((l: string) => l.includes('Mixed task')) ?? '';
    expect(titleLine).toMatch(/Mixed task.*2/);
  });

  it('(c) badge disappears when last active subtask is completed', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Solo task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Only sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Badge should show 1
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Solo task')) ?? '';
    expect(titleLine).toMatch(/Solo task.*1/);
    // Expand, navigate to subtask, complete it
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Solo task')) ?? '';
    // badge stays visible as 0/1 — numerator goes to zero but badge is not hidden
    expect(titleLine).toMatch(/Solo task.*0\/1/);
  });

  it('(d) badge decrements after pressing d on an active subtask', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Delete badge task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Del Sub 1');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Del Sub 2');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Badge = 2
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Delete badge task')) ?? '';
    expect(titleLine).toMatch(/Delete badge task.*2/);
    // Expand, navigate to first subtask, delete it
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('d');
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Delete badge task')) ?? '';
    expect(titleLine).toMatch(/Delete badge task.*1/);
  });

  it('(e) badge appears at 1 when a subtask is added to a task with no badge', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('New badge task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // No badge yet
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('New badge task')) ?? '';
    expect(titleLine).not.toMatch(/New badge task.*\d/);
    // Add one subtask
    stdin.write('s');
    await sleep(50);
    stdin.write('First sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('New badge task')) ?? '';
    expect(titleLine).toMatch(/New badge task.*1/);
  });

  it('(f) badge decrements from 2 to 1 when one of two active subtasks is completed', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Two sub task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub One');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub Two');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Two sub task')) ?? '';
    expect(titleLine).toMatch(/Two sub task.*2/);
    // Complete first subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Two sub task')) ?? '';
    expect(titleLine).toMatch(/Two sub task.*1/);
  });

  it('(g) task title still fully present in frame after badge renders', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Full title task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub X');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Full title task');
  });

  it('T013: bulk-complete (c on parent) causes badge to disappear', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Bulk task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub 1');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub 2');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Badge should show 2
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Bulk task')) ?? '';
    expect(titleLine).toMatch(/Bulk task.*2/);
    // Press c on the parent (bulk-completes all subtasks + the task itself)
    stdin.write('c');
    await sleep(50);
    // Task and its badge are gone (task is completed and hidden)
    frame = lastFrame() ?? '';
    expect(frame).not.toContain('Bulk task');
  });

  it('T014: show-completed toggle — a task with all subtasks completed shows no badge', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('All done task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub only');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Complete the subtask via expand + navigate + c
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    // Toggle show-completed (h)
    stdin.write(LEFT); // collapse first
    await sleep(50);
    stdin.write('h');
    await sleep(50);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('All done task');
    // The task should be visible (completed) but no badge
    const titleLine = frame.split('\n').find((l: string) => l.includes('All done task')) ?? '';
    // badge stays visible as 0/1 — numerator goes to zero but badge is not hidden
    expect(titleLine).toMatch(/All done task.*0\/1/);
  });
});

// ────────────────────────────────────────────────────────────
// 003: Tab key subtask toggle
// ────────────────────────────────────────────────────────────
describe('003: Tab key subtask toggle', () => {
  // Helper: create a task with one subtask and return {lastFrame, stdin}
  async function setupTaskWithSubtask(taskTitle: string, subtaskTitle: string) {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write(taskTitle);
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write(subtaskTitle);
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Subtasks start collapsed; parent task is selected
    return { lastFrame, stdin };
  }

  it('(1) Tab expands collapsed subtasks on a task row', async () => {
    const { lastFrame, stdin } = await setupTaskWithSubtask('Tab Parent', 'Tab Sub');
    // Subtasks collapsed — Tab Sub should not be visible
    expect(lastFrame()).not.toContain('Tab Sub');
    // Press Tab — should expand
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).toContain('Tab Sub');
  });

  it('(2) Tab collapses expanded subtasks on a task row', async () => {
    const { lastFrame, stdin } = await setupTaskWithSubtask('Collapse Parent', 'Collapse Sub');
    // Expand via RIGHT first
    stdin.write(RIGHT);
    await sleep(50);
    expect(lastFrame()).toContain('Collapse Sub');
    // Press Tab — should collapse
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).not.toContain('Collapse Sub');
  });

  it('(3) repeated Tab alternates expanded and collapsed state', async () => {
    const { lastFrame, stdin } = await setupTaskWithSubtask('Toggle Parent', 'Toggle Sub');
    // Initially collapsed
    expect(lastFrame()).not.toContain('Toggle Sub');
    // Tab → expand
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).toContain('Toggle Sub');
    // Tab → collapse
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).not.toContain('Toggle Sub');
    // Tab → expand again
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).toContain('Toggle Sub');
  });

  it('(4) Tab is a no-op when selected task has no subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('No Sub Task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    const frameBefore = lastFrame() ?? '';
    stdin.write(TAB);
    await sleep(50);
    const frameAfter = lastFrame() ?? '';
    // Frame should remain stable; no crash
    expect(frameAfter).toContain('No Sub Task');
    // Confirm the visible rows didn't change (still no subtasks visible)
    expect(frameAfter).toEqual(frameBefore);
  });

  it('(5) Tab is a no-op when a subtask row is selected', async () => {
    const { lastFrame, stdin } = await setupTaskWithSubtask('Row Tab Parent', 'Row Tab Sub');
    // Expand subtasks
    stdin.write(RIGHT);
    await sleep(50);
    expect(lastFrame()).toContain('Row Tab Sub');
    // Navigate down to the subtask row
    stdin.write(DOWN);
    await sleep(50);
    // Press Tab — should be no-op; subtask stays visible
    stdin.write(TAB);
    await sleep(50);
    expect(lastFrame()).toContain('Row Tab Sub');
  });

  it('right and left arrow keys still work after Tab is added', async () => {
    const { lastFrame, stdin } = await setupTaskWithSubtask('Arrow Parent', 'Arrow Sub');
    // RIGHT expands
    stdin.write(RIGHT);
    await sleep(50);
    expect(lastFrame()).toContain('Arrow Sub');
    // LEFT collapses
    stdin.write(LEFT);
    await sleep(50);
    expect(lastFrame()).not.toContain('Arrow Sub');
  });
});

// ────────────────────────────────────────────────────────────
// 004 T002: Bidirectional "c" toggle (US1)
// ────────────────────────────────────────────────────────────
describe('004 T002: Bidirectional "c" toggle', () => {
  it('(1) pressing c on a completed task reverts it to active', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    // Add task and complete it
    stdin.write('a');
    await sleep(50);
    stdin.write('Reactivate me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('c'); // complete
    await sleep(50);
    expect(lastFrame()).not.toContain('Reactivate me');
    // Toggle show completed
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).toContain('Reactivate me');
    // Press c on the completed task — should revert to active
    stdin.write('c');
    await sleep(50);
    // Hide completed again — the task should still be visible (it's now active)
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).toContain('Reactivate me');
  });

  it('(2) pressing c on a completed subtask reverts it to active', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Parent T002');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Child T002');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand and complete the subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN); // to subtask
    await sleep(50);
    stdin.write('c'); // complete subtask
    await sleep(50);
    // Subtask hidden in active view
    expect(lastFrame()).not.toContain('Child T002');
    // Show completed
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).toContain('Child T002');
    // Navigate to subtask and reactivate
    stdin.write(DOWN); // navigate to the subtask row
    await sleep(50);
    stdin.write('c'); // reactivate
    await sleep(50);
    // Hide completed — subtask should still appear (now active)
    stdin.write('h');
    await sleep(50);
    expect(lastFrame()).toContain('Child T002');
  });

  it('(3) pressing c on an active task still completes it (existing behaviour preserved)', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Still completes');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    expect(lastFrame()).toContain('Still completes');
    stdin.write('c'); // complete active task
    await sleep(50);
    expect(lastFrame()).not.toContain('Still completes');
  });

  it('(4) a reactivated task can be completed again in the same session', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Cycle task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // complete → reactivate → complete cycle
    stdin.write('c'); // complete
    await sleep(50);
    stdin.write('h'); // show completed
    await sleep(50);
    stdin.write('c'); // reactivate
    await sleep(50);
    stdin.write('h'); // hide completed again
    await sleep(50);
    expect(lastFrame()).toContain('Cycle task'); // now active
    stdin.write('c'); // complete again
    await sleep(50);
    expect(lastFrame()).not.toContain('Cycle task'); // hidden again
  });

  it('(5) when all tasks are completed, reactivating one makes it appear in active list', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Only task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('c'); // complete — now no active tasks
    await sleep(50);
    // Show completed to access the task
    stdin.write('h');
    await sleep(50);
    stdin.write('c'); // reactivate
    await sleep(50);
    stdin.write('h'); // hide completed
    await sleep(50);
    // The reactivated task should now appear in active list
    expect(lastFrame()).toContain('Only task');
  });

  it('(6) two c keypresses on the same row produce deterministic final state', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Toggle twice');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Press c twice quickly on an active task
    stdin.write('c');
    await sleep(10);
    stdin.write('c');
    await sleep(50);
    // After two c presses: first completes and hides, second on an empty list is a no-op
    // Task should be hidden (completed after first c)
    expect(lastFrame()).not.toContain('Toggle twice');
  });
});

// ────────────────────────────────────────────────────────────
// 004 T006: Command bar hint text (US2)
// ────────────────────────────────────────────────────────────
describe('004 T006: Command bar hint text', () => {
  it('idle-mode hint contains "complete/reactivate"', async () => {
    const db = createTestDb();
    const { lastFrame } = render(<App db={db} />);
    await sleep(50);
    expect(lastFrame()).toContain('complete/reactivate');
  });
});

// ────────────────────────────────────────────────────────────
// 004 T008: Fullscreen layout (US3)
// ────────────────────────────────────────────────────────────
describe('004 T008: Fullscreen layout', () => {
  it('(1) command bar text is present in the rendered output', async () => {
    const db = createTestDb();
    const { lastFrame } = render(<App db={db} />);
    await sleep(50);
    const frame = lastFrame() ?? '';
    // Hint text should appear at the bottom
    expect(frame).toContain('navigate');
  });

  it('(2) with many tasks, command bar hint remains present after scrolling', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    // Add 20 tasks
    for (let i = 1; i <= 20; i++) {
      stdin.write('a');
      await sleep(30);
      stdin.write(`Task ${i}`);
      await sleep(30);
      stdin.write(ENTER);
      await sleep(30);
    }
    // Scroll down through all tasks
    for (let i = 0; i < 19; i++) {
      stdin.write(DOWN);
      await sleep(20);
    }
    const frame = lastFrame() ?? '';
    // Command bar hint must always be visible
    expect(frame).toContain('navigate');
  });

  it('(3) selected task stays visible while scrolling down', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    for (let i = 1; i <= 15; i++) {
      stdin.write('a');
      await sleep(30);
      stdin.write(`Scroll task ${i}`);
      await sleep(30);
      stdin.write(ENTER);
      await sleep(30);
    }
    // Navigate to last task
    for (let i = 0; i < 14; i++) {
      stdin.write(DOWN);
      await sleep(20);
    }
    // The last task should be visible in current frame
    expect(lastFrame()).toContain('Scroll task 15');
  });
});

// ────────────────────────────────────────────────────────────
// 005: active/total ratio badge — US1: display
// ────────────────────────────────────────────────────────────
describe('005 US1: ratio badge display', () => {
  it('(1) badge shows 1/2 for a task with 1 active and 1 completed subtask', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Ratio task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Add 2 subtasks
    stdin.write('s');
    await sleep(50);
    stdin.write('Active sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Done sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand and complete the second subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write(DOWN); // move to 2nd subtask
    await sleep(50);
    stdin.write('c'); // complete Done sub
    await sleep(50);
    const frame = lastFrame() ?? '';
    const titleLine = frame.split('\n').find((l: string) => l.includes('Ratio task')) ?? '';
    expect(titleLine).toMatch(/Ratio task.*1\/2/);
  });

  it('(2) badge shows 3/3 for a task with 3 active and 0 completed subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('All active task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    for (const name of ['Sub A', 'Sub B', 'Sub C']) {
      stdin.write('s');
      await sleep(50);
      stdin.write(name);
      await sleep(50);
      stdin.write(ENTER);
      await sleep(50);
    }
    const frame = lastFrame() ?? '';
    const titleLine = frame.split('\n').find((l: string) => l.includes('All active task')) ?? '';
    expect(titleLine).toMatch(/All active task.*3\/3/);
  });

  it('(3) no badge when task has zero subtasks', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('No sub task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    const frame = lastFrame() ?? '';
    const titleLine = frame.split('\n').find((l: string) => l.includes('No sub task')) ?? '';
    // Must not contain any slash-separated ratio
    expect(titleLine).not.toMatch(/\d+\/\d+/);
  });
});

// ────────────────────────────────────────────────────────────
// 005 US2: ratio badge updates on subtask completion
// ────────────────────────────────────────────────────────────
describe('005 US2: ratio badge updates on completion', () => {
  it('(1) completing a subtask decrements numerator: 2/3 → 1/3', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Completion task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    for (const name of ['Sub 1', 'Sub 2', 'Sub 3']) {
      stdin.write('s');
      await sleep(50);
      stdin.write(name);
      await sleep(50);
      stdin.write(ENTER);
      await sleep(50);
    }
    // Badge should be 3/3
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Completion task')) ?? '';
    expect(titleLine).toMatch(/Completion task.*3\/3/);
    // Expand and complete one subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Completion task')) ?? '';
    expect(titleLine).toMatch(/Completion task.*2\/3/);
  });

  it('(2) completing last active subtask shows 0/N badge, not hidden', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Last sub task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Only sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Badge shows 1/1
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Last sub task')) ?? '';
    expect(titleLine).toMatch(/Last sub task.*1\/1/);
    // Complete the only subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Last sub task')) ?? '';
    // Badge shows 0/1 (NOT hidden)
    expect(titleLine).toMatch(/Last sub task.*0\/1/);
  });

  it('(3) re-activating a subtask increments numerator: 0/1 → 1/1', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Reactivate task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Reactivate me');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Expand, complete subtask
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c'); // complete subtask
    await sleep(50);
    // Now show completed to see the subtask
    stdin.write(LEFT); // collapse
    await sleep(50);
    stdin.write('h'); // toggle show-completed
    await sleep(50);
    stdin.write(RIGHT); // expand again to see completed sub
    await sleep(50);
    stdin.write(DOWN); // navigate to completed subtask
    await sleep(50);
    stdin.write('c'); // reactivate subtask
    await sleep(50);
    const frame = lastFrame() ?? '';
    const titleLine = frame.split('\n').find((l: string) => l.includes('Reactivate task')) ?? '';
    expect(titleLine).toMatch(/Reactivate task.*1\/1/);
  });
});

// ────────────────────────────────────────────────────────────
// 005 US3: ratio badge updates on add/delete
// ────────────────────────────────────────────────────────────
describe('005 US3: ratio badge updates on add/delete', () => {
  it('(1) no badge → add subtask → badge shows 1/1', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Add badge task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Add badge task')) ?? '';
    expect(titleLine).not.toMatch(/\d+\/\d+/);
    stdin.write('s');
    await sleep(50);
    stdin.write('First sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Add badge task')) ?? '';
    expect(titleLine).toMatch(/Add badge task.*1\/1/);
  });

  it('(2) 1/2 + add active subtask → 2/3', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Grow task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub A');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub B');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Complete Sub B to get 1/2
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c'); // complete Sub B
    await sleep(50);
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Grow task')) ?? '';
    expect(titleLine).toMatch(/Grow task.*1\/2/);
    // Navigate UP to the parent task row (Sub B was hidden after completion,
    // selection clamped to Sub A at index 1 — UP reaches Grow task at index 0)
    stdin.write(UP);
    await sleep(50);
    // Collapse and add another subtask
    stdin.write(LEFT);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Sub C');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Grow task')) ?? '';
    expect(titleLine).toMatch(/Grow task.*2\/3/);
  });

  it('(3) 1/2 + delete active subtask → 0/1', async () => {
    const db = createTestDb();
    const { lastFrame, stdin } = render(<App db={db} />);
    stdin.write('a');
    await sleep(50);
    stdin.write('Delete active task');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Active sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    stdin.write('s');
    await sleep(50);
    stdin.write('Done sub');
    await sleep(50);
    stdin.write(ENTER);
    await sleep(50);
    // Complete 'Done sub' (2nd) to get 1/2
    stdin.write(RIGHT);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write(DOWN);
    await sleep(50);
    stdin.write('c');
    await sleep(50);
    let frame = lastFrame() ?? '';
    let titleLine = frame.split('\n').find((l: string) => l.includes('Delete active task')) ?? '';
    expect(titleLine).toMatch(/Delete active task.*1\/2/);
    // Delete the active subtask — 'Active sub' is already selected (Done sub was
    // completed and hidden, selection clamped from index 2 to index 1 = Active sub)
    stdin.write('d'); // delete Active sub
    await sleep(50);
    frame = lastFrame() ?? '';
    titleLine = frame.split('\n').find((l: string) => l.includes('Delete active task')) ?? '';
    expect(titleLine).toMatch(/Delete active task.*0\/1/);
  });
});

