"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"

type VaultRow = {
  id: string
  label: string
  username: string
  password?: string
  url?: string
  notes?: string
  tags?: string[]
  favorite?: boolean
}

export function AdminPasswordManagerTab() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email || "User"
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : null
  const userImage = typeof session?.user?.image === "string" ? session.user.image : null
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U"
  const [vaultRows, setVaultRows] = useState<VaultRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let ignore = false
    async function loadVaultData() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/testing/vaultdata")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error((payload as { error?: string })?.error ?? "Failed to load vault data")
        }
        const rows = Array.isArray((payload as any).data) ? (payload as any).data : []
        if (!ignore) {
          setVaultRows(rows)
        }
      } catch (err) {
        console.error("Failed to load vault data", err)
        if (!ignore) {
          setError("Unable to load password items right now.")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }
    loadVaultData()
    return () => {
      ignore = true
    }
  }, [])

  const favoriteCount = useMemo(() => vaultRows.filter((row) => row.favorite).length, [vaultRows])

  async function handleRevealPassword(id: string) {
    if (!id) return
    setPasswordLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const response = await fetch(`/api/testing/vaultdata?id=${encodeURIComponent(id)}`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error((payload as { error?: string })?.error ?? "Failed to load password")
      }
      const entry = (payload as any).data as VaultRow | undefined
      if (entry && entry.id) {
        setVaultRows((rows) =>
          rows.map((row) => (row.id === entry.id ? { ...row, password: entry.password } : row))
        )
      }
    } catch (err) {
      console.error("Failed to reveal password", err)
    } finally {
      setPasswordLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="card rounded-[32px] bg-[#0e1629] p-6">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select className="rounded-[24px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs text-[#5dd4ff] shadow-sm focus:outline-none">
            <option className="bg-[#0e1629]">All Vaults</option>
          </select>
          <select className="rounded-[24px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs text-[#5dd4ff] shadow-sm focus:outline-none">
            <option className="bg-[#0e1629]">Last Month</option>
          </select>
        </div>
        <button className="rounded-[24px] border border-[#1a2446] bg-[#0b1225] px-4 py-1.5 text-xs font-medium text-[#5dd4ff] hover:bg-[#121c3d]">
          Print
        </button>
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

        {/* Table */}
        <div className="mt-8 overflow-x-auto rounded-[20px] border border-[#1a2446] bg-[#050b1c]">
          <table className="min-w-full border-collapse text-sm text-[#5dd4ff]">
            <thead>
              <tr className="bg-[#0b1225] text-left text-xs font-semibold uppercase tracking-wide text-[#5dd4ff]">
                <th className="border-b border-[#1a2446] px-3 py-2">Label</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Username</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Password</th>
                <th className="border-b border-[#1a2446] px-3 py-2">URL</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Tags</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Notes</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Favorite</th>
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
                  <td colSpan={7} className="px-3 py-4 text-center text-[#5dd4ff]">
                    No password items yet. POST to <code>/api/testing/vaultdata</code> to add one.
                  </td>
                </tr>
              ) : (
                vaultRows.map((row) => (
                  <tr key={row.id ?? row.label} className="border-t border-[#1a2446]">
                    <td className="border-r border-[#1a2446] px-3 py-2 text-white">{row.label}</td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.username}</td>
                    <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {row.password ? row.password : "••••••••"}
                        </span>
                        {!row.password && (
                          <button
                            className="rounded bg-sky-900 px-2 py-1 text-xs text-sky-100 hover:bg-sky-800 disabled:opacity-60"
                            onClick={() => handleRevealPassword(row.id)}
                            disabled={passwordLoading[row.id]}
                          >
                            {passwordLoading[row.id] ? "Loading..." : "Show"}
                          </button>
                        )}
                      </div>
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
                    <td className="px-3 py-2 text-[#5dd4ff]">{row.favorite ? "true" : "false"}</td>
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

