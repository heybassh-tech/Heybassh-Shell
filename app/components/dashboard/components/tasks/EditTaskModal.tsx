import { useState, useEffect, useRef } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";
import { PrimaryInput } from "../../../PrimaryInput";
import { FiTag, FiCalendar, FiFlag, FiCheckCircle, FiUser } from "react-icons/fi";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getTagColor, getPriorityColor, getStatusColor } from "./taskUtils";
import { Tag, DatePicker } from "antd";
import { CreateTagPopup } from "./popups/CreateTagPopup";
import { priorityOptions, statusOptions } from "../../types";

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
  priority: "" as any,
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
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Inline panel states
  const [assigneePanelOpen, setAssigneePanelOpen] = useState(false);
  const [tagPanelOpen, setTagPanelOpen] = useState(false);
  const [datePanelOpen, setDatePanelOpen] = useState(false);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(false);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [notifyAssignee, setNotifyAssignee] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Refs for click outside detection
  const assigneePanelRef = useRef<HTMLDivElement>(null);
  const tagPanelRef = useRef<HTMLDivElement>(null);
  const datePanelRef = useRef<HTMLDivElement>(null);
  const priorityPanelRef = useRef<HTMLDivElement>(null);
  const statusPanelRef = useRef<HTMLDivElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneePanelRef.current && !assigneePanelRef.current.contains(event.target as Node)) {
        setAssigneePanelOpen(false);
      }
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

    if (assigneePanelOpen || tagPanelOpen || datePanelOpen || priorityPanelOpen || statusPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [assigneePanelOpen, tagPanelOpen, datePanelOpen, priorityPanelOpen, statusPanelOpen]);

  useEffect(() => {
    if (task) {
      setEditTask({
        title: task.title,
        assignee: task.assignee,
        startDate: (task as any).startDate || "",
        dueDate: task.dueDate,
        priority: task.priority || ("" as any), // Use empty string if no priority
        status: task.status,
        description: task.description || "",
        tags: task.tags || [],
      });
      setStartDate((task as any).startDate ? dayjs((task as any).startDate) : null);
      setEndDate(task.dueDate ? dayjs(task.dueDate) : null);
      // Set selected assignees from task.assignee
      setSelectedAssignees(task.assignee ? [task.assignee] : []);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || loading) return;
    setLoading(true);

    try {
      const taskToUpdate = {
        ...editTask,
        assignee: selectedAssignees.length > 0 ? selectedAssignees[0] : "", // Use first assignee for backward compatibility
        startDate: startDate ? startDate.format("YYYY-MM-DD") : editTask.startDate || "",
        dueDate: endDate ? endDate.format("YYYY-MM-DD") : editTask.dueDate || "",
        priority: editTask.priority || "Normal", // Default to Normal if empty for API
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
    setEndDate(null);
    setAssigneePanelOpen(false);
    setTagPanelOpen(false);
    setDatePanelOpen(false);
    setPriorityPanelOpen(false);
    setStatusPanelOpen(false);
    setTagSearch("");
    setAssigneeSearch("");
    setNotifyAssignee(false);
    setSelectedAssignees([]);
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return null;
    return `${startDate.format("ddd, MMM D")} – ${endDate.format("ddd, MMM D")}`;
  };

  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const activeAssignees = employees.filter((e) => (e.status ?? "Accepted") === "Accepted");
  const filteredAssignees = activeAssignees.filter((a) =>
    (a.name || a.email || "").toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const handleTagToggle = (tag: string) => {
    if (editTask.tags.includes(tag)) {
      setEditTask({ ...editTask, tags: editTask.tags.filter((t) => t !== tag) });
    } else {
      setEditTask({ ...editTask, tags: [...editTask.tags, tag] });
    }
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    if (selectedAssignees.includes(assigneeId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== assigneeId));
    } else {
      setSelectedAssignees([...selectedAssignees, assigneeId]);
    }
  };

  const handleCreateTag = (tagName: string, tagColor: string) => {
    if (!editTask.tags.includes(tagName)) {
      setEditTask({ ...editTask, tags: [...editTask.tags, tagName] });
    }
    setCreateTagOpen(false);
  };

  return (
    <>
    <PrimaryModal
      open={open}
      title="Edit Task"
        description="Update task details and assign it to team members."
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
              value={editTask.title}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
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
              value={editTask.description}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              placeholder="Enter task description"
            />
          </div>

          {/* Grid Layout: 3 per row - Assignee, Tags, Dates in first row, Priority and Status in second row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Assignee - Label + Clickable Row + Inline Panel */}
            <div className="relative" ref={assigneePanelRef}>
              <label className="block text-sm font-medium text-blue-200 mb-2">Assignee</label>
              <button
                type="button"
                onClick={() => {
                  setAssigneePanelOpen(!assigneePanelOpen);
                  setTagPanelOpen(false);
                  setDatePanelOpen(false);
                  setPriorityPanelOpen(false);
                  setStatusPanelOpen(false);
                }}
                className="flex items-center gap-2 text-blue-300 hover:text-white/50 transition-colors"
              >
                <div className="border border-[#1a2446] bg-[#0e1629] rounded-full p-2">
                  <FiUser className="h-4 w-4 text-blue-300 flex-shrink-0" />
                </div>
                <div className="flex-1 text-left">
                  {selectedAssignees.length > 0 ? (
                    <span className="text-sm text-blue-200">
                      {selectedAssignees.length} {selectedAssignees.length === 1 ? "person" : "people"}
                    </span>
                  ) : (
                    <span className="text-sm text-blue-200">No assignee</span>
                  )}
                </div>
              </button>

              {/* Inline Assignee Panel */}
              {assigneePanelOpen && (
                <div className="absolute z-[1001] mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-4 shadow-lg">
                  <div className="space-y-3">
                    {/* Search */}
                    <PrimaryInput
                      type="text"
                      placeholder="Search people"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                    />

                    {/* Selected Assignees */}
                    {selectedAssignees.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-200">{selectedAssignees.length} selected</span>
                        <button
                          type="button"
                          onClick={() => setSelectedAssignees([])}
                          className="text-xs text-blue-300 hover:text-blue-200"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Assignees List */}
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {filteredAssignees.length > 0 ? (
                        filteredAssignees.map((employee) => {
                          const isSelected = selectedAssignees.includes(employee.id);
                          return (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() => handleAssigneeToggle(employee.id)}
                              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "border-[#18aead] bg-[#18aead]/10"
                                  : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiUser className="h-4 w-4 text-blue-300" />
                                  <span className="text-sm text-blue-200">
                                    {employee.name || employee.email}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-xs text-[#18aead]">Selected</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-1 py-2 text-xs text-blue-300/70">No people found</p>
                      )}
                    </div>

                    {/* Notify Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyAssignee}
                        onChange={(e) => setNotifyAssignee(e.target.checked)}
                        className="rounded border-[#1a2446] bg-[#0e1629] text-[#18aead] focus:ring-[#18aead]"
                      />
                      <span className="text-xs text-blue-200">Notify assignees</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Tags - Label + Clickable Row + Inline Panel */}
            <div className="relative" ref={tagPanelRef}>
              <label className="block text-sm font-medium text-blue-200 mb-2">Tags</label>
              <div className="flex w-full items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTagPanelOpen(!tagPanelOpen);
                    setAssigneePanelOpen(false);
                    setDatePanelOpen(false);
                    setPriorityPanelOpen(false);
                    setStatusPanelOpen(false);
                  }}
                  className="flex items-center gap-2 text-blue-300 hover:text-white/50 transition-colors"
                >
                  <div className="border border-[#1a2446] bg-[#0e1629] rounded-full p-2">
                    <PlusIcon className="h-4 w-4 text-blue-300" />
                  </div>
                </button>
                <div className="flex flex-wrap gap-2 flex-1">
                  {editTask.tags.map((tag, index) => {
                    const color = getTagColor(tag);
                    return (
                      <div
                        key={index}
                        className="group relative inline-flex items-center"
                      >
                        <Tag
                          className={`${color} border text-xs px-2 py-0.5 rounded-full cursor-pointer`}
                        >
                          {tag}
                        </Tag>
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {editTask.tags.length === 0 && (
                    <span className="text-sm text-blue-200">No tags</span>
                  )}
                </div>
              </div>
              
              {/* Inline Tag Panel */}
              {tagPanelOpen && (
                <div className="absolute z-[1001] mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-4 shadow-lg">
                  <div className="space-y-3">
                    {/* Search */}
                    <PrimaryInput
                      type="text"
                      placeholder="Search tags"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                    />

                    {/* Selected Tags Summary */}
                    {editTask.tags.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-200">{editTask.tags.length} selected tags</span>
                        <button
                          type="button"
                          onClick={() => setEditTask({ ...editTask, tags: [] })}
                          className="text-xs text-blue-300 hover:text-blue-200"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Selected Tag Chips */}
                    {editTask.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editTask.tags.map((tag) => {
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
                    )}

                    {/* Global Tags Section */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-blue-200">Global</p>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredTags.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {filteredTags.map((tag) => {
                              const isSelected = editTask.tags.includes(tag);
                              const color = getTagColor(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleTagToggle(tag)}
                                  className={`rounded-full border text-xs px-2 py-0.5 transition-colors ${
                                    isSelected
                                      ? "border-[#18aead] bg-[#18aead]/20"
                                      : `${color} border`
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-1 py-2 text-xs text-blue-300/70">No tags found</p>
                        )}
                      </div>
                    </div>

                    {/* Add Tag Button */}
                    <button
                      type="button"
                      onClick={() => setCreateTagOpen(true)}
                      className="w-full text-sm font-medium text-[#18aead] transition-colors hover:text-[#18aead]/80 text-center py-2"
                    >
                      Create Tag
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
                setAssigneePanelOpen(false);
                setTagPanelOpen(false);
                setPriorityPanelOpen(false);
                setStatusPanelOpen(false);
              }}
              className="flex items-center gap-2 text-blue-300 hover:text-white/50 transition-colors"
              >
              <div className="border border-[#1a2446] bg-[#0e1629] rounded-full p-2">
                <FiCalendar className="h-4 w-4 text-blue-300 flex-shrink-0" />
              </div>
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
              <div className="absolute z-[1001] mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-4 shadow-lg">
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
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Grid Layout: Priority and Status in second row (2 items in 3-column grid) */}
          <div className="grid grid-cols-3 gap-4">
            {/* Priority - Label + Clickable Row + Inline Panel */}
            <div className="relative" ref={priorityPanelRef}>
            <label className="block text-sm font-medium text-blue-200 mb-2">Priority</label>
            <button
              type="button"
              onClick={() => {
                setPriorityPanelOpen(!priorityPanelOpen);
                setAssigneePanelOpen(false);
                setTagPanelOpen(false);
                setDatePanelOpen(false);
                setStatusPanelOpen(false);
              }}
              className="flex items-center gap-2 text-blue-300 hover:text-white/50 transition-colors"
            >
              <div className="border border-[#1a2446] bg-[#0e1629] rounded-full p-2">
                <FiFlag className="h-4 w-4 text-blue-300 flex-shrink-0" />
              </div>
              <div className="flex-1">
                {editTask.priority ? (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityColor(editTask.priority)}`}>
                    {editTask.priority}
                  </span>
                ) : (
                  <span className="text-sm text-blue-200">No priority</span>
                )}
              </div>
            </button>

            {/* Inline Priority Panel */}
            {priorityPanelOpen && (
              <div className="absolute z-[1001] mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTask({ ...editTask, priority: "" as any });
                      setPriorityPanelOpen(false);
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-left transition-colors ${
                      !editTask.priority
                        ? "border-[#18aead] bg-[#18aead]/10"
                        : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FiFlag className="h-4 w-4 text-blue-300" />
                      <span className="text-sm text-blue-200">No priority</span>
                    </div>
                  </button>
                  {priorityOptions.map((priority) => {
                    const isSelected = priority === editTask.priority;
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => {
                          setEditTask({ ...editTask, priority: priority as Task["priority"] });
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
                setAssigneePanelOpen(false);
                setTagPanelOpen(false);
                setDatePanelOpen(false);
                setPriorityPanelOpen(false);
              }}
              className="flex items-center gap-2 text-blue-300 hover:text-white/50 transition-colors"
            >
              <div className="border border-[#1a2446] bg-[#0e1629] rounded-full p-2">
                <FiCheckCircle className="h-4 w-4 text-blue-300 flex-shrink-0" />
              </div>
              <div className="flex-1">
                {editTask.status ? (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(editTask.status)}`}>
                    {editTask.status}
                  </span>
                ) : (
                  <span className="text-sm text-blue-200">No status</span>
                )}
              </div>
            </button>

            {/* Inline Status Panel */}
            {statusPanelOpen && (
              <div className="absolute z-[1001] mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
                <div className="space-y-1">
                  {statusOptions.map((status) => {
                    const isSelected = status === editTask.status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setEditTask({ ...editTask, status: status as Task["status"] });
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
            {loading ? "Updating..." : "Update Task"}
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
