type Module = {
  id: string
  title: string
  description: string
}

const marketingModules: Module[] = [
  {
    id: "forms_live_chat",
    title: "Forms & Live Chat",
    description: "Capture leads from forms and chat, then route them to the right owner in seconds.",
  },
  {
    id: "call_to_action",
    title: "Call-To-Action",
    description: "Design and test CTAs that turn visitors into pipeline with clear performance visibility.",
  },
  {
    id: "social",
    title: "Social",
    description: "Schedule, publish, and monitor your social channels with unified analytics.",
  },
  {
    id: "ads",
    title: "Ads",
    description: "Plan and track campaigns with budgets, approvals, and creative checklists.",
  },
  {
    id: "events",
    title: "Events",
    description: "Manage webinars and live events with invites, attendance, and follow-up tasks.",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Group assets, audiences, and reporting to see which campaigns drive revenue.",
  },
  {
    id: "lead_scoring",
    title: "Lead Scoring",
    description: "Score leads using fit and engagement so sales knows who to call first.",
  },
  {
    id: "seo_analytics",
    title: "SEO & Analytics",
    description: "Track rankings, crawl health, and content performance across your site.",
  },
  {
    id: "reviews",
    title: "Reviews",
    description: "Collect, respond to, and showcase customer reviews from one workspace.",
  },
  {
    id: "referral_system",
    title: "Referral System",
    description: "Run referral programs with invites, rewards, and attribution you can trust.",
  },
]

export function Marketing() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Marketing</h2>
        <p className="mt-1 text-sm text-blue-200">
          Jump into modules your team uses most.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketingModules.map((module) => (
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

