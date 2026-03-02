# Quickstart: Subtask Active/Total Ratio Badge

**Feature**: `005-subtask-ratio-badge`  
**Prerequisite**: Feature `002-subtask-count-badge` (plain active-count badge) is implemented and merged. This feature replaces that badge.

---

## Prerequisites

```bash
node --version   # >= 22
npm --version    # >= 10
```

Dependencies are already installed. No new runtime dependencies are added by this feature.

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
2. Press `a`, type a task title `"Buy groceries"`, press `Enter`
3. With the task selected, press `s` → type `"Milk"` → `Enter` (subtask 1)
4. Press `s` → type `"Bread"` → `Enter` (subtask 2)
5. **Expected**: Task row shows `Buy groceries  2/2` (dim text, no brackets)
6. Expand the task: press `→` or `Enter`
7. Select the first subtask with `↓`, press `c` to complete it
8. **Expected**: The parent task badge updates to `1/2`
9. Complete the second subtask (`↓` → `c`)
10. **Expected**: Badge shows `0/2` (not hidden — total is still visible)
11. Add another task with no subtasks
12. **Expected**: No badge appears on the new task row

---

## Key acceptance scenarios to verify

| State | Badge |
|-------|-------|
| 2 active, 0 complete subtasks | `2/2` |
| 1 active, 1 complete subtask | `1/2` |
| 0 active, 2 complete subtasks | `0/2` |
| 0 subtasks | *(no badge)* |
| 7 active, 12 total subtasks | `7/12` |

---

## Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Only DB query unit tests
npx vitest run tests/unit/db/queries.test.ts

# Only hook unit tests
npx vitest run tests/unit/hooks/useTasks.test.tsx

# Only integration tests
npx vitest run tests/integration/components/App.test.tsx
```

---

## Key test cases (written before implementation — TDD)

- `getSubtaskRatioCounts` returns `{ active: N, total: M }` per task
- `getSubtaskRatioCounts` returns empty object for empty `taskIds`
- `getSubtaskRatioCounts` omits tasks with zero subtasks
- `TaskItem` renders `1/2` when `subtaskActive=1, subtaskTotal=2`
- `TaskItem` renders `0/2` when `subtaskActive=0, subtaskTotal=2`
- `TaskItem` renders nothing when `subtaskTotal=0`
- `App` integration: completing a subtask flips badge from `2/2` to `1/2`
