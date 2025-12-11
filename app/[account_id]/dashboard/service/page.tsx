 'use client'

import { PrimaryInput } from "../../../components/PrimaryInput"

export default function Service() {
  return (
    <div className="max-w-[800px] mx-auto p-6">
      <div className="card">
        <h1 className="text-xl font-bold mb-2">Book a Service</h1>
        <p className="text-blue-200 text-sm mb-3">
          Submit a service request; we'll follow up by email.
        </p>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            alert("Submitted (demo)")
          }}
        >
          <PrimaryInput placeholder="Subject" size="lg" className="h-[44px]" />
          <select className="h-[44px] w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-blue-100 focus:border-[#0e6f69]/60 focus:outline-none focus:ring-2 focus:ring-[#0e6f69]/40">
            <option>Website Support</option>
            <option>HubSpot</option>
            <option>Integrations</option>
            <option>AI/Automation</option>
            <option>Custom</option>
          </select>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-blue-100 placeholder:text-blue-200/60 focus:border-[#0e6f69]/60 focus:outline-none focus:ring-2 focus:ring-[#0e6f69]/40"
            rows={5}
            placeholder="Details"
          />
          <button className="btn btn-primary">Submit</button>
        </form>
      </div>
    </div>
  )
}
