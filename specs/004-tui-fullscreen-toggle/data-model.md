# Data Model: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Feature**: `004-tui-fullscreen-toggle`  
**Phase**: 1 — Design  
**Status**: Complete

---

## Overview

This feature introduces no new database tables or schema changes. The existing `tasks` and `subtasks` tables already support both `'active'` and `'complete'` status values. The changes are:

1. Two new query functions (`reactivateTask`, `reactivateSubtask`) that write `status = 'active'` back to existing rows.
2. Two corresponding hook callbacks (`reactivateTask`, `reactivateSubtask`) exposed from `useTasks`.
3. UI state: one new `scrollOffset` integer in `App.tsx` to manage the virtual scroll window.

---

## Existing Entities (unchanged)

### Task

| Field | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Auto-increment row identifier |
| `title` | `TEXT NOT NULL` | Task description |
| `status` | `TEXT` (`'active'` \| `'complete'`) | Current lifecycle state — **toggled bidirectionally by this feature** |
| `position` | `INTEGER` | Display order |
| `created_at` | `INTEGER` | Unix timestamp (ms) |

**Status transitions (updated)**:

```
active ←──── c keypress ────→ complete
```

Previously one-directional (`active → complete` only). This feature makes the transition bidirectional.

### Subtask

| Field | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY` | Auto-increment row identifier |
| `task_id` | `INTEGER` | Foreign key to `tasks.id` (CASCADE DELETE) |
| `title` | `TEXT NOT NULL` | Subtask description |
| `status` | `TEXT` (`'active'` \| `'complete'`) | Current lifecycle state — **toggled bidirectionally by this feature** |
| `position` | `INTEGER` | Display order within parent task |
| `created_at` | `INTEGER` | Unix timestamp (ms) |

**Status transitions (updated)**: Same as `Task` — bidirectional via "c" keypress, independently of parent `Task` status.

---

## New Query Functions

### `reactivateTask(db, id)`

```ts
export function reactivateTask(db: Database, id: number): void {
  db.prepare("UPDATE tasks SET status = 'active' WHERE id = ?").run(id);
}
```

- **Scope**: Updates only the targeted task row. Does NOT touch subtasks (spec assumption: items toggled independently).
- **Atomicity**: Single `UPDATE` statement; SQLite guarantees atomicity at statement level.
- **Idempotency**: Calling `reactivateTask` on an already-active task is a no-op (no harm).

### `reactivateSubtask(db, id)`

```ts
export function reactivateSubtask(db: Database, id: number): void {
  db.prepare("UPDATE subtasks SET status = 'active' WHERE id = ?").run(id);
}
```

- **Scope**: Updates only the targeted subtask row.
- **Atomicity**: Single `UPDATE` statement.
- **Idempotency**: Calling `reactivateSubtask` on an already-active subtask is a no-op.

---

## New UI State

### `scrollOffset` (in `App.tsx`)

| Property | Type | Initial Value | Description |
|---|---|---|---|
| `scrollOffset` | `number` | `0` | Index of the first visible row in the flat `rows` array; drives the virtual scroll window |

**Update rules**:
- If `selectedIndex < scrollOffset` → set `scrollOffset = selectedIndex` (scroll up).
- If `selectedIndex >= scrollOffset + visibleHeight` → set `scrollOffset = selectedIndex - visibleHeight + 1` (scroll down).
- On task list mutation (add/delete/complete): clamp `selectedIndex` as before; `scrollOffset` adjusts on the next render cycle.

**`visibleHeight` computation**:
```ts
const RESERVED_ROWS =
  BANNER_LINES.length  // 5 — ASCII art banner
  + 1                  // marginBottom below banner
  + 1                  // command bar (1 line)
  + (startupError ? 1 : 0)     // StatusMessage if present
  + (showCompleted ? 1 : 0);   // "[showing completed]" indicator
const visibleHeight = Math.max(1, (stdout.rows ?? 24) - RESERVED_ROWS);
```

---

## Validation Rules

| Rule | Description |
|---|---|
| **VR-001** | `status` must be one of `'active'` or `'complete'` — enforced by existing column constraint and TypeScript union type |
| **VR-002** | `reactivateTask` must not be called with an `id` that does not exist in `tasks` — caller is responsible (existing pattern: UI handler guards on `currentRow` being defined) |
| **VR-003** | `scrollOffset` must always be `>= 0` and `<= Math.max(0, rows.length - visibleHeight)` — enforced by the clamp-scroll algorithm |

---

## No Migration Required

The only changes are:
- New `UPDATE` SQL statements (no DDL changes).
- New TypeScript functions in `queries.ts` and new callbacks in `useTasks.ts`.
- Additional `useState` in `App.tsx`.

No schema migration is needed. Existing SQLite databases are fully compatible.
