import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';

interface TaskInputProps {
  mode: 'addTask' | 'addSubtask';
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export function TaskInput({ mode, onConfirm, onCancel }: TaskInputProps) {
  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const label = mode === 'addTask' ? 'New task' : 'New subtask';

  return (
    <Box>
      <Text bold>{label}: </Text>
      <TextInput
        placeholder="Type title and press Enter…"
        onSubmit={(value) => {
          const trimmed = value.trim();
          if (trimmed.length === 0) {
            // Empty title is a no-op (FR-003); user stays in input mode
            return;
          }
          onConfirm(trimmed);
        }}
      />
    </Box>
  );
}
