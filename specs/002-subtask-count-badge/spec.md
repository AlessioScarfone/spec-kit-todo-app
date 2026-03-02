# Feature Specification: Incomplete Subtask Count Badge

**Feature Branch**: `002-subtask-count-badge`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "Add in light gray the number of subtask near the task title if any. If subtask number is 0 I don't want to show anything. Show only the number of not completed items"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See pending subtask workload at a glance (Priority: P1)

A user scans the task list and instantly knows how many subtasks still require attention for each task, without having to expand or navigate into the task.

**Why this priority**: This is the core value of the feature — reducing cognitive overhead when reviewing what work remains. Everything else depends on this being correct.

**Independent Test**: Can be fully tested by viewing the task list when tasks have a mix of active and completed subtasks, confirming the count shown equals the number of active (not completed) subtasks.

**Acceptance Scenarios**:

1. **Given** a task has 3 active subtasks and 1 completed subtask, **When** the user views the task list, **Then** the number `3` is displayed near the task title in the same dimmed style as the `(done)` label.
2. **Given** a task has 0 active subtasks (all completed or none added), **When** the user views the task list, **Then** no count indicator appears next to the task title.
3. **Given** a task has no subtasks at all, **When** the user views the task list, **Then** no count indicator appears next to the task title.

---

### User Story 2 - Count stays accurate as subtasks are completed (Priority: P2)

When the user completes a subtask, the count badge on the parent task updates to reflect the new number of remaining active subtasks.

**Why this priority**: A stale count would mislead users about remaining work. Accuracy after state changes is essential for the feature to be trustworthy.

**Independent Test**: Can be fully tested by completing a subtask that belongs to a task with multiple active subtasks, then verifying the displayed count decreases by 1.

**Acceptance Scenarios**:

1. **Given** a task shows a count of `2`, **When** the user marks one of its subtasks as complete, **Then** the count updates to `1`.
2. **Given** a task shows a count of `1`, **When** the user marks its last active subtask as complete, **Then** the count indicator disappears entirely.

---

### User Story 3 - Count stays accurate when subtasks are added or deleted (Priority: P3)

When a new subtask is added to a task, or an existing active subtask is deleted, the count badge reflects the change immediately.

**Why this priority**: Add and delete are less frequent operations than completion, but consistency matters for user trust.

**Independent Test**: Can be fully tested by adding a new subtask to a task, verifying the count increases, then deleting an active subtask and verifying the count decreases.

**Acceptance Scenarios**:

1. **Given** a task has no active subtasks (no badge shown), **When** the user adds a new subtask, **Then** the badge appears showing `1`.
2. **Given** a task shows a count of `2`, **When** the user deletes one active subtask, **Then** the count updates to `1`.

---

### Edge Cases

- What happens when a parent task is completed and all subtasks are bulk-completed? → The count must drop to 0 and the badge must disappear.
- What happens when a task has more than 9 incomplete subtasks (e.g., 12)? → The full number is displayed without truncation or capping.
- What if multiple tasks are visible simultaneously? → Each task row independently shows its own correct count.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The interface MUST display the count of active (not completed) subtasks adjacent to the task title for any task that has at least one active subtask.
- **FR-002**: The count MUST be rendered using the same `dimColor` style as the existing `(done)` label on completed tasks — visually subdued, distinct from the task title, and consistent with the app's existing muted-text convention.
- **FR-003**: The count indicator MUST NOT be shown when a task has zero active subtasks (whether because no subtasks exist, or all are completed).
- **FR-004**: The count MUST reflect the current live state — it MUST update whenever a subtask is added, completed, or deleted.
- **FR-005**: The count MUST represent only subtasks in `active` status; completed subtasks MUST NOT be counted.
- **FR-006**: The count display MUST NOT interfere with or alter the visual layout of the task title or other task row elements.

### Key Entities

- **Task**: Top-level work item displayed in the task list; has a title and an associated set of zero or more subtasks.
- **Subtask**: Child item belonging to exactly one parent task; has a `status` of either `active` or `complete`. Only `active` subtasks contribute to the count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can determine the number of remaining subtasks for any task without navigating away from the task list view.
- **SC-002**: The displayed count is always accurate — a manual count of active subtasks matches the displayed number 100% of the time after any state-changing operation (add, complete, delete).
- **SC-003**: The badge appears and disappears correctly in all boundary conditions: zero subtasks, one subtask transitioning to complete, and bulk-completion of all subtasks via parent task completion.
- **SC-004**: The addition of the count badge does not cause any existing task list layout to shift, wrap, or become unreadable.

## Assumptions

- The count applies only to direct subtasks (one level of nesting); the app does not support nested subtasks beyond one level.
- The count is displayed as a plain integer (no "+" suffix, no icon — just the number).
- The badge is positioned inline with the task title, to the right of the title text, following natural reading order.
- The count uses Ink's `dimColor` prop — the same style as the `(done)` label on completed tasks — not `color="gray"`.
- No user setting or toggle is needed to enable/disable this display — it is always active.
