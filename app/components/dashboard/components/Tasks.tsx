import { useState } from "react";
import { Task } from "../types";
import { TaskFilters } from "./tasks/TaskFilters";
import { TasksTable } from "./tasks/TasksTable";
import { TasksBoard } from "./tasks/TasksBoard";
import { AddTaskModal } from "./tasks/AddTaskModal";
import { EditTaskModal } from "./tasks/EditTaskModal";
import { DeleteTaskModal } from "./tasks/DeleteTaskModal";
import { TasksHeader } from "./tasks/TasksHeader";
import { useTasks } from "./tasks/useTasks";

interface TasksProps {
  accountId: string;
  employees: { id: string; name: string; email?: string; role?: string; status?: string }[];
}

export function Tasks({ accountId, employees }: TasksProps) {
  const { tasks, availableTags, addTask, updateTask, removeTask } = useTasks({ accountId });
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleAddTaskSuccess = (task: Task) => {
    addTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleUpdateTaskSuccess = (updatedTask: Task) => {
    updateTask(updatedTask);
    setEditingTask(null);
  };

  const requestDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteSuccess = () => {
    if (taskToDelete) {
      removeTask(taskToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleMenuToggle = (taskId: string) => {
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      <TasksHeader onAddTask={() => setIsModalOpen(true)} />

      <TaskFilters
        filters={filters}
        viewMode={viewMode}
        employees={employees}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
      />

      <AddTaskModal
        open={isModalOpen}
        accountId={accountId}
        employees={employees}
        availableTags={availableTags}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddTaskSuccess}
      />

      <EditTaskModal
        open={isEditModalOpen}
        accountId={accountId}
        task={editingTask}
        employees={employees}
        availableTags={availableTags}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={handleUpdateTaskSuccess}
      />

      <DeleteTaskModal
        open={isDeleteModalOpen}
        task={taskToDelete}
        accountId={accountId}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />

      {viewMode === "list" ? (
        <TasksTable
          tasks={tasks}
          employees={employees}
          filters={filters}
          openMenuId={openMenuId}
          onMenuToggle={handleMenuToggle}
          onEdit={handleEditTask}
          onDelete={requestDeleteTask}
        />
      ) : (
        <TasksBoard
          tasks={tasks}
          employees={employees}
          filters={filters}
          openMenuId={openMenuId}
          onMenuToggle={handleMenuToggle}
          onEdit={handleEditTask}
          onDelete={requestDeleteTask}
        />
      )}
    </div>
  );
}
