# Keyboard Interaction Contract

**Feature**: Terminal Todo App (001-tui-todo-app)  
**Date**: 2026-03-02  
**Status**: Authoritative — derived from spec.md FR-011 and clarification answers

This document is the canonical reference for all keyboard bindings. Implementation MUST match this contract exactly. Any deviation requires updating this contract first (spec-first rule).

---

## Global Keys (always active)

| Key | Action | Notes |
|---|---|---|
| `Ctrl+C` | Exit application | Handled by Ink's default `exitOnCtrlC` |
| `q` | Exit application | Graceful exit from main list view only |

---

## Main List View (inputMode = `idle`)

### Navigation

| Key | Action |
|---|---|
| `↑` (up arrow) | Move selection cursor up one row |
| `↓` (down arrow) | Move selection cursor down one row |

Behavior:
- Cursor wraps: pressing `↑` on the first item moves to the last; pressing `↓` on the last moves to the first
- Each visible row (task or visible subtask) is independently selectable
- The cursor cannot be positioned on an empty list (no-op)

### Subtask Accordion

| Key | Action | Condition |
|---|---|---|
| `→` (right arrow) | Expand subtasks under selected task | Selected row is a top-level Task with subtasks; subtasks currently collapsed |
| `←` (left arrow) | Collapse subtasks under selected task | Selected row is a top-level Task; subtasks currently expanded |
| `Tab` | Toggle (expand if collapsed, collapse if expanded) subtask list under selected task | Selected row is a top-level Task with subtasks |

Behavior:
- `→` and `←` are no-ops when the selected row is a Subtask
- `→` is a no-op when the selected Task has no subtasks
- `Tab` is a no-op when the selected row is a Subtask
- `Tab` is a no-op when the selected Task has no subtasks
- Expanded/collapsed state is not persisted between sessions

### Task Lifecycle

| Key | Action | Condition |
|---|---|---|
| `c` | Complete selected item | Selected row is active (Task or Subtask) |
| `d` | Permanently delete selected item | Selected row is any item (active or complete if visible) |

Behavior — completing:
- Completing a **Task** also completes all its Subtasks atomically
- Completed items are immediately hidden (unless `showCompleted = true`)
- `c` is a no-op when the selected item is already complete

Behavior — deleting:
- Deleting a **Task** permanently removes all its Subtasks (cascade)
- Deleting a **Subtask** removes only that subtask; parent and siblings unaffected
- No confirmation prompt; action is immediate and irreversible

### Completed Items Visibility

| Key | Action |
|---|---|
| `h` | Toggle visibility of completed items |

Behavior:
- When `showCompleted = false` (default): only active items are shown
- When `showCompleted = true`: completed items are shown inline, visually distinct (dimmed/strikethrough), ordered after their active siblings

### Add New Item

| Key | Action | Condition |
|---|---|---|
| `a` | Enter add-task mode | inputMode = `idle`, any list state |
| `s` | Enter add-subtask mode | inputMode = `idle`, selected row is a top-level Task |

---

## Input Mode (inputMode = `addTask` or `addSubtask`)

| Key | Action |
|---|---|
| Any printable character | Append to title field |
| `Backspace` | Delete last character from title field |
| `Enter` | Confirm — save item if title is non-empty |
| `Esc` | Cancel — discard input, return to list |

Behavior:
- `Enter` with an empty title is a no-op (user remains in input mode)
- No maximum title length is enforced
- Newly added items are appended at the end of the list (insertion order)

---

## Summary Table

| Key | idle (list) | addTask / addSubtask |
|---|---|---|
| `↑` / `↓` | Navigate list | — |
| `→` | Expand subtasks | — |
| `←` | Collapse subtasks | — |
| `a` | Add task | — |
| `s` | Add subtask (task selected) | — |
| `c` | Complete item | — |
| `d` | Delete item | — |
| `h` | Toggle completed | — |
| `Enter` | — | Confirm (if title non-empty) |
| `Esc` | — | Cancel |
| `Backspace` | — | Delete last char |
| `q` / `Ctrl+C` | Quit | — |
