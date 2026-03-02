# Research: Subtask Completed/Total Ratio Badge

**Feature**: `005-subtask-ratio-badge`  
**Phase**: 0 — Research  
**Status**: Complete

---

## Research Questions

The following unknowns were extracted from the Technical Context analysis and resolved below.

---

### RQ-1: Where is the existing active-count badge rendered and how is data passed to it?

**Decision**: The badge is rendered inside `TaskItem.tsx`. Data flows as:
`useTasks` hook → `App.tsx` → `TaskList.tsx` → `TaskItem.tsx` via prop `activeSubtaskCount`.

**Rationale**: Traced from `src/hooks/useTasks.ts` → `src/components/TaskList.tsx` → `src/components/TaskItem.tsx`. TaskList receives both `subtaskCounts` (total, per-task loop in useTasks) and `activeSubtaskCounts` (from `getActiveSubtaskCounts` query), passes them separately to TaskItem.

**Impact on this feature**: Both numerator (active) and denominator (total) values are already available in `useTasks`. The badge change is localised to: one query function in `queries.ts`, the `useTasks` hook, `TaskList.tsx` props, and `TaskItem.tsx` rendering.

---

### RQ-2: What is the cheapest way to retrieve both active and total subtask counts?

**Decision**: Add a single combined aggregate query `getSubtaskRatioCounts` that returns `Record<number, { completed: number; total: number }>` for all given task IDs in one SQL round-trip.

```sql
SELECT
  task_id,
  COUNT(*)                                           AS total,
  SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS completed
FROM subtasks
WHERE task_id IN (…placeholders…)
GROUP BY task_id
```

**Rationale**: The current approach uses two separate data structures in `useTasks`:
- `subtaskCounts` — N individual `SELECT COUNT(*) … WHERE task_id = ?` queries (one per task, in a loop).
- `activeSubtaskCounts` — one bulk `getActiveSubtaskCounts` query (IN clause).

Replacing both with a single combined query eliminates a full loop of per-task DB hits and reduces to one query. This also simplifies the hook: one `useMemo` block instead of two.

**Alternatives considered**:
- Keep both separate queries: rejected — still requires N+1 queries (the loop in `subtaskCounts`).
- Add a DB view: rejected — violates Principle III (no second confirmed use case; raw SQL is already sufficient).

---

### RQ-3: Should `subtaskCounts` (used for `hasSubtasks` / accordion) be preserved separately?

**Decision**: No. Derive `hasSubtasks` from `subtaskRatioCounts[taskId].total > 0` at the `TaskList` call site. `subtaskCounts` as a standalone structure is removed.

**Rationale**: `subtaskCounts` was only used for two purposes:
1. `hasSubtasks` boolean in `TaskList` — derivable from `total > 0`.
2. Badge value — now superseded by `total` in the ratio.

Removing it cleans up the hook and component interfaces without losing functionality.

---

### RQ-4: What changes are needed in `TaskItem.tsx` props?

**Decision**: Replace `activeSubtaskCount?: number` with two props: `subtaskCompleted?: number` and `subtaskTotal?: number`. Badge renders `{subtaskCompleted}/{subtaskTotal}` when `subtaskTotal > 0`; hidden when `subtaskTotal === 0` or both are undefined.

**Rationale**: Two orthogonal values should be two props, not a compound object — consistent with the existing prop style of this component (all primitive). The new prop names are unambiguous about which count each represents.

**Alternatives considered**:
- Single object prop `subtaskRatio?: { active: number; total: number }` — rejected; object props introduce unnecessary wrapping and are less idiomatic in this component.
- Keep `activeSubtaskCount` + add `totalSubtaskCount` — rejected; the old name no longer conveys the full picture post-rename.

---

### RQ-5: Does FR-008 require deleting `getActiveSubtaskCounts`?

**Decision**: Yes. `getActiveSubtaskCounts` in `queries.ts` is removed; its call site in `useTasks` is replaced with `getSubtaskRatioCounts`. No other consumer exists.

**Rationale**: Keeping dead code violates Principle III. The new combined query is a strict superset of what the old function provided.

**Alternatives considered**: Mark as deprecated and keep — rejected; no external consumers, no backward-compat obligation.

---

## Summary of Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | New `getSubtaskRatioCounts` query replaces `getActiveSubtaskCounts` + `subtaskCounts` loop | Single SQL round-trip; simpler hook |
| 2 | `useTasks` exposes `subtaskRatioCounts: Record<number, {completed: number; total: number}>` | One source of truth for both numerator and denominator |
| 3 | `TaskItem` props renamed to `subtaskCompleted` + `subtaskTotal` | Two orthogonal primitive props; clear naming |
| 4 | `TaskList` derives `hasSubtasks` from `total > 0`; passes both props to `TaskItem` | No separate `subtaskCounts` map needed |
| 5 | No schema changes; no new dependencies | Pure derived data; Principle III compliant |
