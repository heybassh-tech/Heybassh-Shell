"use client"

interface FrontOfficeGenericTabProps {
  activeLabel: string
}

export function FrontOfficeGenericTab({ activeLabel }: FrontOfficeGenericTabProps) {
  return (
    <div className="card rounded-[32px] bg-[#0e1629]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{activeLabel}</h2>
        <p className="mt-1 text-sm text-blue-200">Front Office application module.</p>
      </div>
    </div>
  )
}

