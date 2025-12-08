import { useMemo, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { getCompanies, addCompany as addCompanyToStorage } from "../../../../app/utils/storage";
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
} from "@heroicons/react/24/outline";
import { PrimaryButton } from "../../PrimaryButton";
import { PrimaryInput } from "../../PrimaryInput";
import { PrimaryModal } from "../../PrimaryModal";
import { Company, companyStatusOptions } from "../types";

type ActivityFilterValue = "all" | "7" | "30" | "stale30";

type CompanyFilters = {
  owner: string;
  status: string;
  createdFrom: string;
  createdTo: string;
  activity: ActivityFilterValue;
};

type NewCompanyFormState = {
  name: string;
  domain: string;
  industry: string;
  size: string;
  status: Company["status"];
};

const activityFilters: { label: string; value: ActivityFilterValue }[] = [
  { label: "Any activity", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "No activity 30+ days", value: "stale30" },
];

const defaultFilters: CompanyFilters = {
  owner: "all",
  status: "all",
  createdFrom: "",
  createdTo: "",
  activity: "all",
};

type FilterPanel = "owner" | "created" | "activity" | "status";

const statusColors: Record<Company["status"], string> = {
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

interface CompaniesProps {
  companies: Company[];
  onAddCompany: (company: Omit<Company, "id">) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string;
  defaultOwner?: string;
}

const createInitialCompany = (): NewCompanyFormState => ({
  name: "",
  domain: "",
  industry: "",
  size: "",
  status: companyStatusOptions[0] ?? "New",
});

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

export function Companies({
  isLoading: propIsLoading = false,
  errorMessage: propErrorMessage,
  defaultOwner = "Unassigned",
}: Partial<CompaniesProps> = {}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [errorMessage, setErrorMessage] = useState(propErrorMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Load companies from local storage on component mount
  useEffect(() => {
    const loadCompanies = () => {
      try {
        setIsLoading(true);
        const storedCompanies = getCompanies();
        setCompanies(storedCompanies);
      } catch (error) {
        console.error('Failed to load companies:', error);
        setErrorMessage('Failed to load companies. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCompanies();
  }, []);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [newCompany, setNewCompany] = useState<NewCompanyFormState>(createInitialCompany);
  const [filters, setFilters] = useState<CompanyFilters>(defaultFilters);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [activeFilterPanel, setActiveFilterPanel] = useState<FilterPanel | null>(null);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const inlineFiltersRef = useRef<HTMLDivElement>(null);

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    companies.forEach((company) => {
      if (company.owner?.trim()) {
        owners.add(company.owner.trim());
      }
    });
    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const normalizeDate = (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return companies.filter((company) => {
      const matchesSearch =
        !normalizedSearch ||
        company.name.toLowerCase().includes(normalizedSearch) ||
        company.domain.toLowerCase().includes(normalizedSearch) ||
        company.industry.toLowerCase().includes(normalizedSearch) ||
        (company.owner ?? "Unassigned").toLowerCase().includes(normalizedSearch);

      const ownerValue = company.owner?.trim() || "Unassigned";
      const matchesOwner =
        filters.owner === "all" ||
        (filters.owner === "unassigned" ? ownerValue === "Unassigned" : ownerValue === filters.owner);

      const matchesStatus = filters.status === "all" || company.status === filters.status;

      const createdAtDate = normalizeDate(company.createdAt);
      const createdFromDate = normalizeDate(filters.createdFrom);
      const createdToDate = normalizeDate(filters.createdTo);

      const matchesCreatedFrom = !createdFromDate || (createdAtDate && createdAtDate >= createdFromDate);
      const matchesCreatedTo = !createdToDate || (createdAtDate && createdAtDate <= createdToDate);

      const lastActivityDate = normalizeDate(company.lastActivity);
      const lastActivityTime = lastActivityDate?.getTime() ?? 0;

      const matchesActivity =
        filters.activity === "all" ||
        (filters.activity === "7" && lastActivityDate && lastActivityTime >= sevenDaysAgo) ||
        (filters.activity === "30" && lastActivityDate && lastActivityTime >= thirtyDaysAgo) ||
        (filters.activity === "stale30" && (!lastActivityDate || lastActivityTime < thirtyDaysAgo));

      return matchesSearch && matchesOwner && matchesStatus && matchesCreatedFrom && matchesCreatedTo && matchesActivity;
    });
  }, [companies, filters, searchTerm]);

  const hasSelectedCompanies = selectedCompanies.size > 0;
  
  // Update the component's loading state based on both prop and local state
  const isLoadingState = isLoading || isSubmitting;
  const allSelected = filteredCompanies.length > 0 && selectedCompanies.size === filteredCompanies.length;
  const someSelected = selectedCompanies.size > 0 && selectedCompanies.size < filteredCompanies.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    setSelectedCompanies((prev) => {
      const next = new Set<string>();
      companies.forEach((company) => {
        if (prev.has(company.id)) {
          next.add(company.id);
        }
      });
      return next;
    });
  }, [companies]);

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
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  const handleSelectCompany = (companyId: string) => {
    const next = new Set(selectedCompanies);
    if (next.has(companyId)) {
      next.delete(companyId);
    } else {
      next.add(companyId);
    }
    setSelectedCompanies(next);
  };

  const handleAddCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCompany.name.trim()) return;

    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const payload = {
        name: newCompany.name.trim(),
        domain: newCompany.domain.trim() || "example.com",
        industry: newCompany.industry.trim() || "General",
        size: newCompany.size || "1-10",
        status: (newCompany.status as Company['status']) || "New",
        owner: defaultOwner,
        lastActivity: now,
      };
      
      const addedCompany = await addCompanyToStorage(payload);
      setCompanies(prev => [...prev, addedCompany]);
      setNewCompany(createInitialCompany());
      setIsModalOpen(false);
      setFormError('');
    } catch (error) {
      console.error('Error adding company:', error);
      setFormError('Failed to add company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = () => {
    console.log("Delete companies:", Array.from(selectedCompanies));
    setSelectedCompanies(new Set());
    setMoreDropdownOpen(false);
  };

  const handleEditSelected = () => {
    console.log("Edit companies:", Array.from(selectedCompanies));
    setMoreDropdownOpen(false);
  };

  const handleFilterChange = (key: keyof CompanyFilters, value: string) => {
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
          className={`inline-flex items-center gap-2 rounded-[20px] border px-3.5 py-1.5 text-xs transition-colors ${
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
                className="rounded-[8px] border border-[#1a2446] px-3 py-1 text-xs text-blue-200 hover:bg-[#121c3d]"
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
        <h2 className="text-2xl font-bold text-white">Companies</h2>
        <PrimaryButton
          onClick={() => setIsModalOpen(true)}
          icon={isSubmitting ? <SpinnerIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Company'}
        </PrimaryButton>
      </div>

      {errorMessage && (
        <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {hasSelectedCompanies ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#1a2446] bg-[#0c142a] px-4 py-[6px]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-blue-200">
                {selectedCompanies.size} company{selectedCompanies.size !== 1 ? "ies" : ""} selected
              </span>
              {selectedCompanies.size < filteredCompanies.length && (
                <button onClick={handleSelectAll} className="text-sm text-[#7ed0ff] transition-colors hover:text-white">
                  Select all {filteredCompanies.length} companies
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
                placeholder="Search companies"
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
                "Account Owner",
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
                  {companyStatusOptions.map((status) => (
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
                className="inline-flex items-center gap-1 rounded-[20px] border border-transparent px-3 py-1.5 text-xs text-[#7ed0ff] transition hover:text-white"
              >
                Clear filters
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
                  <button className="text-blue-300/60 transition hover:text-blue-300">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Domain</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                  <button className="text-blue-300/60 transition hover:text-blue-300">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Industry</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                  <button className="text-blue-300/60 transition hover:text-blue-300">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
            {isLoadingState ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-blue-300">
                  <span className="inline-flex items-center justify-center gap-2 text-blue-200">
                    <SpinnerIcon className="h-5 w-5 text-blue-300" />
                    Loading companies…
                  </span>
                </td>
              </tr>
            ) : filteredCompanies.length ? (
              filteredCompanies.map((company) => {
                const isSelected = selectedCompanies.has(company.id);
                return (
                  <tr
                    key={company.id}
                    className={`transition-colors hover:bg-[#121c3d] ${isSelected ? "bg-[#121c3d]/50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectCompany(company.id)}
                        className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#2b9bff] focus:ring-[#2b9bff]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] text-xs font-semibold text-white">
                            {company.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{company.name || "--"}</div>
                          <div className="text-xs text-blue-300">{company.domain || "No domain"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{company.industry || "--"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{company.size || "--"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[company.status] ?? "border-[#1a2446] text-blue-100"
                        }`}
                      >
                        {company.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-blue-300">
                  {searchTerm ? `No companies found for "${searchTerm}".` : "No companies yet. Add one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PrimaryModal
        open={isModalOpen}
        title="Add Company"
        description="Capture core account details for your company database."
        onClose={() => {
          setIsModalOpen(false);
          setNewCompany(createInitialCompany());
        }}
        widthClassName="max-w-3xl"
      >
        <form onSubmit={handleAddCompany} className="space-y-6">
              {formError && (
                <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-blue-200">
                    Company Name
                  </label>
                  <PrimaryInput
                    id="company-name"
                    type="text"
                    required
                    value={newCompany.name}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="company-domain" className="block text-sm font-medium text-blue-200">
                    Domain
                  </label>
                  <PrimaryInput
                    id="company-domain"
                    type="text"
                    value={newCompany.domain}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, domain: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="company-industry" className="block text-sm font-medium text-blue-200">
                    Industry
                  </label>
                  <PrimaryInput
                    id="company-industry"
                    type="text"
                    value={newCompany.industry}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, industry: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="company-size" className="block text-sm font-medium text-blue-200">
                    Company Size
                  </label>
                  <PrimaryInput
                    id="company-size"
                    type="text"
                    value={newCompany.size}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, size: event.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company-status" className="block text-sm font-medium text-blue-200">
                  Status
                </label>
                <select
                  id="company-status"
                  className="mt-2 w-full rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                  value={newCompany.status}
                  onChange={(event) =>
                    setNewCompany((prev) => ({ ...prev, status: event.target.value as Company["status"] }))
                  }
                >
                  {companyStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewCompany(createInitialCompany());
                  }}
                  className="rounded-[4px] border border-[#1a2446] px-4 py-2 text-xs font-medium text-blue-200 transition hover:bg-[#121c3d]"
                >
                  Cancel
                </button>
                {isSubmittingCompany && (
                  <SpinnerIcon className="h-4 w-4 text-blue-300" />
                )}
                <PrimaryButton type="submit" disabled={isSubmittingCompany}>
                  {isSubmittingCompany ? (
                    <span className="flex items-center gap-2">
                      Saving…
                    </span>
                  ) : (
                    "Save Company"
                  )}
                </PrimaryButton>
              </div>
            </form>
      </PrimaryModal>
    </div>
  );
}


