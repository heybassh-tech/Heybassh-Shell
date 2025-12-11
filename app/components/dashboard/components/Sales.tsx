type Module = {
  id: string
  title: string
  description: string
}

const salesModules: Module[] = [
  {
    id: "appointment_scheduling",
    title: "Appointment Scheduling",
    description: "Let prospects pick times that sync with rep calendars, reminders, and buffers.",
  },
  {
    id: "ai_sales_assistants",
    title: "AI Sales Assistants",
    description: "Use AI to prep calls, summarize meetings, and surface next-best actions automatically.",
  },
  {
    id: "video_selling",
    title: "Video Selling",
    description: "Record and send personalized videos that move deals forward asynchronously.",
  },
  {
    id: "sales_automation",
    title: "Sales Automation",
    description: "Automate follow-ups, tasks, and handoffs so nothing slips through the cracks.",
  },
  {
    id: "sales_analytics",
    title: "Sales Analytics",
    description: "Track pipeline health, win rates, and rep performance with actionable dashboards.",
  },
]

export function Sales() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Sales</h2>
        <p className="mt-1 text-sm text-blue-200">
          Focused tools to schedule, automate, and close more revenue.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {salesModules.map((module) => (
          <div
            key={module.id}
            className="flex h-full flex-col justify-between rounded-[24px] border border-[#141f3b] bg-[#0c142a] p-5 shadow-[0_18px_40px_-28px_rgba(39,172,255,0.5)]"
          >
            <div>
              <h3 className="text-base font-semibold text-white">{module.title}</h3>
              <p className="mt-2 text-sm text-blue-200">{module.description}</p>
            </div>
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#5dd4ff] hover:text-white">
              Open ↗
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}







