# Quickstart: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Feature**: `004-tui-fullscreen-toggle`  
**Prerequisite**: Base app from feature `001-tui-todo-app` is installed and working (features `002` and `003` optional but recommended).

---

## Prerequisites

```bash
node --version   # >= 22
npm --version    # >= 10
```

No new runtime dependencies are added by this feature. All changes use `ink`'s existing `useStdout()` hook and SQLite `UPDATE` statements.

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

## Verify the features manually

### Story 1 — Bidirectional toggle (P1)

1. Start the app: `npm start`
2. Press `a`, type a task title (e.g. `"Fix bug"`), press `Enter`
3. Press `c` to complete the task — **expected**: task disappears from active list
4. Press `h` to show completed tasks — **expected**: `"Fix bug"` appears with completed styling
5. Navigate to `"Fix bug"` with `↓`, then press `c` again
6. **Expected**: Task reverts to active state (no strikethrough, back in the active list)
7. Press `h` to hide completed — **expected**: `"Fix bug"` is visible as active

**Subtask toggle**:
1. Add a task, press `s` to add a subtask (e.g. `"Step 1"`)
2. Press `→` to expand the task, navigate to `"Step 1"`, press `c` to complete it
3. Press `h` to show completed, navigate to the subtask, press `c` again
4. **Expected**: Subtask returns to active state

### Story 2 — Updated command bar (P2)

1. Start the app: `npm start`
2. Look at the bottom hint line
3. **Expected**: `"c complete/reactivate"` (not `"c complete"`)

### Story 3 — Fullscreen TUI with pinned command bar (P3)

1. Start the app in a small terminal window (e.g. 40 columns × 15 rows): `npm start`
2. **Expected**: TUI fills the entire terminal; command bar is at the very last line
3. Add more tasks than fit on screen (add 20+ tasks via repeated `a` → title → Enter)
4. Navigate with `↓` through the list
5. **Expected**: Task list scrolls; command bar remains pinned at the bottom at all times
6. Resize the terminal window while the app is running
7. **Expected**: TUI reflows to the new dimensions; command bar stays at the bottom

---

## Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Only unit tests (DB queries — reactivateTask / reactivateSubtask)
npx vitest run tests/unit/db/queries.test.ts

# Only integration tests (App — toggle, command bar, fullscreen)
npx vitest run tests/integration/components/App.test.tsx
```

---

## Key files changed in this feature

| File | Change |
|------|--------|
| [src/db/queries.ts](../../../../src/db/queries.ts) | Add `reactivateTask()` and `reactivateSubtask()` |
| [src/hooks/useTasks.ts](../../../../src/hooks/useTasks.ts) | Expose `reactivateTask` and `reactivateSubtask` callbacks |
| [src/components/App.tsx](../../../../src/components/App.tsx) | Fullscreen layout via `useStdout()`; virtual scroll offset; bidirectional "c" handler; updated hint text |

---

## TypeScript build check

```bash
npx tsc --noEmit
```
