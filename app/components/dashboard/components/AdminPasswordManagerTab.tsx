"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { v4 as uuidv4 } from "uuid"
import { PrimaryModal } from "../../PrimaryModal"

type VaultEntry = {
  id: string
  label: string
  username: string
  password: string
  url?: string
  notes?: string
  tags?: string[]
  favorite?: boolean
}

export function AdminPasswordManagerTab() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email || "User"
  const userImage = typeof session?.user?.image === "string" ? session.user.image : null
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : null
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U"
  const accountId = (session?.user as any)?.account_id

  const [vaultRows, setVaultRows] = useState<VaultEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLabel, setDeleteLabel] = useState<string>("")
  const [form, setForm] = useState<Omit<VaultEntry, "id">>({
    label: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    tags: [],
    favorite: false,
  })

  const favoriteCount = useMemo(() => vaultRows.filter((row) => row.favorite).length, [vaultRows])

  useEffect(() => {
    // Auto-load on mount
    loadVault()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  async function loadVault() {
    if (!accountId) {
      setError("Missing account id.")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/accounts/${accountId}/password-vault`, {
        method: "GET",
        cache: "no-store",
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to load vault")
      }
      const entries = Array.isArray((payload as any).entries) ? (payload as any).entries : []
      setVaultRows(entries as VaultEntry[])
    } catch (err) {
      console.error("Failed to load vault", err)
      setError("Unable to load vault.")
    } finally {
      setIsLoading(false)
    }
  }

  async function persistVault(nextEntries: VaultEntry[]) {
    if (!accountId) {
      setError("Missing account id.")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/accounts/${accountId}/password-vault`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: nextEntries }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to save vault")
      }
      setVaultRows(nextEntries)
      setEditingId(null)
      setForm({ label: "", username: "", password: "", url: "", notes: "", tags: [], favorite: false })
    } catch (err) {
      console.error("Failed to save vault", err)
      setError("Unable to save vault.")
    } finally {
      setIsLoading(false)
    }
  }

  function startEdit(entry: VaultEntry) {
    setEditingId(entry.id)
    setForm({
      label: entry.label,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      notes: entry.notes,
      tags: entry.tags ?? [],
      favorite: entry.favorite ?? false,
    })
    setModalOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ label: "", username: "", password: "", url: "", notes: "", tags: [], favorite: false })
    setModalOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: VaultEntry = {
      id: editingId ?? uuidv4(),
      label: form.label.trim(),
      username: form.username.trim(),
      password: form.password,
      url: form.url?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      tags: form.tags?.length ? form.tags : undefined,
      favorite: form.favorite ?? false,
    }
    const updated = editingId
      ? vaultRows.map((r) => (r.id === editingId ? next : r))
      : [...vaultRows, next]
    await persistVault(updated)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    const updated = vaultRows.filter((r) => r.id !== id)
    await persistVault(updated)
    setDeleteId(null)
    setDeleteLabel("")
  }

  return (
    <div className="card rounded-[32px] bg-[#0e1629] p-6">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-[24px] border border-[#1a2446] bg-[#0b1225] px-4 py-2 text-xs font-semibold text-[#5dd4ff] hover:bg-[#121c3d]"
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
          >
            Add Password
          </button>
          <button
            className="rounded-[24px] border border-[#1a2446] bg-[#0b1225] px-4 py-2 text-xs font-semibold text-[#5dd4ff] hover:bg-[#121c3d]"
            onClick={loadVault}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
        <span className="text-xs text-blue-300/80">Vault items: {vaultRows.length}</span>
      </div>

      {/* Report card */}
      <div className="rounded-[28px] border border-[#1a2446] bg-[#070d20] p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff]">
              {userImage ? (
                <Image src={userImage} alt={userName} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                  {userInitial}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{userName}</h1>
              <p className="text-sm text-[#5dd4ff]">
                Usage Report<span className="text-[#5dd4ff]">: All vault usage for the last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right column info + usage */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#020617]">
                <div className="h-20 w-20 rounded-full border-[11px] border-[#5dd4ff] border-r-[#1a2446] border-b-[#1a2446]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Vault items overview</p>
                <p className="text-xs text-[#5dd4ff]">
                  {vaultRows.length} Total · {favoriteCount} Favorites
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-[#5dd4ff]">
            <p>
              Report by <span className="text-[#5dd4ff]">Jeff Shiner</span> on 26th March 2018
            </p>
            <p className="mt-1">
              Last Sign In: <span className="text-[#5dd4ff]">23rd March 2018</span>
            </p>
            <p className="mt-1">
              Member Since: <span className="text-[#5dd4ff]">28th November 2016</span>
            </p>
            <p className="mt-1">
              Status: <span className="text-emerald-400">Active</span>
            </p>
            {userEmail && (
              <p className="mt-1">
                Email: <span className="text-[#5dd4ff]">{userEmail}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-[#5dd4ff]">
          <div className="rounded-[20px] border border-[#1a2446] bg-[#050b1c] py-3">
            <p className="text-2xl font-semibold text-white">{vaultRows.length}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Items</p>
          </div>
          <div className="rounded-[20px] border border-[#1a2446] bg-[#050b1c] py-3">
            <p className="text-2xl font-semibold text-white">{favoriteCount}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Favorites</p>
          </div>
          <div className="rounded-[20px] border border-[#1a2446] bg-[#050b1c] py-3">
            <p className="text-2xl font-semibold text-white">
              {vaultRows.reduce((acc, row) => acc + (row.tags?.length ?? 0), 0)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Tags</p>
          </div>
        </div>

        {/* Form Modal */}
        <PrimaryModal
          open={modalOpen}
          onClose={resetForm}
          title={editingId ? "Edit Password" : "Add Password"}
          description="Manage a password entry for this account vault."
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-200">Label</label>
                <input
                  className="w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-200">Username</label>
                <input
                  className="w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-200">Password</label>
                <input
                  className="w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-blue-200">URL</label>
                <input
                  className="w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-blue-200">Notes</label>
                <textarea
                  className="w-full rounded-[12px] border border-[#1a2446] bg-[#0e1629] px-3 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.favorite}
                  onChange={(e) => setForm((f) => ({ ...f, favorite: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#1a2446] bg-[#0e1629] text-[#18aead] focus:ring-[#18aead]"
                />
                <span className="text-sm text-blue-100">Favorite</span>
              </div>
            </div>
            {error && <span className="text-xs text-rose-300">{error}</span>}
            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-[12px] border border-[#1a2446] px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-[#0e1629]"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-[12px] bg-[#18aead] px-4 py-2 text-sm font-semibold text-white hover:bg-[#18aead]/90"
                disabled={isLoading}
              >
                {editingId ? "Update" : "Add"} Password
              </button>
            </div>
          </form>
        </PrimaryModal>

      {/* Delete confirmation */}
      <PrimaryModal
        open={Boolean(deleteId)}
        onClose={() => {
          setDeleteId(null)
          setDeleteLabel("")
        }}
        title="Delete password"
        description={`Are you sure you want to delete "${deleteLabel}"?`}
      >
        <div className="space-y-4">
          <p className="text-sm text-blue-100">
            This will remove the entry from the vault for this account.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteId(null)
                setDeleteLabel("")
              }}
              className="rounded-[12px] border border-[#1a2446] px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-[#0e1629]"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteId && handleDelete(deleteId)}
              className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        </div>
      </PrimaryModal>

        {/* Table */}
        <div className="mt-8 overflow-x-auto rounded-[20px] border border-[#1a2446] bg-[#050b1c]">
          <table className="min-w-full border-collapse text-sm text-[#5dd4ff]">
            <thead>
              <tr className="bg-[#0b1225] text-left text-xs font-semibold uppercase tracking-wide text-[#5dd4ff]">
                <th className="border-b border-[#1a2446] px-3 py-2">Name</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Username</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Password</th>
                <th className="border-b border-[#1a2446] px-3 py-2">URL</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Tags</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Notes</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Favorite</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-[#5dd4ff]">
                    Loading password items…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-rose-300">
                    {error}
                  </td>
                </tr>
              ) : vaultRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-[#5dd4ff]">
                    No password items yet. Click “Add Password” to create one.
                  </td>
                </tr>
              ) : (
                vaultRows.map((row) => (
                  <tr key={row.id ?? row.label} className="border-t border-[#1a2446]">
                    <td className="border-r border-[#1a2446] px-3 py-2 text-white">{row.label}</td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.username}</td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">
                      <span className="font-mono">{row.password || "—"}</span>
                    </td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">
                          {row.url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">
                      {row.tags?.length ? row.tags.join(", ") : "—"}
                    </td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.notes || "—"}</td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.favorite ? "true" : "false"}</td>
                    <td className="px-3 py-2 text-[#5dd4ff]">
                      <div className="flex gap-2">
                        <button
                          className="rounded border border-[#1a2446] px-3 py-1 text-xs text-blue-100 hover:bg-[#0e1629]"
                          onClick={() => startEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-rose-600 px-3 py-1 text-xs text-rose-200 hover:bg-rose-900/40"
                          onClick={() => {
                            setDeleteId(row.id)
                            setDeleteLabel(row.label)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

