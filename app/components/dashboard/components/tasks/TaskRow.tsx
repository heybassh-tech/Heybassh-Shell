import { Task } from "../../types";
import { getPriorityColor, getStatusColor } from "./taskUtils";
import { TaskActionsMenu } from "./TaskActionsMenu";

interface TaskRowProps {
  task: Task;
  employees: { id: string; name: string; email?: string }[];
  openMenuId: string | null;
  onMenuToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({
  task,
  employees,
  openMenuId,
  onMenuToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const assignee = employees.find((e) => e.id === task.assignee);
  const assigneeName = assignee?.name || assignee?.email || task.assignee;

  return (
    <tr className="transition-colors hover:bg-[#121c3d]">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="text-sm font-medium text-white">{task.title}</div>
        {task.description && (
          <div className="mt-1 text-xs text-blue-300 line-clamp-1">{task.description}</div>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="text-sm text-blue-200">{assigneeName}</div>
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
      <td className="relative whitespace-nowrap px-6 py-4 overflow-visible">
        <TaskActionsMenu
          task={task}
          isOpen={openMenuId === task.id}
          onToggle={() => onMenuToggle(openMenuId === task.id ? "" : task.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
