# Tasks: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Input**: Design documents from `/specs/004-tui-fullscreen-toggle/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to
- All paths are relative to repository root

---

## Phase 1: User Story 1 - Reactivate a Completed Task (Priority: P1) 🎯 MVP

**Goal**: Pressing "c" on a completed task or subtask toggles it back to "active". Existing "active → complete" behavior is preserved. Status change persists across sessions.

**Independent Test**: Complete any task → press `h` to show completed → navigate to it → press `c` → confirm it reappears in the active list and remains active after restarting the app.

### Tests for User Story 1 ⚠️ Write and confirm FAILING before implementation

- [X] T001 [US1] Write failing unit tests for `reactivateTask` and `reactivateSubtask` in `tests/unit/db/queries.test.ts` — cover: (1) `reactivateTask` sets `status = 'active'` for a completed task row, (2) `reactivateSubtask` sets `status = 'active'` for a completed subtask row, (3) calling either function on an already-active row is a no-op, (4) after `reactivateTask` the row reads back as `'active'` on a fresh `SELECT` against the same DB connection (persistence — SC-005/FR-008), (5) after completing a task (which cascades `'complete'` to its subtasks), calling `reactivateSubtask` on one subtask leaves the parent task row still `'complete'` — confirms independent toggle (spec assumption). Confirm tests **FAIL** before proceeding to T003.
- [X] T002 [P] [US1] Write failing integration tests for bidirectional "c" toggle in `tests/integration/components/App.test.tsx` — cover all six acceptance scenarios: (1) pressing "c" on a completed task reverts it to active, (2) pressing "c" on a completed subtask reverts it to active, (3) pressing "c" on an active task still completes it (existing behaviour preserved), (4) a reactivated task can be completed again **in the same session** (status cycles correctly — persistence across restart is covered by T001 scenario 4, not here), (5) when all tasks in the list are completed, pressing "c" on one causes it to reappear in the active list (`getAllTasks(db, false)` returns it), (6) two simulated "c" inputs on the same row within a single render cycle produce a deterministic final state (idempotent per keypress — no stale-status race). Confirm tests **FAIL** before proceeding to T005.

### Implementation for User Story 1

- [X] T003 [US1] Add `reactivateTask(db, id)` and `reactivateSubtask(db, id)` to `src/db/queries.ts` — each is a single `UPDATE … SET status = 'active' WHERE id = ?` statement; `reactivateTask` does NOT touch subtasks (independent toggle per spec assumption). Run T001 tests — they must now pass.
- [X] T004 [US1] Expose `reactivateTask` and `reactivateSubtask` as `useCallback` hooks in `src/hooks/useTasks.ts`, calling the new query functions and calling `reload()` after each write. Return both from the hook alongside existing callbacks.
- [X] T005 [US1] Update the `useInput` "c" handler in `src/components/App.tsx` — branch on `currentRow.task.status` / `currentRow.subtask.status`: call `completeTask`/`completeSubtask` when the item is `'active'`; call `reactivateTask`/`reactivateSubtask` when the item is `'complete'`. Run T002 tests — they must now pass.

**Checkpoint**: T001 unit tests and T002 integration tests both green. Bidirectional toggle is fully functional and persisted.

---

## Phase 2: User Story 2 - Updated Command Bar Reflecting Toggle Behavior (Priority: P2)

**Goal**: The idle-mode hint bar at the bottom of the TUI shows `"c complete/reactivate"` instead of `"c complete"`, giving new users immediate discoverability of the bidirectional toggle.

**Independent Test**: Launch the app (`npm start`) and read the bottom hint line — `"c complete/reactivate"` must appear regardless of task state or selection.

### Tests for User Story 2 ⚠️ Write and confirm FAILING before implementation

- [X] T006 [US2] Write failing integration test asserting the idle-mode hint string contains `"complete/reactivate"` in `tests/integration/components/App.test.tsx`. Confirm test **FAILS** before proceeding to T007.

### Implementation for User Story 2

- [X] T007 [US2] Update the idle-mode hint string literal in `src/components/App.tsx`: replace `'c complete'` with `'c complete/reactivate'` inside the `useInput`-idle branch text. Run T006 test — it must now pass.

**Checkpoint**: T006 integration test green. Command bar text correct for both idle and any task-state scenario.

---

## Phase 3: User Story 3 - Full-Terminal Fullscreen TUI Layout (Priority: P3)

**Goal**: The TUI fills 100% of the terminal width and height at launch. The task list scrolls within the available vertical space via a virtual window. The command bar is always pinned to the last terminal line, never pushed off-screen regardless of task count or terminal size. The TUI reflows on terminal resize.

**Independent Test**: Start the app in a small terminal (≈ 40 × 15), add more tasks than fit on screen (20+), scroll with `↓` — the command bar must remain at the very bottom throughout. Resize the terminal — the layout must reflow instantly.

### Tests for User Story 3 ⚠️ Write and confirm FAILING before implementation

- [X] T008 [US3] Write failing integration tests for fullscreen layout in `tests/integration/components/App.test.tsx` — cover: (1) root `Box` is sized using `stdout.columns` / `stdout.rows` (mock `useStdout` to return known dimensions and assert the rendered output fills them), (2) the command bar text is present in the last rendered line, (3) with more tasks than `visibleHeight`, scrolling keeps the selected task visible and the hint bar remains on the final line, (4) after an initial render at 80×24, update the mock `useStdout` to return 60×20 and trigger a re-render — assert the root `Box` adopts the new dimensions and the command bar remains on the final line (resize reflow — FR-007). Confirm tests **FAIL** before proceeding to T009.

### Implementation for User Story 3

- [X] T009 [US3] Add `useStdout` import from `ink` and `scrollOffset` state (`useState<number>(0)`) to `src/components/App.tsx`. Compute `visibleHeight` from `stdout.rows` minus reserved rows (banner height + margins + command bar line + optional status rows).
- [X] T010 [US3] Implement fullscreen flex layout in `src/components/App.tsx`: size the root `Box` to `width={stdout.columns} height={stdout.rows}`; wrap the banner + task list section in a `Box` with `flexGrow={1} overflowY="hidden"`; move the command bar `Box` outside that wrapper so it is always the last child of the root column — Yoga layout pins it to the bottom. Note: the command bar relies on terminal-level line truncation on narrow terminals — no wrapping or overflow handling needed (spec assumption, no additional implementation required).
- [X] T011 [US3] Implement virtual scroll in `src/components/App.tsx`: slice `rows` to `rows.slice(scrollOffset, scrollOffset + visibleHeight)` before passing to `TaskList`; after every `selectedIndex` update apply the clamp-scroll algorithm (scroll up when `selectedIndex < scrollOffset`; scroll down when `selectedIndex >= scrollOffset + visibleHeight`). Run T008 tests — they must now pass.

**Checkpoint**: T008 integration tests green. TUI is fullscreen, command bar is pinned, list scrolls correctly.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T012 Run full regression suite to confirm no regressions across all three stories: `npm test`
- [X] T013 [P] TypeScript build check with no errors: `npx tsc --noEmit`
- [X] T014 [P] Manual smoke test per all three verification scenarios in `specs/004-tui-fullscreen-toggle/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No upstream dependencies — can start immediately
- **Phase 2 (US2)**: Independent of US1; can start in parallel after any US1 implementation tasks that touch `App.tsx` (T005) are complete to avoid merge conflicts on the same file. Tests (T006) and the string change (T007) are safe to run after T005.
- **Phase 3 (US3)**: Independent of US1 and US2 semantically, but all three phases modify `App.tsx` — sequence Phase 3 after Phase 2 to avoid conflicts.
- **Polish (Phase 4)**: Depends on all three user story phases being complete.

### User Story Dependencies

- **US1 (P1)**: Self-contained. `queries.ts` → `useTasks.ts` → `App.tsx`. No dependency on US2 or US3.
- **US2 (P2)**: Self-contained. One string change in `App.tsx`. No dependency on US1 or US3 (though best applied after US1's `App.tsx` edits land to prevent conflicts).
- **US3 (P3)**: Self-contained layout change. No dependency on US1 or US2 (though best applied last since it restructures `App.tsx`).

### Within Each User Story (Red → Green → Refactor)

- Tests MUST be written and confirmed **FAILING** before any implementation task in that story
- T003 depends on T001 (unit tests confirmed failing)
- T004 depends on T003 (query functions exist)
- T005 depends on T004 (hook callbacks exist); run T002 tests after T005 to confirm green
- T007 depends on T006 (integration test confirmed failing)
- T009 → T010 → T011 must execute in order (each builds on the previous); run T008 tests after T011 to confirm green

### Parallel Opportunities

- T001 and T002 are in different test files → can be written in parallel
- T013 and T014 (Polish) touch no source files → can run in parallel with each other

---

## Parallel Example: User Story 1

```bash
# T001 and T002 can be written in parallel (different files):
Task T001: Write failing unit tests  — tests/unit/db/queries.test.ts
Task T002: Write failing integration tests — tests/integration/components/App.test.tsx
# ↑ confirm both FAIL before proceeding

# Then sequence:
Task T003: Add query functions — src/db/queries.ts  (T001 now passes)
Task T004: Expose callbacks — src/hooks/useTasks.ts
Task T005: Update handler — src/components/App.tsx  (T002 now passes)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Write T001 tests → confirm FAIL
2. Write T002 tests → confirm FAIL (parallel with T001)
3. Implement T003 → T004 → T005 (sequential; T001 then T002 turn green)
4. **STOP and VALIDATE**: Manual toggle smoke test per quickstart.md Story 1

### Incremental Delivery

1. Complete Phase 1 (US1) → bidirectional toggle works. Demo-able MVP.
2. Complete Phase 2 (US2) → hint bar updated. Minor but user-visible.
3. Complete Phase 3 (US3) → fullscreen layout with pinned bar. Polish complete.
4. Complete Phase 4 (Polish) → full regression suite + type check.

---

## Notes

- `completeTask` wraps subtask completion in a transaction; `reactivateTask` intentionally does **not** touch subtasks — spec assumption: items are toggled independently.
- `useStdout()` is already exported by `ink` v6 — no new dependency needed.
- Virtual scroll `scrollOffset` is the only new state variable required for US3; it is a single `useState<number>(0)` in `App.tsx`.
- US2 is a one-line string change; if implemented after US1's `App.tsx` changes are committed it presents zero merge risk.
- All three stories can be validated end-to-end without any database migration.
