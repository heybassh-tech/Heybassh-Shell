"use client"

import Image from "next/image"
import { useSession } from "next-auth/react"

const passwordManagerItems = [
  {
    name: "tumblr",
    vault: "Social",
    type: "Login",
    used: "22 Mar 2018 at 11:41 am",
  },
  {
    name: "AgileBits Inc. Team - Jeff Shiner",
    vault: "Demo",
    type: "Login",
    used: "21 Mar 2018 at 1:49 pm",
  },
  {
    name: "AgileBits Wi-Fi: Office",
    vault: "Team",
    type: "Wireless Router",
    used: "15 Mar 2018 at 4:23 pm",
  },
  {
    name: "Sales Zapier",
    vault: "Sales",
    type: "Login",
    used: "08 Mar 2018 at 10:14 am",
  },
  {
    name: "Gmail - Demo",
    vault: "Demo",
    type: "Login",
    used: "06 Mar 2018 at 8:49 am",
  },
]

export function AdminPasswordManagerTab() {
  const { data: session } = useSession()
  const userName = session?.user?.name || session?.user?.email || "User"
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : null
  const userImage = typeof session?.user?.image === "string" ? session.user.image : null
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U"

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
                <p className="text-lg font-semibold text-white">Used 25% of their items</p>
                <p className="text-xs text-[#5dd4ff]">33 Used · 133 Total</p>
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
            <p className="text-2xl font-semibold text-white">5</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Vaults</p>
          </div>
          <div className="rounded-[20px] border border-[#1a2446] bg-[#050b1c] py-3">
            <p className="text-2xl font-semibold text-white">2</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Groups</p>
          </div>
          <div className="rounded-[20px] border border-[#1a2446] bg-[#050b1c] py-3">
            <p className="text-2xl font-semibold text-white">133</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-[#5dd4ff]">Items</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-x-auto rounded-[20px] border border-[#1a2446] bg-[#050b1c]">
          <table className="min-w-full border-collapse text-sm text-[#5dd4ff]">
            <thead>
              <tr className="bg-[#0b1225] text-left text-xs font-semibold uppercase tracking-wide text-[#5dd4ff]">
                <th className="border-b border-[#1a2446] px-3 py-2">Item Name</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Vault</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Item Type</th>
                <th className="border-b border-[#1a2446] px-3 py-2">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {passwordManagerItems.map((row) => (
                <tr key={row.name} className="border-t border-[#1a2446]">
                  <td className="border-r border-[#1a2446] px-3 py-2">{row.name}</td>
                  <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.vault}</td>
                  <td className="border-r border-[#1a2446] px-3 py-2 text-[#5dd4ff]">{row.type}</td>
                  <td className="px-3 py-2 text-[#5dd4ff]">{row.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

