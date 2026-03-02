# Quickstart: Terminal Todo App (001-tui-todo-app)

**Date**: 2026-03-02

This document covers prerequisites, project setup, development workflow, and how to run the app and tests.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | `>= 22` | LTS recommended |
| npm | `>= 10` | Included with Node 22 |

---

## Project Bootstrap

```bash
# 1. Initialise the package
npm init -y

# 2. Set module type
# In package.json: "type": "module"

# 3. Install runtime dependencies
npm install ink react @inkjs/ui better-sqlite3 env-paths

# 4. Install development dependencies
npm install --save-dev \
  typescript \
  @types/node \
  @types/react \
  @types/better-sqlite3 \
  tsx \
  vitest \
  ink-testing-library

# 5. Initialise TypeScript
npx tsc --init
```

### Required `package.json` fields

```json
{
  "type": "module",
  "bin": {
    "todo-tui": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx src/index.tsx",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Required `tsconfig.json` settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  }
}
```

---

## Project Structure

```
src/
├── components/
│   ├── App.tsx            # Root component — composes all views
│   ├── TaskList.tsx       # Renders the full list of tasks (and subtasks)
│   ├── TaskItem.tsx       # Single task row with accordion controls
│   ├── SubtaskItem.tsx    # Single subtask row
│   ├── TaskInput.tsx      # TextInput for adding a new task or subtask
│   └── EmptyState.tsx     # Friendly message when there are no tasks
├── db/
│   ├── connection.ts      # Opens SQLite connection, applies pragmas + migrations
│   ├── migrations.ts      # Schema DDL and user_version management
│   └── queries.ts         # All typed query functions (insert, update, delete, select)
├── hooks/
│   └── useTasks.ts        # React hook — loads tasks, exposes mutators
├── types.ts               # Shared TypeScript types (Task, Subtask, UIState)
└── index.tsx              # Entry point — calls render(<App />)

tests/
├── unit/
│   ├── db/
│   │   └── queries.test.ts      # DB query functions against :memory: SQLite
│   └── hooks/
│       └── useTasks.test.ts     # Hook logic (with mocked DB)
└── integration/
    └── components/
        └── App.test.tsx         # End-to-end TUI rendering via ink-testing-library

specs/001-tui-todo-app/          # Feature documentation (this directory)
```

---

## Running the App (Development)

```bash
npm run dev
```

This runs `src/index.tsx` directly via `tsx` with no compilation step.

---

## Running Tests

```bash
# All tests, single run
npm test

# Watch mode during development
npm run test:watch
```

Tests use:
- `vitest` as runner
- `ink-testing-library` for Ink component rendering
- In-memory SQLite (`:memory:`) for all database tests — no disk I/O

---

## Building for Distribution

```bash
npm run build
# Output: dist/
```

The compiled entry point is `dist/index.js`. The `bin` field in `package.json` points to it.

```bash
# Install globally after build
npm install -g .

# Run
todo-tui
```

---

## Data Location

The SQLite database is created automatically on first launch.

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/todo-tui/tasks.db` |
| Linux | `~/.local/share/todo-tui/tasks.db` |
| Windows | `%APPDATA%\todo-tui\tasks.db` |

If the database file is missing, it is created fresh. If it is corrupted, the app displays an error and creates a new empty database.

---

## Key Usage (in-app)

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate list |
| `→` / `←` | Expand / collapse subtasks |
| `a` | Add new task |
| `s` | Add subtask to selected task |
| `c` | Complete selected item |
| `d` | Delete selected item permanently |
| `h` | Show / hide completed items |
| `q` | Quit |

Full keyboard contract: see [contracts/keyboard-schema.md](./contracts/keyboard-schema.md)
