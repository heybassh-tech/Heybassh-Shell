import type { NavItem } from "./types";

export function findNavLabel(items: NavItem[], id: string): string {
  for (const item of items) {
    if (item.id === id) return item.label;
    if (item.children) {
      const child = item.children.find((child) => child.id === id);
      if (child) return child.label;
    }
  }
  return id.replace(/_/g, " ");
}

export function viewToPath(view: string): string | null {
  // Only route to actual pages that exist, otherwise return null to keep in place
  if (view === "overview") return "dashboard";
  if (view === "customers_contacts") return "contacts";
  if (view === "customers_companies") return "companies";
  if (view === "products_listing") return "products";
  if (view === "admin_overview") return "dashboard/admin";
  if (view === "admin_it") return "dashboard/admin/it";
  if (view === "admin_password_manager") return "dashboard/admin/password-manager";
  if (view === "hr_leave_request") return "hr/leave-request";
  if (view === "hr_users") return "hr/users";
  // For all other views, return null to just update state without routing
  return null;
}

// Helper: match query tokens against a full name so that first/last names can be searched independently
export function nameMatchesTokens(name: string, query: string) {
  const toTokens = (s: string) => s.toLowerCase().split(/[\s\-]+/).filter(Boolean);
  const nameTokens = toTokens(name);
  const queryTokens = toTokens(query);
  if (!queryTokens.length) return true;
  return queryTokens.every((qt) => nameTokens.some((nt) => nt.includes(qt)));
}

