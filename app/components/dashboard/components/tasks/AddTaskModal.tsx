import { useState, useRef, useEffect } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";
import { PrimaryInput } from "../../../PrimaryInput";
import { FiTag, FiCalendar, FiFlag, FiCheckCircle } from "react-icons/fi";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getTagColor, getPriorityColor, getStatusColor } from "./taskUtils";
import { Tag, DatePicker } from "antd";
import { CreateTagPopup } from "./popups/CreateTagPopup";
import { priorityOptions, statusOptions } from "../../types";

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
  
  // Inline panel states
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(false);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [createTagOpen, setCreateTagOpen] = useState(false);

  // Refs for click outside detection
  const tagPanelRef = useRef<HTMLDivElement>(null);
  const datePanelRef = useRef<HTMLDivElement>(null);
  const priorityPanelRef = useRef<HTMLDivElement>(null);
  const statusPanelRef = useRef<HTMLDivElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagPanelRef.current && !tagPanelRef.current.contains(event.target as Node)) {
        setTagPanelOpen(false);
      }
      if (datePanelRef.current && !datePanelRef.current.contains(event.target as Node)) {
        setDatePanelOpen(false);
      }
      if (priorityPanelRef.current && !priorityPanelRef.current.contains(event.target as Node)) {
        setPriorityPanelOpen(false);
      }
      if (statusPanelRef.current && !statusPanelRef.current.contains(event.target as Node)) {
        setStatusPanelOpen(false);
      }
    };

    if (tagPanelOpen || datePanelOpen || priorityPanelOpen || statusPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [tagPanelOpen, datePanelOpen, priorityPanelOpen, statusPanelOpen]);

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
    setTagPanelOpen(false);
    setDatePanelOpen(false);
    setPriorityPanelOpen(false);
    setStatusPanelOpen(false);
    setTagSearch("");
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return null;
    return `${startDate.format("ddd, MMM D")} – ${endDate.format("ddd, MMM D")}`;
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const handleTagToggle = (tag: string) => {
    if (task.tags.includes(tag)) {
      setTask({ ...task, tags: task.tags.filter((t) => t !== tag) });
    } else {
      setTask({ ...task, tags: [...task.tags, tag] });
    }
  };

  const handleCreateTag = (tagName: string, tagColor: string) => {
    if (!task.tags.includes(tagName)) {
      setTask({ ...task, tags: [...task.tags, tagName] });
    }
    setCreateTagOpen(false);
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

          {/* Tags - Label + Clickable Row + Inline Panel */}
          <div className="relative" ref={tagPanelRef}>
            <label className="block text-sm font-medium text-blue-200 mb-2">Tags</label>
            <button
              type="button"
              onClick={() => {
                setTagPanelOpen(!tagPanelOpen);
                setDatePanelOpen(false);
                setPriorityPanelOpen(false);
                setStatusPanelOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiTag className="h-4 w-4 text-blue-300 flex-shrink-0 rounded-full bg-[#0e1629] p-2" />
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
            
            {/* Inline Tag Panel */}
            {tagPanelOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-4 shadow-lg">
                <div className="space-y-3">
                  {/* Search */}
                  <PrimaryInput
                    type="text"
                    placeholder="Search tags"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                  />

                  {/* Selected Tags */}
                  {task.tags.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-blue-200">Selected</p>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag) => {
                          const color = getTagColor(tag);
                          return (
                            <Tag
                              key={tag}
                              className={`${color} border text-xs px-2 py-0.5 rounded-full cursor-pointer`}
                              onClick={() => handleTagToggle(tag)}
                            >
                              {tag}
                            </Tag>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags List */}
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => {
                        const isSelected = task.tags.includes(tag);
                        const color = getTagColor(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? "border-[#18aead] bg-[#18aead]/10"
                                : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Tag className={`${color} border text-xs px-2 py-0.5 rounded-full`}>
                                {tag}
                              </Tag>
                              {isSelected && (
                                <span className="text-xs text-[#18aead]">Selected</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-1 py-2 text-xs text-blue-300/70">No tags found</p>
                    )}
                  </div>

                  {/* Add Tag Button */}
                  <button
                    type="button"
                    onClick={() => setCreateTagOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#18aead] bg-[#18aead]/10 px-4 py-2 text-sm font-medium text-[#18aead] transition-colors hover:bg-[#18aead]/20"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Tag
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dates - Label + Clickable Row + Inline Panel */}
          <div className="relative" ref={datePanelRef}>
            <label className="block text-sm font-medium text-blue-200 mb-2">Dates</label>
            <button
              type="button"
              onClick={() => {
                setDatePanelOpen(!datePanelOpen);
                setTagPanelOpen(false);
                setPriorityPanelOpen(false);
                setStatusPanelOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiCalendar className="h-4 w-4 text-blue-300 flex-shrink-0 rounded-full bg-[#0e1629] p-2" />
              <div className="flex-1">
                {startDate && endDate ? (
                  <span className="text-sm text-blue-200">{formatDateRange()}</span>
                ) : (
                  <span className="text-sm text-blue-200">No date</span>
                )}
              </div>
            </button>

            {/* Inline Date Panel */}
            {datePanelOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-4 shadow-lg">
                <div className="space-y-4">
                  {/* Calendar */}
                  <DatePicker.RangePicker
                    value={[startDate, endDate]}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setStartDate(dates[0]);
                        setEndDate(dates[1]);
                      } else if (dates === null) {
                        setStartDate(null);
                        setEndDate(null);
                      }
                    }}
                    format="YYYY-MM-DD"
                    className="w-full"
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      borderColor: "#1a2446",
                      backgroundColor: "#0e1629",
                    }}
                  />

                  {/* Date Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-200 mb-1">
                        Start Date
                      </label>
                      <PrimaryInput
                        type="date"
                        value={startDate ? startDate.format("YYYY-MM-DD") : ""}
                        onChange={(e) => {
                          const parsed = dayjs(e.target.value, "YYYY-MM-DD", true);
                          if (parsed.isValid()) {
                            setStartDate(parsed);
                            // Auto-focus end date input
                            setTimeout(() => {
                              const endDateInput = document.getElementById("end-date-input");
                              endDateInput?.focus();
                            }, 100);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-200 mb-1">
                        End Date
                      </label>
                      <PrimaryInput
                        id="end-date-input"
                        type="date"
                        value={endDate ? endDate.format("YYYY-MM-DD") : ""}
                        onChange={(e) => {
                          const parsed = dayjs(e.target.value, "YYYY-MM-DD", true);
                          if (parsed.isValid()) {
                            setEndDate(parsed);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Priority - Label + Clickable Row + Inline Panel */}
          <div className="relative" ref={priorityPanelRef}>
            <label className="block text-sm font-medium text-blue-200 mb-2">Priority</label>
            <button
              type="button"
              onClick={() => {
                setPriorityPanelOpen(!priorityPanelOpen);
                setTagPanelOpen(false);
                setDatePanelOpen(false);
                setStatusPanelOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiFlag className="h-4 w-4 text-blue-300 flex-shrink-0 rounded-full bg-[#0e1629] p-2" />
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

            {/* Inline Priority Panel */}
            {priorityPanelOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
                <div className="space-y-1">
                  {priorityOptions.map((priority) => {
                    const isSelected = priority === task.priority;
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => {
                          setTask({ ...task, priority: priority as Task["priority"] });
                          setPriorityPanelOpen(false);
                        }}
                        className={`w-full rounded-lg border px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "border-[#18aead] bg-[#18aead]/10"
                            : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiFlag className="h-4 w-4 text-blue-300" />
                            <span className="text-sm text-blue-200">{priority}</span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPriorityColor(
                              priority as Task["priority"]
                            )}`}
                          >
                            {priority}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status - Label + Clickable Row + Inline Panel */}
          <div className="relative" ref={statusPanelRef}>
            <label className="block text-sm font-medium text-blue-200 mb-2">Status</label>
            <button
              type="button"
              onClick={() => {
                setStatusPanelOpen(!statusPanelOpen);
                setTagPanelOpen(false);
                setDatePanelOpen(false);
                setPriorityPanelOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-[10px] border border-[#1a2446] px-4 py-3 text-left transition-colors hover:border-[#18aead]"
            >
              <FiCheckCircle className="h-4 w-4 text-blue-300 flex-shrink-0 rounded-full bg-[#0e1629] p-2" />
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

            {/* Inline Status Panel */}
            {statusPanelOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
                <div className="space-y-1">
                  {statusOptions.map((status) => {
                    const isSelected = status === task.status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setTask({ ...task, status: status as Task["status"] });
                          setStatusPanelOpen(false);
                        }}
                        className={`w-full rounded-lg border px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "border-[#18aead] bg-[#18aead]/10"
                            : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="h-4 w-4 text-blue-300" />
                            <span className="text-sm text-blue-200">{status}</span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(
                              status as Task["status"]
                            )}`}
                          >
                            {status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

      <CreateTagPopup
        open={createTagOpen}
        accountId={accountId}
        onClose={() => setCreateTagOpen(false)}
        onSuccess={handleCreateTag}
      />
    </>
  );
}