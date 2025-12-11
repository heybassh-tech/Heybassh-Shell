import { Modal } from "antd";
import { FiFlag } from "react-icons/fi";
import { priorityOptions } from "../../../types";
import { Task } from "../../../types";
import { getPriorityColor } from "../taskUtils";

interface PrioritySelectorPopupProps {
  open: boolean;
  selectedPriority: Task["priority"];
  onClose: () => void;
  onSelect: (priority: Task["priority"]) => void;
}

export function PrioritySelectorPopup({
  open,
  selectedPriority,
  onClose,
  onSelect,
}: PrioritySelectorPopupProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Select Priority"
      width={400}
      centered
      maskClosable={false}
      destroyOnClose
      className="primary-modal"
    >
      <div className="space-y-2">
        {priorityOptions.map((priority) => {
          const isSelected = priority === selectedPriority;
          return (
            <button
              key={priority}
              type="button"
              onClick={() => {
                onSelect(priority as Task["priority"]);
              }}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-[#18aead] bg-[#18aead]/10"
                  : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiFlag className="h-4 w-4 text-blue-300" />
                  <span className="text-sm text-blue-200">{priority}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPriorityColor(
                    priority as Task["priority"]
                  )}`}
                >
                  {priority}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

