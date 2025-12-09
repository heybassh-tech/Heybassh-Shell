"use client"

import { useState, useRef, useEffect, ChangeEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { FunnelIcon } from "@heroicons/react/24/outline"
import logo from "../../../Images/heybasshlogo.png"
import { SearchIcon, AcademyIcon, MediaIcon, BellIcon } from "../icons"
import type { Contact } from "../types"
import { nameMatchesTokens } from "../utils"
import { SEARCH_SELECTION_KEY } from "../types"

interface DashboardHeaderProps {
  accountId: string
  companyName: string
  contacts: Contact[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  navigate: (viewKey: string) => void
}

export function DashboardHeader({
  accountId,
  companyName,
  contacts,
  searchQuery,
  setSearchQuery,
  navigate,
}: DashboardHeaderProps) {
  const [searchPreviewOpen, setSearchPreviewOpen] = useState(false)
  const [searchPreviewSelection, setSearchPreviewSelection] = useState<string | null>(null)
  const [searchTransitioning, setSearchTransitioning] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const searchLoaderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredContacts = contacts.filter((contact) => {
    const rawQuery = searchQuery.trim()
    if (!rawQuery) return true
    const q = rawQuery.toLowerCase()
    const matchesNameTokens = nameMatchesTokens(contact.name, q)
    const matchesOtherFields = [contact.id, contact.email, contact.phone, contact.company].some((field) =>
      field.toLowerCase().includes(q),
    )
    return matchesNameTokens || matchesOtherFields
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!searchPreviewOpen) return

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        const items = document.querySelectorAll(".search-preview-item")
        if (!items.length) return

        const currentIndex = Array.from(items).findIndex((item) => item.getAttribute("data-selected") === "true")
        let nextIndex = 0

        if (event.key === "ArrowDown") {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        }

        setSearchPreviewSelection(items[nextIndex].getAttribute("data-id"))
      } else if (event.key === "Enter" && searchPreviewSelection) {
        const selectedItem = document.querySelector(`[data-id="${searchPreviewSelection}"]`) as HTMLElement
        if (selectedItem) selectedItem.click()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchPreviewOpen, searchPreviewSelection])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (searchLoaderTimeout.current) {
        clearTimeout(searchLoaderTimeout.current)
      }
    }
  }, [])

  function scheduleSearchLoader() {
    setSearchTransitioning(true)
    if (searchLoaderTimeout.current) {
      clearTimeout(searchLoaderTimeout.current)
    }
    searchLoaderTimeout.current = setTimeout(() => {
      setSearchTransitioning(false)
    }, 500)
  }

  function handleTopSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value
    setSearchQuery(nextValue)
    setSearchPreviewOpen(Boolean(nextValue.trim()))
    if (!nextValue.trim()) {
      setSearchPreviewSelection(null)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SEARCH_SELECTION_KEY)
      }
    }
  }

  function handleSearchResultNavigate(contactId?: string) {
    if (contactId) {
      setSearchPreviewSelection(contactId)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SEARCH_SELECTION_KEY, contactId)
      }
    }
    setSearchPreviewOpen(false)
    scheduleSearchLoader()
    navigate("customers_contacts")
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-[rgba(9,15,31,.95)] px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href={`/${accountId}/dashboard`} className="flex items-center">
          <Image src={logo} alt="Heybassh" height={28} className="h-7 w-auto" />
        </Link>
        <div className="relative" ref={filterRef} data-dropdown>
          <div className="flex items-center gap-2 border border-[#1a2446] rounded-[24px] px-4 py-1.2 bg-[#0e1629]">
            <SearchIcon />
            <input
              type="text"
              value={searchQuery}
              onChange={handleTopSearchChange}
              onFocus={() => setSearchPreviewOpen(Boolean(searchQuery.trim()))}
              onBlur={() => {
                if (!searchQuery.trim()) setSearchPreviewOpen(false)
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchPreviewOpen(false)
                  ;(event.target as HTMLInputElement).blur()
                } else if (event.key === "Enter") {
                  setSearchPreviewOpen(false)
                  handleSearchResultNavigate()
                }
              }}
              placeholder="Search Heybassh"
              className="bg-transparent border-0 outline-0 text-sm text-blue-200 placeholder-blue-300/60 px-4 py-2 w-96"
            />
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-1.5 rounded-full hover:bg-[#1a2446] transition-colors"
              aria-label="Open filters"
            >
              <FunnelIcon className="w-4 h-4 text-blue-300" />
            </button>
          </div>

          {/* Filter Popup */}
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0e1629] border border-[#1a2446] rounded-lg shadow-lg z-50 p-3">
              <h3 className="font-medium text-blue-100 mb-3">Filters</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-option-1"
                    className="h-4 w-4 rounded border-[#1a2446] text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="filter-option-1" className="ml-2 text-sm text-blue-200">
                    Filter Option 1
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-option-2"
                    className="h-4 w-4 rounded border-[#1a2446] text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="filter-option-2" className="ml-2 text-sm text-blue-200">
                    Filter Option 2
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1.5 text-sm text-blue-200 hover:bg-[#1a2446] rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsFilterOpen(false)
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
          {searchTransitioning && (
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[11px] text-blue-300">
              <span className="h-3 w-3 animate-spin rounded-full border border-blue-300 border-r-transparent"></span>
              Loading…
            </div>
          )}
          {searchPreviewOpen && (
            <div className="absolute left-0 top-full mt-2 w-[320px] rounded-[20px] border border-[#1a2446] bg-[#050a1b] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#111936] px-4 py-2 text-xs uppercase tracking-wide text-blue-300">
                <span>Contacts</span>
                <button
                  className="text-[11px] font-semibold text-[#7ed0ff] hover:text-white transition-colors"
                  onClick={() => handleSearchResultNavigate()}
                >
                  View all
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {searchQuery.trim() ? (
                  filteredContacts.length ? (
                    filteredContacts.slice(0, 5).map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSearchResultNavigate(contact.id)}
                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[#0c142a] transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{contact.name}</p>
                          <p className="text-xs text-blue-300">{contact.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-200">{contact.company}</p>
                          <p className="text-xs text-blue-400/80">{contact.phone}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-blue-300">No contacts found.</div>
                  )
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-blue-300">Start typing to search contacts.</div>
                )}
              </div>
              {filteredContacts.length > 5 && (
                <div className="border-t border-[#111936] px-4 py-2 text-[11px] text-blue-300">Showing top 5 results</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="#" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors border border-[#1a2446]">
          BotOnly AI
        </Link>
        <Link href="#" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors border border-[#1a2446]">
          Tools
        </Link>
        <button className="inline-flex items-center justify-center h-8 w-8 text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors border border-[#1a2446]">
          <AcademyIcon />
        </button>
        <button className="inline-flex items-center justify-center h-8 w-8 text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors border border-[#1a2446]">
          <MediaIcon />
        </button>
        <button className="inline-flex items-center justify-center h-8 w-8 text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors border border-[#1a2446] relative">
          <BellIcon />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full"></span>
        </button>
        <Link
          href={`/${accountId}/dashboard/service`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#031226] bg-gradient-to-r from-[#FFD54A] to-[#FFC107] hover:brightness-110 rounded-[20px] transition-all border border-[#d4a017]"
        >
          Book a Service
        </Link>
        <div className="relative inline-flex items-center gap-1.5" data-dropdown>
          <button
            onClick={() => setCompanyMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-blue-200 hover:text-white hover:bg-[#0e1629] rounded-[20px] transition-colors"
          >
            <span className="truncate max-w-[120px]">{companyName}</span>
          </button>
          {companyMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-[20px] border border-[#1a2446] bg-[#0e1629] text-xs shadow-lg z-50 py-1" data-dropdown>
              <Link
                className="block px-3 py-1.5 text-blue-100 hover:bg-[#121c3d] text-xs"
                href={`/${accountId}/settings`}
                onClick={() => setCompanyMenuOpen(false)}
              >
                Company Profile
              </Link>
              <Link
                className="block px-3 py-1.5 text-blue-100 hover:bg-[#121c3d] text-xs rounded-b-[20px]"
                href={`/${accountId}/settings`}
                onClick={() => setCompanyMenuOpen(false)}
              >
                Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

