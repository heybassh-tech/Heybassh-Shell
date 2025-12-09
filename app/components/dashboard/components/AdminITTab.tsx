"use client"

import { Pill } from "./Pill"

export function AdminITTab() {
  return (
    <div className="card rounded-[32px] bg-[#0e1629]">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">IT Operations</h2>
          <p className="mt-1 text-sm text-blue-200">
            Track fleet health, resolve incidents, and power automations used by customer teams.
          </p>
        </div>
        <Pill>IT</Pill>
      </div>
      <div className="rounded-[28px] border border-dashed border-[#1a2446] bg-[#070d20] p-6 text-sm text-blue-200">
        IT workspace coming soon. Connect device inventory, approval flows, and monitoring alerts here.
      </div>
    </div>
  )
}

