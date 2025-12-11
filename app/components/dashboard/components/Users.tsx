"use client"

import { useState, useMemo, Suspense, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { PrimaryButton } from "../../PrimaryButton"
import { PrimaryInput } from "../../PrimaryInput"
import { PrimaryModal } from "../../PrimaryModal"

type UserType = "Employee" | "Others"

interface User {
  id: string
  name?: string | null
  email: string
  userType: UserType
  access: string
  role?: "user" | "admin" | "super_admin"
  status: "Invited" | "Accepted" | "Inactive"
  createdAt: string
}

const defaultUsers: User[] = []

const SortIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15M8.25 9L12 5.25 15.75 9" />
  </svg>
)

function UsersContent({ accountId, companyName }: { accountId: string; companyName: string }) {
  const { data: session } = useSession()
  const currentUserRole = (session?.user as any)?.role ?? "user"
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [userType, setUserType] = useState<UserType>("Employee")
  const [role, setRole] = useState<"user" | "admin" | "super_admin">("user")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [panelMode, setPanelMode] = useState<"add" | "edit" | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch users on mount and when accountId changes
  useEffect(() => {
    let ignore = false
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const response = await fetch(`/api/accounts/${accountId}/users`)
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const data = await response.json()
        if (!ignore) {
          setUsers(data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            userType: user.userType || (user.role === "admin" ? "Employee" : "Others"),
            access: user.role ? user.role : user.userType === "Employee" ? "admin" : "user",
            role: user.role,
            status: user.status || (user.emailVerified ? "Accepted" : "Invited"),
            createdAt: user.createdAt,
          })))
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        if (!ignore) {
          setIsLoadingUsers(false)
        }
      }
    }
    fetchUsers()
    return () => {
      ignore = true
    }
  }, [accountId])

  useEffect(() => {
    if (panelOpen) {
      document.body.classList.add("user-panel-open")
    } else {
      document.body.classList.remove("user-panel-open")
    }
    return () => {
      document.body.classList.remove("user-panel-open")
    }
  }, [panelOpen])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      if (!normalizedSearch) return true
      return (
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.name ?? "").toLowerCase().includes(normalizedSearch) ||
        user.userType.toLowerCase().includes(normalizedSearch) ||
        (user.access ?? "").toLowerCase().includes(normalizedSearch) ||
        user.status.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [users, searchTerm])

  const openAddPanel = () => {
    if (!["admin", "super_admin"].includes(currentUserRole)) {
      setPermissionModalOpen(true)
      return
    }
    setPanelMode("add")
    setSelectedUser(null)
    setEmail("")
    setName("")
    setUserType("Employee")
    setRole("user")
    setPanelOpen(true)
  }

  const openEditPanel = (user: User) => {
    setPanelMode("edit")
    setSelectedUser(user)
    setEmail(user.email)
    setName(user.name || "")
    setUserType(user.userType)
    const resolvedRole =
      (user.role as any) ??
      (user.access === "super_admin"
        ? "super_admin"
        : user.access === "admin"
        ? "admin"
        : "user")
    setRole(resolvedRole)
    setPanelOpen(true)
  }

  const closeAddPanel = () => {
    setPanelOpen(false)
    setPanelMode(null)
    setSelectedUser(null)
    setEmail("")
    setName("")
    setUserType("Employee")
    setRole("user")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !accountId) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          email: email.trim(),
          role: role || (userType === "Employee" ? "admin" : "user"),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send invitation")
      }

      // Refetch users to get the updated list including the new pending invitation
      const usersResponse = await fetch(`/api/accounts/${accountId}/users`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType || (user.role === "admin" ? "Employee" : "Others"),
          access: user.role ? user.role : user.userType === "Employee" ? "admin" : "user",
          role: user.role,
          status: user.status || (user.emailVerified ? "Accepted" : "Invited"),
          createdAt: user.createdAt,
        })))
      }
      
      closeAddPanel()
    } catch (error) {
      console.error("Failed to send invitation", error)
      alert(error instanceof Error ? error.message : "Failed to send invitation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/accounts/${accountId}/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          name: name.trim() || null,
          role: role,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to update user")
      }
      // refresh list
      const usersResponse = await fetch(`/api/accounts/${accountId}/users`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType || (user.role === "admin" ? "Employee" : "Others"),
          access: user.role ? user.role : user.userType === "Employee" ? "admin" : "user",
          role: user.role,
          status: user.status || (user.emailVerified ? "Accepted" : "Invited"),
          createdAt: user.createdAt,
        })))
      }
      closeAddPanel()
    } catch (error) {
      console.error("Failed to update user", error)
      alert(error instanceof Error ? error.message : "Failed to update user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors: Record<User["status"], string> = {
    Accepted: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    Invited: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    Inactive: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedUserIds.size === 0) return
    
    setIsDeleting(true)
    try {
      const userIdsArray = Array.from(selectedUserIds)
      
      // Delete users one by one
      const deletePromises = userIdsArray.map(async (userId) => {
        // Skip if it's a pending invitation (starts with "inv-")
        if (userId.startsWith("inv-")) {
          return { success: true, userId }
        }
        
        const response = await fetch(`/api/accounts/${accountId}/users`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data?.message || data?.error || `Failed to delete user ${userId}`)
        }
        
        return { success: true, userId }
      })

      await Promise.all(deletePromises)

      // Refresh users list
      const usersResponse = await fetch(`/api/accounts/${accountId}/users`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType || (user.role === "admin" ? "Employee" : "Others"),
          access: user.role ? user.role : user.userType === "Employee" ? "admin" : "user",
          role: user.role,
          status: user.status || (user.emailVerified ? "Accepted" : "Invited"),
          createdAt: user.createdAt,
        })))
      }

      setSelectedUserIds(new Set())
      setDeleteModalOpen(false)
    } catch (error) {
      console.error("Failed to delete users", error)
      alert(error instanceof Error ? error.message : "Failed to delete users. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center py-10 text-blue-200">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-300 border-t-transparent mr-2" />
        Loading users...
      </div>
    )
  }

  return (
    <>
      <div className={`space-y-6 transition-all duration-300 ${panelOpen ? "blur-sm" : ""}`}>
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <h2 className="text-2xl font-bold text-[#18aead]">Users</h2>
          <div className="flex items-center gap-2">
            {currentUserRole === "super_admin" && selectedUserIds.size > 0 && (
              <PrimaryButton
                onClick={() => setDeleteModalOpen(true)}
                icon={<TrashIcon className="h-4 w-4" />}
                variant="danger"
              >
                Delete Selected ({selectedUserIds.size})
              </PrimaryButton>
            )}
            <PrimaryButton onClick={openAddPanel} icon={<PlusIcon className="h-4 w-4" />} variant="brand">
              Add User
            </PrimaryButton>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#18aead] focus-within:ring-1 focus-within:ring-[#18aead] lg:max-w-xl">
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

        <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
          <table className="min-w-full divide-y divide-[#1a2446]">
            <thead className="bg-[#0e1629]">
              <tr>
                {currentUserRole === "super_admin" && (
                  <th scope="col" className="px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#18aead] focus:ring-[#18aead] focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                )}
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">User Type</span>
                    <SortIcon className="h-4 w-4 text-blue-300/60" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Access</span>
                    <SortIcon className="h-4 w-4 text-blue-300/60" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Invite Status</span>
                    <SortIcon className="h-4 w-4 text-blue-300/60" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer transition-colors hover:bg-[#121c3d]"
                    onClick={(e) => {
                      // Don't open edit panel if clicking checkbox
                      if ((e.target as HTMLElement).tagName !== "INPUT") {
                        openEditPanel(user)
                      }
                    }}
                  >
                    {currentUserRole === "super_admin" && (
                      <td className="whitespace-nowrap px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#18aead] focus:ring-[#18aead] focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{user.name || "—"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200">{user.userType}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-blue-200 uppercase">{user.access || "—"}</div>
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
                  <td colSpan={currentUserRole === "super_admin" ? 7 : 6} className="px-6 py-8 text-center text-sm text-blue-300">
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
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2446] px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{panelMode === "edit" ? "Edit User" : "Add User"}</h3>
              <p className="text-sm text-blue-300/70">
                {panelMode === "edit" ? "Update user details and roles" : `Invite a new user to join ${companyName}`}
              </p>
            </div>
            <button
              onClick={closeAddPanel}
              className="rounded-lg p-2 text-blue-300/70 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={panelMode === "edit" ? handleUpdateUser : handleSubmit} className="flex flex-1 flex-col">
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
                  disabled={panelMode === "edit"}
                />
              </div>

              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-blue-200 mb-2">
                  Name
                </label>
                <PrimaryInput
                  id="user-name"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="user-type" className="block text-sm font-medium text-blue-200 mb-2">
                  User Type
                </label>
                <select
                  id="user-type"
                  className="w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 py-2.5 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none focus:ring-1 focus:ring-[#18aead]"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  disabled={panelMode === "edit"}
                >
                  <option value="Employee">Employee</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-blue-200 mb-2">
                  Role
                </label>
                <select
                  id="user-role"
                  className="w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 py-2.5 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none focus:ring-1 focus:ring-[#18aead]"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  disabled={currentUserRole !== "super_admin"}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {currentUserRole !== "super_admin" && (
                  <p className="mt-1 text-xs text-blue-300/70">Only super admins can change roles.</p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-[#1a2446] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={closeAddPanel}
                  className="rounded-full border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" disabled={isSubmitting || !email.trim()}>
                  {isSubmitting ? "Saving..." : panelMode === "edit" ? "Save changes" : "Send invite"}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeAddPanel}
        />
      )}

      <PrimaryModal
        open={permissionModalOpen}
        title="Request access"
        description="You need admin access to add or invite users."
        onClose={() => setPermissionModalOpen(false)}
      >
        <div className="space-y-4 text-blue-100">
          <p>Only admins and super admins can add new users.</p>
          <p>Please contact an admin or super admin to grant you access.</p>
          <div className="flex justify-end">
            <PrimaryButton onClick={() => setPermissionModalOpen(false)}>Got it</PrimaryButton>
          </div>
        </div>
      </PrimaryModal>

      {/* Delete Confirmation Modal */}
      {currentUserRole === "super_admin" && (
        <PrimaryModal
          open={deleteModalOpen}
          title="Delete Users"
          description={`Are you sure you want to delete ${selectedUserIds.size} user(s)? This action cannot be undone.`}
          onClose={() => {
            if (!isDeleting) {
              setDeleteModalOpen(false)
            }
          }}
          widthClassName="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-blue-200">
              The following users will be permanently removed from this account:
            </p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-[#1a2446] bg-[#0e1629] p-3">
              <ul className="space-y-1">
                {Array.from(selectedUserIds).map((userId) => {
                  const user = users.find((u) => u.id === userId)
                  return (
                    <li key={userId} className="text-sm text-blue-200">
                      • {user?.email || user?.name || userId}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setDeleteModalOpen(false)
                  }
                }}
                disabled={isDeleting}
                className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <PrimaryButton
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="!bg-rose-600 !border-rose-600 hover:!bg-rose-500 hover:!border-rose-500"
              >
                {isDeleting ? "Deleting..." : "Delete Users"}
              </PrimaryButton>
            </div>
          </div>
        </PrimaryModal>
      )}
    </>
  )
}

export function Users({ accountId, companyName }: { accountId: string; companyName: string }) {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <UsersContent accountId={accountId} companyName={companyName} />
    </Suspense>
  )
}
