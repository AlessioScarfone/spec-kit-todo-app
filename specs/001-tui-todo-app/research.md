# Research: Terminal Todo App (001-tui-todo-app)

**Date**: 2026-03-02  
**Status**: Complete — all NEEDS CLARIFICATION items resolved

---

## R-001: TUI Framework — Ink vs alternatives

**Decision**: `ink` v6 + `@inkjs/ui` v2  
**Rationale**: Ink is the de-facto React-based TUI framework for Node.js. v6.8.0 was released 2 weeks ago. It explicitly tests on Node.js 22 and 24. `useInput` hook exposes `key.upArrow`, `key.downArrow`, `key.leftArrow`, `key.rightArrow`, `key.return`, `key.escape` as named booleans — a direct match to the spec's keyboard scheme. ink-ui (`@inkjs/ui`) provides `TextInput`, `Select`, `StatusMessage`, `Alert`, and `Badge` — all directly useful. Ink is used in production by Claude Code, Gemini CLI, GitHub Copilot CLI, Cloudflare Wrangler, and Shopify CLI.  
**Alternatives considered**:  
- `blessed` / `neo-blessed` — lower-level, no React model, largely unmaintained  
- `terminal-kit` — imperative API, not component-based, poor TypeScript support  
- Native `readline` — too low-level; would require reimplementing layout engine  

---

## R-002: SQLite Driver — `node:sqlite` (Node 22 built-in) vs `better-sqlite3`

**Decision**: `better-sqlite3` v9, accessed via raw SQL — **no ORM**  
**Rationale**: Node.js 22 ships `node:sqlite` as an **experimental** module (behind `--experimental-sqlite` flag). It is not stable for production use. `better-sqlite3` is the mature synchronous SQLite driver, is fully typed (`@types/better-sqlite3`), supports WAL mode and transactions, and is the standard choice for Node.js SQLite. Its synchronous API avoids async complexity in React hooks. All queries are written as raw SQL strings — no query builder, no ORM, no active-record layer. This keeps the data layer minimal, transparent, and directly auditable against the schema contract.  
**Alternatives considered**:  
- `node:sqlite` — experimental, flag-required, API still changing; acceptable for Node 24+ but not yet stable on 22  
- `node-sqlite3` (`sqlite3` npm package) — asynchronous API, more complex to use in React hook context  
- `drizzle-orm`, `prisma`, `knex`, `mikro-orm` — all explicitly rejected per project constraint; raw SQL is sufficient and preferred for this scope  

---

## R-003: OS-Standard Data Directory Resolution

**Decision**: `env-paths` (sindresorhus) for cross-platform path resolution, storing data under `{data}/todo-tui/`  
**Rationale**: `env-paths` resolves the OS-correct user data directory: `~/.local/share/` on Linux, `~/Library/Application Support/` on macOS, `%APPDATA%` on Windows. It follows the same convention as `conf` (which uses `env-paths` internally). This aligns exactly with the spec's FR-012 requirement. `conf` itself is not needed since task data is stored in SQLite, not JSON key-value files.  
**Alternatives considered**:  
- Hardcoded `~/.local/share/` — incorrect on macOS and Windows  
- `conf` — designed for JSON key-value config, not relational task data  
- `xdg-basedir` — Linux-only, no macOS/Windows support  

**Resolved**: `conf` is not used. `env-paths` provides the data directory path; SQLite file is created at `{env-paths('todo-tui').data}/tasks.db`.

---

## R-004: Testing Strategy for Ink Components

**Decision**: `vitest` as test runner + `ink-testing-library` for component tests + `better-sqlite3` in-memory database (`:memory:`) for repository unit tests  
**Rationale**: Vitest is the modern, ESM-native test runner — compatible with the project's `"type": "module"` package. `ink-testing-library` provides `render()` and `lastFrame()` for testing Ink component output as strings, which is the canonical Ink testing approach per the official docs. In-memory SQLite allows fast, isolated DB tests with no disk I/O.  
**Alternatives considered**:  
- `jest` — requires additional ESM config (transform, experimental flags) for ESM+TSX  
- React Testing Library — browser-oriented, not applicable to Ink  

---

## R-005: ink-ui Components Mapping to Features

**Decision**: Use `TextInput` for task title input; custom `useInput`-based list navigation for the task list; `StatusMessage` for error display on startup; `Alert` for data corruption warning  
**Rationale**: ink-ui `Select` component handles its own navigation internally and does not expose fine-grained state for the accordion subtask expand/collapse. The task list requires custom rendering with our own state management (selection index, expanded/collapsed subtasks, completed-toggle visibility). `TextInput` from ink-ui is the right fit for the new-task title input field since it handles cursor, backspace, and submit/cancel events.  
**Alternatives considered**:  
- ink-ui `Select` for the list — lacks accordion and lifecycle state rendering  
- `ink-select-input` — same limitation as `Select`  

---

## R-006: Build & Development Tooling

**Decision**: `tsx` for development (run TypeScript directly), `tsc` for production build output to `dist/`  
**Rationale**: `tsx` runs TypeScript ESM files directly in Node with zero config — ideal for development. Production build uses `tsc` to compile to `dist/` with `"type": "module"` and `"module": "NodeNext"` for correct ES import resolution.  
**Alternatives considered**:  
- `esbuild` / `tsup` — adds build complexity; not needed for a single-process CLI  
- `ts-node` — older, does not handle ESM as cleanly as `tsx`  

---

## Summary — Resolved Technology Stack

| Area | Decision |
|---|---|
| Language | TypeScript 5.x, ES imports (`"type": "module"`) |
| Runtime | Node.js >= 22 |
| TUI Framework | `ink` v6 + `@inkjs/ui` v2 |
| SQLite Driver | `better-sqlite3` v9 |
| Data Directory | `env-paths` → `{data}/todo-tui/tasks.db` |
| Config Store | Not needed (`conf` excluded) |
| Testing | `vitest` + `ink-testing-library` |
| Dev Runner | `tsx` |
| Build | `tsc` → `dist/` |
| Node \<built-in SQLite\> | Rejected (experimental on Node 22) |
