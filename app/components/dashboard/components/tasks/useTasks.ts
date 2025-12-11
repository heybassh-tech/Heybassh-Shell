import { useState, useEffect, useMemo } from "react";
import { Task } from "../../types";

interface UseTasksOptions {
  accountId: string;
}

export function useTasks({ accountId }: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadTasks() {
      setTasksLoading(true);
      try {
        const response = await fetch(`/api/accounts/${accountId}/tasks`);
        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error((payload as { error?: string })?.error ?? "Failed to load tasks");
        }
        if (!ignore) {
          setTasks(Array.isArray(payload) ? payload : []);
        }
      } catch (error) {
        console.error("[Tasks] Failed to fetch tasks", error);
      } finally {
        if (!ignore) {
          setTasksLoading(false);
        }
      }
    }
    loadTasks();
    return () => {
      ignore = true;
    };
  }, [accountId]);

  useEffect(() => {
    let ignore = false;
    async function loadTags() {
      try {
        const res = await fetch(`/api/accounts/${accountId}/tasks/tags`);
        const data = await res.json().catch(() => []);
        if (!ignore && Array.isArray(data)) {
          setTags(data);
        }
      } catch (e) {
        console.error("[Tasks] failed to load tags", e);
      }
    }
    loadTags();
    return () => {
      ignore = true;
    };
  }, [accountId]);

  const availableTags = useMemo(() => {
    const set = new Set<string>(tags);
    tasks.forEach((t) => {
      (t.tags || []).forEach((tg) => set.add(tg));
    });
    return Array.from(set);
  }, [tasks, tags]);

  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return {
    tasks,
    tasksLoading,
    availableTags,
    addTask,
    updateTask,
    removeTask,
  };
}
