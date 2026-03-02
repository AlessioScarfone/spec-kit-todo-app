import { Box, Text } from 'ink';
import type { Subtask } from '../types.js';

interface SubtaskItemProps {
  subtask: Subtask;
  isSelected: boolean;
}

export function SubtaskItem({ subtask, isSelected }: SubtaskItemProps) {
  const isComplete = subtask.status === 'complete';
  const cursor = isSelected ? '❯ ' : '  ';

  return (
    <Box>
      <Text color={isSelected ? 'cyan' : undefined}>{cursor}</Text>
      <Text dimColor={isComplete}>
        {'    '} {/* indentation for subtask */}
        <Text strikethrough={isComplete}>{subtask.title}</Text>
        {isComplete && <Text dimColor> (done)</Text>}
      </Text>
    </Box>
  );
}
