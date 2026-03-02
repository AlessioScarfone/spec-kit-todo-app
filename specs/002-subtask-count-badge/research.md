# Research: Incomplete Subtask Count Badge

**Feature**: `002-subtask-count-badge`  
**Phase**: 0 — All unknowns resolved before Phase 1 design  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## R-001: How to compute the active subtask count per task

**Question**: Should we compute active subtask counts in a batch SQL query (single round-trip across all tasks), or per-task inline inside the existing `subtaskCounts` `useMemo`?

**Decision**: Batch SQL query using `GROUP BY task_id` in a single statement, returning a map of `task_id → count`.

**Rationale**:
- The existing `subtaskCounts` pattern uses a per-task loop with individual `SELECT COUNT(*)` calls — this is acceptable for low data volume but creates N+1 queries.
- Adding a *second* per-task loop for active counts would double that N+1. A single `GROUP BY` query retrieves all counts in one pass.
- Replacing the existing `subtaskCounts` loop with a `GROUP BY` query as well would be a scope increase not covered by this spec — deferred.
- Keeps all SQL in `queries.ts` consistent with the project's "raw SQL only" constraint (Principle III).

**Implementation**:
```sql
SELECT task_id, COUNT(*) AS cnt
FROM subtasks
WHERE status = 'active'
GROUP BY task_id
```
Returned as `Record<number, number>` (task_id → active count). Tasks absent from the result have count 0.

**Alternatives considered**:
- *Per-task loop (N+1 SELECT)*: Consistent with existing `subtaskCounts` pattern but doubles queries. Rejected to avoid compounding the N+1.
- *Modify existing `subtaskCounts` to also return active count*: Would require changing an established interface; rejected — YAGNI; the two maps serve different semantics (total for accordion, active for badge).

---

## R-002: Where in the data flow to surface the active count

**Question**: Should `activeSubtaskCounts` be derived inside `useTasks`, or computed on-the-fly inside `TaskList`/`TaskItem`?

**Decision**: Derived in `useTasks` via a new `useMemo`, returned alongside `subtaskCounts`.

**Rationale**:
- All DB access is centralised in `useTasks`; components never hold DB references directly. Breaking this pattern would violate the existing architecture layer boundary.
- The `useMemo` depends on `[db, tasks, refreshToken]` — matching the existing `subtaskCounts` memo — so it automatically invalidates on every mutation (add, complete, delete) via `forceReload`.
- Keeps `TaskItem` a pure presentational component with no DB awareness.

**Alternatives considered**:
- *Compute in `TaskList`*: Would require passing `db` down to `TaskList`, breaking the DB-free component layer. Rejected.
- *Add to `Task` type as a computed field*: Would denormalise DB-shape types; `Task` maps directly to the `tasks` table row. Rejected.

---

## R-003: How to render the badge in `TaskItem`

**Question**: What exact JSX renders the count badge, and how does it interact with the existing `(done)` label?

**Decision**: Add `<Text dimColor> {count}</Text>` immediately after `<Text strikethrough={isComplete}>{task.title}</Text>` and before the `(done)` label, conditional on `count > 0`.

**Rationale**:
- Spec FR-002 specifies `dimColor` — the same prop used on the `(done)` label — for visual consistency.
- Spec FR-006 requires no layout disruption; Ink's `<Text>` inline rendering within a `<Box>` produces no layout shift.
- Position: after the title, before `(done)` — preserves natural reading order (title → workload remaining → completion state).
- The count is a plain integer with a single leading space for separation (e.g., `❯   My Task 3 (done)`).

**Final rendered anatomy** (task with 3 active subtasks, completed):
```
❯ ▶ My Task  3 (done)
     ↑title  ↑badge ↑done-label
```
Both badge and `(done)` use `dimColor`; the badge is absent when count is 0.

**Alternatives considered**:
- *Parentheses around count, e.g., `(3)`*: Spec assumption explicitly states "plain integer — no suffix, no icon". Rejected.
- *`color="gray"`*: Spec assumption explicitly specifies `dimColor`, not `color="gray"`. Rejected.
- *Separate `<Box>` column for the badge*: Introduces layout complexity and could shift title column width. Rejected (FR-006).

---

## R-004: Prop threading path

**Question**: What is the minimal change to the component prop chain to deliver the count to `TaskItem`?

**Decision**: Add `activeSubtaskCounts: Record<number, number>` to `TaskListProps` and `TaskItemProps`, thread from `App` → `TaskList` → `TaskItem`.

**Rationale**:
- Follows the exact same pattern as `subtaskCounts` which is already threaded identically.
- Minimal surface change; no context, no global store introduction.
- Five files touched in total: `queries.ts`, `useTasks.ts`, `App.tsx`, `TaskList.tsx`, `TaskItem.tsx`.

**Alternatives considered**:
- *React context for counts*: Over-engineering for a prop that travels only 2 levels. Principle III violation. Rejected.
- *Merge `activeSubtaskCounts` into `subtaskCounts`* (make it a two-field object): Would require refactoring existing callers. Out of scope. Rejected.
