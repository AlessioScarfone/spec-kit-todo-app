# Implementation Plan: Incomplete Subtask Count Badge

**Branch**: `002-subtask-count-badge` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-subtask-count-badge/spec.md`

## Summary

Display a `dimColor` count of active (not completed) subtasks inline to the right of each task title, disappearing when the count reaches zero. The feature is a pure derived-view UI enhancement — no schema changes, no new entities. The count is computed from existing subtask data via a new SQL query function, surfaced through a new `activeSubtaskCounts` map in `useTasks`, threaded down to `TaskItem` for rendering.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 22, `"type": "module"` (ES imports throughout)
**Primary Dependencies**: `ink` v6, `@inkjs/ui` v2, `react`, `better-sqlite3` v9
**Storage**: SQLite via `better-sqlite3` — raw SQL only; no ORM; no query builder
**Testing**: `vitest` + `ink-testing-library` + in-memory SQLite (`:memory:`) for DB unit tests
**Target Platform**: macOS, Linux, Windows terminal
**Project Type**: CLI / TUI application
**Performance Goals**: Badge rendering introduces no perceptible overhead; list still renders < 1 second on launch
**Constraints**: Fully offline; single-user; no ORM; no additional runtime dependencies
**Scale/Scope**: Single-user personal tool; per-task badge visible across all active tasks in list view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| **I. Spec-First** | PASS | `spec.md` produced and reviewed before plan; all acceptance criteria documented in spec |
| **II. Test-First (NON-NEGOTIABLE)** | PASS | DB query function testable in unit tests with `:memory:` SQLite; component badge rendering testable via `ink-testing-library` integration tests |
| **III. Simplicity & YAGNI** | PASS | No new abstractions, no new dependencies, no new DB tables; single derived `useMemo` and one new SQL function; badge is plain inline `<Text dimColor>` |
| **IV. Data Integrity** | PASS | Count is derived read-only — no write path; existing FK constraints and WAL unchanged |
| **V. Observability** | PASS | No new error paths introduced; existing error surface unchanged |

**Constitution Check Result**: ALL GATES PASS. No violations.

### Post-Phase 1 Re-check

| Area | Assessment |
|---|---|
| Data model | No new tables or columns — count is a derived aggregate from existing `subtasks` table |
| Dependency count | Zero new runtime dependencies added |
| Source changes | 5 files touched: `queries.ts`, `useTasks.ts`, `App.tsx`, `TaskList.tsx`, `TaskItem.tsx` — all existing; no new files in `src/` |
| Contracts | No external interface changes; no keyboard bindings added or changed |

**Post-Phase 1 Result**: PASS — No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-subtask-count-badge/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

Files touched by this feature (no new files created inside `src/`):

```text
src/
├── components/
│   ├── TaskItem.tsx       # ADD: render active-count badge inline with title
│   ├── TaskList.tsx       # ADD: accept + pass activeSubtaskCounts prop to TaskItem
│   └── App.tsx            # ADD: pass activeSubtaskCounts from useTasks to TaskList
├── db/
│   └── queries.ts         # ADD: getActiveSubtaskCounts(db, taskIds) batch query
└── hooks/
    └── useTasks.ts        # ADD: activeSubtaskCounts derived useMemo

tests/
├── unit/
│   ├── db/
│   │   └── queries.test.ts       # ADD: tests for getActiveSubtaskCounts
│   └── hooks/
│       └── useTasks.test.tsx     # ADD: tests for activeSubtaskCounts
└── integration/
    └── components/
        └── App.test.tsx          # ADD: badge display / hide / update scenarios
```

**Structure Decision**: Single-project layout unchanged from feature 001. All changes are additive edits to existing files — consistent with the established pattern.

## Complexity Tracking

> No violations to justify. The feature introduces no abstractions, no new dependencies, and no schema changes.
