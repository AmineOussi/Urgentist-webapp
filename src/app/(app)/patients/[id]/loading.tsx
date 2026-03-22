// Route-level loading skeleton for /patients/[id]
// Mirrors the layout of PatientView: sticky header + tabs + content

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton w-7 h-7 rounded-xl" />
      </div>
      <div className="skeleton h-8 w-20 rounded-lg" />
      <div className="skeleton h-2.5 w-full rounded-full" />
    </div>
  )
}

function ConstantesTabSkeleton() {
  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      {/* History table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-8 w-28 rounded-xl" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
            <div className="skeleton h-3 w-16 rounded" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="skeleton h-5 w-14 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PatientDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">

      {/* ── Sticky header skeleton ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Top bar */}
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div className="skeleton h-5 w-20 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="skeleton h-7 w-32 rounded-xl" />
              <div className="skeleton h-7 w-24 rounded-xl" />
            </div>
          </div>

          {/* Patient identity */}
          <div className="flex items-center gap-4 py-4 animate-pulse">
            {/* Avatar */}
            <div className="skeleton w-14 h-14 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              {/* Name + badges */}
              <div className="flex items-center gap-2">
                <div className="skeleton h-5 w-48 rounded-lg" />
                <div className="skeleton h-6 w-10 rounded-xl" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3">
                <div className="skeleton h-3.5 w-16 rounded" />
                <div className="skeleton h-3.5 w-12 rounded" />
                <div className="skeleton h-5 w-10 rounded-full" />
                <div className="skeleton h-3.5 w-24 rounded" />
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-0.5">
            {['Constantes', 'SOAP', 'Bilans', 'Ordonnances', 'Infos'].map((label, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-3">
                <div className="skeleton w-4 h-4 rounded" />
                <div className="skeleton h-3.5 rounded hidden sm:block" style={{ width: label.length * 7 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content skeleton (defaults to Constantes) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <ConstantesTabSkeleton />
      </div>
    </div>
  )
}
