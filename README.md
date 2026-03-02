# todo-tui

A keyboard-driven terminal task manager built with [Ink](https://github.com/vadimdemedes/ink) and SQLite. Manage tasks and subtasks entirely from the command line — no mouse, no network connection required.

## Features

- Add top-level tasks and nested subtasks
- Complete or permanently delete tasks and subtasks
- Expand/collapse subtask lists per task (accordion-style)
- Toggle visibility of completed items
- Fully keyboard-driven navigation
- Local SQLite storage — data persists between sessions
- Automatic recovery from a corrupted database file

## Requirements

- Node.js 22 or later
- npm

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

### Run as a CLI binary (after building)

```bash
npm run build
node dist/index.js
```

Or, if installed globally/linked:

```bash
todo-tui
```

### Local use with npm link

To use the CLI as a global command while developing locally:

```bash
npm run build
npm link
```

This registers `todo-tui` as a global command pointing to your local build. You can then run:

```bash
todo-tui
```

To unlink when done:

```bash
npm unlink -g todo-tui
```

> **Note:** Remember to run `npm run build` again after making changes, as the global command runs from `dist/`.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `↑` / `↓` | Move cursor up / down |
| `→` | Expand subtasks under selected task |
| `←` | Collapse subtasks under selected task |
| `a` | Add a new task |
| `s` | Add a subtask to the selected task |
| `c` | Complete the selected item |
| `d` | Permanently delete the selected item |
| `h` | Toggle visibility of completed items |
| `q` / `Ctrl+C` | Quit |

**Notes:**
- Completing a task also completes all of its subtasks.
- Deleting a task permanently removes it and all its subtasks.
- Empty titles are not accepted; stay in the input field or cancel.
- Cursor wraps around at the top and bottom of the list.

## Project Structure

```
src/
  components/     # Ink/React UI components
  db/             # SQLite connection, migrations, and queries
  hooks/          # Custom React hooks
specs/            # Feature specifications and contracts
tests/
  integration/    # Integration tests
  unit/           # Unit tests
```

## Configuration

No configuration file is required. The SQLite database is stored automatically in the OS-standard data directory for the `todo-tui` application (resolved via [`env-paths`](https://github.com/sindresorhus/env-paths)):

| OS | Default path |
|---|---|
| macOS | `~/Library/Application Support/todo-tui/tasks.db` |
| Linux | `~/.local/share/todo-tui/tasks.db` |
| Windows | `%APPDATA%\todo-tui\tasks.db` |

If the database file is missing or corrupted on startup, the app notifies you and starts fresh with an empty task list.

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Tests use [Vitest](https://vitest.dev/) and [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library).

## Build

Compile TypeScript to `dist/`:

```bash
npm run build
```

Output is written to `dist/`, with the entry point at `dist/index.js`.
