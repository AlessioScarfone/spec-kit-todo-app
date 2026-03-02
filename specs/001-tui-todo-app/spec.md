# Feature Specification: Terminal Todo App

**Feature Branch**: `001-tui-todo-app`  
**Created**: 2026-03-02  
**Status**: Clarified  
**Input**: User description: "Build an application that can handle todo task list in a TUI interface to use on a terminal. It has to be fast, and simple. Just add a task and remove a task. Allow Task and subtask to help organization. All information must be stored locally. No internet connection required"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and View Tasks (Priority: P1)

A user opens the application in their terminal and is immediately presented with their existing task list. They can add a new task by typing a title and confirming. The new task instantly appears in the list.

**Why this priority**: Without the ability to create and view tasks, the application has no value. This is the foundational capability every other story builds upon.

**Independent Test**: Can be fully tested by launching the app, adding several tasks and confirming they appear in the list — delivers a usable task tracker with no other features required.

**Acceptance Scenarios**:

1. **Given** the application is launched with no existing tasks, **When** the user adds a new task, **Then** the task appears immediately in the list with its title visible.
2. **Given** the application is launched with existing saved tasks, **When** the task list loads, **Then** all previously saved tasks are displayed in the same order they were created.
3. **Given** the user is adding a task, **When** they cancel the action without confirming, **Then** no task is added and the list remains unchanged.

---

### User Story 2 - Complete and Delete Tasks (Priority: P2)

A user manages the lifecycle of a task once it is created. Pressing `c` marks a task as complete and hides it from the active list. Pressing `d` immediately and permanently removes it with no confirmation. Completed tasks can be revealed with `h`; when visible, a completed task can also be permanently deleted with `d`.

**Why this priority**: Managing what is done versus still pending is essential to keeping the list useful. Completion provides a lightweight way to track progress without permanently discarding data, while hard delete handles tasks added by mistake.

**Independent Test**: Can be fully tested by creating tasks, completing some, hard-deleting others, toggling completed task visibility, deleting completed tasks, and verifying all state survives a restart.

**Acceptance Scenarios**:

1. **Given** an active task is selected, **When** the user presses `c`, **Then** the task (and all its subtasks) is marked as complete and hidden from the active list immediately.
2. **Given** an active task is selected, **When** the user presses `d`, **Then** the task and all its subtasks are permanently removed immediately with no confirmation prompt.
3. **Given** completed tasks exist and are hidden, **When** the user presses `h`, **Then** completed tasks become visible in the list, visually distinct from active tasks.
4. **Given** completed tasks are visible and a completed task is selected, **When** the user presses `d`, **Then** the completed task is permanently deleted.
5. **Given** completed tasks are visible, **When** the user presses `h` again, **Then** completed tasks are hidden from the list.

---

### User Story 3 - Organize with Subtasks (Priority: P3)

A user can add subtasks under an existing task to break a larger goal into smaller steps. Subtasks belong to their parent task and are displayed indented beneath it. The user can collapse and expand the subtask list using the `←` and `→` arrow keys, giving a clean accordion-style view.

**Why this priority**: Subtasks are an organizational enhancement on top of a working task manager. They improve clarity for complex tasks without being essential to basic use.

**Independent Test**: Can be fully tested by creating a task, adding subtasks, collapsing and expanding them, removing individual subtasks, and verifying the hierarchy and collapsed state survive a restart.

**Acceptance Scenarios**:

1. **Given** a task exists, **When** the user adds a subtask to it, **Then** the subtask appears indented below the parent task.
2. **Given** a task has subtasks, **When** the user removes a specific subtask with `d`, **Then** only that subtask is permanently removed; the parent and remaining subtasks are unaffected.
3. **Given** a task has subtasks and the parent is selected, **When** the user presses `←`, **Then** the subtasks collapse and are no longer visible in the list.
4. **Given** a task has collapsed subtasks and the parent is selected, **When** the user presses `→`, **Then** the subtasks expand and become visible again below the parent task.
5. **Given** a task has subtasks, **When** the list is displayed, **Then** the subtasks are visually grouped and indented under their parent task.

---

### Edge Cases

- **Empty task title**: The action is blocked. The application MUST NOT allow a task or subtask to be created with an empty title; the user is kept in the input state until a non-empty title is entered or the action is cancelled.
- **Duplicate task titles**: Allowed. Tasks are uniquely identified by an internal ID, not by their title.
- **Completing a task with incomplete subtasks**: All subtasks are marked as complete alongside the parent task.
- **Hard-deleting a task with subtasks**: The parent task and all its subtasks are permanently deleted together immediately.
- **Missing or corrupted data file**: The application notifies the user of the error, then starts fresh with an empty task list and a new storage file.
- **Large number of tasks**: Not a concern for this version. The application is single-user and not expected to accumulate a large volume of data.
- **Empty task list**: The application displays a friendly message indicating there are no tasks yet, rather than a blank or broken view.

## Requirements *(mandatory)*

### Functional Requirements

**Task creation**
- **FR-001**: Users MUST be able to create a new top-level task with a title.
- **FR-002**: Users MUST be able to add a subtask under an existing task.
- **FR-003**: The application MUST prevent a task or subtask from being created with an empty title; the user MUST be kept in the input state until a valid title is entered or the action is cancelled.
- **FR-004**: Duplicate task titles MUST be allowed; each task is uniquely identified by an internal ID.

**Task lifecycle**
- **FR-005**: Users MUST be able to mark an active task as complete by pressing `c`; the task and all its subtasks are marked as complete and hidden from the active list immediately.
- **FR-006**: Users MUST be able to permanently delete any active task by pressing `d`; the task and all its subtasks are removed immediately with no confirmation prompt.
- **FR-007**: Users MUST be able to permanently delete a completed task by pressing `d` while completed tasks are visible.
- **FR-008**: Users MUST be able to toggle the visibility of completed tasks by pressing `h`; completed tasks MUST be visually distinct from active tasks when shown.

**Subtasks & navigation**
- **FR-009**: Subtasks MUST be displayed indented below and visually associated with their parent task.
- **FR-010**: Users MUST be able to collapse and expand a task's subtasks by pressing `←` (collapse) and `→` (expand) when the parent task is selected.
- **FR-011**: All navigation MUST be keyboard-driven: `↑`/`↓` to move between items, `Enter` to confirm, `Esc` to cancel.

**Persistence & storage**
- **FR-012**: All task and subtask data MUST be stored locally on the user's device in the OS standard user data directory (e.g. `~/.local/share/` on Linux/macOS, `%APPDATA%` on Windows).
- **FR-013**: The application MUST function completely without an internet connection.
- **FR-014**: Task and subtask data MUST persist between sessions; closing and reopening the app MUST restore the previous state.

**Resilience & feedback**
- **FR-015**: If the local data file is missing or corrupted on launch, the application MUST display an error message to the user and start with a new empty task list.
- **FR-016**: When the active task list is empty, the application MUST display a friendly message indicating there are no tasks yet.

### Key Entities

- **Task**: A single unit of work with an internal unique ID and a title (non-empty, duplicates allowed). Has a lifecycle state: *active* or *complete*. May contain zero or more subtasks. Persisted locally across sessions.
- **Subtask**: A child item belonging to exactly one parent task. Has its own internal ID, title, and lifecycle state (*active* or *complete*). Can be completed or deleted independently, or together with the parent. Displayed indented below the parent; can be collapsed or expanded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new task in 5 or fewer interactions (keystrokes or selections) from the app's main view.
- **SC-002**: The task list displays within 1 second of launching the application, even with 500 or more stored tasks.
- **SC-003**: A new user with no prior experience can add and remove a task without consulting any documentation within their first session.
- **SC-004**: Zero data loss occurs when the application is closed normally or interrupted; all tasks and subtasks are fully restored on next launch.
- **SC-005**: The application runs and responds to input with no perceptible lag during all primary actions (add, view, delete).

## Assumptions

- Task ordering is based on insertion order (most recent additions appear at the end of the list).
- Tasks have two lifecycle states only: *active* and *complete*. There is no intermediate state (e.g. in-progress, paused).
- Subtasks support one level of nesting only (no sub-subtasks).
- A single user uses the application on a single machine; no sharing or sync features are in scope.
- Data is stored in a structured file format on the local filesystem under the OS standard user data directory: `~/.local/share/<app-name>/` on Linux/macOS, `%APPDATA%\<app-name>\` on Windows.
- Collapsed/expanded state of subtasks is a UI-only preference and does not need to persist between sessions.
