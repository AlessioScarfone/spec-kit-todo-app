# Feature Specification: TUI Fullscreen Layout & Bidirectional Task Completion Toggle

**Feature Branch**: `004-tui-fullscreen-toggle`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "i want to activate again a completed task when i click again c on a completed task. Update also the info line with the command at the bottom of the tui. Can we make the TUI full terminal size and anchor the command line at the bottom of the terminal?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reactivate a Completed Task (Priority: P1)

A user has marked a task as complete but realizes it needs more work. They navigate to the completed task and press "c" again to toggle it back to active. The task immediately returns to its active state and is treated as an open item again.

**Why this priority**: The toggle behavior is the core new interaction requested. Without it, the user must delete and recreate tasks they accidentally completed or need to reopen — a significant workflow friction point. Everything else in this spec builds on or alongside this capability independently.

**Independent Test**: Can be fully tested by completing a task, pressing "c" on it while it is selected in the completed state, and verifying it becomes active again.

**Acceptance Scenarios**:

1. **Given** a task with status "completed" is highlighted, **When** the user presses "c", **Then** the task status reverts to "active" and it appears in the active task list.
2. **Given** a subtask with status "completed" is highlighted, **When** the user presses "c", **Then** the subtask status reverts to "active".
3. **Given** an active task is highlighted, **When** the user presses "c", **Then** the task status is set to `'complete'` (existing behavior preserved).
4. **Given** a completed task is toggled back to active, **When** the task list is viewed, **Then** the task appears as active and can be completed again.

---

### User Story 2 - Updated Command Bar Reflecting Toggle Behavior (Priority: P2)

A user looks at the command hint bar at the bottom of the TUI to understand available keyboard shortcuts. The hint text for "c" now communicates that it works as a toggle between complete and active, not just a one-way completion action.

**Why this priority**: Without updating the command bar, users have no discoverability of the new toggle behavior. It is a low-effort change that directly completes the user's explicit request and can be verified without any backend changes.

**Independent Test**: Can be fully tested by launching the TUI and reading the command bar — regardless of task state, confirm the hint for "c" reflects a toggle action.

**Acceptance Scenarios**:

1. **Given** the TUI is running, **When** the user views the command hint bar at the bottom of the screen, **Then** the "c" key is described as toggling completion (e.g., "c complete/reactivate") rather than only completing.
2. **Given** a completed task is selected, **When** the user looks at the command bar, **Then** the "c" hint is still visible and accurately describes the toggle action.

---

### User Story 3 - Full-Terminal Fullscreen TUI Layout (Priority: P3)

A user opens the TUI and the interface expands to fill the entire visible terminal window. The task list scrolls within the available height, and the command bar is always pinned to the last line of the terminal — never scrolled out of view, never obscured by content.

**Why this priority**: This is a layout/UX improvement that makes the app feel polished and professional. It does not affect task data or keyboard interactions, so it can be developed and validated independently.

**Independent Test**: Can be fully tested by launching the TUI in a terminal of any size (small and large), confirming the task list fills the terminal height and the command bar remains at the very bottom regardless of the number of tasks.

**Acceptance Scenarios**:

1. **Given** the TUI is launched, **When** the terminal window is any size, **Then** the TUI occupies the full width and height of the terminal.
2. **Given** many tasks are present (more than fit on screen), **When** the user scrolls through the list, **Then** the command bar remains anchored at the bottom and is never pushed off screen.
3. **Given** few tasks are present (fewer than fill the screen), **When** the TUI is displayed, **Then** the task list area fills the remaining space above the pinned command bar (no content appears below the bar).
4. **Given** the terminal is resized while the TUI is running, **When** the resize occurs, **Then** the TUI reflows to the new dimensions and the command bar remains at the bottom.

---

### Edge Cases

- What happens when a completed task's parent task (if any) is still active — does reactivating a subtask affect its parent task's status?
- How does the command bar display if the terminal is so narrow that the full hint string doesn't fit?
- What happens if all tasks are completed and the user reactivates one — does it correctly reappear in the main active list?
- What happens if the user presses "c" rapidly on the same task — does it remain stable (idempotent per keypress)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST toggle a task's status between `'complete'` and `'active'` each time the user presses "c" on that task, regardless of its current status.
- **FR-002**: The system MUST toggle a subtask's status between `'complete'` and `'active'` each time the user presses "c" on that subtask, regardless of its current status.
- **FR-003**: The command hint bar MUST display "c" as a toggle action (e.g., "c complete/reactivate") to reflect its bidirectional behavior.
- **FR-004**: The TUI MUST render to fill the full width and height of the terminal at launch.
- **FR-005**: The command hint bar MUST be permanently anchored to the bottom of the terminal window, remaining visible at all times regardless of task list length.
- **FR-006**: The task list area MUST scroll independently within the space between the top of the TUI and the pinned command bar.
- **FR-007**: The TUI MUST reflow to adapt to terminal resize events while keeping the command bar anchored at the bottom.
- **FR-008**: Reactivating a completed task MUST persist the status change (the task remains active if the app is restarted or the view is refreshed).

### Assumptions

- Reactivating a completed subtask does not automatically affect the parent task's completion status; each item is toggled independently.
- If the terminal is too narrow to display the full command hint string, the string may be truncated — no wrapping or multi-line hint bar is required.
- "Anchored at the bottom" means the command bar occupies the last line(s) of the terminal; the task list grows upward from there.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can toggle any task or subtask between completed and active in a single keypress, with the change reflected immediately on screen.
- **SC-002**: The command bar is visible at the bottom of the terminal at all times, regardless of how many tasks exist or how far the user has scrolled.
- **SC-003**: The TUI fills 100% of the terminal width and height immediately on launch without requiring manual resize.
- **SC-004**: The hint text for "c" accurately communicates bidirectional toggle behavior so that a new user understands the action without external documentation.
- **SC-005**: Status changes made via the toggle persist across TUI sessions — a reactivated task remains active after the app is closed and reopened.
