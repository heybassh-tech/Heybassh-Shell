import { Modal } from "antd";
import { FiCheckCircle } from "react-icons/fi";
import { statusOptions } from "../../../types";
import { Task } from "../../../types";
import { getStatusColor } from "../taskUtils";

interface StatusSelectorPopupProps {
  open: boolean;
  selectedStatus: Task["status"];
  onClose: () => void;
  onSelect: (status: Task["status"]) => void;
}

export function StatusSelectorPopup({
  open,
  selectedStatus,
  onClose,
  onSelect,
}: StatusSelectorPopupProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Select Status"
      width={400}
      centered
      maskClosable={false}
      destroyOnClose
      className="primary-modal"
    >
      <div className="space-y-2">
        {statusOptions.map((status) => {
          const isSelected = status === selectedStatus;
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                onSelect(status as Task["status"]);
              }}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-[#18aead] bg-[#18aead]/10"
                  : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-blue-300" />
                  <span className="text-sm text-blue-200">{status}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(
                    status as Task["status"]
                  )}`}
                >
                  {status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

