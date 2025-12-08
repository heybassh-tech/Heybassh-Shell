import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Task, priorityOptions, statusOptions } from "../types";
import { PrimaryModal } from "../../PrimaryModal";
import { PrimaryButton } from "../../PrimaryButton";
import { PrimaryInput } from "../../PrimaryInput";

interface TasksProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  employees: { id: string; name: string }[];
}

export function Tasks({ tasks, onAddTask, employees }: TasksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [filters, setFilters] = useState({
    search: "",
    priority: "All",
    status: "All",
    assignee: "All",
  });

  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: "",
    assignee: "",
    dueDate: "",
    priority: "Normal",
    status: "Todo",
    description: "",
    tags: [],
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === "All" || task.priority === filters.priority;
    const matchesStatus = filters.status === "All" || task.status === filters.status;
    const matchesAssignee = filters.assignee === "All" || task.assignee === filters.assignee;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask(newTask);
    setNewTask({
      title: "",
      assignee: "",
      dueDate: "",
      priority: "Normal",
      status: "Todo",
      description: "",
      tags: [],
    });
    setIsModalOpen(false);
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
        <h2 className="text-2xl font-bold text-white">Tasks</h2>
        <div className="flex flex-wrap items-center gap-2.5">
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
                {employee.name}
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
          
          <PrimaryButton
            onClick={() => setIsModalOpen(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Task
          </PrimaryButton>
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
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-blue-200">
                Due Date
              </label>
              <PrimaryInput
                id="dueDate"
                type="date"
                required
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-[5px] border border-[#1a2446] bg-[#0c142a]">
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
                        {employees.find(e => e.id === task.assignee)?.name || task.assignee}
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
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className="text-[#7ed0ff] transition-colors hover:text-white">Edit</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
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
            <div key={status} className="rounded-[5px] border border-[#1a2446] bg-[#0c142a]">
              <div className="border-b border-[#1a2446] bg-[#0e1629] px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-300">{status}</h3>
              </div>
              <div className="p-4 space-y-3">
                {filteredTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="rounded-[5px] border border-[#1a2446] bg-[#0e1629] p-3 transition-colors hover:bg-[#121c3d]">
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
                        <span>{employees.find(e => e.id === task.assignee)?.name || task.assignee}</span>
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "--"}</span>
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
