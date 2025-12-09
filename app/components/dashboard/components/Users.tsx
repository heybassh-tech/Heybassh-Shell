"use client"

import { useState, useMemo, Suspense, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { PrimaryButton } from "../../PrimaryButton"
import { PrimaryInput } from "../../PrimaryInput"

type UserType = "Employee" | "Others"

interface User {
  id: string
  email: string
  userType: UserType
  status: "Active" | "Pending" | "Inactive"
  createdAt: string
}

const defaultUsers: User[] = []

const SortIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
  </svg>
)

function UsersContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [email, setEmail] = useState("")
  const [userType, setUserType] = useState<UserType>("Employee")
  const [sendInvite, setSendInvite] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAddPanelOpen = searchParams.get("add") === "true"

  useEffect(() => {
    if (isAddPanelOpen) {
      document.body.classList.add("user-panel-open")
    } else {
      document.body.classList.remove("user-panel-open")
    }
    return () => {
      document.body.classList.remove("user-panel-open")
    }
  }, [isAddPanelOpen])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return users.filter((user) =>
      !normalizedSearch ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.userType.toLowerCase().includes(normalizedSearch)
    )
  }, [users, searchTerm])

  const openAddPanel = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("add", "true")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeAddPanel = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("add")
    const newUrl = params.toString() 
      ? `${pathname}?${params.toString()}`
      : pathname
    router.push(newUrl, { scroll: false })
    setEmail("")
    setUserType("Employee")
    setSendInvite(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      const newUser: User = {
        id: `U-${String(users.length + 1).padStart(4, "0")}`,
        email: email.trim(),
        userType,
        status: sendInvite ? "Pending" : "Active",
        createdAt: new Date().toISOString(),
      }
      
      setUsers([...users, newUser])
      closeAddPanel()
    } catch (error) {
      console.error("Failed to add user", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors: Record<User["status"], string> = {
    Active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    Pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    Inactive: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  }

  return (
    <>
      <div className={`space-y-6 transition-all duration-300 ${isAddPanelOpen ? "blur-sm" : ""}`}>
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <h2 className="text-2xl font-bold text-white">Users</h2>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={openAddPanel} icon={<PlusIcon className="h-4 w-4" />}>
              Add User
            </PrimaryButton>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#2b9bff] focus-within:ring-1 focus-within:ring-[#2b9bff] lg:max-w-xl">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[5px] border border-[#1a2446] bg-[#0c142a]">
          <table className="min-w-full divide-y divide-[#1a2446]">
            <thead className="bg-[#0e1629]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Email</span>
                    <SortIcon className="h-4 w-4 text-blue-300/60" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">User Type</span>
                    <SortIcon className="h-4 w-4 text-blue-300/60" />
                  </div>
                </th>
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="cursor-pointer transition-colors hover:bg-[#121c3d]">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{user.userType}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[user.status] ?? "border-[#1a2446] text-blue-100"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <ChevronRightIcon className="h-5 w-5 text-blue-300/60" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-blue-300">
                    {searchTerm ? `No users found for "${searchTerm}".` : "No users yet. Add one to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-[#0e1629] border-l border-[#1a2446] shadow-2xl transition-transform duration-300 ease-in-out ${
          isAddPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2446] px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Add User</h3>
              <p className="text-sm text-blue-300/70">Invite a new user to the platform</p>
            </div>
            <button
              onClick={closeAddPanel}
              className="rounded-lg p-2 text-blue-300/70 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-blue-200 mb-2">
                  Email
                </label>
                <PrimaryInput
                  id="user-email"
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="user-type" className="block text-sm font-medium text-blue-200 mb-2">
                  User Type
                </label>
                <select
                  id="user-type"
                  className="w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#2b9bff] focus:outline-none"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                >
                  <option value="Employee">Employee</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="send-invite"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#2b9bff] focus:ring-[#2b9bff]"
                />
                <label htmlFor="send-invite" className="text-sm text-blue-200 cursor-pointer">
                  Send the invite to user
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#1a2446] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={closeAddPanel}
                  className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={isSubmitting || !email.trim()}>
                  {isSubmitting ? "Sending..." : "Send Invite"}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Backdrop */}
      {isAddPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeAddPanel}
        />
      )}
    </>
  )
}

export function Users() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <UsersContent />
    </Suspense>
  )
}
