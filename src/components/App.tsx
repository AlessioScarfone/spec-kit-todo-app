import { Box, Text, useApp, useInput } from 'ink';
import { StatusMessage } from '@inkjs/ui';
import type { Database } from 'better-sqlite3';
import { useTasks } from '../hooks/useTasks.js';
import { TaskList, buildFlatRows } from './TaskList.js';
import { TaskInput } from './TaskInput.js';

interface AppProps {
  db: Database;
  startupError?: string;
}

export function App({ db, startupError }: AppProps) {
  const { exit } = useApp();

  const {
    tasks,
    subtasksMap,
    subtaskCounts,
    inputMode,
    setInputMode,
    selectedIndex,
    setSelectedIndex,
    showCompleted,
    expandedTaskIds,
    addTask,
    completeTask,
    completeSubtask,
    deleteTask,
    toggleShowCompleted,
    addSubtask,
    deleteSubtask,
    toggleExpand,
  } = useTasks(db);

  // Build flat row list for navigation
  const rows = buildFlatRows(tasks, subtasksMap, expandedTaskIds);
  const rowCount = rows.length;

  useInput(
    (input, key) => {
      if (inputMode !== 'idle') return;

      // Navigation
      if (key.upArrow) {
        setSelectedIndex(rowCount === 0 ? 0 : (selectedIndex - 1 + rowCount) % rowCount);
        return;
      }
      if (key.downArrow) {
        setSelectedIndex(rowCount === 0 ? 0 : (selectedIndex + 1) % rowCount);
        return;
      }

      const currentRow = rows[selectedIndex];

      // Expand / collapse subtasks
      if (key.rightArrow) {
        if (currentRow?.kind === 'task') {
          const count = subtaskCounts[currentRow.task.id] ?? 0;
          if (count > 0 && !expandedTaskIds.has(currentRow.task.id)) {
            toggleExpand(currentRow.task.id);
          }
        }
        return;
      }
      if (key.leftArrow) {
        if (currentRow?.kind === 'task' && expandedTaskIds.has(currentRow.task.id)) {
          toggleExpand(currentRow.task.id);
        }
        return;
      }

      // Add task
      if (input === 'a') {
        setInputMode('addTask');
        return;
      }

      // Add subtask — only when a top-level task row is selected
      if (input === 's') {
        if (currentRow?.kind === 'task') {
          setInputMode('addSubtask');
        }
        return;
      }

      // Complete item
      if (input === 'c') {
        if (!currentRow) return;
        if (currentRow.kind === 'task' && currentRow.task.status === 'active') {
          completeTask(currentRow.task.id);
          // Clamp selection
          setSelectedIndex(Math.max(0, selectedIndex - 1));
        } else if (currentRow.kind === 'subtask' && currentRow.subtask.status === 'active') {
          completeSubtask(currentRow.subtask.id);
          setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
        return;
      }

      // Delete item
      if (input === 'd') {
        if (!currentRow) return;
        if (currentRow.kind === 'task') {
          deleteTask(currentRow.task.id);
        } else {
          deleteSubtask(currentRow.subtask.id);
        }
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        return;
      }

      // Toggle completed visibility
      if (input === 'h') {
        toggleShowCompleted();
        return;
      }

      // Quit
      if (input === 'q') {
        exit();
      }
    },
    { isActive: true }
  );

  // Determine which task is selected for addSubtask
  const currentRow = rows[selectedIndex];
  const selectedTaskId =
    currentRow?.kind === 'task'
      ? currentRow.task.id
      : currentRow?.kind === 'subtask'
      ? currentRow.taskId
      : undefined;

  return (
    <Box flexDirection="column" paddingX={1}>
      {startupError && (
        <StatusMessage variant="warning">{startupError}</StatusMessage>
      )}

      <Box marginBottom={1}>
        <Text bold color="cyan">
          Todo TUI
        </Text>
        {showCompleted && (
          <Text dimColor> [showing completed]</Text>
        )}
      </Box>

      <TaskList
        tasks={tasks}
        subtasksMap={subtasksMap}
        subtaskCounts={subtaskCounts}
        expandedTaskIds={expandedTaskIds}
        selectedIndex={selectedIndex}
      />

      {inputMode !== 'idle' && (
        <Box marginTop={1}>
          <TaskInput
            mode={inputMode as 'addTask' | 'addSubtask'}
            onConfirm={(title) => {
              if (inputMode === 'addTask') {
                addTask(title);
              } else if (inputMode === 'addSubtask' && selectedTaskId != null) {
                addSubtask(selectedTaskId, title);
              }
              setInputMode('idle');
            }}
            onCancel={() => setInputMode('idle')}
          />
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {inputMode === 'idle'
            ? '↑↓ navigate  a add  s subtask  c complete  d delete  h toggle  q quit'
            : 'Enter confirm  Esc cancel'}
        </Text>
      </Box>
    </Box>
  );
}
