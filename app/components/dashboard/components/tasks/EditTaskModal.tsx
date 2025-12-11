import { useState, useEffect } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";
import { TaskFormFields } from "./TaskFormFields";

interface EditTaskModalProps {
  open: boolean;
  accountId: string;
  task: Task | null;
  employees: { id: string; name: string; email?: string; role?: string; status?: string }[];
  availableTags: string[];
  onClose: () => void;
  onSuccess: (task: Task) => void;
}

const initialTask: Omit<Task, "id"> = {
  title: "",
  assignee: "",
  startDate: "",
  dueDate: "",
  priority: "Normal",
  status: "Todo",
  description: "",
  tags: [],
};

export function EditTaskModal({
  open,
  accountId,
  task,
  employees,
  availableTags,
  onClose,
  onSuccess,
}: EditTaskModalProps) {
  const [editTask, setEditTask] = useState<Omit<Task, "id">>(initialTask);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setEditTask({
        title: task.title,
        assignee: task.assignee,
        startDate: (task as any).startDate || "",
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        description: task.description || "",
        tags: task.tags || [],
      });
      setStartDate((task as any).startDate ? dayjs((task as any).startDate) : null);
      setDueDate(task.dueDate ? dayjs(task.dueDate) : null);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || loading) return;
    setLoading(true);

    try {
      const taskToUpdate = {
        ...editTask,
        startDate: startDate ? startDate.format("YYYY-MM-DD") : editTask.startDate || "",
        dueDate: dueDate ? dueDate.format("YYYY-MM-DD") : editTask.dueDate || "",
      };

      const response = await fetch(`/api/accounts/${accountId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          ...taskToUpdate,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to update task");
      }

      onSuccess(payload as Task);
      handleClose();
    } catch (error) {
      console.error("Failed to update task", error);
      alert(error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEditTask(initialTask);
    setStartDate(null);
    setDueDate(null);
    onClose();
  };

  return (
    <PrimaryModal
      open={open}
      title="Edit Task"
      onClose={handleClose}
      widthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <TaskFormFields
          task={editTask}
          employees={employees}
          availableTags={availableTags}
          startDate={startDate}
          dueDate={dueDate}
          onTaskChange={setEditTask}
          onStartDateChange={setStartDate}
          onDueDateChange={setDueDate}
        />
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Task"}
          </PrimaryButton>
        </div>
      </form>
    </PrimaryModal>
  );
}
