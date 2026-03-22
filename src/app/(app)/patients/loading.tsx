// Route-level loading skeleton for /patients

function PatientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 animate-pulse">
      {/* Avatar */}
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      {/* Name + meta */}
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-40 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      {/* CIN */}
      <div className="skeleton h-3 w-24 rounded hidden sm:block" />
      {/* Age */}
      <div className="skeleton h-3 w-12 rounded hidden md:block" />
      {/* Phone */}
      <div className="skeleton h-3 w-28 rounded hidden lg:block" />
      {/* Date */}
      <div className="skeleton h-3 w-20 rounded hidden xl:block" />
      {/* Arrow */}
      <div className="skeleton w-4 h-4 rounded" />
    </div>
  )
}

function PatientCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
        <div className="skeleton w-5 h-5 rounded" />
      </div>
      <div className="skeleton h-3 w-36 rounded" />
    </div>
  )
}

export default function PatientsLoading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5 min-h-screen bg-[#F0F4F8]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-32 rounded-xl" />
          <div className="skeleton h-3.5 w-48 rounded" />
        </div>
        <div className="skeleton h-9 w-36 rounded-xl" />
      </div>

      {/* Search bar */}
      <div className="skeleton h-11 w-full max-w-lg rounded-2xl" />

      {/* Table desktop */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Thead */}
        <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex items-center gap-6">
          {[120, 80, 100, 80, 120, 100].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <PatientRowSkeleton key={i} />
        ))}
      </div>

      {/* Cards mobile */}
      <div className="sm:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-8 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
