import { useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Modal } from "antd";
import { PrimaryInput } from "../../../../PrimaryInput";
import { PrimaryButton } from "../../../../PrimaryButton";
import { CreateTagPopup } from "./CreateTagPopup";
import { getTagColor } from "../taskUtils";
import { Tag } from "antd";

interface TagSelectorPopupProps {
  open: boolean;
  selectedTags: string[];
  availableTags: string[];
  accountId: string;
  onClose: () => void;
  onSelect: (tags: string[]) => void;
}

export function TagSelectorPopup({
  open,
  selectedTags,
  availableTags,
  accountId,
  onClose,
  onSelect,
}: TagSelectorPopupProps) {
  const [tagSearch, setTagSearch] = useState("");
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(selectedTags);

  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const handleTagToggle = (tag: string) => {
    if (localSelectedTags.includes(tag)) {
      setLocalSelectedTags(localSelectedTags.filter((t) => t !== tag));
    } else {
      setLocalSelectedTags([...localSelectedTags, tag]);
    }
  };

  const handleConfirm = () => {
    onSelect(localSelectedTags);
    setTagSearch("");
  };

  const handleClose = () => {
    setLocalSelectedTags(selectedTags);
    setTagSearch("");
    onClose();
  };

  const handleCreateTag = (tagName: string, tagColor: string) => {
    // Add the new tag to selected tags
    if (!localSelectedTags.includes(tagName)) {
      setLocalSelectedTags([...localSelectedTags, tagName]);
    }
    // Store tag color (we'll implement this in taskUtils)
    // For now, we'll just add the tag
    setCreateTagOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        title="Select Tags"
        width={500}
        centered
        maskClosable={false}
        destroyOnClose
        className="primary-modal"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <PrimaryInput
            type="text"
            placeholder="Search tags"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
          />

          {/* Selected Tags Display */}
          {localSelectedTags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-blue-200">Selected Tags</p>
              <div className="flex flex-wrap gap-2">
                {localSelectedTags.map((tag) => {
                  const color = getTagColor(tag);
                  return (
                    <Tag
                      key={tag}
                      className={`${color} border text-xs px-2 py-0.5 rounded-full cursor-pointer`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags List */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const isSelected = localSelectedTags.includes(tag);
                const color = getTagColor(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-[#18aead] bg-[#18aead]/10"
                        : "border-transparent bg-[#121c3d] hover:border-[#18aead]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className={`${color} border text-xs px-2 py-0.5 rounded-full`}>
                          {tag}
                        </Tag>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-[#18aead]">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="px-1 py-2 text-xs text-blue-300/70">No tags found</p>
            )}
          </div>

          {/* Add Tag Button */}
          <PrimaryButton
            type="button"
            onClick={() => setCreateTagOpen(true)}
            className="w-full"
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Tag
          </PrimaryButton>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              Cancel
            </button>
            <PrimaryButton type="button" onClick={handleConfirm}>
              Confirm
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <CreateTagPopup
        open={createTagOpen}
        accountId={accountId}
        onClose={() => setCreateTagOpen(false)}
        onSuccess={handleCreateTag}
      />
    </>
  );
}

