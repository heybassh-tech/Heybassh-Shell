"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { Contact, Product, Task, Employee } from "./dashboard/types"
import { defaultContacts, defaultProducts, defaultEmployees } from "./dashboard/types"
import { findNavLabel, viewToPath } from "./dashboard/utils"
import { navigation } from "./dashboard/icons"
import { Contacts } from "./dashboard/components/Contacts"
import { Companies } from "./dashboard/components/Companies"
import { Deals } from "./dashboard/components/Deals"
import { Products } from "./dashboard/components/Products"
import { Tasks } from "./dashboard/components/Tasks"
import { Marketing } from "./dashboard/components/Marketing"
import { Sales } from "./dashboard/components/Sales"
import { OverviewTab } from "./dashboard/components/OverviewTab"
import { HRPeopleTab } from "./dashboard/components/HRPeopleTab"
import { AdminOverviewTab } from "./dashboard/components/AdminOverviewTab"
import { AdminITTab } from "./dashboard/components/AdminITTab"
import { AdminPasswordManagerTab } from "./dashboard/components/AdminPasswordManagerTab"
import { FrontOfficeWebsiteTab } from "./dashboard/components/FrontOfficeWebsiteTab"
import { FrontOfficeGenericTab } from "./dashboard/components/FrontOfficeGenericTab"
import { DefaultViewTab } from "./dashboard/components/DefaultViewTab"
import { LeftSidebar } from "./dashboard/layout/LeftSidebar"
import { DashboardHeader } from "./dashboard/layout/DashboardHeader"
import { MainSidebar } from "./dashboard/layout/MainSidebar"

export default function AccountDashboard({ accountId, initialViewKey = "overview" }: { accountId: string; initialViewKey?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [view, setView] = useState(initialViewKey)
  const [companyName, setCompanyName] = useState<string>(accountId)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts)
  const [contactsLoading, setContactsLoading] = useState(true)
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees] = useState<Employee[]>(defaultEmployees)

  useEffect(() => {
    let ignore = false
    async function loadContacts() {
      setContactsLoading(true)
      setContactsError(null)
      try {
        const response = await fetch(`/api/accounts/${accountId}/contacts`)
        const payload = await response.json().catch(() => [])
        if (!response.ok) {
          throw new Error((payload as { error?: string })?.error ?? "Failed to load contacts")
        }
        if (!ignore) {
          setContacts(Array.isArray(payload) ? payload : [])
        }
      } catch (error) {
        console.error("[AccountDashboard] Failed to fetch contacts", error)
        if (!ignore) {
          setContactsError("Unable to load contacts right now. Please try refreshing.")
        }
      } finally {
        if (!ignore) {
          setContactsLoading(false)
        }
      }
    }
    loadContacts()
    return () => {
      ignore = true
    }
  }, [accountId])

  useEffect(() => {
    let ignore = false
    fetch(`/api/accounts/${accountId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ignore && data?.company_name) setCompanyName(data.company_name)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [accountId])

  const activeLabel = useMemo(() => findNavLabel(navigation, view), [view])
  const contactOwnerLabel = useMemo(() => {
    const name = session?.user?.name?.trim()
    const email = session?.user?.email?.trim()
    if (name && email) return `${name} (${email})`
    return name || email || "Unassigned"
  }, [session?.user?.name, session?.user?.email])

  function navigate(viewKey: string) {
    setView(viewKey)
    const seg = viewToPath(viewKey)
    if (seg) {
      router.push(`/${accountId}/${seg}`)
    }
  }

  async function handleAddContact(contact: Omit<Contact, "id">) {
    if (!contact.name || !contact.email) return
    try {
      const response = await fetch(`/api/accounts/${accountId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to create contact")
      }
      setContacts((prev) => [payload as Contact, ...prev])
    } catch (error) {
      console.error("[AccountDashboard] Failed to create contact", error)
      throw error
    }
  }

  function handleAddProductFromModal(product: Omit<Product, "id">) {
    setProducts([...products, product])
  }

  function handleAddTaskFromModal(task: Omit<Task, "id">) {
    const nextId = `T-${String(tasks.length + 1).padStart(3, "0")}`
    setTasks([...tasks, { ...task, id: nextId }])
  }

  const desktopGrid = "md:grid-cols-[64px_minmax(0,1fr)]"
  const contentGrid = sidebarCollapsed ? "md:grid-cols-[0px_minmax(0,1fr)]" : "md:grid-cols-[260px_minmax(0,1fr)]"

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className={`grid min-h-screen grid-cols-1 ${desktopGrid} transition-[grid-template-columns] duration-250 ease-linear`}>
        <LeftSidebar accountId={accountId} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        <div className="flex flex-col min-h-screen">
          <DashboardHeader
            accountId={accountId}
            companyName={companyName}
            contacts={contacts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            navigate={navigate}
          />
          <div className="h-px bg-[#1a2446]/50"></div>
          <div className={`grid flex-1 grid-cols-1 ${contentGrid} transition-[grid-template-columns] duration-250 ease-linear`}>
            <MainSidebar view={view} navigate={navigate} sidebarCollapsed={sidebarCollapsed} />
            <div className="bg-[#020617]">
              <div className="mx-auto grid max-w-[1800px] gap-4 p-4">
                {view === "overview" ? (
                  <OverviewTab accountId={accountId} navigate={navigate} />
                ) : view === "customers_contacts" ? (
                  <div className="space-y-6">
                    <Contacts
                      contacts={contacts}
                      onAddContact={handleAddContact}
                      isLoading={contactsLoading}
                      errorMessage={contactsError ?? undefined}
                      defaultOwner={contactOwnerLabel}
                    />
                  </div>
                ) : view === "customers_companies" ? (
                  <div className="space-y-6">
                    <Companies companies={[]} onAddCompany={() => {}} />
                  </div>
                ) : view === "customers_deals" ? (
                  <div className="space-y-6">
                    <Deals deals={[]} onAddDeal={() => {}} />
                  </div>
                ) : view === "products_listing" ? (
                  <div className="space-y-6">
                    <Products products={products} onAddProduct={handleAddProductFromModal} />
                  </div>
                ) : view === "tasks" ? (
                  <div className="space-y-6">
                    <Tasks tasks={tasks} onAddTask={handleAddTaskFromModal} employees={employees} />
                  </div>
                ) : view === "hr" ? (
                  <HRPeopleTab />
                ) : view === "admin_overview" ? (
                  <AdminOverviewTab />
                ) : view === "admin_it" ? (
                  <AdminITTab />
                ) : view === "customers_marketing" ? (
                  <Marketing />
                ) : view === "customers_sales" ? (
                  <Sales />
                ) : view === "admin_password_manager" ? (
                  <AdminPasswordManagerTab />
                ) : view === "front_office_website" ? (
                  <FrontOfficeWebsiteTab />
                ) : view.startsWith("front_office_") ? (
                  <FrontOfficeGenericTab activeLabel={activeLabel} />
                ) : (
                  <DefaultViewTab activeLabel={activeLabel} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
