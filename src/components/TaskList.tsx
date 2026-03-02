import { Box } from 'ink';
import type { Task, Subtask } from '../types.js';
import { TaskItem } from './TaskItem.js';
import { SubtaskItem } from './SubtaskItem.js';
import { EmptyState } from './EmptyState.js';

export type FlatRow =
  | { kind: 'task'; task: Task }
  | { kind: 'subtask'; subtask: Subtask; taskId: number };

/**
 * Build the flat list of visible rows from tasks + subtasksMap.
 * Subtask rows are interleaved after their parent task when expanded.
 */
export function buildFlatRows(
  tasks: Task[],
  subtasksMap: Record<number, Subtask[]>,
  expandedTaskIds: Set<number>
): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const task of tasks) {
    rows.push({ kind: 'task', task });
    if (expandedTaskIds.has(task.id)) {
      const subs = subtasksMap[task.id] ?? [];
      for (const sub of subs) {
        rows.push({ kind: 'subtask', subtask: sub, taskId: task.id });
      }
    }
  }
  return rows;
}

interface TaskListProps {
  tasks: Task[];
  subtasksMap: Record<number, Subtask[]>;
  subtaskCounts: Record<number, number>;
  activeSubtaskCounts: Record<number, number>;
  expandedTaskIds: Set<number>;
  selectedIndex: number;
}

export function TaskList({
  tasks,
  subtasksMap,
  subtaskCounts,
  activeSubtaskCounts,
  expandedTaskIds,
  selectedIndex,
}: TaskListProps) {
  const rows = buildFlatRows(tasks, subtasksMap, expandedTaskIds);

  if (rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, idx) => {
        const isSelected = idx === selectedIndex;
        if (row.kind === 'task') {
          const count = subtaskCounts[row.task.id] ?? 0;
          return (
            <TaskItem
              key={`task-${row.task.id}`}
              task={row.task}
              isSelected={isSelected}
              isExpanded={expandedTaskIds.has(row.task.id)}
              hasSubtasks={count > 0}
              activeSubtaskCount={activeSubtaskCounts[row.task.id] ?? 0}
            />
          );
        }
        return (
          <SubtaskItem
            key={`subtask-${row.subtask.id}`}
            subtask={row.subtask}
            isSelected={isSelected}
          />
        );
      })}
    </Box>
  );
}
