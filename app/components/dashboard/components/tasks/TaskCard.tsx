import { Tag } from "antd";
import { Task } from "../../types";
import { getPriorityColor } from "./taskUtils";
import { TaskActionsMenu } from "./TaskActionsMenu";

interface TaskCardProps {
  task: Task;
  employees: { id: string; name: string; email?: string }[];
  openMenuId: string | null;
  onMenuToggle: (menuId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({
  task,
  employees,
  openMenuId,
  onMenuToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const assignee = employees.find((e) => e.id === task.assignee);
  const assigneeName = assignee?.name || assignee?.email || task.assignee;
  const menuId = `board-${task.id}`;

  return (
    <div className="relative rounded-[10px] border border-[#1a2446] bg-[#0e1629] p-3 transition-colors hover:bg-[#121c3d] overflow-visible">
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
        <span>{assigneeName}</span>
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
        <TaskActionsMenu
          task={task}
          isOpen={openMenuId === menuId}
          onToggle={() => onMenuToggle(openMenuId === menuId ? "" : menuId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
