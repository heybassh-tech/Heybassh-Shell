"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { Pill } from "./Pill"

interface OverviewTabProps {
  accountId: string
  navigate: (viewKey: string) => void
}

export function OverviewTab({ accountId, navigate }: OverviewTabProps) {
  const router = useRouter()
  const [showModuleMenu, setShowModuleMenu] = useState<{ [key: string]: boolean }>({})

  const handleModuleMenuToggle = (moduleId: string) => {
    setShowModuleMenu((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const overviewModules = [
    {
      id: "overview_customers",
      title: "Customer Module",
      description: "Contacts, companies, deals, products & more.",
      action: () => navigate("customers_contacts"),
    },
    {
      id: "overview_billing",
      title: "Billing Lite Module",
      description: "Quotes, invoices, Stripe/Woo sync.",
      action: () => navigate("billing"),
    },
    {
      id: "overview_service",
      title: "Book a Service Module",
      description: "Log a support request or feature task.",
      action: () => router.push(`/${accountId}/dashboard/service`),
    },
    {
      id: "overview_tasks",
      title: "Tasks Module",
      description: "Teamwork-style lists and boards.",
      action: () => navigate("tasks"),
    },
    {
      id: "overview_hr",
      title: "HR / People Module",
      description: "Directory, leave, onboarding.",
      action: () => navigate("hr"),
    },
    {
      id: "overview_admin",
      title: "IT / Admin Module",
      description: "Assets, approvals, access requests.",
      action: () => navigate("admin"),
    },
  ]

  const overviewStats = [
    { id: "leads", label: "Leads this week", value: "128" },
    { id: "closed", label: "Closed Won", value: "$12.4k" },
    { id: "incidents", label: "Incidents", value: "0" },
  ]

  return (
    <div className="grid gap-5">
      <div className="card rounded-[32px] border-[#1f2c56] bg-gradient-to-r from-[#101b38] via-[#0c142a] to-[#060b1a] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-semibold text-white">Welcome</h3>
              <Pill>Module</Pill>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-blue-200">
              Unified navigation, shared auth, and curated module slots so every workflow is a click away.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/${accountId}/dashboard/service`)}
              className="btn btn-gold text-xs font-semibold px-4 py-2 rounded-[26px]"
            >
              Request Support
            </button>
            <button
              onClick={() => navigate("customers_contacts")}
              className="btn text-xs font-semibold rounded-[26px]"
            >
              Explore Modules
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overviewModules.map((module) => (
          <div
            key={module.id}
            className="card rounded-[28px] border-[#1a2446]/80 bg-[#0c142a] p-5 shadow-[0_25px_45px_-35px_rgba(39,172,255,0.65)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">{module.title.split(" ")[0]}</span>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleModuleMenuToggle(module.id)
                  }}
                  className="text-blue-300 hover:text-white p-1 -mr-2"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </button>
                {showModuleMenu[module.id] && (
                  <div className="absolute right-0 z-10 mt-1 w-40 rounded-md bg-[#0e1629] shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button className="block w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-[#1a2446]">
                        Settings
                      </button>
                      <button className="block w-full px-4 py-2 text-left text-sm text-blue-200 hover:bg-[#1a2446]">
                        Customize
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <h4 className="mt-2 text-lg font-semibold text-white">{module.title}</h4>
            <p className="mt-1 text-sm text-blue-200">{module.description}</p>
            <button
              onClick={module.action}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[26px] bg-[#2b9bff] px-4 py-2 text-sm font-semibold text-[#041226] transition hover:brightness-110"
            >
              Open
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewStats.map((stat) => (
          <div key={stat.id} className="card rounded-[28px] border-[#132044] bg-[#050b1c]">
            <p className="text-xs uppercase tracking-wide text-blue-300">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

