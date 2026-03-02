# Implementation Plan: Tab Key Subtask Toggle

**Branch**: `003-tab-toggle-subtasks` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-tab-toggle-subtasks/spec.md`

## Summary

Add `Tab` as an alternative keyboard shortcut for toggling subtask expand/collapse, alongside the existing `→` / `←` arrow keys. The change is contained entirely in `src/components/App.tsx` where `useInput` handles keyboard events. The `toggleExpand()` call already handles idempotent expand and collapse; the Tab handler reuses the same logic as the arrow keys. A documentation update to the keyboard contract file is also required.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 22, ES modules  
**Primary Dependency**: `ink` v6 — `useInput` hook exposes `key.tab` for Tab key detection  
**Affected Files**:
- `src/components/App.tsx` — add Tab branch inside `useInput` handler
- `specs/001-tui-todo-app/contracts/keyboard-schema.md` — document new binding

**No new dependencies. No schema changes. No new components.**

## Constitution Check

| Principle | Status | Evidence |
|---|---|---|
| **Spec-First** | PASS | spec.md written and approved before plan |
| **Test-First (NON-NEGOTIABLE)** | PASS | T001 writes failing integration tests before T002 implementation; Red→Green→Refactor enforced |
| **Simplicity & YAGNI** | PASS | Single file change; reuses existing `toggleExpand()`; no abstraction added |
| **Data Integrity** | N/A | No data layer touched |
| **Backward Compatibility** | PASS | Existing `→`/`←` bindings unchanged per FR-007 |

## Project Structure

No new files or directories are created. Touched files:

```text
src/components/App.tsx                              ← Tab key handler added to useInput
tests/integration/components/App.test.tsx           ← failing tests written before implementation
specs/001-tui-todo-app/contracts/keyboard-schema.md ← Tab binding documented
```

## Complexity Tracking

| Introduced | Justification | Principle III verdict |
|---|---|---|
| *(none)* | No new abstractions, patterns, or dependencies introduced. Single `if (key.tab)` branch reuses existing `toggleExpand()` call and `subtaskCounts` guard already present in the `→` handler. | PASS — no complexity added |
