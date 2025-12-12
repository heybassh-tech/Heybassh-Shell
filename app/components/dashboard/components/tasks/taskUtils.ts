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

export const getTagColor = (tagName: string): string => {
  try {
    const tagColors = JSON.parse(localStorage.getItem("tagColors") || "{}");
    const color = tagColors[tagName];
    
    if (color) {
      // Convert hex to Tailwind classes (simplified mapping)
      const colorMap: Record<string, string> = {
        "#3b82f6": "border-blue-500/40 bg-blue-500/10 text-blue-200",
        "#10b981": "border-green-500/40 bg-green-500/10 text-green-200",
        "#f59e0b": "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
        "#ef4444": "border-red-500/40 bg-red-500/10 text-red-200",
        "#8b5cf6": "border-purple-500/40 bg-purple-500/10 text-purple-200",
        "#ec4899": "border-pink-500/40 bg-pink-500/10 text-pink-200",
        "#06b6d4": "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
        "#f97316": "border-orange-500/40 bg-orange-500/10 text-orange-200",
      };
      return colorMap[color] || "border-[#1a2446] bg-[#121c3d] text-blue-200";
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Default color
  return "border-[#1a2446] bg-[#121c3d] text-blue-200";
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
