import { Task } from "../../types";

export const getPriorityColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "High":
      return "border-rose-500/40 bg-rose-500/10 text-rose-200";
    case "Normal":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "Low":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-[#1a2446] text-blue-100";
  }
};

export const getStatusColor = (status: Task["status"]) => {
  switch (status) {
    case "Todo":
      return "border-blue-500/40 bg-blue-500/10 text-blue-200";
    case "In Progress":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    case "Done":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-[#1a2446] text-blue-100";
  }
};

export const addTag = (
  tags: string[],
  input: string,
  setTags: (tags: string[]) => void,
  setInput: (input: string) => void
) => {
  const trimmed = input.trim();
  if (!trimmed) return;
  if (tags.includes(trimmed)) {
    setInput("");
    return;
  }
  setTags([...tags, trimmed]);
  setInput("");
};

export const removeTag = (
  tags: string[],
  tagToRemove: string,
  setTags: (tags: string[]) => void
) => {
  setTags(tags.filter((tag) => tag !== tagToRemove));
};
