import { useState } from "react";
import { Task } from "../../types";
import { PrimaryModal } from "../../../PrimaryModal";
import { PrimaryButton } from "../../../PrimaryButton";

interface DeleteTaskModalProps {
  open: boolean;
  task: Task | null;
  accountId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteTaskModal({
  open,
  task,
  accountId,
  onClose,
  onSuccess,
}: DeleteTaskModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!task || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}/tasks?id=${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string })?.error ?? "Failed to delete task");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to delete task", error);
      alert(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrimaryModal
      open={open}
      title="Delete Task"
      description={
        task
          ? `Are you sure you want to delete "${task.title}"? This cannot be undone.`
          : "Are you sure you want to delete this task?"
      }
      onClose={() => {
        if (loading) return;
        onClose();
      }}
      widthClassName="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-blue-200">
          The task will be removed permanently from this account.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (loading) return;
              onClose();
            }}
            className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="!bg-rose-600 !border-rose-600 hover:!bg-rose-500 hover:!border-rose-500"
          >
            {loading ? "Deleting..." : "Delete"}
          </PrimaryButton>
        </div>
      </div>
    </PrimaryModal>
  );
}
