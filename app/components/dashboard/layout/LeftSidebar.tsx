"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import {
  MenuIcon,
  CreateIcon,
  InboxIcon,
  CallsIcon,
  MeetingsIcon,
  SettingsIcon,
} from "../icons"

interface LeftSidebarProps {
  accountId: string
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
}

export function LeftSidebar({ accountId, sidebarCollapsed, setSidebarCollapsed }: LeftSidebarProps) {
  const { data: session } = useSession()
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false)

  const userName = session?.user?.name || session?.user?.email || "User"
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : null
  const userImage = typeof session?.user?.image === "string" ? session.user.image : null
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U"

  return (
    <aside className="hidden md:flex md:sticky md:top-0 md:h-screen flex-col items-center justify-between border-r border-[#1a2446] bg-[#0e1629]/95 py-4 backdrop-blur z-50">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          aria-pressed={sidebarCollapsed}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2446] transition-all ${
            sidebarCollapsed ? "bg-[#101733] text-[#7ed0ff]" : "bg-[rgba(20,26,52,0.85)] text-white/80"
          }`}
          title="Toggle navigation"
        >
          <MenuIcon />
        </button>
        <div className="flex flex-col items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#7ed0ff] hover:bg-[#121c3d] transition-colors" title="Create">
            <CreateIcon />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#7ed0ff] hover:bg-[#121c3d] transition-colors" title="Inbox">
            <InboxIcon />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#7ed0ff] hover:bg-[#121c3d] transition-colors" title="Calls">
            <CallsIcon />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#7ed0ff] hover:bg-[#121c3d] transition-colors" title="Meetings">
            <MeetingsIcon />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#7ed0ff] hover:bg-[#121c3d] transition-colors" title="Settings">
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Profile button */}
      <div className="relative" data-dropdown>
        <button
          onClick={() => setSidebarProfileMenuOpen(!sidebarProfileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-[#7ed0ff] transition-colors"
          title="Profile"
        >
          {userImage ? (
            <Image src={userImage} alt={userName} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] flex items-center justify-center text-sm font-semibold uppercase text-white">
              {userInitial}
            </div>
          )}
        </button>

        {sidebarProfileMenuOpen && (
          <div className="absolute bottom-full left-0 translate-x-0 mb-2 w-48 rounded-[20px] border border-[#1a2446] bg-[#0e1629] text-sm shadow-lg z-50 overflow-hidden" data-dropdown>
            <div className="px-4 py-3 border-b border-[#1a2446]">
              <div className="font-medium text-white">{userName}</div>
              <div className="text-xs text-blue-300 truncate">{userEmail ?? ""}</div>
            </div>
            <Link
              href={`/${accountId}/settings`}
              className="block px-4 py-2.5 hover:bg-[#121c3d] text-blue-100 text-sm"
              onClick={() => setSidebarProfileMenuOpen(false)}
            >
              My Profile
            </Link>
            <Link
              href={`/${accountId}/settings`}
              className="block px-4 py-2.5 hover:bg-[#121c3d] text-blue-100 text-sm"
              onClick={() => setSidebarProfileMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              className="block w-full text-left px-4 py-2.5 hover:bg-[#121c3d] text-blue-100 text-sm"
              onClick={() => {
                setSidebarProfileMenuOpen(false)
                signOut({ callbackUrl: "/" })
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

