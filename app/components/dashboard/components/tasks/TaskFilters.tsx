import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Task, priorityOptions, statusOptions } from "../../types";

interface TaskFiltersProps {
  filters: {
    search: string;
    priority: string;
    status: string;
    assignee: string;
  };
  viewMode: "list" | "board";
  employees: { id: string; name: string; email?: string }[];
  onFilterChange: (filters: {
    search: string;
    priority: string;
    status: string;
    assignee: string;
  }) => void;
  onViewModeChange: (mode: "list" | "board") => void;
}

export function TaskFilters({
  filters,
  viewMode,
  employees,
  onFilterChange,
  onViewModeChange,
}: TaskFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#18aead] focus-within:ring-1 focus-within:ring-[#18aead] lg:max-w-xl">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2.5 lg:flex-1 lg:justify-end">
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
          className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#18aead] focus:outline-none"
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
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as Task["status"] })}
          className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#18aead] focus:outline-none"
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
          onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
          className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#18aead] focus:outline-none"
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
            onClick={() => onViewModeChange("list")}
            className={`rounded-[18px] px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "list"
                ? 'bg-[#18aead] text-white'
                : 'text-blue-200 hover:bg-[#121c3d]'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("board")}
            className={`rounded-[18px] px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "board"
                ? 'bg-[#18aead] text-white'
                : 'text-blue-200 hover:bg-[#121c3d]'
            }`}
          >
            Board
          </button>
        </div>
      </div>
    </div>
  );
}
