# Tasks: Subtask Completed/Total Ratio Badge

**Feature**: `005-subtask-ratio-badge`  
**Input**: [plan.md](plan.md) · [spec.md](spec.md) · [data-model.md](data-model.md) · [research.md](research.md) · [contracts/component-props.md](contracts/component-props.md) · [quickstart.md](quickstart.md)  
**TDD**: Tests MUST be written and confirmed FAILING before the corresponding implementation task begins (Constitution Principle II — NON-NEGOTIABLE)

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (targets different files, no blocking dependency)
- **[US1/US2/US3]**: Which user story this task belongs to
- All file paths are relative to repository root

---

## Phase 1: Setup — Verify Baseline

**Purpose**: Confirm the existing test suite is green and TypeScript compiles before any changes are made. This creates a known-good baseline.

- [X] T001 Run `npm test` — confirm all existing tests pass (no file changes)

**Checkpoint**: All tests green — safe to begin foundational changes

---

## Phase 2: Foundational — DB Query + Hook

**Purpose**: Introduce `getSubtaskRatioCounts` (the single combined aggregate query) and reshape `useTasks` to expose `subtaskRatioCounts`. These are the **only** blocking prerequisites — all three user story phases depend on this data pipeline being correct.

⚠️ **Write tests FIRST — verify they FAIL before implementing**

- [X] T002 [P] Write failing unit tests for `getSubtaskRatioCounts` (4 cases: empty taskIds, mixed states, zero-subtask task omitted, all-complete returns completed=N) in `tests/unit/db/queries.test.ts`
- [X] T003 [P] Write failing unit test for `subtaskRatioCounts` shape `{ completed, total }` in `tests/unit/hooks/useTasks.test.tsx`
- [X] T004 Implement `getSubtaskRatioCounts` in `src/db/queries.ts` using `SUM(CASE WHEN status = 'complete')` for the numerator — confirm T002 tests now pass
- [X] T005 Remove `getActiveSubtaskCounts` from `src/db/queries.ts` (no remaining callers after T006)
- [X] T006 Update `useTasks` hook in `src/hooks/useTasks.ts` — replace the `subtaskCounts` per-task loop and `activeSubtaskCounts` useMemo with a single `subtaskRatioCounts` useMemo; remove both from hook return value; expose `subtaskRatioCounts` — confirm T003 test now passes

**Checkpoint**: `getSubtaskRatioCounts` and `useTasks` deliver `Record<number, { active: number; total: number }>` — ready for all user story phases

---

## Phase 3: User Story 1 — See Active vs. Total Subtask Progress (Priority: P1) 🎯 MVP

**Goal**: The task list shows a dimmed `active/total` ratio badge (e.g. `1/2`) inline after each task title, for any task with at least one subtask. No badge appears when a task has zero subtasks.

**Independent Test**: View the task list with tasks in mixed subtask states — confirm each badge shows the correct ratio; confirm no badge appears on a zero-subtask task.

⚠️ **Write tests FIRST — verify they FAIL before implementing**

- [X] T007 [US1] Write failing integration tests for US1 display (3 scenarios: `1/2` shown, `3/3` shown, no badge for zero subtasks) in `tests/integration/components/App.test.tsx`
- [X] T008 [US1] Update `TaskItemProps` interface, prop defaults, and badge render in `src/components/TaskItem.tsx` — replace `activeSubtaskCount?: number` with `subtaskCompleted?: number` + `subtaskTotal?: number`; render `{subtaskCompleted ?? 0}/{subtaskTotal}` in `<Text dimColor>` when `subtaskTotal > 0`
- [X] T009 [US1] Update `TaskListProps` and `TaskItem` call site in `src/components/TaskList.tsx` — replace `subtaskCounts: Record<number, number>` and `activeSubtaskCounts: Record<number, number>` with `subtaskRatioCounts: Record<number, { completed: number; total: number }>`; derive `hasSubtasks` from `ratio.total > 0`; pass `subtaskCompleted={ratio.completed}` and `subtaskTotal={ratio.total}`
- [X] T010 [US1] Update `<TaskList>` props in `src/components/App.tsx` — pass `subtaskRatioCounts` instead of the removed `subtaskCounts` and `activeSubtaskCounts` — confirm T007 tests now pass

**Checkpoint**: US1 complete — badge displays `active/total` correctly; all US1 tests green; `npm run build` compiles with no TypeScript errors

---

## Phase 4: User Story 2 — Ratio Updates When a Subtask Is Completed (Priority: P2)

**Goal**: When the user marks a subtask as complete, the badge numerator decreases by 1 immediately. The denominator is unchanged. Re-activating a subtask increases the numerator by 1.

**Independent Test**: Start with a task showing `2/3`; complete one subtask → badge shows `1/3`. Complete the last active subtask → badge shows `0/3`.

⚠️ **Write tests FIRST — verify they FAIL before implementing**

- [X] T011 [US2] Write failing integration tests for US2 completion-triggered updates (3 scenarios: `0/3`→`1/3`, `0/1`→`1/1`, reactivate `1/1`→`0/1`) in `tests/integration/components/App.test.tsx`
- [X] T012 [US2] Run test suite — confirm T011 tests pass with no additional code changes; if any fail, trace and fix the reactive update chain in `src/hooks/useTasks.ts` or `src/db/queries.ts`

**Checkpoint**: US2 complete — badge updates immediately on subtask completion/re-activation; all US2 tests green

---

## Phase 5: User Story 3 — Ratio Updates When Subtasks Are Added or Deleted (Priority: P3)

**Goal**: Adding a new subtask increases both numerator and denominator (new subtask is active); deleting an active subtask decreases both; deleting a completed subtask decreases only the denominator. Badge appears on first add; disappears only if all subtasks are deleted (total returns to 0).

**Independent Test**: Task with no badge → add subtask → badge shows `1/1` → add second → `2/2` → delete the first (completed) subtask → `2/2` becomes `1/1`.

⚠️ **Write tests FIRST — verify they FAIL before implementing**

- [X] T013 [US3] Write failing integration tests for US3 add/delete mutations (4 scenarios: no-badge + add → `0/1`; `1/2` + add → `1/3`; `1/2` + delete completed → `0/1`; `1/2` + delete active → `1/1`) in `tests/integration/components/App.test.tsx`
- [X] T014 [US3] Run test suite — confirm T013 tests pass with no additional code changes; if any fail, trace and fix in `src/hooks/useTasks.ts` or `src/db/queries.ts`

**Checkpoint**: US3 complete — badge reflects correct totals after add/delete; all US3 tests green

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Update stale test assertions from the old `[N]` badge format, confirm full compile health, and manual spot-check.

- [X] T015 [P] Update any remaining stale badge assertions that still reference the old `[activeCount]` / `[N]` format in `tests/integration/components/App.test.tsx` and `tests/unit/hooks/useTasks.test.tsx`
- [X] T016 Run full test suite and TypeScript compile: `npm test && npm run build` — confirm 0 failures and 0 type errors
- [X] T017 Manual spot-check using `quickstart.md` verification steps — confirm `1/2`, `0/2`, `2/2`, and no-badge cases all render correctly in the terminal

**Checkpoint**: All phases complete — feature is shipped

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (baseline)
  └─► Phase 2 (foundational: query + hook)
        └─► Phase 3 (US1: components) ──► Phase 4 (US2: completion tests) ──► Phase 5 (US3: add/delete tests)
                                                                                      └─► Phase 6 (polish)
```

### User Story Dependencies

| Story | Depends on | Independently testable? |
|-------|-----------|------------------------|
| US1 (P1) | Phase 2 complete | ✅ Yes — badge display verifiable in isolation |
| US2 (P2) | Phase 3 (US1) complete | ✅ Yes — reactive update verifiable without US3 |
| US3 (P3) | Phase 2 complete | ✅ Yes — add/delete mutations verifiable without US2 |

### Within Each Phase

1. Test tasks (T002, T003, T007, T011, T013) — **write and confirm FAILING first**
2. Implementation tasks — make the failing tests pass
3. Run full suite at each checkpoint before advancing

### Parallel Opportunities

- T002 and T003 can run in parallel (different files: `queries.test.ts` vs `useTasks.test.tsx`)
- T004 and T005 can run in parallel (both in `queries.ts` but non-overlapping changes)
- T008 and T009 can run in parallel (different files: `TaskItem.tsx` vs `TaskList.tsx`)
- T015 can run independently of T016 and T017

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Simultaneously write both failing test files:
Task T002: tests/unit/db/queries.test.ts      ← getSubtaskRatioCounts unit tests
Task T003: tests/unit/hooks/useTasks.test.tsx ← subtaskRatioCounts shape test

# Then implement (T004 and T005 are in the same file but non-overlapping):
Task T004: add getSubtaskRatioCounts to src/db/queries.ts
Task T005: remove getActiveSubtaskCounts from src/db/queries.ts
```

## Parallel Example: Phase 3 (US1 Components)

```bash
# After T007 tests are written and confirmed failing:
Task T008: src/components/TaskItem.tsx  ← prop rename + badge render
Task T009: src/components/TaskList.tsx  ← prop reshape + hasSubtasks derivation
# Then:
Task T010: src/components/App.tsx       ← update <TaskList> call site
```

---

## Implementation Strategy

### MVP: User Story 1 Only (Phase 1 → 2 → 3)

1. Complete Phase 1 — confirm baseline
2. Complete Phase 2 — query + hook (foundational)
3. Complete Phase 3 — components (US1 badge display)
4. **STOP and VALIDATE**: run `npm test && npm run build`; manually verify badge in terminal
5. Commit `feat: add active/total ratio badge display (US1)`

### Full Delivery (all stories)

After MVP is validated:
- Phase 4 (US2) → commit `test: verify ratio badge reactive on completion (US2)`
- Phase 5 (US3) → commit `test: verify ratio badge reactive on add/delete (US3)`
- Phase 6 (Polish) → commit `chore: clean up stale badge test assertions`

---

## Summary

| Phase | Tasks | Story | Description |
|-------|-------|-------|-------------|
| 1 | T001 | — | Verify baseline |
| 2 | T002–T006 | — | Foundational: `getSubtaskRatioCounts` + `useTasks` |
| 3 | T007–T010 | US1 | Badge display (MVP) |
| 4 | T011–T012 | US2 | Reactive update on subtask completion |
| 5 | T013–T014 | US3 | Reactive update on add/delete |
| 6 | T015–T017 | — | Polish, compile, manual check |
| **Total** | **17** | | |

**Parallel opportunities**: 5 identified  
**MVP scope**: Phases 1–3 (tasks T001–T010, US1 only)  
**Independent test criteria**:
- US1: task list displays `active/total` badge correctly from static data
- US2: completing a subtask immediately decrements the badge numerator
- US3: adding/deleting subtasks immediately updates both badge values
