# Implementation Plan: Terminal Todo App

**Branch**: `001-tui-todo-app` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tui-todo-app/spec.md`

## Summary

A keyboard-driven TUI application for managing tasks and subtasks in the terminal. Built with Ink (React for CLIs) and SQLite for local persistence. **No ORM** — all database access uses raw SQL via `better-sqlite3`. Supports task creation, completion, hard deletion, subtask accordion expand/collapse, and a toggle to show/hide completed items. All data is stored locally with no internet dependency.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 22, `"type": "module"` (ES imports throughout)
**Primary Dependencies**: `ink` v6, `@inkjs/ui` v2, `react`, `better-sqlite3` v9, `env-paths`
**Dev Dependencies**: `tsx`, `typescript`, `vitest`, `ink-testing-library`, `@types/node`, `@types/react`, `@types/better-sqlite3`
**Storage**: SQLite via `better-sqlite3` — raw SQL only, no ORM, no query builder; file at `{env-paths('todo-tui').data}/tasks.db`
**Testing**: `vitest` + `ink-testing-library` + in-memory SQLite (`:memory:`) for DB unit tests
**Target Platform**: macOS, Linux, Windows terminal
**Project Type**: CLI / TUI application
**Performance Goals**: List renders in < 1 second on launch; all interactions respond with no perceptible lag
**Constraints**: Fully offline; single-user; single machine; no network calls; no ORM; no query builder
**Scale/Scope**: Single-user personal tool; no concurrency; low data volume expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| **I. Spec-First** | PASS | `spec.md` written and clarified before any code; plan generated after spec approval |
| **II. Test-First (NON-NEGOTIABLE)** | PASS | Test targets defined in project structure; `vitest` + `ink-testing-library` selected; TDD enforced at task level |
| **III. Simplicity & YAGNI** | PASS | No ORM, no query builder, no service layer — raw SQL direct to `better-sqlite3`; `conf` excluded (no config use-case); single project |
| **IV. Data Integrity** | PASS | WAL mode + `PRAGMA foreign_keys = ON`; cascade deletes; atomic transactions; startup error displayed + fresh DB on corruption |
| **V. Observability** | PASS | Startup data errors surface via `StatusMessage` (ink-ui); `console.error` routed via Ink `patchConsole`; specific error messages at every DB failure point |

**Constitution Check Result**: ALL GATES PASS. No violations.

### Post-Phase 1 Re-check

| Area | Assessment |
|---|---|
| Data model | Two tables (tasks, subtasks) — minimal structure required by FR-004/FR-005 |
| Dependency count | 5 runtime deps — each justified; `conf` excluded; no ORM added |
| Keyboard contract | Defined in `contracts/keyboard-schema.md`; no unapproved bindings |
| Data schema | Defined in `contracts/data-schema.md`; `CHECK` constraints enforce invariants at DB level |

**Post-Phase 1 Result**: PASS — No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-tui-todo-app/
├── plan.md                      # This file
├── research.md                  # Phase 0: technology decisions
├── data-model.md                # Phase 1: entity definitions and state machine
├── quickstart.md                # Phase 1: setup and run instructions
├── contracts/
│   ├── keyboard-schema.md       # Authoritative keyboard interaction contract
│   └── data-schema.md           # Authoritative SQLite schema and query patterns
└── tasks.md                     # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── App.tsx            # Root component — composes all views; receives db connection
│   ├── TaskList.tsx       # Renders the full list (tasks + visible subtasks)
│   ├── TaskItem.tsx       # Single task row with accordion indicator
│   ├── SubtaskItem.tsx    # Single subtask row (indented)
│   ├── TaskInput.tsx      # TextInput for adding a new task or subtask title
│   └── EmptyState.tsx     # Friendly message when task list is empty
├── db/
│   ├── connection.ts      # Opens SQLite connection; applies startup pragmas and migrations
│   ├── migrations.ts      # Raw DDL SQL; user_version-based migration runner
│   └── queries.ts         # All typed query functions — raw SQL, no ORM
├── hooks/
│   └── useTasks.ts        # React hook — loads tasks/subtasks, exposes action callbacks
├── types.ts               # Shared TypeScript types (Task, Subtask, UIState, InputMode)
└── index.tsx              # Entry point — opens DB, calls render(<App db={db} />)

tests/
├── unit/
│   ├── db/
│   │   └── queries.test.ts        # All query functions against :memory: SQLite
│   └── hooks/
│       └── useTasks.test.ts       # Hook state logic with mocked query functions
└── integration/
    └── components/
        └── App.test.tsx           # End-to-end keyboard interaction via ink-testing-library
```

**Structure Decision**: Single-project layout. The only abstraction boundary is `src/db/` — it exists solely to enable isolated unit testing of raw SQL queries. No Repository pattern, no service layer, no ORM. The hook calls `db/queries.ts` functions directly.

## Complexity Tracking

> No constitution violations — table not required.
