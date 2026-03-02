import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { StatusMessage } from '@inkjs/ui';
import type { Database } from 'better-sqlite3';
import { useState } from 'react';
import { useTasks } from '../hooks/useTasks.js';
import { TaskList, buildFlatRows } from './TaskList.js';
import { TaskInput } from './TaskInput.js';

const BANNER_LINES = [
  ' _____  ___  ____   ___    _____ _   _ ___ ',
  '|_   _|/ _ \\|  _ \\ / _ \\  |_   _| | | |_ _|',
  '  | | | | | | | | | | | |   | | | | | || | ',
  '  | | | |_| | |_| | |_| |   | | | |_| || | ',
  '  |_|  \\___/|____/ \\___/    |_|  \\___/|___|',
];
const BANNER_WIDTH = Math.max(...BANNER_LINES.map(l => l.length));
const BANNER = BANNER_LINES.map(l => l.padEnd(BANNER_WIDTH)).join('\n');

// Rows reserved by fixed UI elements (banner + margin + command bar)
const RESERVED_ROWS = BANNER_LINES.length + 1 + 1; // 5 banner + 1 margin + 1 command bar = 7

interface AppProps {
  db: Database;
  startupError?: string;
}

export function App({ db, startupError }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);

  const {
    tasks,
    subtasksMap,
    subtaskCounts,
    activeSubtaskCounts,
    inputMode,
    setInputMode,
    selectedIndex,
    setSelectedIndex,
    showCompleted,
    expandedTaskIds,
    addTask,
    completeTask,
    completeSubtask,
    reactivateTask,
    reactivateSubtask,
    deleteTask,
    toggleShowCompleted,
    addSubtask,
    deleteSubtask,
    toggleExpand,
  } = useTasks(db);

  // Build flat row list for navigation
  const rows = buildFlatRows(tasks, subtasksMap, expandedTaskIds);
  const rowCount = rows.length;

  // Compute available terminal dimensions and visible height
  const termWidth = stdout?.columns ?? 80;
  const termHeight = stdout?.rows ?? 24;
  const visibleHeight = Math.max(1, termHeight - RESERVED_ROWS);

  // Slice visible rows for virtual scroll rendering
  const visibleRows = rows.slice(scrollOffset, scrollOffset + visibleHeight);

  // Compute new scrollOffset after selectedIndex changes
  function clampScroll(newIndex: number, currentOffset: number): number {
    if (newIndex < currentOffset) return newIndex;
    if (newIndex >= currentOffset + visibleHeight) return newIndex - visibleHeight + 1;
    return currentOffset;
  }

  useInput(
    (input, key) => {
      if (inputMode !== 'idle') return;

      // Navigation
      if (key.upArrow) {
        const newIdx = rowCount === 0 ? 0 : (selectedIndex - 1 + rowCount) % rowCount;
        setSelectedIndex(newIdx);
        setScrollOffset(prev => clampScroll(newIdx, prev));
        return;
      }
      if (key.downArrow) {
        const newIdx = rowCount === 0 ? 0 : (selectedIndex + 1) % rowCount;
        setSelectedIndex(newIdx);
        setScrollOffset(prev => clampScroll(newIdx, prev));
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

      // Toggle expand/collapse subtasks with Tab
      if (key.tab) {
        if (currentRow?.kind === 'task' && (subtaskCounts[currentRow.task.id] ?? 0) > 0) {
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

      // Complete / reactivate item (bidirectional toggle)
      if (input === 'c') {
        if (!currentRow) return;
        if (currentRow.kind === 'task') {
          if (currentRow.task.status === 'active') {
            completeTask(currentRow.task.id);
            const newIdx = Math.max(0, selectedIndex - 1);
            setSelectedIndex(newIdx);
            setScrollOffset(prev => clampScroll(newIdx, prev));
          } else {
            reactivateTask(currentRow.task.id);
          }
        } else if (currentRow.kind === 'subtask') {
          if (currentRow.subtask.status === 'active') {
            completeSubtask(currentRow.subtask.id);
            const newIdx = Math.max(0, selectedIndex - 1);
            setSelectedIndex(newIdx);
            setScrollOffset(prev => clampScroll(newIdx, prev));
          } else {
            reactivateSubtask(currentRow.subtask.id);
          }
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
        const newIdx = Math.max(0, selectedIndex - 1);
        setSelectedIndex(newIdx);
        setScrollOffset(prev => clampScroll(newIdx, prev));
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
    <Box flexDirection="column" width={termWidth} height={termHeight} paddingX={1}>
      {/* Scrollable content region — grows to fill all space above command bar */}
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {startupError && (
          <StatusMessage variant="warning">{startupError}</StatusMessage>
        )}

        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">{BANNER}</Text>
          {showCompleted && (
            <Text dimColor>[showing completed]</Text>
          )}
        </Box>

        <TaskList
          tasks={tasks}
          subtasksMap={subtasksMap}
          subtaskCounts={subtaskCounts}
          activeSubtaskCounts={activeSubtaskCounts}
          expandedTaskIds={expandedTaskIds}
          selectedIndex={selectedIndex - scrollOffset}
          visibleRows={visibleRows}
          totalRowCount={rowCount}
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
      </Box>

      {/* Pinned command bar — always last child, locked to bottom by flex layout */}
      <Box>
        <Text dimColor>
          {inputMode === 'idle'
            ? '↑↓ navigate  a add  s subtask  c complete/reactivate  d delete  h toggle  q quit'
            : 'Enter confirm  Esc cancel'}
        </Text>
      </Box>
    </Box>
  );
}
