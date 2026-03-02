# Tasks: Tab Key Subtask Toggle

**Input**: Design documents from `/specs/003-tab-toggle-subtasks/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All paths are relative to repository root

---

## Phase 1: User Story 1 - Tab Toggle Subtask Visibility (Priority: P1) 🎯 MVP

**Goal**: `Tab` expands collapsed subtasks and collapses expanded subtasks on the selected task row, with no-op behaviour on subtask rows and tasks without subtasks.

**Independent Test**: Launch the app, create a task, add subtasks. Press `Tab` on the parent task — subtasks collapse. Press `Tab` again — subtasks expand. Verify `→` and `←` still work as before. Press `Tab` while a subtask row is selected — nothing changes.

### Tests for User Story 1 ⚠️ Write and confirm FAILING before T002

- [X] T001 [US1] Write failing integration test for Tab toggle in `tests/integration/components/App.test.tsx` — must cover all five acceptance scenarios from spec.md: (1) Tab expands collapsed subtasks, (2) Tab collapses expanded subtasks, (3) repeated Tab alternates state, (4) Tab is no-op when task has no subtasks, (5) Tab is no-op when a subtask row is selected. Confirm tests **fail** before proceeding to T002.

### Implementation for User Story 1

- [X] T002 [US1] Add Tab key handler to `useInput` in `src/components/App.tsx` — when `key.tab` is true, `currentRow?.kind === 'task'`, **and** `(subtaskCounts[currentRow.task.id] ?? 0) > 0`, call `toggleExpand(currentRow.task.id)`. The count guard satisfies FR-006 (no-op on tasks with no subtasks) and matches the existing `→` handler pattern exactly.
- [X] T003 [P] [US1] Update Subtask Accordion table in `specs/001-tui-todo-app/contracts/keyboard-schema.md` — add `Tab` row: "Toggle (expand if collapsed, collapse if expanded) subtask list under selected task" with same conditions as `→`/`←`

**Checkpoint**: T001 tests now pass. Tab toggles subtasks; arrow keys unchanged; no-ops are correct.

---

## Phase 2: Polish & Cross-Cutting Concerns

- [X] T004 Run existing test suite (`npm test`) to confirm no regressions from T002

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: T001 (tests) MUST complete and fail before T002 (implementation); T003 can run in parallel with T002 (different file)
- **Phase 2 (Polish)**: Depends on T002 completion before running tests

### User Story Dependencies

- **US1 (P1)**: Only user story; self-contained

### Parallel Opportunities

- T001 and T002 touch different files — they can be executed in parallel

---

## Parallel Example: User Story 1

```bash
# T002 and T003 can run in parallel (different files); T001 must complete first:
Task T001: Write failing tests — tests/integration/components/App.test.tsx  (MUST FAIL first)
Task T002: Add Tab handler — src/components/App.tsx  (after T001 confirmed failing)
Task T003: Update keyboard contract — specs/001-tui-todo-app/contracts/keyboard-schema.md  (parallel with T002)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete T001 — write failing tests in `App.test.tsx`; confirm they fail
2. Complete T002 — one new `if (key.tab)` block in `App.tsx`; T001 tests now pass
3. Complete T003 — one new table row in the keyboard contract doc (parallel with T002)
4. Complete T004 — run full test suite to verify no regressions
5. **Validate**: Manual smoke test per the Independent Test above

---

## Notes

- `toggleExpand()` in `useTasks.ts` already handles both expand and collapse via a `Set` — no changes needed there
- Ink's `useInput` exposes `key.tab` natively — no dependency changes required
- Total implementation is a ~5-line addition to `App.tsx`
