# Research: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Feature**: `004-tui-fullscreen-toggle`  
**Phase**: 0 — All unknowns resolved before Phase 1 design  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## R-001: How to achieve fullscreen layout in ink v6

**Question**: Does ink v6 expose API surface for reading terminal dimensions, and does it automatically reflow on resize?

**Decision**: Use `useStdout()` from `ink` to read `stdout.columns` and `stdout.rows`; apply them as `width` / `height` on the outermost `<Box>`. Ink re-renders on resize events automatically when the component reads from `useStdout()`.

**Rationale**:
- `useStdout()` is a built-in ink hook (`import { useStdout } from 'ink'`). It returns `{ stdout }` where `stdout.columns` and `stdout.rows` reflect the current terminal size at render time.
- Ink's render loop already subscribes to `process.stdout`'s `resize` event and triggers a re-render, so no manual `process.stdout.on('resize', ...)` listener is needed.
- Applying `width={stdout.columns}` and `height={stdout.rows}` to the root `Box` guarantees that the layout exactly fills the terminal at launch and after every resize.
- This is zero-dependency: no new npm packages; ink v6 already installed.

**Implementation**:
```tsx
import { Box, useStdout } from 'ink';

function App({ ... }) {
  const { stdout } = useStdout();
  const width = stdout.columns;
  const height = stdout.rows;

  return (
    <Box flexDirection="column" width={width} height={height}>
      ...
    </Box>
  );
}
```

**Alternatives considered**:
- *`process.stdout.columns` / `process.stdout.rows` directly*: Works but misses re-render on resize because React has no reactive binding to a property read. `useStdout()` provides the same values with reactive semantics. Rejected.
- *External `terminal-size` package*: No reactive binding; adds a dependency. Rejected (Principle III).

---

## R-002: How to pin the command bar to the bottom of the terminal

**Question**: What flex layout achieves a pinned bottom bar so that the content area scrolls but the command bar never moves regardless of how many rows the task list has?

**Decision**: Use `flexDirection="column"` on the root `Box` (sized to `height={stdout.rows}`); apply `flexGrow={1}` and `overflowY="hidden"` to the task list `Box`; place the command bar `Box` last — flex layout pushes it to the last row.

**Rationale**:
- In a fixed-height flex column, `flexGrow={1}` on the content region causes it to consume all remaining vertical space, leaving exactly no room below except for the explicitly sized command bar.
- `overflowY="hidden"` clips content that overflows the content region so it never intrudes into the command bar row.
- The command bar `Box` requires no special positioning — being last in a flex column with no remaining space locks it at the bottom.
- This is a pure CSS-flexbox-style layout; ink v6 implements the Yoga layout engine which fully supports this pattern.

**Implementation**:
```tsx
<Box flexDirection="column" width={width} height={height} paddingX={1}>
  {/* scrollable content region */}
  <Box flexDirection="column" flexGrow={1} overflowY="hidden">
    <Banner />
    <TaskList visibleRows={visibleRows} />
  </Box>

  {/* pinned command bar — always last */}
  <Box>
    <Text dimColor>…hint text…</Text>
  </Box>
</Box>
```

**Alternatives considered**:
- *Absolute positioning*: ink/Yoga does not support `position: absolute`. Not available.
- *Padding to push bar to bottom*: Would require computing available rows minus content rows — fragile and recalculates on every render. Rejected.
- *Render command bar outside the ink `Box` to `process.stdout` directly*: Would bypass ink's reconciler and cause rendering artifacts. Rejected.

---

## R-003: How to implement virtual scroll within the bounded content region

**Question**: ink does not have a native scrollable container. How do we keep the selected item visible within the bounded height without content pushing the command bar off-screen?

**Decision**: Maintain a `scrollOffset` state variable (initialized to 0). Compute the number of visible rows as `visibleHeight = height - fixedRowsAboveList - 1` (1 for command bar). Slice `rows` to `rows.slice(scrollOffset, scrollOffset + visibleHeight)` before passing to `TaskList`. Update `scrollOffset` whenever `selectedIndex` moves outside the visible window (clamp-scroll / follow-cursor algorithm).

**Rationale**:
- This is the canonical approach for ink lists (used by ink-select-input and similar). No additional package is required.
- The `scrollOffset` is a single `useState<number>` — the minimum additional state to support scrolling. Principle III compliant.
- Fixed rows above the list: banner (5 lines) + optional "[showing completed]" line (1) + optional `StatusMessage` (1) + `marginBottom` (1) = at most 8 rows. In practice, the banner is the only fixed element above the list; actual fixed row count is measured at render time by passing the content height as a prop.
- A simpler approach: compute `visibleHeight = height - reservedRows` where `reservedRows = BANNER_LINES.length + 2` (banner + 1 separator margin + 1 command bar).

**Scroll update algorithm**:
```ts
// after selectedIndex changes:
if (selectedIndex < scrollOffset) {
  setScrollOffset(selectedIndex);
} else if (selectedIndex >= scrollOffset + visibleHeight) {
  setScrollOffset(selectedIndex - visibleHeight + 1);
}
```

**Alternatives considered**:
- *Render all rows and let ink clip*: `overflowY="hidden"` clips but keeps the selected item at a fixed offset — the selected item could scroll off the top of the visible region. Only setting `scrollOffset` correctly keeps the selected item visible. Rejected as incomplete.
- *Use `ink-select-input`*: Adds a dependency and replaces the existing custom navigation. Out of scope for this feature. Rejected (Principle III).

---

## R-004: Bidirectional status toggle — query design

**Question**: Should `reactivateTask` / `reactivateSubtask` be new standalone functions, or should existing `completeTask` / `completeSubtask` be generalised to `setTaskStatus(id, status)`?

**Decision**: Add two new standalone functions (`reactivateTask`, `reactivateSubtask`) in `queries.ts`. Do not generalise existing `complete*` functions.

**Rationale**:
- The spec says each status change call has a single, clear intent: "complete this item" or "reactivate this item". A `setTaskStatus` abstraction exists to serve a *third* hypothetical status — there is no third status (YAGNI, Principle III).
- `completeTask` has a transaction that also completes all subtasks. `reactivateTask` intentionally does NOT reactivate subtasks (spec assumption: each item is toggled independently). Different semantics → different function.
- Adding a parameter (`status: 'active' | 'complete'`) to the existing `completeTask` would require callers to pass a string literal instead of calling a semantically named function, reducing readability without benefit.
- Two new functions = two new targeted SQL statements = minimal blast radius.

**Implementation**:
```ts
export function reactivateTask(db: Database, id: number): void {
  db.prepare("UPDATE tasks SET status = 'active' WHERE id = ?").run(id);
}

export function reactivateSubtask(db: Database, id: number): void {
  db.prepare("UPDATE subtasks SET status = 'active' WHERE id = ?").run(id);
}
```

**`App.tsx` toggle handler**:
```ts
if (input === 'c') {
  if (!currentRow) return;
  if (currentRow.kind === 'task') {
    if (currentRow.task.status === 'active') {
      completeTask(currentRow.task.id);
    } else {
      reactivateTask(currentRow.task.id);
    }
    setSelectedIndex(Math.max(0, selectedIndex - 1));
  } else if (currentRow.kind === 'subtask') {
    if (currentRow.subtask.status === 'active') {
      completeSubtask(currentRow.subtask.id);
    } else {
      reactivateSubtask(currentRow.subtask.id);
    }
    setSelectedIndex(Math.max(0, selectedIndex - 1));
  }
  return;
}
```

**Alternatives considered**:
- *Generalise to `setTaskStatus(db, id, status)`*: No confirmed third-status use case. Principle III violation. Rejected.
- *`toggleTaskStatus(db, id)`* (reads status then flips it inside the query): Requires a read-then-write; violates the single-statement simplicity that existing query functions follow. Rejected.

---

## R-005: Command bar hint text — exact wording

**Question**: What is the exact replacement string for `"c complete"` in the idle-mode hint?

**Decision**: Replace `"c complete"` with `"c complete/reactivate"` in the hint bar text inside `App.tsx`.

**Rationale**:
- The spec (FR-003) suggests `"c complete/reactivate"` as a concrete example — adopt it verbatim to satisfy the spec exactly.
- The existing hint line is: `'↑↓ navigate  a add  s subtask  c complete  d delete  h toggle  q quit'`
- The updated hint line is: `'↑↓ navigate  a add  s subtask  c complete/reactivate  d delete  h toggle  q quit'`
- No layout change: the hint is displayed with `dimColor` and may be truncated by the terminal if narrow (spec assumption explicitly permits truncation).

**Alternatives considered**:
- `"c toggle"`: Too vague — doesn't communicate what is being toggled. Rejected.
- `"c ✓/↩"`: Icon-based; terminal font support is unknown. Rejected.
