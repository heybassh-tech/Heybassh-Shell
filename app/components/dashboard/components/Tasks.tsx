import { useState } from "react";
import { Task, priorityOptions, statusOptions } from "../types";
import { PrimaryModal } from "../../PrimaryModal";

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
        return "bg-red-100 text-red-800";
      case "Normal":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Todo":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Tasks</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              className="rounded-lg border border-gray-700 bg-[#1a2035] px-4 py-2 pl-10 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="rounded-lg border border-gray-700 bg-[#1a2035] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All" className="bg-gray-800">All Priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority} className="bg-gray-800">
                {priority}
              </option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as Task["status"] })}
            className="rounded-lg border border-gray-700 bg-[#1a2035] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All" className="bg-gray-800">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-gray-800">
                {status}
              </option>
            ))}
          </select>
          
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            className="rounded-lg border border-gray-700 bg-[#1a2035] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All" className="bg-gray-800">All Assignees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id} className="bg-gray-800">
                {employee.name}
              </option>
            ))}
          </select>
          
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium ${
                viewMode === "list"
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium ${
                viewMode === "board"
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Add Task
          </button>
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
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-300">
                Assign To
              </label>
              <select
                id="assignee"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              >
                <option value="">Select Assignee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300">
                Priority
              </label>
              <select
                id="priority"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task["status"] })}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
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
              className="rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Add Task
            </button>
          </div>
        </form>
      </PrimaryModal>

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-lg border border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1a2035]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Assignee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-[#1a2035]">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      {task.description && (
                        <div className="mt-1 text-xs text-gray-400 line-clamp-1">{task.description}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {employees.find(e => e.id === task.assignee)?.name || task.assignee}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className="text-indigo-400 hover:text-indigo-300">Edit</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                    No tasks found. {tasks.length === 0 ? 'Add your first task to get started!' : 'Try adjusting your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statusOptions.map((status) => (
            <div key={status} className="rounded-lg border border-gray-700 bg-[#1a2035]">
              <div className="border-b border-gray-700 px-4 py-3">
                <h3 className="text-sm font-medium text-white">{status}</h3>
              </div>
              <div className="p-4 space-y-3">
                {filteredTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="rounded-lg border border-gray-700 bg-gray-800 p-3 shadow">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-white">{task.title}</h4>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{employees.find(e => e.id === task.assignee)?.name || task.assignee}</span>
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                {filteredTasks.filter((task) => task.status === status).length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center">
                    <p className="text-sm text-gray-400">No tasks</p>
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
