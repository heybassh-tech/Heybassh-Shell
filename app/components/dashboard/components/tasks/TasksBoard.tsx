import { Task, statusOptions } from "../../types";
import { TaskCard } from "./TaskCard";

interface TasksBoardProps {
  tasks: Task[];
  employees: { id: string; name: string; email?: string }[];
  filters: {
    search: string;
    priority: string;
    status: string;
    assignee: string;
  };
  openMenuId: string | null;
  onMenuToggle: (menuId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TasksBoard({
  tasks,
  employees,
  filters,
  openMenuId,
  onMenuToggle,
  onEdit,
  onDelete,
}: TasksBoardProps) {
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesPriority = filters.priority === "All" || task.priority === filters.priority;
    const matchesStatus = filters.status === "All" || task.status === filters.status;
    const matchesAssignee = filters.assignee === "All" || task.assignee === filters.assignee;

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {statusOptions.map((status) => {
        const statusTasks = filteredTasks.filter((task) => task.status === status);
        return (
          <div key={status} className="rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
            <div className="border-b border-[#1a2446] bg-[#0e1629] px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-300">{status}</h3>
            </div>
            <div className="p-4 space-y-3">
              {statusTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  employees={employees}
                  openMenuId={openMenuId}
                  onMenuToggle={onMenuToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {statusTasks.length === 0 && (
                <div className="rounded-[5px] border-2 border-dashed border-[#1a2446] p-4 text-center">
                  <p className="text-sm text-blue-300">No tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
