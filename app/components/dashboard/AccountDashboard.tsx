"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

// Types and constants
import { 
  NavItem, 
  Contact, 
  Company,
  Deal,
  Product, 
  Task, 
  Employee, 
  LeaveRequest,
  defaultContacts,
  defaultCompanies,
  defaultDeals,
  defaultProducts,
  defaultEmployees,
  defaultLeaveRequests,
  priorityOptions,
  statusOptions,
  SEARCH_SELECTION_KEY
} from "./types";

// Icons
import { 
  navigation,
  MenuIcon,
  OverviewIcon,
  UsersIcon,
  BoxIcon,
  CardIcon,
  TasksIcon,
  ReportsIcon,
  AutomateIcon,
  PeopleIcon,
  ShieldIcon,
  BriefcaseIcon,
  BuildingIcon,
  LogoIcon,
  CreateIcon,
  InboxIcon,
  CallsIcon,
  MeetingsIcon,
  SettingsIcon,
  SearchIcon,
  AcademyIcon,
  MediaIcon,
  BellIcon,
  FrontOfficeIcon
} from "./icons";

// Components
import { Overview } from "./components/Overview";
import { Contacts } from "./components/Contacts";
import { Companies } from "./components/Companies";
import { Deals } from "./components/Deals";
import { Products } from "./components/Products";
import { Tasks } from "./components/Tasks";
import { HRPeople } from "./components/HRPeople";
import { Marketing } from "./components/Marketing";
import { Sales } from "./components/Sales";
import { Pill } from "./components/Pill";

// Placeholder components for other tabs
const Billing = () => <PlaceholderTab name="Billing" />;
const Reports = () => <PlaceholderTab name="Reports" />;
const Automate = () => <PlaceholderTab name="Automate" />;
const Admin = () => <PlaceholderTab name="Admin" />;
const Finance = () => <PlaceholderTab name="Finance" />;
const Executive = () => <PlaceholderTab name="Executive" />;

// Reusable placeholder component
const PlaceholderTab = ({ name }: { name: string }) => (
  <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-gray-700">
    <div className="text-center">
      <h3 className="text-lg font-medium text-white">{name} Dashboard</h3>
      <p className="mt-1 text-sm text-gray-400">This section is under development.</p>
    </div>
  </div>
);

// Helper functions
const findNavLabel = (items: NavItem[], id: string): string => {
  for (const item of items) {
    if (item.id === id) return item.label;
    if (item.children) {
      const child = item.children.find((child) => child.id === id);
      if (child) return child.label;
    }
  }
  return id.replace(/_/g, " ");
};

const viewToPath = (view: string): string | null => {
  if (view === "overview") return "dashboard";
  if (view === "customers_contacts") return "contacts";
  if (view === "customers_companies") return "companies";
  if (view === "products_listing") return "products";
  return null;
};

const nameMatchesTokens = (name: string, query: string) => {
  const toTokens = (s: string) => s.toLowerCase().split(/[\s\-]+/).filter(Boolean);
  const nameTokens = toTokens(name);
  const queryTokens = toTokens(query);
  if (!queryTokens.length) return true;
  return queryTokens.every((qt) => nameTokens.some((nt) => nt.includes(qt)));
};

export default function AccountDashboard({ 
  accountId, 
  initialViewKey = "overview" 
}: { 
  accountId: string; 
  initialViewKey?: string 
}) {
  const router = useRouter();
  const [view, setView] = useState(initialViewKey);
  const [companyName, setCompanyName] = useState<string>(accountId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State for different modules
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts);
  const [companies, setCompanies] = useState<Company[]>(defaultCompanies);
  const [deals, setDeals] = useState<Deal[]>(defaultDeals);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(defaultLeaveRequests);
  
  // Search and navigation state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPreviewOpen, setSearchPreviewOpen] = useState(false);
  const [searchPreviewSelection, setSearchPreviewSelection] = useState<string | null>(null);
  const [searchTransitioning, setSearchTransitioning] = useState(false);
  const searchLoaderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email || "User";
  const userImage = typeof session?.user?.image === "string" ? session.user.image : null;
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  // Handle view changes
  const handleViewChange = (newView: string) => {
    setView(newView);
    const path = viewToPath(newView);
    if (path) {
      router.push(`/app/${path}`);
    }
    setMenuOpen(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchPreviewOpen(!!query);
    
    if (searchLoaderTimeout.current) {
      clearTimeout(searchLoaderTimeout.current);
    }
    
    if (query) {
      setSearchTransitioning(true);
      searchLoaderTimeout.current = setTimeout(() => {
        setSearchTransitioning(false);
      }, 300);
    }
  };

  // Handle search selection
  const handleSearchSelect = (item: string) => {
    setSearchQuery(item);
    setSearchPreviewOpen(false);
    // Here you would typically navigate to the selected item
    console.log("Selected:", item);
  };

  // Handle sign out
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Handle adding a new contact
  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contact,
      id: `C-${Date.now()}`,
    };
    setContacts([...contacts, newContact]);
  };

  // Handle adding a new company (persisted to the database)
  const handleAddCompany = async (company: Omit<Company, "id">) => {
    const response = await fetch(`/api/accounts/${accountId}/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(company),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to create company");
    }

    const saved = (await response.json()) as Company;
    setCompanies((prev) => [...prev, saved]);
  };

  // Handle adding a new product
  const handleAddProduct = (product: Omit<Product, 'sku'>) => {
    const newProduct: Product = {
      ...product,
      sku: `P-${Date.now().toString().slice(-6)}`,
    };
    setProducts([...products, newProduct]);
  };

  // Handle adding a new task
  const handleAddTask = (task: Omit<Task, 'id' | 'tags'>) => {
    const newTask: Task = {
      ...task,
      id: `T-${Date.now()}`,
      tags: [],
    };
    setTasks([...tasks, newTask]);
  };

  // Handle adding a new employee
  const handleAddEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: `E-${Date.now()}`,
    };
    setEmployees([...employees, newEmployee]);
  };

  // Handle adding a new leave request
  const handleAddLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'status' | 'employeeName'>) => {
    const employee = employees.find(e => e.id === request.employeeId);
    const newLeaveRequest: LeaveRequest = {
      ...request,
      id: `L-${Date.now()}`,
      status: 'Pending',
      employeeName: employee?.name || 'Unknown',
    };
    setLeaveRequests([...leaveRequests, newLeaveRequest]);
  };

  // Handle updating leave request status
  const handleUpdateLeaveStatus = (id: string, status: LeaveRequest['status']) => {
    setLeaveRequests(leaveRequests.map(request => 
      request.id === id ? { ...request, status } : request
    ));
  };

  // Render the appropriate view based on the current view state
  const renderView = () => {
    switch (view) {
      case 'overview':
        return <Overview companyName={companyName} />;
      case 'customers_contacts':
        return (
          <Contacts
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={async (contact) => {
              const response = await fetch(`/api/accounts/${accountId}/contacts`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: contact.id,
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  company: contact.company,
                  status: contact.status,
                  owner: contact.owner,
                  lastActivity: contact.lastActivity,
                }),
              });

              if (!response.ok) {
                const data = (await response.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error || "Failed to update contact");
              }

              const updated = (await response.json()) as Contact;
              setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            }}
            accountId={accountId}
          />
        );
      case 'customers_companies':
        return <Companies companies={companies} onAddCompany={handleAddCompany} />;
      case 'customers_deals':
        return (
          <Deals
            deals={deals}
            onAddDeal={async (deal) => {
              const response = await fetch(`/api/accounts/${accountId}/deals`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(deal),
              });

              if (!response.ok) {
                const data = (await response.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error || "Failed to create deal");
              }

              const saved = (await response.json()) as Deal;
              setDeals((prev) => [...prev, saved]);
            }}
          />
        );
      case 'customers_marketing':
        return <Marketing />;
      case 'customers_sales':
        return <Sales />;
      case 'products_listing':
        return <Products products={products} onAddProduct={handleAddProduct} />;
      case 'tasks':
        return <Tasks tasks={tasks} onAddTask={handleAddTask} employees={employees} />;
      case 'hr':
        return (
          <HRPeople
            employees={employees}
            leaveRequests={leaveRequests}
            onAddEmployee={handleAddEmployee}
            onAddLeaveRequest={handleAddLeaveRequest}
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
          />
        );
      case 'billing':
        return <Billing />;
      case 'reports':
        return <Reports />;
      case 'automate':
        return <Automate />;
      case 'admin':
        return <Admin />;
      case 'finance':
        return <Finance />;
      case 'executive':
        return <Executive />;
      default:
        return (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white">Page Not Found</h3>
              <p className="mt-1 text-gray-400">The requested page does not exist.</p>
            </div>
          </div>
        );
    }
  };

  // Render navigation items
  const renderNavItems = (items: NavItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <button
          onClick={() => handleViewChange(item.id)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
            view === item.id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          } ${level > 0 ? 'pl-8' : ''}`}
        >
          <div className="flex items-center">
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {!sidebarCollapsed && <span>{item.label}</span>}
          </div>
          {item.children && !sidebarCollapsed && (
            <svg
              className={`h-4 w-4 transform transition-transform ${
                view.startsWith(item.id) ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {item.children && view.startsWith(item.id) && !sidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {renderNavItems(
              item.children.map((child) => ({
                ...child,
                icon: null,
              })),
              level + 1
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex justify-end md:hidden transition-opacity duration-500 ease-in-out ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-500 ease-in-out ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        ></div>
        <div
          className={`relative flex w-72 max-w-xs flex-1 flex-col bg-[#0f172a] pt-5 transform transition-transform duration-500 ease-in-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
                <LogoIcon />
              </div>
              <span className="ml-3 text-xl font-bold text-white">Heybassh</span>
            </div>
            <button
              type="button"
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-5 h-0 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {renderNavItems(navigation)}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-700 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  {userImage ? (
                    <Image
                      className="inline-block h-9 w-9 rounded-full"
                      src={userImage}
                      alt="User profile"
                      width={36}
                      height={36}
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
                      {userInitial}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-gray-400 group-hover:text-gray-300"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      {!sidebarCollapsed && (
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-[#0f172a]">
            <div className="flex h-16 flex-shrink-0 items-center px-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <LogoIcon />
                </div>
                <span className="ml-3 text-xl font-bold text-white">Heybassh</span>
              </div>
              <button
                type="button"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <span className="sr-only">Collapse sidebar</span>
                <svg
                  className="h-6 w-6 transform transition-transform rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-5">
              <nav className="flex-1 space-y-1 px-2">
                {renderNavItems(navigation)}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-700 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div>
                    {userImage ? (
                      <Image
                        className="inline-block h-9 w-9 rounded-full"
                        src={userImage}
                        alt="User profile"
                        width={36}
                        height={36}
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white">
                        {userInitial}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <button
                      onClick={handleSignOut}
                      className="text-xs font-medium text-gray-400 group-hover:text-gray-300"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-1 flex-col ${sidebarCollapsed ? 'md:pl-0' : 'md:pl-64'}`}>
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-[#0f172a] shadow">
          <button
            type="button"
            className="border-r border-gray-700 px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon />
          </button>
          {sidebarCollapsed && (
            <button
              type="button"
              className="hidden md:flex border-r border-gray-700 px-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarCollapsed(false)}
            >
              <span className="sr-only">Expand sidebar</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex w-full max-w-4xl items-center justify-center md:ml-6">
                <div className="relative w-full">
                  <div className="relative w-full flex items-center">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <SearchIcon />
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full rounded-[28px] border border-[#1a2446] bg-[#0e1629] py-2 pl-10 pr-12 text-blue-200 placeholder-blue-300/60 focus:border-[#2b9bff] focus:outline-none focus:ring-1 focus:ring-[#2b9bff] sm:text-sm"
                      placeholder="Search name, email..."
                      type="search"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => searchQuery && setSearchPreviewOpen(true)}
                      onBlur={() => {
                        // Small delay to allow clicking on search results
                        setTimeout(() => setSearchPreviewOpen(false), 200);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 flex items-center justify-center"
                    >
                      <svg className="h-5 w-5 text-blue-300/60 transition-colors hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                    </button>
                  </div>
                  {searchPreviewOpen && (
                    <div className="absolute left-0 right-0 z-10 mt-1 max-h-96 overflow-auto rounded-md bg-white py-1 shadow-lg">
                      {searchTransitioning ? (
                        <div className="py-2 px-4 text-sm text-gray-500">Searching...</div>
                      ) : searchQuery ? (
                        <div>
                          {[
                            { id: '1', name: 'Search result 1' },
                            { id: '2', name: 'Search result 2' },
                            { id: '3', name: 'Search result 3' },
                          ]
                            .filter((item) =>
                              item.name.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((item) => (
                              <div
                                key={item.id}
                                className={`cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100 ${
                                  searchPreviewSelection === item.id ? 'bg-indigo-50' : ''
                                }`}
                                onClick={() => handleSearchSelect(item.name)}
                              >
                                {item.name}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="py-2 px-4 text-sm text-gray-500">
                          Type to search...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="rounded-full bg-[#1a2035] p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon />
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {userImage ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={userImage}
                        alt="User profile"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                        {userInitial}
                      </div>
                    )}
                  </button>
                </div>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-white">
              {findNavLabel(navigation, view)}
            </h1>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
