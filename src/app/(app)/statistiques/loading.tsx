export default function StatistiquesLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse px-5 md:px-8 py-6 max-w-7xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-100 rounded-xl" />
          <div className="h-3 w-48 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-gray-100 rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-8 bg-gray-100 rounded w-1/2" />
              <div className="h-2.5 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="h-4 bg-gray-100 rounded w-40 mb-4" />
            <div className="h-20 bg-gray-50 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Chart row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <div className="flex justify-between mb-1.5">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-12" />
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
