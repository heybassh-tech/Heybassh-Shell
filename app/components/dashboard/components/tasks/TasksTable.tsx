import { Task } from "../../types";
import { TaskRow } from "./TaskRow";

interface TasksTableProps {
  tasks: Task[];
  employees: { id: string; name: string; email?: string }[];
  filters: {
    search: string;
    priority: string;
    status: string;
    assignee: string;
  };
  openMenuId: string | null;
  onMenuToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TasksTable({
  tasks,
  employees,
  filters,
  openMenuId,
  onMenuToggle,
  onEdit,
  onDelete,
}: TasksTableProps) {
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === "All" || task.priority === filters.priority;
    const matchesStatus = filters.status === "All" || task.status === filters.status;
    const matchesAssignee = filters.assignee === "All" || task.assignee === filters.assignee;

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  return (
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
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                employees={employees}
                openMenuId={openMenuId}
                onMenuToggle={onMenuToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                {filters.search
                  ? `No tasks found for "${filters.search}".`
                  : tasks.length === 0
                  ? "No tasks yet. Add one to get started."
                  : "Try adjusting your filters."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
