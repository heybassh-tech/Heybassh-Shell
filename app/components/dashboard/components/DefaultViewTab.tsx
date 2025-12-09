"use client"

interface DefaultViewTabProps {
  activeLabel: string
}

export function DefaultViewTab({ activeLabel }: DefaultViewTabProps) {
  return (
    <div className="card rounded-[32px] bg-[#0e1629]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{activeLabel}</h2>
        <p className="mt-1 text-sm text-blue-200">
          This is a preview area for <span className="font-medium text-blue-100">{activeLabel}</span>.
        </p>
      </div>
    </div>
  )
}

