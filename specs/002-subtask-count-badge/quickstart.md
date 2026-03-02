# Quickstart: Incomplete Subtask Count Badge

**Feature**: `002-subtask-count-badge`  
**Prerequisite**: Base app from feature `001-tui-todo-app` is installed and working.

---

## Prerequisites

```bash
node --version   # >= 22
npm --version    # >= 10
```

Dependencies are already installed from feature 001. No new runtime dependencies are added by this feature.

---

## Run the app

```bash
npm start
```

## Run in dev mode (auto-reload on save)

```bash
npm run dev
```

---

## Verify the badge manually

1. Start the app: `npm start`
2. Press `a`, type a task title, press `Enter` — e.g. `"Buy groceries"`
3. With the task selected, press `s`, type a subtask title, press `Enter` — e.g. `"Milk"`
4. Add a second subtask: `s` → `"Bread"` → `Enter`
5. **Expected**: Task row shows `Buy groceries  2` (count in dim color to the right of the title)
6. Press `↓` to select the first subtask, then `c` to complete it
7. **Expected**: Count updates to `1`
8. Complete the remaining subtask (`c`)
9. **Expected**: Count disappears (task row shows `Buy groceries` with no badge)

---

## Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Only unit tests (DB queries)
npx vitest run tests/unit/db/queries.test.ts

# Only integration tests (App component)
npx vitest run tests/integration/components/App.test.tsx
```

---

## Key files changed in this feature

| File | Change |
|------|--------|
| [src/db/queries.ts](../../../../src/db/queries.ts) | Add `getActiveSubtaskCounts` batch query |
| [src/hooks/useTasks.ts](../../../../src/hooks/useTasks.ts) | Add `activeSubtaskCounts` derived `useMemo` |
| [src/components/App.tsx](../../../../src/components/App.tsx) | Thread `activeSubtaskCounts` to `TaskList` |
| [src/components/TaskList.tsx](../../../../src/components/TaskList.tsx) | Accept and pass `activeSubtaskCounts` to `TaskItem` |
| [src/components/TaskItem.tsx](../../../../src/components/TaskItem.tsx) | Render badge when `activeSubtaskCount > 0` |

---

## TypeScript build check

```bash
npx tsc --noEmit
```
