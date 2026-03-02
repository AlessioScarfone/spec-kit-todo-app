# Implementation Plan: Subtask Active/Total Ratio Badge

**Branch**: `005-subtask-ratio-badge` | **Date**: 2026-03-02 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/005-subtask-ratio-badge/spec.md`

## Summary

Replace the existing plain active-count badge (introduced in feature 002) with an `active/total` ratio badge displayed inline on each task row. The numerator is the count of non-completed subtasks; the denominator is the count of all subtasks. No schema changes are needed — both values are derived from the existing `subtasks` table via a new combined aggregate query.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js >= 22, `"type": "module"` (ES imports)  
**Primary Dependencies**: `ink` v6, `@inkjs/ui` v2, `react` — React-based TUI renderer; `better-sqlite3` v9  
**Storage**: SQLite via `better-sqlite3` — raw SQL only, no ORM  
**Testing**: `vitest` + `ink-testing-library`; in-memory SQLite (`:memory:`) for DB unit tests  
**Target Platform**: macOS, Linux, Windows terminal (CLI / TUI application)  
**Project Type**: CLI / TUI application  
**Performance Goals**: Sub-frame render latency for badge update on subtask state change (same synchronous useMemo pattern already used by app)  
**Constraints**: No new runtime dependencies; no schema migrations; must not break virtual-scroll row layout  
**Scale/Scope**: Single-user, local-only; up to ~100 tasks with ~20 subtasks each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Spec-First** | ✅ PASS | `spec.md` produced by `/speckit.specify` exists and is approved before any code changes |
| **II. Test-First** | ✅ PASS | Plan explicitly requires tests to be written and confirmed failing before implementation; TDD enforced in tasks.md |
| **III. Simplicity & YAGNI** | ✅ PASS | Minimal change set: one new query function, one hook reshape, two component prop changes. No new abstractions. No new dependencies. |
| **IV. Data Integrity** | ✅ PASS | Feature is read-only aggregation; no writes, no migrations, no data-loss risk |
| **V. Observability** | ✅ PASS | No new service-layer writes introduced; existing error handling untouched |

**Post-design re-check**: All five gates remain GREEN after Phase 1 design. No complexity violations to log.

## Project Structure

### Documentation (this feature)

```text
specs/005-subtask-ratio-badge/
├── plan.md              ← This file
├── research.md          ← Phase 0 output ✓
├── data-model.md        ← Phase 1 output ✓
├── quickstart.md        ← Phase 1 output ✓
├── contracts/
│   └── component-props.md  ← Phase 1 output ✓
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code Changes (repository root)

```text
src/
├── db/
│   └── queries.ts              ← ADD getSubtaskRatioCounts; REMOVE getActiveSubtaskCounts
├── hooks/
│   └── useTasks.ts             ← REPLACE subtaskCounts + activeSubtaskCounts with subtaskRatioCounts
└── components/
    ├── TaskItem.tsx             ← CHANGE props activeSubtaskCount → subtaskActive + subtaskTotal; UPDATE badge render
    └── TaskList.tsx             ← CHANGE props subtaskCounts + activeSubtaskCounts → subtaskRatioCounts; derive hasSubtasks from total

tests/
├── unit/
│   ├── db/
│   │   └── queries.test.ts     ← ADD tests for getSubtaskRatioCounts (write first — TDD)
│   └── hooks/
│       └── useTasks.test.tsx   ← UPDATE tests for subtaskRatioCounts shape
└── integration/
    └── components/
        └── App.test.tsx        ← UPDATE badge assertions from [N] to N/M format
```

**Structure Decision**: Single-project layout. All changes are confined to existing files — no new source files created. The feature is purely a reshape of an existing derived-data pipeline.

## Complexity Tracking

No complexity violations. All changes satisfy Principle III:

- No new abstractions introduced.
- No new dependencies.
- Combining two queries into one is simpler, not more complex.
- Removing `getActiveSubtaskCounts` and the `subtaskCounts`/`activeSubtaskCounts` pair reduces total surface area.

## Implementation Blueprint

### Step 1 — DB Query (`src/db/queries.ts`)

**Add** `getSubtaskRatioCounts`:

```typescript
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
```

**Remove** `getActiveSubtaskCounts` (no remaining callers after hook update).

### Step 2 — Hook (`src/hooks/useTasks.ts`)

Replace the two `useMemo` blocks for `subtaskCounts` and `activeSubtaskCounts`:

```typescript
const subtaskRatioCounts = useMemo(
  () => queries.getSubtaskRatioCounts(db, tasks.map((t) => t.id)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [db, tasks, refreshToken]
);
```

Expose `subtaskRatioCounts` from the hook return value; remove `subtaskCounts` and `activeSubtaskCounts`.

### Step 3 — TaskItem component (`src/components/TaskItem.tsx`)

Props change: replace `activeSubtaskCount?: number` with `subtaskActive?: number` + `subtaskTotal?: number`.

Badge render:

```tsx
{(subtaskTotal ?? 0) > 0 && (
  <Text dimColor> {subtaskActive ?? 0}/{subtaskTotal}</Text>
)}
```

### Step 4 — TaskList component (`src/components/TaskList.tsx`)

Props change: replace `subtaskCounts + activeSubtaskCounts` with `subtaskRatioCounts: Record<number, { active: number; total: number }>`.

Derive `hasSubtasks` and pass values to `TaskItem`:

```tsx
const ratio = subtaskRatioCounts[row.task.id] ?? { active: 0, total: 0 };
<TaskItem
  key={`task-${row.task.id}`}
  task={row.task}
  isSelected={isSelected}
  isExpanded={expandedTaskIds.has(row.task.id)}
  hasSubtasks={ratio.total > 0}
  subtaskActive={ratio.active}
  subtaskTotal={ratio.total}
/>
```

### Step 5 — App.tsx

Update the `<TaskList>` call to pass `subtaskRatioCounts` instead of the removed props.

## Test Plan (TDD — write before implementation)

| Test | File | Level |
|------|------|-------|
| `getSubtaskRatioCounts` returns correct active + total for mixed states | `queries.test.ts` | Unit |
| `getSubtaskRatioCounts` returns empty map for empty taskIds | `queries.test.ts` | Unit |
| `getSubtaskRatioCounts` omits tasks with zero subtasks | `queries.test.ts` | Unit |
| `getSubtaskRatioCounts` returns `0` active when all subtasks complete | `queries.test.ts` | Unit |
| Badge renders `1/2` for 1 active of 2 subtasks | `App.test.tsx` | Integration |
| Badge renders `0/2` when all subtasks complete | `App.test.tsx` | Integration |
| No badge when task has zero subtasks | `App.test.tsx` | Integration |
| Completing a subtask transitions badge from `2/2` → `1/2` | `App.test.tsx` | Integration |
| Adding a subtask transitions badge from `1/1` → `2/2` | `App.test.tsx` | Integration |
| `useTasks` exposes `subtaskRatioCounts` with correct shape | `useTasks.test.tsx` | Unit |
