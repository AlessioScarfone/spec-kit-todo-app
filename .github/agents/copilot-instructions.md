# spec-kit-todo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-02

## Active Technologies
- SQLite via `better-sqlite3` — raw SQL only; no ORM; no query builder (002-subtask-count-badge)
- TypeScript 5.x / Node.js >= 22, ES modules (`"type": "module"`) + `ink` v6 + `@inkjs/ui` v2 + `react` — `useStdout()` provides terminal dimensions and resize events (004-tui-fullscreen-toggle)
- SQLite via `better-sqlite3` v9 — raw SQL; `reactivateTask` / `reactivateSubtask` functions added to `queries.ts` (004-tui-fullscreen-toggle)
- TypeScript 5.x / Node.js >= 22, `"type": "module"` (ES imports) + `ink` v6, `@inkjs/ui` v2, `react` — React-based TUI renderer; `better-sqlite3` v9 (005-subtask-ratio-badge)
- SQLite via `better-sqlite3` — raw SQL only, no ORM (005-subtask-ratio-badge)

- TypeScript 5.x, Node.js >= 22, `"type": "module"` (ES imports throughout) + `ink` v6, `@inkjs/ui` v2, `react`, `better-sqlite3` v9, `env-paths` (001-tui-todo-app)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js >= 22, `"type": "module"` (ES imports throughout): Follow standard conventions

## Recent Changes
- 005-subtask-ratio-badge: Added TypeScript 5.x / Node.js >= 22, `"type": "module"` (ES imports) + `ink` v6, `@inkjs/ui` v2, `react` — React-based TUI renderer; `better-sqlite3` v9
- 005-subtask-ratio-badge: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
- 004-tui-fullscreen-toggle: Added TypeScript 5.x / Node.js >= 22, ES modules (`"type": "module"`) + `ink` v6 + `@inkjs/ui` v2 + `react` — `useStdout()` provides terminal dimensions and resize events


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
