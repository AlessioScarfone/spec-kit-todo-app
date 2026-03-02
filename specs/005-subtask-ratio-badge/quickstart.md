# Quickstart: Subtask Completed/Total Ratio Badge

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
5. **Expected**: Task row shows `Buy groceries  0/2` (dim text, no brackets — 0 completed out of 2 total)
6. Expand the task: press `→` or `Enter`
7. Select the first subtask with `↓`, press `c` to complete it
8. **Expected**: The parent task badge updates to `1/2`
9. Complete the second subtask (`↓` → `c`)
10. **Expected**: Badge shows `2/2` (both completed — badge stays visible)
11. Add another task with no subtasks
12. **Expected**: No badge appears on the new task row

---

## Key acceptance scenarios to verify

| State | Badge |
|-------|-------|
| 0 completed, 2 active subtasks | `0/2` |
| 1 completed, 1 active subtask | `1/2` |
| 2 completed, 0 active subtasks | `2/2` |
| 0 subtasks | *(no badge)* |
| 5 completed, 12 total subtasks | `5/12` |

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

- `getSubtaskRatioCounts` returns `{ completed: N, total: M }` per task
- `getSubtaskRatioCounts` returns empty object for empty `taskIds`
- `getSubtaskRatioCounts` omits tasks with zero subtasks
- `TaskItem` renders `1/2` when `subtaskCompleted=1, subtaskTotal=2`
- `TaskItem` renders `0/2` when `subtaskCompleted=0, subtaskTotal=2`
- `TaskItem` renders nothing when `subtaskTotal=0`
- `App` integration: completing a subtask flips badge from `0/2` to `1/2`
