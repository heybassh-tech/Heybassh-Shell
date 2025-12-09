"use client"

export function Users() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Users</h2>
      </div>

      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-white">Coming Soon</h3>
          <p className="mt-2 text-sm text-gray-400">
            The Users management feature is currently under development.
          </p>
        </div>
      </div>
    </div>
  )
}


