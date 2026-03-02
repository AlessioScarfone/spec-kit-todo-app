# Data Model: Subtask Active/Total Ratio Badge

**Feature**: `005-subtask-ratio-badge`  
**Phase**: 1 — Design  
**Status**: Complete

---

## Overview

This feature introduces **no new database tables and no schema changes**. The active/total ratio is a pair of derived read-only aggregates computed from the existing `subtasks` table in a single query.

---

## Existing Entities (unchanged)

### Task

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `title` | TEXT NOT NULL | Non-empty enforced by CHECK constraint |
| `status` | TEXT | `'active'` \| `'complete'` |
| `position` | INTEGER | Insertion-order sort key |
| `created_at` | INTEGER | Unix epoch ms |

### Subtask

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `task_id` | INTEGER FK | References `tasks(id)` ON DELETE CASCADE |
| `title` | TEXT NOT NULL | Non-empty enforced by CHECK constraint |
| `status` | TEXT | `'active'` \| `'complete'` |
| `position` | INTEGER | Insertion-order sort key within parent task |
| `created_at` | INTEGER | Unix epoch ms |

---

## Derived Aggregate: Subtask Ratio

The badge values are not stored — they are derived on every render cycle refresh from live subtask data.

### Derivation Rules

```
total(taskId)  = COUNT(*)                                         FROM subtasks WHERE task_id = taskId
active(taskId) = COUNT(*) FILTER (WHERE status = 'active')        FROM subtasks WHERE task_id = taskId
```

Combined into a single SQL query across all visible task IDs:

```sql
SELECT
  task_id,
  COUNT(*)                                            AS total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
FROM subtasks
WHERE task_id IN (…)
GROUP BY task_id
```

### Result Type

```typescript
type SubtaskRatioCounts = Record<number, { active: number; total: number }>;
```

Tasks with zero subtasks will be **absent** from the result map. Consumers must default to `{ active: 0, total: 0 }` for absent keys.

---

## In-Memory Shape (useTasks hook)

| Property | Type | Description |
|----------|------|-------------|
| `subtaskRatioCounts` | `Record<number, { active: number; total: number }>` | Replaces both `subtaskCounts` and `activeSubtaskCounts` from feature 002 |

---

## Badge Display Logic

| Condition | Badge shown | Display |
|-----------|-------------|---------|
| `total === 0` (key absent or `total = 0`) | No | — |
| `total > 0` | Yes | `{active}/{total}` in dimmed style |

Examples:

| State | Badge |
|-------|-------|
| 1 active, 1 complete subtask | `1/2` |
| 3 active, 0 complete subtasks | `3/3` |
| 0 active, 2 complete subtasks | `0/2` |
| 12 active, 12 total subtasks | `12/12` |

---

## Removed Derived Views

The following from feature 002 are **retired** by this feature:

- `getActiveSubtaskCounts` in `src/db/queries.ts` — replaced by `getSubtaskRatioCounts`
- `subtaskCounts` (per-task loop) in `useTasks` — replaced by `subtaskRatioCounts`
- `activeSubtaskCounts` in `useTasks` — replaced by `subtaskRatioCounts`
