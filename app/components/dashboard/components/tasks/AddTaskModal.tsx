import { useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";
import { PrimaryInput } from "../../../PrimaryInput";
import { TagSelectorPopup } from "./popups/TagSelectorPopup";
import { DateRangePopup } from "./popups/DateRangePopup";
import { PrioritySelectorPopup } from "./popups/PrioritySelectorPopup";
import { StatusSelectorPopup } from "./popups/StatusSelectorPopup";
import { FiTag, FiCalendar, FiFlag, FiCheckCircle } from "react-icons/fi";
import { getTagColor, getPriorityColor, getStatusColor } from "./taskUtils";
import { Tag } from "antd";

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
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Popup states
  const [tagPopupOpen, setTagPopupOpen] = useState(false);
  const [datePopupOpen, setDatePopupOpen] = useState(false);
  const [priorityPopupOpen, setPriorityPopupOpen] = useState(false);
  const [statusPopupOpen, setStatusPopupOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const taskToAdd = {
        ...task,
        startDate: startDate ? startDate.format("YYYY-MM-DD") : task.startDate || "",
        dueDate: endDate ? endDate.format("YYYY-MM-DD") : task.dueDate || "",
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
    setEndDate(null);
    setTagPopupOpen(false);
    setDatePopupOpen(false);
    setPriorityPopupOpen(false);
    setStatusPopupOpen(false);
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return null;
    return `${startDate.format("ddd, MMM D")} – ${endDate.format("ddd, MMM D")}`;
  };

  return (
    <>
      <PrimaryModal
        open={open}
        title="Add Task"
        description="Create a new task and assign it to a team member."
        onClose={handleClose}
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name - Inline */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-blue-200 mb-2">
              Task Name
            </label>
            <PrimaryInput
              id="title"
              type="text"
              required
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              placeholder="Enter task name"
            />
          </div>

          {/* Description - Inline */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-blue-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 placeholder-blue-300/60 focus:border-[#18aead] focus:outline-none"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              placeholder="Enter task description"
            />
          </div>

          {/* Tags Row - Clickable */}
          <div>
            <button
              type="button"
              onClick={() => setTagPopupOpen(true)}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiTag className="h-4 w-4 text-blue-300 flex-shrink-0" />
              <div className="flex-1">
                {task.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => {
                      const color = getTagColor(tag);
                      return (
                        <Tag
                          key={index}
                          className={`${color} border text-xs px-2 py-0.5 rounded-full`}
                        >
                          {tag}
                        </Tag>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-blue-200">No tags</span>
                )}
              </div>
            </button>
          </div>

          {/* Dates Row - Clickable */}
          <div>
            <button
              type="button"
              onClick={() => setDatePopupOpen(true)}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiCalendar className="h-4 w-4 text-blue-300 flex-shrink-0" />
              <div className="flex-1">
                {startDate && endDate ? (
                  <div>
                    <div className="text-xs font-medium text-blue-300/70 mb-0.5">Dates</div>
                    <span className="text-sm text-blue-200">{formatDateRange()}</span>
                  </div>
                ) : (
                  <span className="text-sm text-blue-200">No date</span>
                )}
              </div>
            </button>
          </div>

          {/* Priority Row - Clickable */}
          <div>
            <button
              type="button"
              onClick={() => setPriorityPopupOpen(true)}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiFlag className="h-4 w-4 text-blue-300 flex-shrink-0" />
              <div className="flex-1">
                {task.priority ? (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                ) : (
                  <span className="text-sm text-blue-200">No priority</span>
                )}
              </div>
            </button>
          </div>

          {/* Status Row - Clickable */}
          <div>
            <button
              type="button"
              onClick={() => setStatusPopupOpen(true)}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiCheckCircle className="h-4 w-4 text-blue-300 flex-shrink-0" />
              <div className="flex-1">
                {task.status ? (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                ) : (
                  <span className="text-sm text-blue-200">No status</span>
                )}
              </div>
            </button>
          </div>

          {/* Action Buttons */}
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
              {loading ? "Saving..." : "Add Task"}
            </PrimaryButton>
          </div>
        </form>
      </PrimaryModal>

      {/* Popups */}
      <TagSelectorPopup
        open={tagPopupOpen}
        selectedTags={task.tags}
        availableTags={availableTags}
        accountId={accountId}
        onClose={() => setTagPopupOpen(false)}
        onSelect={(tags) => {
          setTask({ ...task, tags });
          setTagPopupOpen(false);
        }}
      />

      <DateRangePopup
        open={datePopupOpen}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setDatePopupOpen(false)}
        onSelect={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setDatePopupOpen(false);
        }}
      />

      <PrioritySelectorPopup
        open={priorityPopupOpen}
        selectedPriority={task.priority}
        onClose={() => setPriorityPopupOpen(false)}
        onSelect={(priority) => {
          setTask({ ...task, priority });
          setPriorityPopupOpen(false);
        }}
      />

      <StatusSelectorPopup
        open={statusPopupOpen}
        selectedStatus={task.status}
        onClose={() => setStatusPopupOpen(false)}
        onSelect={(status) => {
          setTask({ ...task, status });
          setStatusPopupOpen(false);
        }}
      />
    </>
  );
}
