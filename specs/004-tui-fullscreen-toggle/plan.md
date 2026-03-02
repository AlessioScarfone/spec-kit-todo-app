# Implementation Plan: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Branch**: `004-tui-fullscreen-toggle` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-tui-fullscreen-toggle/spec.md`

## Summary

Three independent improvements to the existing ink-based TUI:

1. **Bidirectional toggle (P1)**: Pressing "c" on a completed task or subtask reverts it to "active". New `reactivateTask` / `reactivateSubtask` SQL functions; the `useInput` handler in `App.tsx` branches on current item status.
2. **Command bar hint update (P2)**: Replace `"c complete"` with `"c complete/reactivate"` in the hint bar text in `App.tsx`.
3. **Fullscreen + pinned command bar (P3)**: Use `useStdout()` (ink built-in) to read terminal dimensions; wrap the entire layout in a `Box` sized to `stdout.rows × stdout.columns`; give the task list `flexGrow={1}` so the command bar is always pinned to the last line; manage a virtual scroll window to keep the selected row visible within the bounded height.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js >= 22, ES modules (`"type": "module"`)  
**Primary Dependencies**: `ink` v6 + `@inkjs/ui` v2 + `react` — `useStdout()` provides terminal dimensions and resize events  
**Storage**: SQLite via `better-sqlite3` v9 — raw SQL; `reactivateTask` / `reactivateSubtask` functions added to `queries.ts`  
**Testing**: `vitest` + `ink-testing-library`; in-memory SQLite (`:memory:`) for DB unit tests  
**Target Platform**: macOS, Linux, Windows terminal (CLI/TUI)  
**Project Type**: CLI / TUI application  
**Performance Goals**: Immediate visual feedback on keypress (< 16 ms re-render); no perceptible lag on resize  
**Constraints**: No new npm dependencies; fullscreen achieved entirely via existing `ink` APIs  
**Scale/Scope**: Single-file layout change + two new query functions; 5 files modified, 0 files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| **I. Spec-First** | PASS | `spec.md` written and approved before plan; all FRs traced to user stories |
| **II. Test-First (NON-NEGOTIABLE)** | PASS | Each user story produces a failing test before implementation code is written; Red→Green→Refactor enforced |
| **III. Simplicity & YAGNI** | PASS | No new dependencies; `useStdout()` is a built-in ink hook; scroll offset is a single `useState`; no abstraction beyond what two confirmed use cases require |
| **IV. Data Integrity** | PASS | `reactivateTask` and `reactivateSubtask` are single `UPDATE` statements; SQLite atomicity guarantees no partial writes; persistence verified by session-restart scenario |
| **V. Observability & Debuggability** | PASS | No new service-layer operations beyond existing DB write pattern; errors surface through existing `startupError` channel; no silent swallowing |

**Post-Phase-1 re-check**: All principles remain PASS after design. No violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/004-tui-fullscreen-toggle/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── App.tsx          ← fullscreen layout, pinned bar, toggle handler, hint text
├── db/
│   └── queries.ts       ← reactivateTask(), reactivateSubtask() added
└── hooks/
    └── useTasks.ts      ← reactivateTask / reactivateSubtask callbacks exposed

tests/
├── integration/
│   └── components/
│       └── App.test.tsx ← toggle tests, command bar text, fullscreen indicator tests
└── unit/
    └── db/
        └── queries.test.ts ← reactivateTask / reactivateSubtask unit tests
```

**Structure Decision**: Single-project layout (Option 1). No new directories created. All changes are contained within existing `src/` and `tests/` trees.

## Complexity Tracking

| Introduced | Justification | Principle III verdict |
|---|---|---|
| Scroll offset `useState` in `App.tsx` | ink has no native scrollable container; a virtual window (offset + slice) is the canonical ink pattern for bounded-height lists | PASS — minimum viable solution; no abstraction introduced; single integer state variable |
