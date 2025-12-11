import { useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";
import { TaskFormFields } from "./TaskFormFields";

interface AddTaskModalProps {
  open: boolean;
  accountId: string;
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

export function AddTaskModal({
  open,
  accountId,
  employees,
  availableTags,
  onClose,
  onSuccess,
}: AddTaskModalProps) {
  const [task, setTask] = useState<Omit<Task, "id">>(initialTask);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const taskToAdd = {
        ...task,
        startDate: startDate ? startDate.format("YYYY-MM-DD") : task.startDate || "",
        dueDate: dueDate ? dueDate.format("YYYY-MM-DD") : task.dueDate || "",
      };

      const response = await fetch(`/api/accounts/${accountId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskToAdd),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to create task");
      }

      onSuccess(payload as Task);
      handleClose();
    } catch (error) {
      console.error("Failed to create task", error);
      alert(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTask(initialTask);
    setStartDate(null);
    setDueDate(null);
    onClose();
  };

  return (
    <PrimaryModal
      open={open}
      title="Add Task"
      description="Create a new task and assign it to a team member."
      onClose={handleClose}
      widthClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <TaskFormFields
          task={task}
          employees={employees}
          availableTags={availableTags}
          startDate={startDate}
          dueDate={dueDate}
          onTaskChange={setTask}
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
            {loading ? "Saving..." : "Save Task"}
          </PrimaryButton>
        </div>
      </form>
    </PrimaryModal>
  );
}
