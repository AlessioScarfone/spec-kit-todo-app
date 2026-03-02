# Data Model: Incomplete Subtask Count Badge

**Feature**: `002-subtask-count-badge`  
**Phase**: 1 — Design  
**Status**: Complete

---

## Overview

This feature introduces **no new database tables and no schema changes**. The active subtask count is a derived read-only aggregate computed from the existing `subtasks` table.

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

## Derived View: Active Subtask Count

The badge count is not stored — it is derived on every render cycle from live subtask data.

### Derivation Rule

```
activeCount(taskId) = COUNT(*) FROM subtasks
                      WHERE task_id = taskId
                        AND status = 'active'
```

### Query (batch, single round-trip)

```sql
SELECT task_id, COUNT(*) AS cnt
FROM subtasks
WHERE status = 'active'
GROUP BY task_id
```

Result type: `Array<{ task_id: number; cnt: number }>`  
Consumed as: `Record<number, number>` (task_id → active count)  
Default (absent task): `0`

### Lifecycle

| Event | Effect on count |
|-------|----------------|
| Subtask added (status = `'active'`) | count + 1 |
| Subtask completed (status → `'complete'`) | count − 1 |
| Subtask deleted (any status) | count − 1 if was `'active'`, else unchanged |
| Parent task completed (all subtasks → `'complete'`) | count → 0 |

All changes propagate automatically: `forceReload()` increments `refreshToken`, invalidating the `activeSubtaskCounts` `useMemo`, triggering a re-query.

---

## Runtime Data Flow

```
SQLite subtasks table
        │
        │  getActiveSubtaskCounts(db, taskIds)  [queries.ts]
        ▼
Record<number, number>  activeSubtaskCounts
        │
        │  useMemo([db, tasks, refreshToken])   [useTasks.ts]
        ▼
useTasks() hook → App.tsx → TaskList.tsx → TaskItem.tsx
                                                │
                                                │  count > 0 ?
                                                ▼
                                      <Text dimColor> {count} </Text>
```

---

## TypeScript Interface Additions

### `queries.ts`

```typescript
// Returns map of task_id → active subtask count for all provided task IDs
export function getActiveSubtaskCounts(
  db: Database,
  taskIds: number[]
): Record<number, number>
```

### `useTasks.ts` (returned object addition)

```typescript
activeSubtaskCounts: Record<number, number>
```

### `TaskItemProps` addition

```typescript
activeSubtaskCount: number  // 0 means no badge rendered
```

### `TaskListProps` addition

```typescript
activeSubtaskCounts: Record<number, number>
```

---

## Validation Rules

- Count is always `>= 0` (guaranteed by SQL COUNT and status filter)
- Badge renders if and only if `activeSubtaskCount > 0` (FR-003)
- Count is always an integer; no rounding, no capping (spec assumption: full number shown for 10+)
