import { useRef, useEffect } from "react";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Task } from "../../types";

interface TaskActionsMenuProps {
  task: Task;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskActionsMenu({
  task,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: TaskActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onToggle]);

  return (
    <div className="relative overflow-visible" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded-lg p-1 text-blue-300/70 transition-colors hover:bg-[#121c3d] hover:text-white"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-visible rounded-lg border border-[#1a2446] bg-[#0e1629] shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-[#121c3d]"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
