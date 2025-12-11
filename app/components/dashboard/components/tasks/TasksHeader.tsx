import { PlusIcon } from "@heroicons/react/24/outline";
import { PrimaryButton } from "../../../PrimaryButton";

interface TasksHeaderProps {
  onAddTask: () => void;
}

export function TasksHeader({ onAddTask }: TasksHeaderProps) {
  return (
    <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
      <h2 className="text-2xl font-bold text-[#18aead]">Tasks</h2>
      <div className="flex items-center gap-2">
        <PrimaryButton
          onClick={onAddTask}
          icon={<PlusIcon className="h-4 w-4" />}
          variant="brand"
        >
          Add Task
        </PrimaryButton>
      </div>
    </div>
  );
}
