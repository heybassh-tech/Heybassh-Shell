import { useMemo, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { getDeals, addDeal as addDealToStorage, getCompanies } from "../../../../app/utils/storage";
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
import type { Deal } from "../types";
import { dealStageOptions, dealStatusOptions } from "../types";

type ActivityFilterValue = "all" | "7" | "30" | "stale30";

type DealFilters = {
  owner: string;
  status: string;
  stage: string;
  createdFrom: string;
  createdTo: string;
  activity: ActivityFilterValue;
};

type NewDealFormState = {
  name: string;
  company: string;
  amount: number | string;
  stage: Deal["stage"];
  status: Deal["status"];
  closeDate?: string;
};

const activityFilters: { label: string; value: ActivityFilterValue }[] = [
  { label: "Any activity", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "No activity 30+ days", value: "stale30" },
];

const defaultFilters: DealFilters = {
  owner: "all",
  status: "all",
  stage: "all",
  createdFrom: "",
  createdTo: "",
  activity: "all",
};

type FilterPanel = "owner" | "created" | "activity" | "status" | "stage";

const statusColors: Record<Deal["status"], string> = {
  Open: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  Won: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  Lost: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const stageColors: Record<Deal["stage"], string> = {
  New: "bg-slate-500/15 text-slate-200 border-slate-500/40",
  Qualified: "bg-sky-500/15 text-sky-200 border-sky-500/40",
  Proposal: "bg-indigo-500/15 text-indigo-200 border-indigo-500/40",
  Negotiation: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  Won: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  Lost: "bg-rose-500/15 text-rose-200 border-rose-500/40",
};

const SortIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
  </svg>
);

interface DealsProps {
  deals: Deal[];
  onAddDeal: (deal: Omit<Deal, "id">) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string;
  defaultOwner?: string;
}

const createInitialDeal = (): NewDealFormState => ({
  name: "",
  company: "",
  amount: "",
  stage: dealStageOptions[0] ?? "New",
  status: "Open",
});

const SpinnerIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

export function Deals({
  isLoading: propIsLoading = false,
  errorMessage: propErrorMessage,
  defaultOwner = "Unassigned",
}: Partial<DealsProps> = {}) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [errorMessage, setErrorMessage] = useState(propErrorMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Load deals and companies from local storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [storedDeals, storedCompanies] = await Promise.all([
          getDeals(),
          getCompanies()
        ]);
        setDeals(storedDeals);
        setCompanies(storedCompanies.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Failed to load data:', error);
        setErrorMessage('Failed to load deals. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [newDeal, setNewDeal] = useState<NewDealFormState>(createInitialDeal);
  const [filters, setFilters] = useState<DealFilters>(defaultFilters);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [activeFilterPanel, setActiveFilterPanel] = useState<FilterPanel | null>(null);
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const inlineFiltersRef = useRef<HTMLDivElement>(null);

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    deals.forEach((deal) => {
      if (deal.owner?.trim()) {
        owners.add(deal.owner.trim());
      }
    });
    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [deals]);

  const normalizeDate = (value: string) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return deals.filter((deal) => {
      const matchesSearch =
        !normalizedSearch ||
        deal.name.toLowerCase().includes(normalizedSearch) ||
        deal.company.toLowerCase().includes(normalizedSearch) ||
        (deal.owner ?? "Unassigned").toLowerCase().includes(normalizedSearch);

      const ownerValue = deal.owner?.trim() || "Unassigned";
      const matchesOwner =
        filters.owner === "all" ||
        (filters.owner === "unassigned" ? ownerValue === "Unassigned" : ownerValue === filters.owner);

      const matchesStatus = filters.status === "all" || deal.status === filters.status;
      const matchesStage = filters.stage === "all" || deal.stage === filters.stage;

      const createdAtDate = normalizeDate(deal.createdAt);
      const createdFromDate = normalizeDate(filters.createdFrom);
      const createdToDate = normalizeDate(filters.createdTo);

      const matchesCreatedFrom = !createdFromDate || (createdAtDate && createdAtDate >= createdFromDate);
      const matchesCreatedTo = !createdToDate || (createdAtDate && createdAtDate <= createdToDate);

      const lastActivityDate = normalizeDate(deal.lastActivity);
      const lastActivityTime = lastActivityDate?.getTime() ?? 0;

      const matchesActivity =
        filters.activity === "all" ||
        (filters.activity === "7" && lastActivityDate && lastActivityTime >= sevenDaysAgo) ||
        (filters.activity === "30" && lastActivityDate && lastActivityTime >= thirtyDaysAgo) ||
        (filters.activity === "stale30" && (!lastActivityDate || lastActivityTime < thirtyDaysAgo));

      return (
        matchesSearch &&
        matchesOwner &&
        matchesStatus &&
        matchesStage &&
        matchesCreatedFrom &&
        matchesCreatedTo &&
        matchesActivity
      );
    });
  }, [deals, filters, searchTerm]);

  const hasSelectedDeals = selectedDeals.size > 0;
  
  // Update the component's loading state based on both prop and local state
  const isLoadingState = isLoading || isSubmitting;
  const allSelected = filteredDeals.length > 0 && selectedDeals.size === filteredDeals.length;
  const someSelected = selectedDeals.size > 0 && selectedDeals.size < filteredDeals.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    setSelectedDeals((prev) => {
      const next = new Set<string>();
      deals.forEach((deal) => {
        if (prev.has(deal.id)) {
          next.add(deal.id);
        }
      });
      return next;
    });
  }, [deals]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
      if (inlineFiltersRef.current && !inlineFiltersRef.current.contains(event.target as Node)) {
        setActiveFilterPanel(null);
      }
    }

    // Moved to useEffect
  }, [moreDropdownOpen, activeFilterPanel]);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map((d) => d.id)));
    }
  };

  const handleSelectDeal = (dealId: string) => {
    const next = new Set(selectedDeals);
    if (next.has(dealId)) {
      next.delete(dealId);
    } else {
      next.add(dealId);
    }
    setSelectedDeals(next);
  };

  const handleAddDeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newDeal.name.trim()) return;

    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const payload = {
        name: newDeal.name.trim(),
        company: newDeal.company || companies[0]?.name || "",
        amount: Number(newDeal.amount) || 0,
        stage: (newDeal.stage as Deal['stage']) || "New",
        status: (newDeal.status as Deal['status']) || "Open",
        owner: defaultOwner,
        closeDate: newDeal.closeDate || new Date().toISOString().split('T')[0],
        lastActivity: now,
      };
      
      const addedDeal = await addDealToStorage(payload);
      setDeals(prev => [...prev, addedDeal]);
      setNewDeal(createInitialDeal());
      setIsModalOpen(false);
      setFormError('');
    } catch (error) {
      console.error('Error adding deal:', error);
      setFormError('Failed to add deal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = () => {
    console.log("Delete deals:", Array.from(selectedDeals));
    setSelectedDeals(new Set());
    setMoreDropdownOpen(false);
  };

  const handleEditSelected = () => {
    console.log("Edit deals:", Array.from(selectedDeals));
    setMoreDropdownOpen(false);
  };

  const handleFilterChange = (key: keyof DealFilters, value: string) => {
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
          className={`inline-flex items-center gap-2 rounded-[20px] border px-3 py-1.5 text-xs transition-colors ${
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) {
      setMoreDropdownOpen(false);
    }
    if (activeFilterPanel) {
      setActiveFilterPanel(null);
    }
  };

  useEffect(() => {
    if (moreDropdownOpen || activeFilterPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreDropdownOpen, activeFilterPanel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Deals</h2>
        <PrimaryButton
          onClick={() => setIsModalOpen(true)}
          icon={isSubmitting ? <SpinnerIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Deal'}
        </PrimaryButton>
      </div>

      {errorMessage && (
        <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {hasSelectedDeals ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-[6px]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-blue-200">
                {selectedDeals.size} deal{selectedDeals.size !== 1 ? "s" : ""} selected
              </span>
              {selectedDeals.size < filteredDeals.length && (
                <button onClick={handleSelectAll} className="text-sm text-[#7ed0ff] transition-colors hover:text-white">
                  Select all {filteredDeals.length} deals
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
            <div className="relative flex w-full items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#2b9bff] focus-within:ring-1 focus-within:ring-[#2b9bff] lg:max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
              <input
                type="text"
                placeholder="Search deals"
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
                "Deal Owner",
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
                "stage",
                "Stage",
                <ChartBarIcon className="h-4 w-4" />,
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange("stage", "all")}
                    className={`rounded-[18px] border px-3 py-1.5 text-xs font-medium transition ${
                      filters.stage === "all"
                        ? "border-[#2b9bff] bg-[#142044] text-white"
                        : "border-[#1a2446] bg-[#0e1629] text-blue-100"
                    }`}
                  >
                    All
                  </button>
                  {dealStageOptions.map((stage) => (
                    <button
                      type="button"
                      key={stage}
                      onClick={() => handleFilterChange("stage", stage)}
                      className={`rounded-[18px] border px-3 py-1.5 text-xs font-medium transition ${
                        filters.stage === stage
                          ? "border-[#2b9bff] bg-[#142044] text-white"
                          : "border-[#1a2446] bg-[#0e1629] text-blue-100"
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>,
                filters.stage !== "all",
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
                  {dealStatusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
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
                () => setActiveFilterPanel(null)
              )}
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setActiveFilterPanel(null);
                }}
                className="ml-auto inline-flex items-center gap-1 rounded-[20px] border border-transparent px-3 py-1.5 text-xs text-[#7ed0ff] transition hover:text-white"
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
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Deal</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                  <button className="text-blue-300/60 transition hover:text-blue-300">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Company</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                  <button className="text-blue-300/60 transition hover:text-blue-300">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Amount</span>
                  <SortIcon className="h-4 w-4 text-blue-300/60" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Stage</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Status</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
            {isLoadingState ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                  <span className="inline-flex items-center justify-center gap-2 text-blue-200">
                    <SpinnerIcon className="h-5 w-5 text-blue-300" />
                    Loading deals…
                  </span>
                </td>
              </tr>
            ) : filteredDeals.length ? (
              filteredDeals.map((deal) => {
                const isSelected = selectedDeals.has(deal.id);
                return (
                  <tr
                    key={deal.id}
                    className={`transition-colors hover:bg-[#121c3d] ${isSelected ? "bg-[#121c3d]/50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectDeal(deal.id)}
                        className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#2b9bff] focus:ring-[#2b9bff]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] text-xs font-semibold text-white">
                            {deal.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{deal.name || "--"}</div>
                          <div className="text-xs text-blue-300">{formatDate(deal.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{deal.company || "--"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{formatCurrency(deal.amount ?? 0)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stageColors[deal.stage]}`}
                      >
                        {deal.stage}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[deal.status] ?? "border-[#1a2446] text-blue-100"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                  {searchTerm ? `No deals found for "${searchTerm}".` : "No deals yet. Add one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PrimaryModal
        open={isModalOpen}
        title="Add Deal"
        description="Track pipeline value, stage, and outcomes across your deals."
        onClose={() => {
          setIsModalOpen(false);
          setNewDeal(createInitialDeal());
        }}
        widthClassName="max-w-3xl"
      >
        <form onSubmit={handleAddDeal} className="space-y-6">
              {formError && (
                <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="deal-name" className="block text-sm font-medium text-blue-200">
                    Deal name
                  </label>
                  <PrimaryInput
                    id="deal-name"
                    type="text"
                    required
                    value={newDeal.name}
                    onChange={(event) => setNewDeal((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="deal-company" className="block text-sm font-medium text-blue-200">
                    Company
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={newDeal.company}
                    onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                    className="mt-1 block w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-white shadow-sm focus:border-[#2b9bff] focus:outline-none focus:ring-1 focus:ring-[#2b9bff]"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="deal-amount" className="block text-sm font-medium text-blue-200">
                    Amount
                  </label>
                  <PrimaryInput
                    id="deal-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDeal.amount}
                    onChange={(event) => setNewDeal((prev) => ({ ...prev, amount: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="deal-stage" className="block text-sm font-medium text-blue-200">
                    Stage
                  </label>
                  <select
                    id="deal-stage"
                    className="mt-2 w-full rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                    value={newDeal.stage}
                    onChange={(event) =>
                      setNewDeal((prev) => ({ ...prev, stage: event.target.value as Deal["stage"] }))
                    }
                  >
                    {dealStageOptions.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="deal-status" className="block text-sm font-medium text-blue-200">
                  Status
                </label>
                <select
                  id="deal-status"
                  className="mt-2 w-full rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                  value={newDeal.status}
                  onChange={(event) =>
                    setNewDeal((prev) => ({ ...prev, status: event.target.value as Deal["status"] }))
                  }
                >
                  {dealStatusOptions.map((status) => (
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
                    setNewDeal(createInitialDeal());
                  }}
                  className="rounded-[4px] border border-[#1a2446] px-4 py-2 text-xs font-medium text-blue-200 transition hover:bg-[#121c3d]"
                >
                  Cancel
                </button>
                {isSubmittingDeal && (
                  <SpinnerIcon className="h-4 w-4 text-blue-300" />
                )}
                <PrimaryButton type="submit" disabled={isSubmittingDeal}>
                  {isSubmittingDeal ? (
                    <span className="flex items-center gap-2">
                      Saving…
                    </span>
                  ) : (
                    "Save Deal"
                  )}
                </PrimaryButton>
              </div>
            </form>
      </PrimaryModal>
    </div>
  );
}


