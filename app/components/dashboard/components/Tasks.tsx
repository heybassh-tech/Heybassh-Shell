import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, PlusIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DatePicker, Tag } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Task, priorityOptions, statusOptions } from "../types";
import { PrimaryModal } from "../../PrimaryModal";
import { PrimaryButton } from "../../PrimaryButton";
import { PrimaryInput } from "../../PrimaryInput";

// Ant Design DatePicker uses dayjs by default

interface TasksProps {
  accountId: string;
  employees: { id: string; name: string; email?: string }[];
}

export function Tasks({ accountId, employees }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [filters, setFilters] = useState({
    search: "",
    priority: "All",
    status: "All",
    assignee: "All",
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: "",
    assignee: "",
    dueDate: "",
    priority: "Normal",
    status: "Todo",
    description: "",
    tags: [],
  });
  const [editTask, setEditTask] = useState<Omit<Task, 'id'>>({
    title: "",
    assignee: "",
    dueDate: "",
    priority: "Normal",
    status: "Todo",
    description: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [editStartDate, setEditStartDate] = useState<Dayjs | null>(null);
  const [editDueDate, setEditDueDate] = useState<Dayjs | null>(null);

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
    function handleClickOutside(event: MouseEvent) {
      Object.keys(menuRefs.current).forEach((id) => {
        const ref = menuRefs.current[id];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === "All" || task.priority === filters.priority;
    const matchesStatus = filters.status === "All" || task.status === filters.status;
    const matchesAssignee = filters.assignee === "All" || task.assignee === filters.assignee;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskToAdd = {
        ...newTask,
        dueDate: dueDate ? dueDate.format("YYYY-MM-DD") : newTask.dueDate || "",
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

      setTasks((prev) => [payload as Task, ...prev]);
      setNewTask({
        title: "",
        assignee: "",
        dueDate: "",
        priority: "Normal",
        status: "Todo",
        description: "",
        tags: [],
      });
      setTagInput("");
      setStartDate(null);
      setDueDate(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create task", error);
      alert(error instanceof Error ? error.message : "Failed to create task");
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      assignee: task.assignee,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      description: task.description || "",
      tags: task.tags || [],
    });
    setEditTagInput("");
    setEditStartDate(task.dueDate ? dayjs(task.dueDate) : null);
    setEditDueDate(task.dueDate ? dayjs(task.dueDate) : null);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const taskToUpdate = {
        ...editTask,
        dueDate: editDueDate ? editDueDate.format("YYYY-MM-DD") : editTask.dueDate || "",
      };

      const response = await fetch(`/api/accounts/${accountId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          ...taskToUpdate,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to update task");
      }

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? (payload as Task) : t)));
      setEditingTask(null);
      setEditTask({
        title: "",
        assignee: "",
        dueDate: "",
        priority: "Normal",
        status: "Todo",
        description: "",
        tags: [],
      });
      setEditTagInput("");
      setEditStartDate(null);
      setEditDueDate(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update task", error);
      alert(error instanceof Error ? error.message : "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to delete task", error);
      alert("Failed to delete task");
    }
  };

  const addTag = (tags: string[], input: string, setTags: (tags: string[]) => void, setInput: (input: string) => void) => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tags: string[], tagToRemove: string, setTags: (tags: string[]) => void) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "border-rose-500/40 bg-rose-500/10 text-rose-200";
      case "Normal":
        return "border-amber-500/40 bg-amber-500/10 text-amber-200";
      case "Low":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
      default:
        return "border-[#1a2446] text-blue-100";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Todo":
        return "border-blue-500/40 bg-blue-500/10 text-blue-200";
      case "In Progress":
        return "border-amber-500/40 bg-amber-500/10 text-amber-200";
      case "Done":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
      default:
        return "border-[#1a2446] text-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-[#18aead]">Tasks</h2>
        <div className="flex items-center gap-2">
          <PrimaryButton
            onClick={() => setIsModalOpen(true)}
            icon={<PlusIcon className="h-4 w-4" />}
            variant="brand"
          >
            Add Task
          </PrimaryButton>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#2b9bff] focus-within:ring-1 focus-within:ring-[#2b9bff] lg:max-w-xl">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 lg:flex-1 lg:justify-end">
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#2b9bff] focus:outline-none"
          >
            <option value="All" className="bg-[#0e1629]">All Priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority} className="bg-[#0e1629]">
                {priority}
              </option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as Task["status"] })}
            className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#2b9bff] focus:outline-none"
          >
            <option value="All" className="bg-[#0e1629]">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-[#0e1629]">
                {status}
              </option>
            ))}
          </select>
          
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#2b9bff] focus:outline-none"
          >
            <option value="All" className="bg-[#0e1629]">All Assignees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id} className="bg-[#0e1629]">
                {employee.name || employee.email}
              </option>
            ))}
          </select>
          
          <div className="flex rounded-[20px] border border-[#1a2446] bg-[#0e1629] p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-[18px] px-3 py-1.5 text-xs font-medium transition ${
                viewMode === "list"
                  ? 'bg-[#2b9bff] text-white'
                  : 'text-blue-200 hover:bg-[#121c3d]'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`rounded-[18px] px-3 py-1.5 text-xs font-medium transition ${
                viewMode === "board"
                  ? 'bg-[#2b9bff] text-white'
                  : 'text-blue-200 hover:bg-[#121c3d]'
              }`}
            >
              Board
            </button>
          </div>
        </div>
      </div>
      <PrimaryModal
        open={isModalOpen}
        title="Add Task"
        description="Create a new task and assign it to a team member."
        onClose={() => {
          setIsModalOpen(false);
          setNewTask({
            title: "",
            assignee: "",
            dueDate: "",
            priority: "Normal",
            status: "Todo",
            description: "",
            tags: [],
          });
        }}
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleAddTask} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-blue-200">
                Title
              </label>
              <PrimaryInput
                id="title"
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-blue-200">
                Assign To
              </label>
              <select
                id="assignee"
                required
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              >
                <option value="" className="bg-[#0e1629]">Select Assignee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id} className="bg-[#0e1629]">
                    {employee.name || employee.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-blue-200 mb-2">
                Start Date
              </label>
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={(date) => setStartDate(date)}
                format="YYYY-MM-DD"
                className="w-full !rounded-[10px] !border !border-[#1a2446] !bg-[#0e1629] !px-4 !py-2 !text-sm !text-blue-100 placeholder:!text-blue-300/60 focus-within:!border-[#2b9bff] focus-within:!outline-none"
                placeholder="Select start date"
                renderExtraFooter={() => (
                  <div className="flex gap-2 p-2 border-t border-[#1a2446]">
                    <button
                      type="button"
                      onClick={() => setStartDate(dayjs())}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartDate(dayjs().add(1, "day"))}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartDate(dayjs().add(7, "day"))}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartDate(null)}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors ml-auto"
                    >
                      None
                    </button>
                  </div>
                )}
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-blue-200 mb-2">
                Due Date
              </label>
              <DatePicker
                id="dueDate"
                value={dueDate || (newTask.dueDate ? dayjs(newTask.dueDate) : null)}
                onChange={(date) => {
                  setDueDate(date);
                  setNewTask({ ...newTask, dueDate: date ? date.format("YYYY-MM-DD") : "" });
                }}
                format="YYYY-MM-DD"
                className="w-full !rounded-[10px] !border !border-[#1a2446] !bg-[#0e1629] !px-4 !py-2 !text-sm !text-blue-100 placeholder:!text-blue-300/60 focus-within:!border-[#2b9bff] focus-within:!outline-none"
                placeholder="Select due date"
                renderExtraFooter={() => (
                  <div className="flex gap-2 p-2 border-t border-[#1a2446]">
                    <button
                      type="button"
                      onClick={() => {
                        const today = dayjs();
                        setDueDate(today);
                        setNewTask({ ...newTask, dueDate: today.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const plus1 = dayjs().add(1, "day");
                        setDueDate(plus1);
                        setNewTask({ ...newTask, dueDate: plus1.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const plus7 = dayjs().add(7, "day");
                        setDueDate(plus7);
                        setNewTask({ ...newTask, dueDate: plus7.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate(null);
                        setNewTask({ ...newTask, dueDate: "" });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors ml-auto"
                    >
                      None
                    </button>
                  </div>
                )}
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-blue-200">
                Priority
              </label>
              <select
                id="priority"
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority} className="bg-[#0e1629]">
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-blue-200">
                Status
              </label>
              <select
                id="status"
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task["status"] })}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status} className="bg-[#0e1629]">
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-blue-200">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 placeholder-blue-300/60 focus:border-[#2b9bff] focus:outline-none"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-blue-200 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTask.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => removeTag(newTask.tags, tag, (tags) => setNewTask({ ...newTask, tags }))}
                    className="bg-[#121c3d] border-[#1a2446] text-blue-200"
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
              <div className="flex gap-2">
                <PrimaryInput
                  id="tags"
                  type="text"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(newTask.tags, tagInput, (tags) => setNewTask({ ...newTask, tags }), setTagInput);
                    }
                  }}
                />
                <PrimaryButton
                  type="button"
                  onClick={() => addTag(newTask.tags, tagInput, (tags) => setNewTask({ ...newTask, tags }), setTagInput)}
                >
                  Add
                </PrimaryButton>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setNewTask({
                  title: "",
                  assignee: "",
                  dueDate: "",
                  priority: "Normal",
                  status: "Todo",
                  description: "",
                  tags: [],
                });
                setStartDate(null);
                setDueDate(null);
              }}
              className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              Cancel
            </button>
            <PrimaryButton type="submit">
              Save Task
            </PrimaryButton>
          </div>
        </form>
      </PrimaryModal>

      {/* Edit Task Modal */}
      <PrimaryModal
        open={isEditModalOpen}
        title="Edit Task"
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
          setEditTask({
            title: "",
            assignee: "",
            dueDate: "",
            priority: "Normal",
            status: "Todo",
            description: "",
            tags: [],
          });
          setEditTagInput("");
          setEditStartDate(null);
          setEditDueDate(null);
        }}
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleUpdateTask} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="edit-title" className="block text-sm font-medium text-blue-200">
                Title
              </label>
              <PrimaryInput
                id="edit-title"
                type="text"
                required
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-assignee" className="block text-sm font-medium text-blue-200">
                Assign To
              </label>
              <select
                id="edit-assignee"
                required
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={editTask.assignee}
                onChange={(e) => setEditTask({ ...editTask, assignee: e.target.value })}
              >
                <option value="" className="bg-[#0e1629]">Select Assignee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id} className="bg-[#0e1629]">
                    {employee.name || employee.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-startDate" className="block text-sm font-medium text-blue-200 mb-2">
                Start Date
              </label>
              <DatePicker
                id="edit-startDate"
                value={editStartDate}
                onChange={(date) => setEditStartDate(date)}
                format="YYYY-MM-DD"
                className="w-full !rounded-[10px] !border !border-[#1a2446] !bg-[#0e1629] !px-4 !py-2 !text-sm !text-blue-100 placeholder:!text-blue-300/60 focus-within:!border-[#2b9bff] focus-within:!outline-none"
                placeholder="Select start date"
                renderExtraFooter={() => (
                  <div className="flex gap-2 p-2 border-t border-[#1a2446]">
                    <button
                      type="button"
                      onClick={() => setEditStartDate(dayjs())}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStartDate(dayjs().add(1, "day"))}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStartDate(dayjs().add(7, "day"))}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStartDate(null)}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors ml-auto"
                    >
                      None
                    </button>
                  </div>
                )}
              />
            </div>
            <div>
              <label htmlFor="edit-dueDate" className="block text-sm font-medium text-blue-200 mb-2">
                Due Date
              </label>
              <DatePicker
                id="edit-dueDate"
                value={editDueDate || (editTask.dueDate ? dayjs(editTask.dueDate) : null)}
                onChange={(date) => {
                  setEditDueDate(date);
                  setEditTask({ ...editTask, dueDate: date ? date.format("YYYY-MM-DD") : "" });
                }}
                format="YYYY-MM-DD"
                className="w-full !rounded-[10px] !border !border-[#1a2446] !bg-[#0e1629] !px-4 !py-2 !text-sm !text-blue-100 placeholder:!text-blue-300/60 focus-within:!border-[#2b9bff] focus-within:!outline-none"
                placeholder="Select due date"
                renderExtraFooter={() => (
                  <div className="flex gap-2 p-2 border-t border-[#1a2446]">
                    <button
                      type="button"
                      onClick={() => {
                        const today = dayjs();
                        setEditDueDate(today);
                        setEditTask({ ...editTask, dueDate: today.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const plus1 = dayjs().add(1, "day");
                        setEditDueDate(plus1);
                        setEditTask({ ...editTask, dueDate: plus1.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const plus7 = dayjs().add(7, "day");
                        setEditDueDate(plus7);
                        setEditTask({ ...editTask, dueDate: plus7.format("YYYY-MM-DD") });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors"
                    >
                      +7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDueDate(null);
                        setEditTask({ ...editTask, dueDate: "" });
                      }}
                      className="px-3 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#121c3d] rounded transition-colors ml-auto"
                    >
                      None
                    </button>
                  </div>
                )}
              />
            </div>
            <div>
              <label htmlFor="edit-priority" className="block text-sm font-medium text-blue-200">
                Priority
              </label>
              <select
                id="edit-priority"
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={editTask.priority}
                onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as Task["priority"] })}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority} className="bg-[#0e1629]">
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-blue-200">
                Status
              </label>
              <select
                id="edit-status"
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                value={editTask.status}
                onChange={(e) => setEditTask({ ...editTask, status: e.target.value as Task["status"] })}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status} className="bg-[#0e1629]">
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="edit-description" className="block text-sm font-medium text-blue-200">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={3}
                className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 placeholder-blue-300/60 focus:border-[#2b9bff] focus:outline-none"
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="edit-tags" className="block text-sm font-medium text-blue-200 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editTask.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => removeTag(editTask.tags, tag, (tags) => setEditTask({ ...editTask, tags }))}
                    className="bg-[#121c3d] border-[#1a2446] text-blue-200"
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
              <div className="flex gap-2">
                <PrimaryInput
                  id="edit-tags"
                  type="text"
                  placeholder="Add a tag and press Enter"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(editTask.tags, editTagInput, (tags) => setEditTask({ ...editTask, tags }), setEditTagInput);
                    }
                  }}
                />
                <PrimaryButton
                  type="button"
                  onClick={() => addTag(editTask.tags, editTagInput, (tags) => setEditTask({ ...editTask, tags }), setEditTagInput)}
                >
                  Add
                </PrimaryButton>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTask(null);
                setEditTask({
                  title: "",
                  assignee: "",
                  dueDate: "",
                  priority: "Normal",
                  status: "Todo",
                  description: "",
                  tags: [],
                });
                setEditTagInput("");
                setEditStartDate(null);
                setEditDueDate(null);
              }}
              className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              Cancel
            </button>
            <PrimaryButton type="submit">
              Update Task
            </PrimaryButton>
          </div>
        </form>
      </PrimaryModal>

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
          <table className="min-w-full divide-y divide-[#1a2446]">
            <thead className="bg-[#0e1629]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Title</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Assignee</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Due Date</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Priority</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Status</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Tags</span>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-[#121c3d]">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      {task.description && (
                        <div className="mt-1 text-xs text-blue-300 line-clamp-1">{task.description}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">
                        {employees.find(e => e.id === task.assignee)?.name || employees.find(e => e.id === task.assignee)?.email || task.assignee}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "--"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map((tag, index) => (
                            <Tag key={index} className="bg-[#121c3d] border-[#1a2446] text-blue-200 text-xs">
                              {tag}
                            </Tag>
                          ))
                        ) : (
                          <span className="text-xs text-blue-300/50">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap px-6 py-4">
                      <div className="relative" ref={(el) => { menuRefs.current[task.id] = el; }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === task.id ? null : task.id);
                          }}
                          className="rounded-lg p-1 text-blue-300/70 transition-colors hover:bg-[#121c3d] hover:text-white"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        {openMenuId === task.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-[#1a2446] bg-[#0e1629] shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-[#121c3d]"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-blue-300">
                    {filters.search ? `No tasks found for "${filters.search}".` : tasks.length === 0 ? 'No tasks yet. Add one to get started.' : 'Try adjusting your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statusOptions.map((status) => (
            <div key={status} className="rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
              <div className="border-b border-[#1a2446] bg-[#0e1629] px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-300">{status}</h3>
              </div>
              <div className="p-4 space-y-3">
                {filteredTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] p-3 transition-colors hover:bg-[#121c3d]">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                        <span className={`inline-flex items-center rounded-full border px-2 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-blue-300 line-clamp-2">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-blue-200">
                        <span>{employees.find(e => e.id === task.assignee)?.name || employees.find(e => e.id === task.assignee)?.email || task.assignee}</span>
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "--"}</span>
                      </div>
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <Tag key={index} className="bg-[#121c3d] border-[#1a2446] text-blue-200 text-xs">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end">
                        <div className="relative" ref={(el) => { menuRefs.current[`board-${task.id}`] = el; }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === `board-${task.id}` ? null : `board-${task.id}`);
                            }}
                            className="rounded-lg p-1 text-blue-300/70 transition-colors hover:bg-[#121c3d] hover:text-white"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                          {openMenuId === `board-${task.id}` && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-[#1a2446] bg-[#0e1629] shadow-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
                              >
                                <PencilIcon className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-[#121c3d]"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {filteredTasks.filter((task) => task.status === status).length === 0 && (
                  <div className="rounded-[5px] border-2 border-dashed border-[#1a2446] p-4 text-center">
                    <p className="text-sm text-blue-300">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
