# Component Props Contract: TaskItem

**Feature**: `005-subtask-ratio-badge`  
**Consumer**: `TaskList.tsx`  
**Version**: 2.0 (replaces 1.0 from feature 002)

---

## Overview

`TaskItem` is the leaf component that renders a single task row in the TUI. This document defines its public prop contract after the ratio-badge update. Any caller that previously passed `activeSubtaskCount` **must** migrate to `subtaskActive` + `subtaskTotal`.

---

## Interface: `TaskItemProps`

```typescript
interface TaskItemProps {
  /** The task record to display. */
  task: Task;

  /** Whether this row is the currently selected row in the list. */
  isSelected: boolean;

  /** Whether the task's subtask list is currently expanded (accordion open). */
  isExpanded: boolean;

  /** Whether this task has at least one subtask (controls accordion indicator). */
  hasSubtasks: boolean;

  /**
   * Number of completed subtasks belonging to this task.
   * Used as the numerator of the ratio badge.
   * Defaults to 0. Badge is hidden when subtaskTotal is 0.
   */
  subtaskCompleted?: number;

  /**
   * Total number of subtasks (any status) belonging to this task.
   * Used as the denominator of the ratio badge.
   * Defaults to 0. Badge is hidden when this is 0.
   */
  subtaskTotal?: number;
}
```

---

## Badge Rendering Rules

| `subtaskTotal` | `subtaskCompleted` | Rendered badge |
|----------------|-----------------|-------------|
| 0 or absent    | any             | *(hidden)*  |
| > 0            | 0               | `0/{total}` dimmed |
| > 0            | > 0             | `{completed}/{total}` dimmed |

**Style**: the badge is rendered with `<Text dimColor>` — identical visual treatment to the `(done)` label. No brackets, no icons.

**Position**: inline after the task title, separated by a single space.

---

## Breaking Change from v1.0

| v1.0 prop (feature 002) | v2.0 replacement |
|-------------------------|-----------------|
| `activeSubtaskCount?: number` | `subtaskCompleted?: number` + `subtaskTotal?: number` |

Callers producing only `activeSubtaskCount` will no longer compile — TypeScript will surface this as a type error at `TaskList.tsx`.

---

## TaskListProps Changes

`TaskList.tsx` props also change in parallel:

```typescript
// BEFORE (features 001-004)
interface TaskListProps {
  subtaskCounts: Record<number, number>;
  activeSubtaskCounts: Record<number, number>;
  // …
}

// AFTER (feature 005)
interface TaskListProps {
  subtaskRatioCounts: Record<number, { completed: number; total: number }>;
  // …  (subtaskCounts and activeSubtaskCounts removed)
}
```

---

## Query Function Contract: `getSubtaskRatioCounts`

```typescript
/**
 * Returns completed and total subtask counts for each of the given task IDs.
 * Tasks with zero subtasks are absent from the result — callers must default to { completed: 0, total: 0 }.
 */
function getSubtaskRatioCounts(
  db: Database,
  taskIds: number[]
): Record<number, { completed: number; total: number }>
```

Replaces `getActiveSubtaskCounts`, which is removed.
