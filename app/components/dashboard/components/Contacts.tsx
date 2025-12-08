import { useMemo, useState, useRef, useEffect, ReactNode } from "react";
import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { PrimaryButton } from "../../PrimaryButton";
import { PrimaryInput } from "../../PrimaryInput";
import { PrimaryModal } from "../../PrimaryModal";
import { Contact, contactStatusOptions } from "../types";

type ActivityFilterValue = "all" | "7" | "30" | "stale30";

type ContactFilters = {
  owner: string;
  status: string;
  createdFrom: string;
  createdTo: string;
  activity: ActivityFilterValue;
};

type NewContactFormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: Contact["status"];
};

const activityFilters: { label: string; value: ActivityFilterValue }[] = [
  { label: "Any activity", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "No activity 30+ days", value: "stale30" },
];

const defaultFilters: ContactFilters = {
  owner: "all",
  status: "all",
  createdFrom: "",
  createdTo: "",
  activity: "all",
};

type FilterPanel = "owner" | "created" | "activity" | "status";

const statusColors: Record<Contact["status"], string> = {
  New: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  "In Progress": "border-amber-500/40 bg-amber-500/10 text-amber-200",
  Customer: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  Churned: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const SortIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
  </svg>
);

interface ContactsProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, "id">) => Promise<void> | void;
  onUpdateContact?: (contact: Contact) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string;
  defaultOwner?: string;
  accountId?: string;
}

const createInitialContact = (): NewContactFormState => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  status: contactStatusOptions[0] ?? "New",
});

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

export function Contacts({
  contacts,
  onAddContact,
  onUpdateContact,
  isLoading = false,
  errorMessage,
  defaultOwner = "Unassigned",
  accountId,
}: ContactsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [newContact, setNewContact] = useState<NewContactFormState>(createInitialContact);
  const [editContact, setEditContact] = useState<NewContactFormState>(createInitialContact);
  const [filters, setFilters] = useState<ContactFilters>(defaultFilters);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [activeFilterPanel, setActiveFilterPanel] = useState<FilterPanel | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const inlineFiltersRef = useRef<HTMLDivElement>(null);

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    contacts.forEach((contact) => {
      if (contact.owner?.trim()) {
        owners.add(contact.owner.trim());
      }
    });
    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const normalizeDate = (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return contacts.filter((contact) => {
      const matchesSearch =
        !normalizedSearch ||
        contact.name.toLowerCase().includes(normalizedSearch) ||
        contact.email.toLowerCase().includes(normalizedSearch) ||
        (contact.company ?? "").toLowerCase().includes(normalizedSearch) ||
        (contact.owner ?? "Unassigned").toLowerCase().includes(normalizedSearch);

      const ownerValue = contact.owner?.trim() || "Unassigned";
      const matchesOwner =
        filters.owner === "all" ||
        (filters.owner === "unassigned" ? ownerValue === "Unassigned" : ownerValue === filters.owner);

      const matchesStatus = filters.status === "all" || contact.status === filters.status;

      const createdAtDate = normalizeDate(contact.createdAt);
      const createdFromDate = normalizeDate(filters.createdFrom);
      const createdToDate = normalizeDate(filters.createdTo);

      const matchesCreatedFrom = !createdFromDate || (createdAtDate && createdAtDate >= createdFromDate);
      const matchesCreatedTo = !createdToDate || (createdAtDate && createdAtDate <= createdToDate);

      const lastActivityDate = normalizeDate(contact.lastActivity);
      const lastActivityTime = lastActivityDate?.getTime() ?? 0;

      const matchesActivity =
        filters.activity === "all" ||
        (filters.activity === "7" && lastActivityDate && lastActivityTime >= sevenDaysAgo) ||
        (filters.activity === "30" && lastActivityDate && lastActivityTime >= thirtyDaysAgo) ||
        (filters.activity === "stale30" && (!lastActivityDate || lastActivityTime < thirtyDaysAgo));

      return (
        matchesSearch && matchesOwner && matchesStatus && matchesCreatedFrom && matchesCreatedTo && matchesActivity
      );
    });
  }, [contacts, filters, searchTerm]);

  const hasSelectedContacts = selectedContacts.size > 0;
  const allSelected = filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length;
  const someSelected = selectedContacts.size > 0 && selectedContacts.size < filteredContacts.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    setSelectedContacts((prev) => {
      const next = new Set<string>();
      contacts.forEach((contact) => {
        if (prev.has(contact.id)) {
          next.add(contact.id);
        }
      });
      return next;
    });
  }, [contacts]);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
      setMoreDropdownOpen(false);
    }
    if (inlineFiltersRef.current && !inlineFiltersRef.current.contains(event.target as Node)) {
      setActiveFilterPanel(null);
    }
  }

  if (moreDropdownOpen || activeFilterPanel) {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }
}, [moreDropdownOpen, activeFilterPanel]);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

const handleAddContact = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!newContact.name.trim() || !newContact.email.trim()) return;

  const timestamp = new Date().toISOString();
  const payload: Omit<Contact, "id"> = {
    name: newContact.name.trim(),
    email: newContact.email.trim(),
    phone: newContact.phone.trim(),
    company: newContact.company.trim(),
    owner: defaultOwner?.trim() || "Unassigned",
    createdAt: timestamp,
    lastActivity: timestamp,
    status: newContact.status,
  };

  try {
    setIsSubmittingContact(true);
    setFormError(null);
    await onAddContact(payload);
    setNewContact(createInitialContact());
    setIsModalOpen(false);
  } catch (error) {
    console.error("Failed to add contact", error);
    setFormError("Failed to save contact. Please try again.");
  } finally {
    setIsSubmittingContact(false);
  }
};

const handleEditContact = (contact: Contact) => {
  setEditingContact(contact);
  setEditContact({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    status: contact.status,
  });
  setIsEditModalOpen(true);
};

const handleUpdateContact = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!editingContact || !editContact.name.trim() || !editContact.email.trim()) return;

  const updatedContact: Contact = {
    ...editingContact,
    name: editContact.name.trim(),
    email: editContact.email.trim(),
    phone: editContact.phone.trim(),
    company: editContact.company.trim(),
    status: editContact.status,
    lastActivity: new Date().toISOString(),
  };

  try {
    setIsUpdatingContact(true);
    setFormError(null);

    if (onUpdateContact) {
      await onUpdateContact(updatedContact);
    } else if (accountId) {
      // Fallback to direct API call if onUpdateContact is not provided
      const response = await fetch(`/api/accounts/${accountId}/contacts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingContact.id,
          name: updatedContact.name,
          email: updatedContact.email,
          phone: updatedContact.phone,
          company: updatedContact.company,
          status: updatedContact.status,
          owner: updatedContact.owner,
          lastActivity: updatedContact.lastActivity,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update contact");
      }
    }

    setEditingContact(null);
    setEditContact(createInitialContact());
    setIsEditModalOpen(false);
  } catch (error) {
    console.error("Failed to update contact", error);
    setFormError("Failed to save changes. Please try again.");
  } finally {
    setIsUpdatingContact(false);
  }
};

  const handleDeleteSelected = () => {
    console.log("Delete contacts:", Array.from(selectedContacts));
    setSelectedContacts(new Set());
    setMoreDropdownOpen(false);
  };

  const handleEditSelected = () => {
    console.log("Edit contacts:", Array.from(selectedContacts));
    setMoreDropdownOpen(false);
  };

const handleFilterChange = (key: keyof ContactFilters, value: string) => {
  setFilters((prev) => ({ ...prev, [key]: value }));
};

const handleResetFilters = () => {
  setFilters(defaultFilters);
};

const toggleFilterPanel = (panel: FilterPanel) => {
  setActiveFilterPanel((prev) => (prev === panel ? null : panel));
};

  function renderFilterButton(
    panel: FilterPanel,
    label: string,
    icon: ReactNode,
    content: ReactNode,
    isActive: boolean,
    onClose: () => void,
  ) {
    return (
      <div key={panel} className="relative">
        <button
          type="button"
          onClick={() => toggleFilterPanel(panel)}
          className={`inline-flex items-center gap-2 rounded-[20px] border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            isActive || activeFilterPanel === panel
              ? "border-[#2b9bff] bg-[#142044] text-white"
              : "border-[#1a2446] bg-[#0e1629] text-blue-200 hover:bg-[#121c3d] hover:text-white"
          }`}
        >
          {icon}
          {label}
        </button>
        {activeFilterPanel === panel && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[12px] border border-[#1a2446] bg-[#050a1b] p-4 text-blue-100 shadow-2xl">
            {content}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-3 py-1 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Contacts</h2>
        <div className="flex items-center gap-2">
          
        <PrimaryButton
          onClick={() => setIsModalOpen(true)}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add Contact
        </PrimaryButton>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {hasSelectedContacts ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#1a2446] bg-[#0c142a] px-4 py-[6px]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-blue-200">
                {selectedContacts.size} contact{selectedContacts.size !== 1 ? "s" : ""} selected
              </span>
              {selectedContacts.size < filteredContacts.length && (
                <button onClick={handleSelectAll} className="text-sm text-[#7ed0ff] transition-colors hover:text-white">
                  Select all {filteredContacts.length} contacts
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={moreDropdownRef}>
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className="inline-flex items-center gap-1.5 rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3 py-1.5 text-xs text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  More
                  <svg
                    className={`h-3 w-3 transition-transform ${moreDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {moreDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-[20px] border border-[#1a2446] bg-[#0e1629] shadow-lg">
                    <button
                      onClick={handleEditSelected}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-blue-200 transition-colors hover:bg-[#121c3d]"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-400 transition-colors hover:bg-[#121c3d]"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#2b9bff] focus-within:ring-1 focus-within:ring-[#2b9bff] lg:max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
              <input
                type="text"
                placeholder="Search contacts"
                className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div
              className="flex w-full flex-wrap items-center gap-2.5 lg:flex-1 lg:justify-end"
              ref={inlineFiltersRef}
            >
              {renderFilterButton(
                "owner",
                "Contact Owner",
                <UserCircleIcon className="h-4 w-4" />,
                <select
                  className="mt-2 w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-xs text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                  value={filters.owner}
                  onChange={(event) => handleFilterChange("owner", event.target.value)}
                >
                  <option value="all">All owners</option>
                  <option value="unassigned">Unassigned</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>,
                filters.owner !== "all",
                () => setActiveFilterPanel(null),
              )}
              {renderFilterButton(
                "created",
                "Created Date",
                <CalendarDaysIcon className="h-4 w-4" />,
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">From</p>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-xs text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                      value={filters.createdFrom}
                      onChange={(event) => handleFilterChange("createdFrom", event.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-300/70">To</p>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-xs text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                      value={filters.createdTo}
                      onChange={(event) => handleFilterChange("createdTo", event.target.value)}
                    />
                  </div>
                </div>,
                Boolean(filters.createdFrom || filters.createdTo),
                () => setActiveFilterPanel(null),
              )}
              {renderFilterButton(
                "activity",
                "Activity",
                <ChartBarIcon className="h-4 w-4" />,
                <div className="grid gap-2 sm:grid-cols-2">
                  {activityFilters.map((activity) => (
                    <label
                      key={activity.value}
                      className={`cursor-pointer rounded-[18px] border px-3 py-2 text-xs font-medium transition ${
                        filters.activity === activity.value
                          ? "border-[#2b9bff] bg-[#142044] text-white"
                          : "border-[#1a2446] bg-[#0e1629] text-blue-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="activity-filter"
                        value={activity.value}
                        className="sr-only"
                        checked={filters.activity === activity.value}
                        onChange={(event) => handleFilterChange("activity", event.target.value)}
                      />
                      {activity.label}
                    </label>
                  ))}
                </div>,
                filters.activity !== "all",
                () => setActiveFilterPanel(null),
              )}
              {renderFilterButton(
                "status",
                "Status",
                <CheckCircleIcon className="h-4 w-4" />,
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange("status", "all")}
                    className={`rounded-[18px] border px-3 py-1.5 text-xs font-medium transition ${
                      filters.status === "all"
                        ? "border-[#2b9bff] bg-[#142044] text-white"
                        : "border-[#1a2446] bg-[#0e1629] text-blue-100"
                    }`}
                  >
                    All
                  </button>
                  {contactStatusOptions.map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => handleFilterChange("status", status)}
                      className={`rounded-[18px] border px-3 py-1.5 text-xs font-medium transition ${
                        filters.status === status
                          ? "border-[#2b9bff] bg-[#142044] text-white"
                          : "border-[#1a2446] bg-[#0e1629] text-blue-100"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>,
                filters.status !== "all",
                () => setActiveFilterPanel(null),
              )}
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setActiveFilterPanel(null);
                }}
                className="inline-flex items-center gap-1 rounded-[20px] border border-transparent px-3 py-1.5 text-xs font-medium text-[#7ed0ff] transition-colors hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[5px] border border-[#1a2446] bg-[#0c142a]">
        <table className="min-w-full divide-y divide-[#1a2446]">
          <thead className="bg-[#0e1629]">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input
                  type="checkbox"
                  ref={selectAllCheckboxRef}
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#2b9bff] focus:ring-[#2b9bff]"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Name</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Email</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Phone</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                </div>
              </th>
              {/* Owner, Created, and Activity columns are intentionally hidden from the table UI
                  but are still available for filtering via the controls above. */}
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Status</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                  <span className="inline-flex items-center justify-center gap-2 text-blue-200">
                    <SpinnerIcon className="h-5 w-5 text-blue-300" />
                    Loading contacts…
                  </span>
                </td>
              </tr>
            ) : filteredContacts.length ? (
              filteredContacts.map((contact) => {
                const isSelected = selectedContacts.has(contact.id);
                return (
                  <tr
                    key={contact.id}
                    className={`cursor-pointer transition-colors hover:bg-[#121c3d] ${isSelected ? "bg-[#121c3d]/50" : ""}`}
                    onClick={() => handleEditContact(contact)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectContact(contact.id)}
                        className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#2b9bff] focus:ring-[#2b9bff]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] text-xs font-semibold text-white">
                            {contact.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{contact.name || "--"}</div>
                          <div className="text-xs text-blue-300">{contact.company || "No company"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{contact.email || "--"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{contact.phone || "--"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[contact.status] ?? "border-[#1a2446] text-blue-100"
                        }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <ChevronRightIcon className="h-5 w-5 text-blue-300/60" />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                  {searchTerm ? `No contacts found for "${searchTerm}".` : "No contacts yet. Add one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PrimaryModal
        open={isModalOpen}
        title="Add Contact"
        description="Capture the basics, ownership, and lifecycle metadata."
        onClose={() => {
          setIsModalOpen(false);
          setNewContact(createInitialContact());
        }}
        widthClassName="max-w-3xl"
      >
        <form onSubmit={handleAddContact} className="space-y-6">
              {formError && (
                <div className="rounded-[10px] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-blue-200">
                    Full Name
                  </label>
                  <PrimaryInput
                    id="contact-name"
                    type="text"
                    required
                    value={newContact.name}
                    onChange={(event) => setNewContact((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-blue-200">
                    Email
                  </label>
                  <PrimaryInput
                    id="contact-email"
                    type="email"
                    required
                    value={newContact.email}
                    onChange={(event) => setNewContact((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-blue-200">
                    Phone
                  </label>
                  <PrimaryInput
                    id="contact-phone"
                    type="tel"
                    value={newContact.phone}
                    onChange={(event) => setNewContact((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="block text-sm font-medium text-blue-200">
                    Company
                  </label>
                  <PrimaryInput
                    id="contact-company"
                    type="text"
                    value={newContact.company}
                    onChange={(event) => setNewContact((prev) => ({ ...prev, company: event.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-status" className="block text-sm font-medium text-blue-200">
                  Status
                </label>
                <select
                  id="contact-status"
                  className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                  value={newContact.status}
                  onChange={(event) =>
                    setNewContact((prev) => ({ ...prev, status: event.target.value as Contact["status"] }))
                  }
                >
                  {contactStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewContact(createInitialContact());
                  }}
                  className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={isSubmittingContact}>
                  {isSubmittingContact ? (
                    <span className="flex items-center gap-2">
                      <SpinnerIcon className="h-4 w-4 text-[#031226]" />
                      Saving…
                    </span>
                  ) : (
                    "Save Contact"
                  )}
                </PrimaryButton>
              </div>
            </form>
      </PrimaryModal>

      <PrimaryModal
        open={isEditModalOpen}
        title="Edit Contact"
        description="Update contact information."
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContact(null);
          setEditContact(createInitialContact());
          setFormError(null);
        }}
        widthClassName="max-w-3xl"
      >
        <form onSubmit={handleUpdateContact} className="space-y-6">
          {formError && (
            <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-contact-name" className="block text-sm font-medium text-blue-200">
                Full Name
              </label>
              <PrimaryInput
                id="edit-contact-name"
                type="text"
                required
                value={editContact.name}
                onChange={(event) => setEditContact((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="edit-contact-email" className="block text-sm font-medium text-blue-200">
                Email
              </label>
              <PrimaryInput
                id="edit-contact-email"
                type="email"
                required
                value={editContact.email}
                onChange={(event) => setEditContact((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="edit-contact-phone" className="block text-sm font-medium text-blue-200">
                Phone
              </label>
              <PrimaryInput
                id="edit-contact-phone"
                type="tel"
                value={editContact.phone}
                onChange={(event) => setEditContact((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="edit-contact-company" className="block text-sm font-medium text-blue-200">
                Company
              </label>
              <PrimaryInput
                id="edit-contact-company"
                type="text"
                value={editContact.company}
                onChange={(event) => setEditContact((prev) => ({ ...prev, company: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-contact-status" className="block text-sm font-medium text-blue-200">
              Status
            </label>
            <select
              id="edit-contact-status"
              className="mt-2 w-full rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
              value={editContact.status}
              onChange={(event) =>
                setEditContact((prev) => ({ ...prev, status: event.target.value as Contact["status"] }))
              }
            >
              {contactStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingContact(null);
                setEditContact(createInitialContact());
                setFormError(null);
              }}
              className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={isUpdatingContact}>
              {isUpdatingContact ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="h-4 w-4 text-[#031226]" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
                  )}
                </PrimaryButton>
              </div>
            </form>
      </PrimaryModal>
    </div>
  );
}
 
 
