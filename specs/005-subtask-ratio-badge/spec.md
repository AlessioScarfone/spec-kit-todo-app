# Feature Specification: Subtask Active/Total Ratio Badge

**Feature Branch**: `005-subtask-ratio-badge`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "update the count of subtask to show the count on the total subtask. Eg. I have a task with 2 sub task, one completed an one active. I want to see a counter like 1/2. So 2 total subtask and 1 active. The format is: active_subtask/total_subtask"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See active vs. total subtask progress at a glance (Priority: P1)

A user scans the task list and immediately understands how many subtasks they have left to complete out of the total assigned to each task. Instead of just seeing a raw count of remaining items, they see a ratio (e.g., `1/2`) which communicates both progress and remaining work in a single glance.

**Why this priority**: This is the core value of the feature. The ratio format gives users richer context than a plain count — they can see at a glance how much of the work is done. All other stories depend on this display being correct.

**Independent Test**: Can be fully tested by viewing the task list when tasks have a mix of active and completed subtasks, confirming the badge shows `active/total` where active equals non-completed subtasks and total equals all subtasks.

**Acceptance Scenarios**:

1. **Given** a task has 1 active subtask and 1 completed subtask, **When** the user views the task list, **Then** the badge displays `1/2` next to the task title in a dimmed style.
2. **Given** a task has 3 active subtasks and 0 completed subtasks, **When** the user views the task list, **Then** the badge displays `3/3`.
3. **Given** a task has 0 subtasks, **When** the user views the task list, **Then** no badge is shown next to the task title.

---

### User Story 2 - Ratio updates correctly when a subtask is completed (Priority: P2)

When the user marks a subtask as complete, the active/total ratio badge on the parent task updates to reflect the change: the numerator (active count) decreases by 1, while the denominator (total count) stays the same.

**Why this priority**: A stale or incorrect ratio would mislead users about how much work remains. Accuracy after completion events is critical for the badge to be trustworthy.

**Independent Test**: Can be fully tested by completing a subtask on a task that shows `2/3`, then verifying the badge updates to `1/3`.

**Acceptance Scenarios**:

1. **Given** a task displays `2/3`, **When** the user marks one active subtask as complete, **Then** the badge updates to `1/3`.
2. **Given** a task displays `1/2`, **When** the user marks the last active subtask as complete, **Then** the badge updates to `0/2`.
3. **Given** a task displays `0/1` (all subtasks done), **When** the user marks the one subtask back to active (if re-activation is supported), **Then** the badge updates to `1/1`.

---

### User Story 3 - Ratio updates correctly when subtasks are added or deleted (Priority: P3)

When the user adds a new subtask or deletes an existing one, the badge reflects the change immediately. Adding a subtask increases the denominator; deleting an active subtask decreases both numerator and denominator; deleting a completed subtask decreases only the denominator.

**Why this priority**: Add and delete are less frequent operations than completion, but the denominator must always reflect actual total — an outdated total would make the ratio meaningless.

**Independent Test**: Can be fully tested by adding a subtask to a task showing `1/2`, verifying it becomes `2/3`, then deleting a completed subtask and verifying it becomes `2/2`.

**Acceptance Scenarios**:

1. **Given** a task has no subtasks (no badge), **When** the user adds a new subtask, **Then** the badge appears showing `1/1`.
2. **Given** a task displays `1/2`, **When** the user adds a new active subtask, **Then** the badge updates to `2/3`.
3. **Given** a task displays `1/2`, **When** the user deletes the completed subtask, **Then** the badge updates to `1/1`.
4. **Given** a task displays `1/2`, **When** the user deletes the active subtask, **Then** the badge updates to `0/1`.

---

### Edge Cases

- What happens when a task has only one subtask and it is completed? → The badge shows `0/1`, indicating all subtasks are done without hiding the total.
- What happens when a task has no subtasks? → No badge is displayed.
- What happens when a task has more than 9 subtasks (e.g., 12 total, 7 active)? → The badge displays the full numbers without truncation: `7/12`.
- What if multiple tasks are visible simultaneously, each with different subtask states? → Each task row independently shows its own correct ratio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The interface MUST display a ratio badge in the format `active/total` next to the task title for any task that has at least one subtask (total > 0).
- **FR-002**: The numerator (`active`) MUST represent the count of subtasks in a non-completed state only.
- **FR-003**: The denominator (`total`) MUST represent the count of all subtasks belonging to the task, regardless of their completion state.
- **FR-004**: The badge MUST NOT be displayed when a task has zero subtasks (total = 0).
- **FR-005**: The badge MUST use the same visually dimmed style as the existing muted indicators in the task row (e.g., the `(done)` label on completed tasks) to clearly distinguish it from the task title.
- **FR-006**: The badge MUST reflect the current live state — it MUST update immediately whenever a subtask is added, completed, or deleted.
- **FR-007**: The badge MUST NOT interfere with or alter the visual layout of the task title or any other existing task row elements.
- **FR-008**: This badge MUST replace the existing plain active-count badge introduced in feature 002 — there MUST NOT be two separate count indicators on the same task row.

### Key Entities

- **Task**: Top-level work item in the task list; has a title and an associated set of zero or more subtasks. The badge is rendered at this level.
- **Subtask**: Child item belonging to exactly one parent task; carries a status of either active or complete. Its status determines whether it contributes to the numerator, and its existence always contributes to the denominator.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can determine both the number of remaining subtasks and the total subtask count for any task without navigating away from the task list view.
- **SC-002**: The displayed ratio is always accurate — a manual count of active subtasks matches the numerator, and a manual count of all subtasks matches the denominator, 100% of the time after any state-changing operation (add, complete, delete).
- **SC-003**: The badge appears, disappears, and updates correctly across all boundary conditions: zero subtasks (hidden), all subtasks active, all subtasks completed (showing `0/N`), and mixed states.
- **SC-004**: The ratio badge does not cause any existing task row layout to shift, wrap, or become unreadable at any reasonable subtask count.

## Assumptions

- The badge replaces the existing plain active-count badge from feature 002; it is not an addition alongside it.
- The badge is displayed for any task with at least one subtask, including when all subtasks are completed (showing `0/N`), to preserve visibility of the total count.
- Only direct subtasks are counted (one level of nesting); nested subtasks beyond one level are out of scope.
- The format is a plain `active/total` string (e.g., `1/2`), with no surrounding brackets, icons, or labels.
- The badge is positioned inline with the task title, to the right of the title text, consistent with the existing muted-text convention.
- No user setting or toggle is needed to enable/disable this display — it is always active when subtasks exist.
