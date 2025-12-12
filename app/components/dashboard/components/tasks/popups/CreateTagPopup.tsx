import { useState } from "react";
import { Modal } from "antd";
import { PrimaryInput } from "../../../../PrimaryInput";
import { PrimaryButton } from "../../../../PrimaryButton";

interface CreateTagPopupProps {
  open: boolean;
  accountId: string;
  onClose: () => void;
  onSuccess: (tagName: string, tagColor: string) => void;
}

const TAG_COLORS = [
  { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
  { name: "Green", value: "#10b981", class: "bg-green-500" },
  { name: "Yellow", value: "#f59e0b", class: "bg-yellow-500" },
  { name: "Red", value: "#ef4444", class: "bg-red-500" },
  { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
  { name: "Cyan", value: "#06b6d4", class: "bg-cyan-500" },
  { name: "Orange", value: "#f97316", class: "bg-orange-500" },
];

export function CreateTagPopup({
  open,
  accountId,
  onClose,
  onSuccess,
}: CreateTagPopupProps) {
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].value);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || loading) return;

    setLoading(true);
    try {
      // Store tag color in localStorage for now
      // In a real app, you'd save this to the backend
      const tagColors = JSON.parse(localStorage.getItem("tagColors") || "{}");
      tagColors[tagName.trim()] = selectedColor;
      localStorage.setItem("tagColors", JSON.stringify(tagColors));

      // Call the tags API to create the tag (if it exists)
      // For now, we'll just call onSuccess
      onSuccess(tagName.trim(), selectedColor);
      handleClose();
    } catch (error) {
      console.error("Failed to create tag", error);
      alert("Failed to create tag");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTagName("");
    setSelectedColor(TAG_COLORS[0].value);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title="Create New Tag"
      width={400}
      centered
      maskClosable={false}
      destroyOnClose
      className="primary-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tag Name */}
        <div>
          <label htmlFor="tag-name" className="block text-sm font-medium text-blue-200 mb-2">
            Tag Name <span className="text-red-400">*</span>
          </label>
          <PrimaryInput
            id="tag-name"
            type="text"
            required
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Enter tag name"
          />
        </div>

        {/* Tag Color */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Tag Color <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {TAG_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={`relative h-10 w-full rounded-lg border-2 transition-all ${
                  selectedColor === color.value
                    ? "border-[#18aead] ring-2 ring-[#18aead]/50"
                    : "border-[#1a2446] hover:border-[#18aead]/50"
                }`}
              >
                <div className={`h-full w-full rounded ${color.class}`} />
                {selectedColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white drop-shadow-lg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={loading || !tagName.trim()}>
            {loading ? "Creating..." : "Create New Tag"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

