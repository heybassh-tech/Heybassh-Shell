"use client"

import { Pill } from "./Pill"

export function AdminOverviewTab() {
  return (
    <div className="card rounded-[32px] bg-[#0e1629]">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Admin Control Center</h2>
          <p className="mt-1 text-sm text-blue-200">
            Configure governance settings, review access, and keep your workspace compliant.
          </p>
        </div>
        <Pill>Compliance</Pill>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-[#1a2446] bg-[#070d20] p-5">
          <p className="text-xs uppercase tracking-wide text-blue-300">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold text-white">4</p>
          <p className="mt-1 text-sm text-blue-200">Access requests awaiting approval</p>
        </div>
        <div className="rounded-[28px] border border-[#1a2446] bg-[#070d20] p-5">
          <p className="text-xs uppercase tracking-wide text-blue-300">Policies</p>
          <p className="mt-2 text-3xl font-semibold text-white">12</p>
          <p className="mt-1 text-sm text-blue-200">Active governance rules</p>
        </div>
      </div>
    </div>
  )
}

