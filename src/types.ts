export interface Task {
  id: number;
  title: string;
  status: 'active' | 'complete';
  position: number;
  created_at: number;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  status: 'active' | 'complete';
  position: number;
  created_at: number;
}

export type InputMode = 'idle' | 'addTask' | 'addSubtask';

export interface UIState {
  selectedIndex: number;
  inputMode: InputMode;
  showCompleted: boolean;
  expandedTaskIds: Set<number>;
}
