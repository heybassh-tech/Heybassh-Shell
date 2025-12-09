"use client"

import { useState } from "react"
import type { NavItem } from "../types"
import { navigation } from "../icons"

interface MainSidebarProps {
  view: string
  navigate: (viewKey: string) => void
  sidebarCollapsed: boolean
}

export function MainSidebar({ view, navigate, sidebarCollapsed }: MainSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    customers: true,
    products: true,
    front_office: false,
    admin: true,
  })

  const navSeparators = new Set(["billing", "automate"])

  function toggleSectionState(curr: Record<string, boolean>, id: string) {
    return { ...curr, [id]: !curr[id] }
  }

  function isParentActive(item: NavItem) {
    if (item.id === view) return true
    return Boolean(item.children?.some((child) => child.id === view))
  }

  return (
    <aside
      className={`border-b border-[#1a2446] p-3 md:border-b-0 md:border-r bg-[#0e1629] md:sticky md:top-0 md:h-screen md:overflow-hidden ${
        sidebarCollapsed ? "pointer-events-none" : "pointer-events-auto"
      }`}
      aria-hidden={sidebarCollapsed}
    >
      <div className="flex h-full flex-col">
        <nav className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 pt-2 pb-24">
          {navigation.map((item) => {
            const hasChildren = Boolean(item.children?.length)
            const open = openSections[item.id] ?? false
            const active = isParentActive(item)

            return (
              <div key={item.id} className="grid gap-1">
                <button
                  onClick={() => (hasChildren ? setOpenSections((c) => toggleSectionState(c, item.id)) : navigate(item.id))}
                  className={`flex items-center justify-between rounded-[6px] border px-3 text-sm transition ${
                    active
                      ? "border-[#1a2446] bg-[#111936] text-white shadow-[0_15px_35px_-25px_rgba(39,172,255,0.65)]"
                      : "border-transparent text-blue-100 hover:bg-[#101733]"
                  }`}
                  style={{ paddingTop: "4px", paddingBottom: "4px" }}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121c3d] text-[#7ed0ff]">
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                </button>
                {hasChildren && (
                  <div
                    className={`overflow-hidden rounded-[7px] border border-[#111936] bg-[#0d142a] transition-all ${
                      open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col gap-1 p-2">
                      {item.children?.map((child) => {
                        const childActive = child.id === view
                        return (
                          <button
                            key={child.id}
                            onClick={() => navigate(child.id)}
                            className={`rounded-[6px] px-3 py-2 text-left text-xs font-medium transition ${
                              childActive
                                ? "bg-[#152044] text-white shadow-[0_12px_28px_-25px_rgba(39,172,255,0.65)]"
                                : "text-blue-200 hover:bg-[#121c3d] hover:text-white"
                            }`}
                          >
                            {child.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {navSeparators.has(item.id) && (
                  <div className="mx-1 mt-2 h-px bg-[#1a2446]/60" aria-hidden="true"></div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

