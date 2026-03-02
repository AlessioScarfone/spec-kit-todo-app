import { useState, useMemo, useCallback } from 'react';
import type { Database } from 'better-sqlite3';
import type { Task, Subtask, InputMode } from '../types.js';
import * as queries from '../db/queries.js';

export function useTasks(db: Database) {
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());

  // Token that increments after any DB mutation to trigger synchronous re-computation
  const [refreshToken, setRefreshToken] = useState(0);
  const forceReload = useCallback(() => setRefreshToken((n) => n + 1), []);

  // Synchronous derivation — no useEffect needed
  const tasks = useMemo(
    () => queries.getAllTasks(db, showCompleted),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, showCompleted, refreshToken]
  );

  const subtasksMap = useMemo(() => {
    const map: Record<number, Subtask[]> = {};
    for (const taskId of expandedTaskIds) {
      map[taskId] = queries.getSubtasksForTask(db, taskId, showCompleted);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, showCompleted, expandedTaskIds, refreshToken]);

  // Subtask counts for ALL tasks (used to show accordion indicator + enable expand)
  const subtaskCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const task of tasks) {
      const row = db
        .prepare('SELECT COUNT(*) as cnt FROM subtasks WHERE task_id = ?')
        .get(task.id) as { cnt: number };
      counts[task.id] = row.cnt;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, tasks, refreshToken]);

  // Reload after expand/collapse so subtask list is freshly fetched
  const reload = forceReload;

  const addTask = useCallback(
    (title: string) => {
      queries.insertTask(db, title);
      reload();
    },
    [db, reload]
  );

  const completeTask = useCallback(
    (id: number) => {
      queries.completeTask(db, id);
      reload();
    },
    [db, reload]
  );

  const completeSubtask = useCallback(
    (id: number) => {
      queries.completeSubtask(db, id);
      reload();
    },
    [db, reload]
  );

  const deleteTask = useCallback(
    (id: number) => {
      queries.deleteTask(db, id);
      reload();
    },
    [db, reload]
  );

  const toggleShowCompleted = useCallback(() => {
    setShowCompleted((prev) => !prev);
  }, []);

  const addSubtask = useCallback(
    (taskId: number, title: string) => {
      queries.insertSubtask(db, taskId, title);
      reload();
    },
    [db, reload]
  );

  const deleteSubtask = useCallback(
    (id: number) => {
      queries.deleteSubtask(db, id);
      reload();
    },
    [db, reload]
  );

  const toggleExpand = useCallback((taskId: number) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  return {
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
  };
}
