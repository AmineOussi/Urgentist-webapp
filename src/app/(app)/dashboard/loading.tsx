// Route-level loading skeleton for /dashboard
// Shown by Next.js App Router while the async page.tsx is streaming

import { SkeletonCard } from '@/components/ui/skeleton'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 animate-pulse">
      {/* Triage badge */}
      <div className="skeleton w-9 h-9 rounded-xl" />
      {/* Name + motif */}
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-36 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      {/* Age */}
      <div className="skeleton h-3 w-10 rounded hidden sm:block" />
      {/* Wait time */}
      <div className="skeleton h-6 w-16 rounded-full hidden md:block" />
      {/* Box */}
      <div className="skeleton h-5 w-14 rounded-lg hidden lg:block" />
      {/* Statut */}
      <div className="skeleton h-6 w-20 rounded-full" />
      {/* Arrow */}
      <div className="skeleton w-4 h-4 rounded" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6 min-h-screen bg-[#F0F4F8]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-44 rounded-xl" />
          <div className="skeleton h-3.5 w-32 rounded" />
        </div>
        <div className="skeleton h-9 w-36 rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>

      {/* Table desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Thead */}
        <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex items-center gap-4">
          {[60, 120, 80, 100, 90, 100, 80].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
              <div className="skeleton h-6 w-8 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
