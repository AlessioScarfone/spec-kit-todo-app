# Tasks: Terminal Todo App

**Input**: Design documents from `/specs/001-tui-todo-app/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Included — Constitution Principle II mandates TDD as NON-NEGOTIABLE; `vitest` + `ink-testing-library` enforced at task level per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Tests MUST be written first and MUST FAIL before implementation begins within each story

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and directory structure.

- [ ] T001 Initialize `package.json` with `"type": "module"`, `bin`, and all scripts (`dev`, `build`, `test`, `test:watch`)
- [ ] T002 Install runtime dependencies: `ink`, `react`, `@inkjs/ui`, `better-sqlite3`, `env-paths`
- [ ] T003 Install dev dependencies: `typescript`, `@types/node`, `@types/react`, `@types/better-sqlite3`, `tsx`, `vitest`, `ink-testing-library`
- [ ] T004 [P] Configure `tsconfig.json` with `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `jsx: react-jsx`, `outDir: dist`, `rootDir: src`
- [ ] T005 [P] Create directory skeleton: `src/components/`, `src/db/`, `src/hooks/`, `tests/unit/db/`, `tests/unit/hooks/`, `tests/integration/components/`

**Checkpoint**: Project is bootable — `npm install` runs clean, TypeScript compiler resolves.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — shared types, DB connection, and schema migrations — that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Define shared TypeScript types (`Task`, `Subtask`, `UIState`, `InputMode`) in `src/types.ts`
- [ ] T007 Implement `openDatabase()` in `src/db/connection.ts`: open SQLite file at `env-paths('todo-tui').data/tasks.db`, apply `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`, call `runMigrations()`
- [ ] T008 Implement `runMigrations()` in `src/db/migrations.ts`: DDL for `tasks` and `subtasks` tables, indexes, `CHECK` constraints, and `user_version` guard — exactly per `contracts/data-schema.md`
- [ ] T036 Implement DB startup error handling in `src/db/connection.ts`: catch SQLite `NOTADB` / file-open errors; on corruption display error via `StatusMessage` in `src/components/App.tsx` and start with a fresh empty DB; on missing file create DB normally (FR-015, Constitution IV)

**Checkpoint**: Foundation ready — `openDatabase()` returns a usable `Database` instance; schema is applied; DB startup errors surface correctly to the user; all user story phases can now begin.

---

## Phase 3: User Story 1 — Add and View Tasks (Priority: P1) 🎯 MVP

**Goal**: User launches the app, sees their existing tasks, and can add a new task which persists immediately. An empty list shows a friendly message.

**Independent Test**: Launch the app with no tasks → add two tasks → quit → relaunch → both tasks appear in order.

### Tests for User Story 1 ⚠️ WRITE FIRST — MUST FAIL BEFORE IMPLEMENTATION

- [ ] T009 [P] [US1] Write unit tests for `getAllTasks()` and `insertTask()` against `:memory:` SQLite in `tests/unit/db/queries.test.ts`; include a performance benchmark seeding 500 rows and asserting `getAllTasks()` completes within 200 ms (SC-002)
- [ ] T010 [P] [US1] Write `useTasks` hook unit tests: initial load, `addTask` state update, empty list state, in `tests/unit/hooks/useTasks.test.ts`
- [ ] T011 [US1] Write integration test: render `<App>`, press `a`, type title, press Enter, verify task appears in frame output in `tests/integration/components/App.test.tsx`

### Implementation for User Story 1

- [ ] T012 [US1] Implement `getAllTasks()` and `insertTask()` query functions (active-only and all-items variants) in `src/db/queries.ts`
- [ ] T013 [P] [US1] Create `EmptyState` component (friendly no-tasks message, FR-016) in `src/components/EmptyState.tsx`
- [ ] T014 [P] [US1] Create `TaskInput` component using `ink-ui` `TextInput`; blocks confirm on empty title (FR-003) in `src/components/TaskInput.tsx`
- [ ] T015 [P] [US1] Create `TaskItem` component: renders task row with title; accordion indicator placeholder in `src/components/TaskItem.tsx`
- [ ] T016 [US1] Implement `useTasks` hook: load active tasks on mount, expose `addTask` callback, manage `selectedIndex` and `inputMode` UI state in `src/hooks/useTasks.ts`
- [ ] T017 [US1] Create `TaskList` component: renders `TaskItem` rows or `EmptyState`; highlights selected row in `src/components/TaskList.tsx`
- [ ] T018 [US1] Create root `App` component: composes `TaskList` + `TaskInput`; handles `↑`/`↓` navigation and `a` key to enter add-task mode in `src/components/App.tsx`
- [ ] T019 [US1] Create entry point: open DB via `openDatabase()`, call `render(<App db={db} />)` in `src/index.tsx`

**Checkpoint**: `npm run dev` launches with working task list; tasks typed in survive a restart; empty list shows a message; US1 is fully functional.

---

## Phase 4: User Story 2 — Complete and Delete Tasks (Priority: P2)

**Goal**: User can mark a task complete (`c`), permanently delete any item (`d`), and toggle visibility of completed tasks (`h`). Completed tasks are visually distinct when shown.

**Independent Test**: Create tasks → complete one → verify it's hidden → press `h` → verify it reappears (dimmed) → press `d` to delete it → press `h` again → quit and relaunch → state matches.

### Tests for User Story 2 ⚠️ WRITE FIRST — MUST FAIL BEFORE IMPLEMENTATION

- [ ] T020 [P] [US2] Extend `tests/unit/db/queries.test.ts`: add tests for `completeTask()`, `completeSubtask()`, `deleteTask()`, and `getAllTasks()` with `showCompleted = true`
- [ ] T021 [P] [US2] Extend `tests/unit/hooks/useTasks.test.ts`: add tests for `completeTask`, `deleteTask`, `toggleShowCompleted` actions and resulting state changes
- [ ] T022 [US2] Extend integration tests in `tests/integration/components/App.test.tsx` with US2 keyboard scenarios: `c` to complete a task, `c` to complete a subtask when a subtask row is selected, `d` to delete, `h` to toggle visibility

### Implementation for User Story 2

- [ ] T023 [US2] Add `completeTask()` (transactionally completes task + all subtasks), `deleteTask()`, and `showCompleted`-aware `getAllTasks()` overload to `src/db/queries.ts`
- [ ] T041 [US2] Add `completeSubtask()` query function (`UPDATE subtasks SET status = 'complete' WHERE id = ?`) to `src/db/queries.ts`; expose `completeSubtask` action in `src/hooks/useTasks.ts`; wire `c` key for subtask-selected row in `src/components/App.tsx` (keyboard-schema.md condition: `c` applies to "Task or Subtask")
- [ ] T024 [US2] Extend `useTasks` hook: add `completeTask`, `deleteTask`, `showCompleted` toggle, re-query after each mutation in `src/hooks/useTasks.ts`
- [ ] T025 [US2] Update `TaskItem` to render completed state (dim color / strikethrough via Ink) in `src/components/TaskItem.tsx`
- [ ] T026 [US2] Update `App` component: wire `c`, `d`, `h` key bindings; pass `showCompleted` flag down to `TaskList`/`TaskItem` in `src/components/App.tsx`

**Checkpoint**: US1 and US2 both work and all associated unit + integration tests pass; completed tasks hide/show correctly; state survives restart.

---

## Phase 5: User Story 3 — Organize with Subtasks (Priority: P3)

**Goal**: User can add subtasks under a task (`s`), expand/collapse them with `→`/`←`, and delete individual subtasks with `d`. Subtask hierarchy and ordering persist across sessions.

**Independent Test**: Create a task → add two subtasks → press `←` to collapse → verify subtasks hidden → press `→` to expand → delete one subtask → quit → relaunch → one subtask remains under parent.

### Tests for User Story 3 ⚠️ WRITE FIRST — MUST FAIL BEFORE IMPLEMENTATION

- [ ] T027 [P] [US3] Extend `tests/unit/db/queries.test.ts`: add tests for `insertSubtask()`, `deleteSubtask()`, `getSubtasksForTask()`, and cascade delete behavior
- [ ] T028 [P] [US3] Extend `tests/unit/hooks/useTasks.test.ts`: add tests for `addSubtask`, `deleteSubtask`, `toggleExpand` and `expandedTaskIds` state management
- [ ] T029 [US3] Extend integration tests in `tests/integration/components/App.test.tsx`: add subtask add, collapse, expand, and delete keyboard scenarios

### Implementation for User Story 3

- [ ] T030 [US3] Add `insertSubtask()`, `deleteSubtask()`, and `getSubtasksForTask()` query functions to `src/db/queries.ts`
- [ ] T031 [P] [US3] Create `SubtaskItem` component: indented row rendering with title and completed state in `src/components/SubtaskItem.tsx`
- [ ] T032 [US3] Extend `useTasks` hook: add `addSubtask`, `deleteSubtask` actions; add `expandedTaskIds` Set to UI state; add `toggleExpand` callback in `src/hooks/useTasks.ts`
- [ ] T033 [US3] Update `TaskItem` to show accordion indicator (`▶` collapsed / `▼` expanded) based on `expandedTaskIds` in `src/components/TaskItem.tsx`
- [ ] T034 [US3] Update `TaskList` to interleave `SubtaskItem` rows under their parent when expanded in `src/components/TaskList.tsx`
- [ ] T035 [US3] Update `App` component: wire `s` (add-subtask mode), `←` (collapse), `→` (expand) key bindings; handle `d` on subtask rows in `src/components/App.tsx`

**Checkpoint**: All three user stories independently functional; subtask hierarchy renders and persists correctly; all tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Resilience, validation edges, and distribution wiring that cut across all user stories.

- ~~T036~~ *(moved to Phase 2 — Foundational; DB error handling must be in place before any user story is tested — analysis finding C6)*
- [ ] T037 [P] Enforce empty-title blocking in `TaskInput` component: `Enter` on empty string is a no-op; user stays in input mode (FR-003) in `src/components/TaskInput.tsx`
- [ ] T038 [P] Add `q` quit key binding (graceful exit from idle mode) in `src/components/App.tsx`
- [ ] T039 [P] Verify `bin` field in `package.json` and shebang in `src/index.tsx`; confirm `npm run build` produces `dist/index.js` and `todo-tui` runs globally
- [ ] T040 Validate full quickstart.md workflow: bootstrap, `npm run dev`, add tasks/subtasks, quit, relaunch state restored, `npm test` all green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Stories (Phases 3–5)**: All depend on Foundational phase; can proceed sequentially (P1 → P2 → P3) or in parallel if staffed
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **User Story 2 (P2)**: Starts after Phase 2 — extends `queries.ts` and `useTasks.ts` independently; integrates into `App.tsx`
- **User Story 3 (P3)**: Starts after Phase 2 — adds new query functions, new component (`SubtaskItem`); extends hook and `TaskList`

### Within Each User Story

1. Write tests → confirm they FAIL
2. Implement query functions → run DB unit tests
3. Implement/extend hook → run hook unit tests
4. Implement/extend components → run integration tests
5. All tests pass → story complete

### Parallel Opportunities

- T004, T005 — parallel within Phase 1 (T003 must run sequentially after T002 — both mutate `node_modules`)
- T009, T010 — parallel within US1 tests (different files)
- T013, T014, T015 — parallel within US1 implementation (different component files)
- T020, T021 — parallel within US2 tests
- T023, T041 — T041 can be written in parallel with T023 if split across developers; sequential otherwise (same file `queries.ts`)
- T027, T028 — parallel within US3 tests
- T031 — parallel within US3 implementation (isolated new component)
- T037, T038, T039 — parallel within Polish phase (T036 moved to Phase 2)

---

## Parallel Example: User Story 1

```bash
# 1. Write tests in parallel (different files):
Task T009: "Write query tests for getAllTasks/insertTask in tests/unit/db/queries.test.ts"
Task T010: "Write useTasks hook tests in tests/unit/hooks/useTasks.test.ts"

# 2. After tests pass (failing), implement queries (T012), then components in parallel:
Task T013: "Create EmptyState in src/components/EmptyState.tsx"
Task T014: "Create TaskInput in src/components/TaskInput.tsx"
Task T015: "Create TaskItem in src/components/TaskItem.tsx"

# 3. After T012 + components are done, implement hook and list sequentially:
Task T016: "Implement useTasks hook in src/hooks/useTasks.ts"
Task T017: "Create TaskList in src/components/TaskList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm run dev` → add tasks → quit → relaunch → tasks restored
5. Deploy/demo if ready — already a usable task tracker

### Incremental Delivery

1. Setup + Foundational → project scaffolded
2. User Story 1 → working task creator with persistence (MVP)
3. User Story 2 → add lifecycle management (complete, delete, toggle)
4. User Story 3 → add subtask hierarchy and accordion view
5. Polish → resilience, packaging, validation edge cases

### Parallel Team Strategy

With multiple contributors after Phase 2 is complete:
- Developer A: User Story 1 (task CRUD + basic UI)
- Developer B: User Story 2 (lifecycle + completed toggle)
- Developer C: User Story 3 (subtasks + accordion)

Stories operate on different source files where possible; `App.tsx`, `useTasks.ts`, `queries.ts` are shared extension points to coordinate when merging.

---

## Notes

- `[P]` tasks operate on different files — no coordination needed
- Each `[Story]` label maps directly to a user story for traceability against spec.md
- Every story is independently launchable and testable after its phase is complete
- TDD is **non-negotiable**: write tests, confirm FAIL, then implement
- Commit after each completed task or logical group (test + implementation together)
- `contracts/data-schema.md` is the single source of truth for SQL — never deviate
- `contracts/keyboard-schema.md` is the single source of truth for key bindings — never add undocumented keys
