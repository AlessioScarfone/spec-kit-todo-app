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
  subtaskRatioCounts: Record<number, { completed: number; total: number }>;
  expandedTaskIds: Set<number>;
  selectedIndex: number;
  /** Pre-sliced rows for virtual scroll; when provided, overrides the built rows */
  visibleRows?: FlatRow[];
  /** Total flat row count (before slicing); used to detect empty state */
  totalRowCount?: number;
}

export function TaskList({
  tasks,
  subtasksMap,
  subtaskRatioCounts,
  expandedTaskIds,
  selectedIndex,
  visibleRows,
  totalRowCount,
}: TaskListProps) {
  const builtRows = buildFlatRows(tasks, subtasksMap, expandedTaskIds);
  const rows = visibleRows ?? builtRows;
  const effectiveTotal = totalRowCount ?? builtRows.length;

  if (effectiveTotal === 0) {
    return <EmptyState />;
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, idx) => {
        const isSelected = idx === selectedIndex;
        if (row.kind === 'task') {
          const ratio = subtaskRatioCounts[row.task.id] ?? { completed: 0, total: 0 };
          return (
            <TaskItem
              key={`task-${row.task.id}`}
              task={row.task}
              isSelected={isSelected}
              isExpanded={expandedTaskIds.has(row.task.id)}
              hasSubtasks={ratio.total > 0}
              subtaskCompleted={ratio.completed}
              subtaskTotal={ratio.total}
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
