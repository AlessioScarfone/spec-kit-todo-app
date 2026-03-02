import { Box, Text } from 'ink';
import type { Task } from '../types.js';

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  isExpanded: boolean;
  hasSubtasks: boolean;
  activeSubtaskCount?: number;
}

export function TaskItem({ task, isSelected, isExpanded, hasSubtasks, activeSubtaskCount = 0 }: TaskItemProps) {
  const isComplete = task.status === 'complete';

  // Accordion indicator
  let accordionIndicator = '  '; // 2 spaces when no subtasks
  if (hasSubtasks) {
    accordionIndicator = isExpanded ? '▼ ' : '▶ ';
  }

  // Selection indicator
  const cursor = isSelected ? '❯ ' : '  ';

  return (
    <Box>
      <Text color={isSelected ? 'cyan' : undefined}>{cursor}</Text>
      <Text dimColor={isComplete}>
        {accordionIndicator}
        <Text strikethrough={isComplete}>{task.title}</Text>
        {activeSubtaskCount > 0 && <Text dimColor> [{activeSubtaskCount}]</Text>}
        {isComplete && <Text dimColor> (done)</Text>}
      </Text>
    </Box>
  );
}
