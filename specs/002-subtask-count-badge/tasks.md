# Tasks: Incomplete Subtask Count Badge

**Branch**: `002-subtask-count-badge`
**Input**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md)
**Tests**: Included — Constitution Principle II is NON-NEGOTIABLE; tests written first and confirmed failing before implementation begins
**Organization**: Tasks grouped by user story; each story independently testable

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelisable (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

## Codebase Context

- `useTasks.ts` already has `subtaskCounts` (total subtasks, drives accordion indicator) — MUST NOT change
- New `activeSubtaskCounts` (active-only) added alongside it for the badge
- `refreshToken` / `forceReload` pattern already drives reactivity for all mutations — US2 and US3 require no additional code
- Prop chain: `useTasks` → `App.tsx` → `TaskList.tsx` → `TaskItem.tsx`

---

## Phase 1: Tests — Write First, All Must FAIL Before Phase 2 Begins

**Purpose**: Establish the failing test suite (red step of TDD). No implementation code exists yet.

**⚠️ CRITICAL**: Do NOT proceed to Phase 2 until `npm test` confirms these suites appear and fail for the right reason (missing export or assertion failure — not a syntax/config error).

- [X] T001 [P] [US1] Write unit tests for `getActiveSubtaskCounts` in `tests/unit/db/queries.test.ts` — add `describe('002: getActiveSubtaskCounts')` covering: (a) returns `{}` when `taskIds` is empty, (b) returns `{}` when no subtasks exist, (c) counts only `active` subtasks per task, (d) ignores `complete` subtasks, (e) handles multiple tasks in one call, (f) correctly counts 12+ active subtasks for a single task — full integer displayed without truncation
- [X] T002 [P] [US1] Write hook tests for `activeSubtaskCounts` in `tests/unit/hooks/useTasks.test.tsx` — add `describe('002: activeSubtaskCounts')` covering: (a) is `{}` when no tasks exist, (b) reflects active count after `addSubtask`, (c) decrements after `completeSubtask`, (d) absent/0 after all subtasks of a task are completed
- [X] T003 [P] [US1] Write integration tests for badge rendering in `tests/integration/components/App.test.tsx` — add `describe('002: subtask count badge')` covering: (a) badge absent when task has no subtasks, (b) badge shows correct count with mixed active/complete subtasks, (c) badge disappears when last active subtask is completed, (d) badge decrements after pressing `d` on an active subtask, (e) badge appears at `1` when a subtask is added to a task with no badge (US3 add path), (f) badge decrements from `2` to `1` when one of two active subtasks is completed (US2 intermediate state), (g) after badge renders, task title string is still fully present in the frame (layout non-regression)
- [X] T013 [P] Write integration test for bulk-complete edge case in `tests/integration/components/App.test.tsx` — add to `describe('002: subtask count badge')`: pressing `c` on a parent task (bulk-completes all its subtasks) causes the badge to disappear for that task
- [X] T014 [P] Write integration test for show-completed toggle edge case in `tests/integration/components/App.test.tsx` — add to `describe('002: subtask count badge')`: toggling `h` to show completed tasks — a task with all subtasks completed shows no badge

**Checkpoint**: `npm test` — all five suites/cases appear and fail. Proceed to Phase 2.

---

## Phase 2: Foundational — Data Layer (Blocking for All Story Phases)

**Purpose**: Add the batch SQL query that all implementation tasks depend on.

**⚠️ CRITICAL**: All US phases are blocked until this phase is complete.

- [X] T004 Add `getActiveSubtaskCounts(db: Database, taskIds: number[]): Record<number, number>` to `src/db/queries.ts` — guard: return `{}` immediately when `taskIds.length === 0`; run `SELECT task_id, COUNT(*) as cnt FROM subtasks WHERE task_id IN (…) AND status = 'active' GROUP BY task_id`; default missing task IDs to 0

**Checkpoint**: `npx vitest run tests/unit/db/queries.test.ts` — the `002: getActiveSubtaskCounts` suite is green. Foundation ready.

---

## Phase 3: User Story 1 — See pending subtask workload at a glance (Priority: P1) 🎯 MVP

**Goal**: Wire `activeSubtaskCounts` through the full prop chain and render a `dimColor` integer badge to the right of each task title. Badge is absent when count is zero.

**Independent Test**: Add a task with 3 active + 1 completed subtask → see `3`. Complete all remaining → badge disappears. Multiple tasks each show their own independent count.

### Implementation for User Story 1

- [X] T005 [US1] Add `activeSubtaskCounts` useMemo to `src/hooks/useTasks.ts` — call `getActiveSubtaskCounts(db, tasks.map(t => t.id))` with deps `[db, tasks, refreshToken]`; include `activeSubtaskCounts` in the hook return object
- [X] T006 [US1] Destructure `activeSubtaskCounts` from `useTasks(db)` in `src/components/App.tsx` and pass it as prop `activeSubtaskCounts` to `<TaskList>`
- [X] T007 [US1] Add `activeSubtaskCounts: Record<number, number>` to `TaskListProps` in `src/components/TaskList.tsx`; pass `activeSubtaskCount={activeSubtaskCounts[row.task.id] ?? 0}` to each `<TaskItem>`
- [X] T008 [US1] Add `activeSubtaskCount?: number` to `TaskItemProps` in `src/components/TaskItem.tsx`; render `<Text dimColor> {activeSubtaskCount}</Text>` after the title `<Text>` and before `(done)`, conditional on `activeSubtaskCount > 0` — use `dimColor` not `color="gray"`

**Checkpoint**: `npm test` — all three `002:` suites green. US1 fully functional and testable independently.

---

## Phase 4: User Story 2 — Count stays accurate as subtasks are completed (Priority: P2)

**Goal**: Completing a subtask immediately decrements the badge. Completing the last active subtask hides the badge entirely.

> **No new implementation code required.** `completeSubtask` already calls `reload()` → `refreshToken` increments → `activeSubtaskCounts` useMemo recomputes. Test T003(c) already covers this.

- [X] T009 [US2] Confirm `tests/integration/components/App.test.tsx` test T003(c) ("badge disappears when last subtask completed") passes — no code changes needed
- [X] T010 [US2] Manually verify in running app (`npm start`): add 2 subtasks to a task, press `c` on one → count drops to `1`; press `c` on the remaining → badge disappears

**Checkpoint**: US2 automated test green + manual smoke passed.

---

## Phase 5: User Story 3 — Count stays accurate when subtasks are added or deleted (Priority: P3)

**Goal**: Adding a subtask shows or increments the badge. Deleting an active subtask decrements it.

> **No new implementation code required.** `insertSubtask` and `deleteSubtask` both call `reload()`. Test T003(d) already covers the delete path.

- [X] T011 [US3] Confirm `tests/integration/components/App.test.tsx` test T003(d) ("badge decrements after delete") passes — no code changes needed
- [X] T012 [US3] Manually verify in running app (`npm start`): add a subtask to a task with no badge → badge appears at `1`; press `d` on that subtask → badge disappears

**Checkpoint**: US3 automated test green + manual smoke passed.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 [P] Confirm test T013 (bulk-complete → badge disappears) written in Phase 1 passes — no code changes needed
- [X] T014 [P] Confirm test T014 (show-completed toggle → no badge) written in Phase 1 passes — no code changes needed
- [X] T015 [P] Run `npx tsc --noEmit` and confirm zero type errors across all changed files

**Checkpoint**: All tests pass, TypeScript clean. Feature complete.

---

## Dependencies & Execution Order

```
T001 [P] ─┐
T002 [P] ─┤
T003 [P] ─┼─ (write in parallel) → confirm red → T004 ─► T005 → T006 → T007 → T008
T013 [P] ─┤                                        │
T014 [P] ─┘                                        └─► T009, T011, T013✓, T014✓ (verify only, after T008)

T015 [P] ─── (run after all story checkpoints, parallel with T013✓ and T014✓)
```

**US1 prop chain** (sequential — each step depends on the previous):
`T004 → T005 → T006 → T007 → T008`

**PR-ready after**: T008 + T003 suite green = US1 complete = MVP shippable.

---

## Parallel Execution Examples

**Phase 1** — write all test files simultaneously:
```
T001 (queries.test.ts) ‖ T002 (useTasks.test.tsx) ‖ T003 (App.test.tsx) ‖ T013 (bulk-complete edge) ‖ T014 (show-completed edge)
```

**Phase 6** — polish checks simultaneously:
```
T013 (bulk-complete edge case) ‖ T014 (show-completed toggle edge case) ‖ T015 (tsc --noEmit)
```

---

## Implementation Strategy

**MVP scope** (US1 only, TDD):
1. Write tests: T001 ‖ T002 ‖ T003 → confirm red
2. Implement: T004 → T005 → T006 → T007 → T008 → confirm all `002:` suites green
3. **STOP and VALIDATE** — US2 and US3 reactivity comes for free via `refreshToken`

**Full delivery**: Phases 1–3 + verify US2 (T009, T010) + verify US3 (T011, T012) + polish (T013–T015)

**Summary**: 15 tasks total — 3 test-file tasks, 5 implementation tasks, 4 verification tasks, 3 polish tasks.

| File | Tasks | Change |
|------|-------|--------|
| `tests/unit/db/queries.test.ts` | T001 | Add `describe('002: getActiveSubtaskCounts')` (incl. >9 subtasks case) |
| `tests/unit/hooks/useTasks.test.tsx` | T002 | Add `describe('002: activeSubtaskCounts')` |
| `tests/integration/components/App.test.tsx` | T003, T013, T014, T009, T011 | Add `describe('002: subtask count badge')` with all acceptance + edge cases |
| `src/db/queries.ts` | T004 | Add `getActiveSubtaskCounts` batch query |
| `src/hooks/useTasks.ts` | T005 | Add `activeSubtaskCounts` useMemo + return |
| `src/components/App.tsx` | T006 | Pass `activeSubtaskCounts` to `<TaskList>` |
| `src/components/TaskList.tsx` | T007 | Thread `activeSubtaskCounts` → `<TaskItem>` |
| `src/components/TaskItem.tsx` | T008 | Render `dimColor` count badge when > 0 |
