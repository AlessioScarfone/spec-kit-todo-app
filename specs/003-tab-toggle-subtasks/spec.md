# Feature Specification: Tab Key Subtask Toggle

**Feature Branch**: `003-tab-toggle-subtasks`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "toggle subtask visibility with tab and not only left/right arrow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Subtask Visibility with Tab (Priority: P1)

A user navigating the task list wants to quickly expand or collapse subtasks under the selected task. Currently they must reach for the `→` or `←` arrow keys. With this feature, pressing `Tab` on a task with subtasks toggles the collapsed/expanded state directly — expand if collapsed, collapse if expanded — without changing any other key binding.

**Why this priority**: This is the entire scope of the feature. Tab is a universally ergonomic key for toggling/cycling between states and is closer to home row than arrow keys, reducing hand movement during list navigation.

**Independent Test**: Can be fully tested by selecting a task with subtasks, pressing Tab repeatedly, and verifying that the subtask list alternates between visible and hidden each time.

**Acceptance Scenarios**:

1. **Given** a task with subtasks is selected and subtasks are collapsed, **When** the user presses `Tab`, **Then** the subtasks expand and become visible beneath the parent task.
2. **Given** a task with subtasks is selected and subtasks are expanded, **When** the user presses `Tab`, **Then** the subtasks collapse and are hidden from the list.
3. **Given** the same task, **When** the user presses `Tab` multiple times in succession, **Then** each press alternates the subtask list between expanded and collapsed.
4. **Given** a task with no subtasks is selected, **When** the user presses `Tab`, **Then** nothing changes and no error occurs.
5. **Given** a subtask row is selected (not a top-level task), **When** the user presses `Tab`, **Then** nothing changes and no error occurs.
6. **Given** a task with subtasks is selected, **When** the user presses `→` or `←`, **Then** the expand/collapse behavior is unchanged — the existing arrow key bindings continue to work exactly as before.

---

### Edge Cases

- **Subtask selected**: Tab is a no-op when the currently selected row is a subtask, matching the existing behavior of `→` and `←`.
- **Task with no subtasks**: Tab is a no-op, matching the existing `→` no-op behavior.
- **Empty list**: Tab is a no-op when there are no rows to act on.
- **Expanded/collapsed state persistence**: Like the existing arrow key behavior, Tab-triggered state changes are not persisted between sessions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST respond to the `Tab` key in the main list view when `inputMode` is `idle`.
- **FR-002**: When `Tab` is pressed and the selected row is a top-level task with subtasks currently collapsed, the subtasks MUST expand.
- **FR-003**: When `Tab` is pressed and the selected row is a top-level task with subtasks currently expanded, the subtasks MUST collapse.
- **FR-004**: `Tab` MUST act as a toggle — a single binding that handles both expand and collapse — rather than requiring separate keys for each direction.
- **FR-005**: `Tab` MUST be a no-op when the selected row is a subtask.
- **FR-006**: `Tab` MUST be a no-op when the selected task has no subtasks.
- **FR-007**: The existing `→` (expand) and `←` (collapse) key bindings MUST continue to work exactly as before; this feature adds `Tab` as an alternative, not a replacement.
- **FR-008**: The set of visible rows after pressing `Tab` MUST be identical to the set that would be visible after pressing `→` or `←` from the same starting expand/collapse state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can expand and collapse subtasks using only the `Tab` key without touching `→` or `←`.
- **SC-002**: All existing subtask expand/collapse acceptance scenarios from the original spec (001-tui-todo-app, User Story 3) continue to pass without modification after this change is applied.
- **SC-003**: `Tab` produces no visible change and no error when pressed on a task without subtasks or on a subtask row.
- **SC-004**: The keyboard contract document for the app is updated to reflect the new `Tab` binding alongside `→`/`←` in the Subtask Accordion section.
