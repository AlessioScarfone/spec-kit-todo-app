import { Text, Box } from 'ink';

export function EmptyState() {
  return (
    <Box paddingY={1}>
      <Text dimColor>No tasks yet. Press {"'a'"} to add your first task.</Text>
    </Box>
  );
}
