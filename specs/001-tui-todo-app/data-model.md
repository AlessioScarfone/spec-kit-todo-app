# Data Model: Terminal Todo App (001-tui-todo-app)

**Date**: 2026-03-02  
**Source**: spec.md — Key Entities + Functional Requirements

---

## Entities

### Task

Represents a top-level unit of work.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal unique identifier |
| `title` | TEXT | NOT NULL, length > 0 | User-provided title (non-empty; duplicates allowed) |
| `status` | TEXT | NOT NULL, CHECK IN (`active`, `complete`) | Lifecycle state |
| `position` | INTEGER | NOT NULL | Insertion-order index for display ordering |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (ms) |

**Rules:**
- `title` MUST NOT be empty (enforced at application layer before DB write)
- `status` transitions: `active` → `complete` (via `c`); either → deleted (via `d`)
- Deleted tasks are physically removed from the database (no soft-delete)
- `position` is assigned as `MAX(position) + 1` on insert; gaps are acceptable after deletes

---

### Subtask

Represents a child item belonging to exactly one parent `Task`.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal unique identifier |
| `task_id` | INTEGER | NOT NULL, FOREIGN KEY → Task.id ON DELETE CASCADE | Parent task reference |
| `title` | TEXT | NOT NULL, length > 0 | User-provided title (non-empty; duplicates allowed within parent) |
| `status` | TEXT | NOT NULL, CHECK IN (`active`, `complete`) | Lifecycle state |
| `position` | INTEGER | NOT NULL | Insertion-order index within the parent task |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (ms) |

**Rules:**
- `ON DELETE CASCADE` ensures all subtasks are removed when the parent task is deleted
- When a parent task is completed (`c`), all its subtasks are also set to `complete` in a single transaction
- Subtasks support one level of nesting only (no `parent_subtask_id`)
- `position` is scoped to `task_id` (insertion order within the parent)

---

## State Machine — Task / Subtask Lifecycle

```
          [created]
              │
              ▼
          ┌────────┐
          │ active │◄────── (new task or subtask)
          └────────┘
           │      │
     [c]   │      │  [d]
           │      │
           ▼      ▼
     ┌──────────┐  ┌─────────┐
     │ complete │  │ DELETED │
     └──────────┘  └─────────┘
           │
     [d]   │
           ▼
       ┌─────────┐
       │ DELETED │
       └─────────┘
```

- `active → complete`: pressing `c` on the item
- `active → DELETED`: pressing `d` on the item  
- `complete → DELETED`: pressing `d` on the item while completed items are visible (`h` toggled on)

---

## Relationships

```
Task 1 ──── 0..* Subtask
```

- One Task has zero or more Subtasks
- A Subtask belongs to exactly one Task
- Cascade delete is enforced at the database level

---

## Persistence Notes

- Storage: SQLite file at `{env-paths('todo-tui').data}/tasks.db`
- WAL mode enabled for reliability (`PRAGMA journal_mode = WAL`)
- Migrations run on startup; schema versioned via `PRAGMA user_version`
- All multi-row writes (e.g., completing a task + all subtasks) execute in a single transaction
- On startup, if the file is missing it is created fresh; if it is corrupted (SQLite NOTADB error), the user is notified and an empty database is created at the same path

---

## UI-Only State (not persisted)

| State | Description |
|---|---|
| `selectedIndex` | Currently highlighted row index in the list |
| `expandedTaskIds` | Set of task IDs whose subtasks are currently visible |
| `showCompleted` | Boolean toggle for displaying completed items |
| `inputMode` | `idle` \| `addTask` \| `addSubtask` — current input state |
