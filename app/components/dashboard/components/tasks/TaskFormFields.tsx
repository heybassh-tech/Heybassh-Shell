import { useState, useMemo } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { FiCalendar, FiFlag, FiUser } from "react-icons/fi";
import { DatePicker, Tag } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task, priorityOptions, statusOptions } from "../../types";
import { PrimaryInput } from "../../../PrimaryInput";
import { getPriorityColor, getStatusColor, addTag, removeTag } from "./taskUtils";

interface TaskFormFieldsProps {
  task: Omit<Task, "id">;
  employees: { id: string; name: string; email?: string; role?: string; status?: string }[];
  availableTags: string[];
  startDate: Dayjs | null;
  dueDate: Dayjs | null;
  onTaskChange: (task: Omit<Task, "id">) => void;
  onStartDateChange: (date: Dayjs | null) => void;
  onDueDateChange: (date: Dayjs | null) => void;
}

export function TaskFormFields({
  task,
  employees,
  availableTags,
  startDate,
  dueDate,
  onTaskChange,
  onStartDateChange,
  onDueDateChange,
}: TaskFormFieldsProps) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAllAssignees, setShowAllAssignees] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const activeAssignees = useMemo(
    () => employees.filter((e) => (e.status ?? "Accepted") === "Accepted"),
    [employees]
  );

  const filteredAssignees = useMemo(
    () =>
      activeAssignees.filter((a) =>
        (a.name || a.email || "").toLowerCase().includes(assigneeSearch.toLowerCase())
      ),
    [activeAssignees, assigneeSearch]
  );

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return availableTags;
    return availableTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()));
  }, [availableTags, tagSearch]);

  const selectedAssignee = employees.find((e) => e.id === task.assignee);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="title" className="block text-sm font-medium text-blue-200">
          Title
        </label>
        <PrimaryInput
          id="title"
          type="text"
          required
          value={task.title}
          onChange={(e) => onTaskChange({ ...task, title: e.target.value })}
        />
      </div>

      <div className="relative">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-200">
          <FiUser className="h-4 w-4 text-blue-300" />
          <span>Assign To</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setAssigneeOpen((o) => !o);
            setShowAllAssignees(false);
          }}
          className="flex w-full items-center justify-between rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 transition-colors hover:border-[#18aead]"
        >
          <span className="truncate">
            {selectedAssignee?.name || selectedAssignee?.email || "Select assignee"}
          </span>
          <span className="text-blue-300/70">▼</span>
        </button>
        {assigneeOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <PrimaryInput
                id="assignee-search"
                type="text"
                placeholder="Search people"
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setAssigneeOpen(false);
                  setAssigneeSearch("");
                  setShowAllAssignees(false);
                }}
                className="rounded p-1 text-blue-300/70 hover:bg-[#121c3d] hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
              {(showAllAssignees ? filteredAssignees : filteredAssignees.slice(0, 6)).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onTaskChange({ ...task, assignee: a.id });
                    setAssigneeOpen(false);
                    setAssigneeSearch("");
                    setShowAllAssignees(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
                >
                  <span className="flex items-center gap-2">
                    <FiUser className="h-4 w-4" />
                    {a.name || a.email}
                  </span>
                  {task.assignee === a.id && <span className="text-xs text-[#18aead]">Selected</span>}
                </button>
              ))}
              {!showAllAssignees && filteredAssignees.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllAssignees(true)}
                  className="w-full rounded-lg border border-dashed border-[#1a2446] px-3 py-2 text-center text-sm text-blue-200 transition-colors hover:border-[#18aead]"
                >
                  Load more
                </button>
              )}
              {filteredAssignees.length === 0 && (
                <p className="px-1 py-2 text-xs text-blue-300/70">No people found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-blue-200 mb-2">
          Date
        </label>
        <DatePicker
          id="dueDate"
          value={dueDate || (task.dueDate ? dayjs(task.dueDate) : null)}
          onChange={(date) => {
            onDueDateChange(date);
            onTaskChange({ ...task, dueDate: date ? date.format("YYYY-MM-DD") : "" });
          }}
          format="YYYY-MM-DD"
          className="w-full !rounded-[10px] !border !border-[#1a2446] !bg-[#0e1629] !px-4 !py-2 !text-sm !text-blue-100 placeholder:!text-blue-300/60 focus-within:!border-[#18aead] focus-within:!outline-none"
          placeholder="Select a date"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const today = dayjs();
              onDueDateChange(today);
              onTaskChange({ ...task, dueDate: today.format("YYYY-MM-DD") });
            }}
            className="flex items-center gap-1 text-xs text-blue-200 hover:text-white"
          >
            <FiCalendar className="h-4 w-4" />
            Pick date
          </button>
          <button
            type="button"
            onClick={() => {
              onDueDateChange(null);
              onTaskChange({ ...task, dueDate: "" });
            }}
            className="flex items-center gap-1 text-xs text-blue-200 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
            No date
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-200">
          <FiFlag className="h-4 w-4 text-blue-300" />
          <span>Priority</span>
        </div>
        <button
          type="button"
          onClick={() => setPriorityOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 transition-colors hover:border-[#18aead]"
        >
          <span className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </span>
          <span className="text-blue-300/70">▼</span>
        </button>
        {priorityOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
            {priorityOptions.map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => {
                  onTaskChange({ ...task, priority: priority as Task["priority"] });
                  setPriorityOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
              >
                <span className="flex items-center gap-2">
                  <FiFlag className="h-4 w-4" />
                  {priority}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPriorityColor(priority as Task["priority"])}`}>
                  {priority}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-200">
          <Tag className="bg-transparent text-blue-200"> </Tag>
          <span>Status</span>
        </div>
        <button
          type="button"
          onClick={() => setStatusOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 transition-colors hover:border-[#18aead]"
        >
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
          <span className="text-blue-300/70">▼</span>
        </button>
        {statusOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-2 shadow-lg">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onTaskChange({ ...task, status: status as Task["status"] });
                  setStatusOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
              >
                <span className="flex items-center gap-2">
                  <FiFlag className="h-4 w-4" />
                  {status}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(status as Task["status"])}`}>
                  {status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="description" className="block text-sm font-medium text-blue-200">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 placeholder-blue-300/60 focus:border-[#18aead] focus:outline-none"
          value={task.description}
          onChange={(e) => onTaskChange({ ...task, description: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="tags" className="block text-sm font-medium text-blue-200">
            Tags
          </label>
          <button
            type="button"
            onClick={() => setTagOpen(true)}
            className="flex items-center gap-1 rounded-full bg-[#121c3d] px-3 py-1 text-xs font-medium text-blue-200 transition-colors hover:bg-[#18aead] hover:text-white"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {task.tags.length > 0 ? (
            task.tags.map((tag, index) => (
              <Tag
                key={index}
                closable
                onClose={() => removeTag(task.tags, tag, (tags) => onTaskChange({ ...task, tags }))}
                className="bg-[#121c3d] border-[#1a2446] text-blue-200"
              >
                {tag}
              </Tag>
            ))
          ) : (
            <span className="text-xs text-blue-300/70">No tags</span>
          )}
        </div>
        {tagOpen && (
          <div className="relative">
            <div className="absolute z-50 mt-2 w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-200">Select tags</span>
                <button
                  type="button"
                  onClick={() => {
                    setTagOpen(false);
                    setTagSearch("");
                  }}
                  className="rounded p-1 text-blue-300/70 hover:bg-[#121c3d] hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <PrimaryInput
                  id="tags"
                  type="text"
                  placeholder="Search tags"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
              </div>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        addTag(task.tags, tag, (tags) => onTaskChange({ ...task, tags }), () => {});
                        setTagOpen(false);
                        setTagSearch("");
                      }}
                      className="w-full rounded-lg border border-transparent bg-[#121c3d] px-3 py-2 text-left text-sm text-blue-200 transition-colors hover:border-[#18aead] hover:bg-[#121c3d]/70"
                    >
                      {tag}
                    </button>
                  ))
                ) : tagSearch.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      addTag(task.tags, tagSearch, (tags) => onTaskChange({ ...task, tags }), () => {});
                      setTagSearch("");
                      setTagOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-dashed border-[#18aead] px-3 py-2 text-left text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
                  >
                    <span>Create tag "{tagSearch}"</span>
                    <PlusIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <p className="text-xs text-blue-300/70">No tags yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
