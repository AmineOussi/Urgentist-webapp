export default function ParametresLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse px-5 md:px-8 py-6 pb-24 md:pb-8 max-w-3xl w-full">
      <div className="space-y-1.5">
        <div className="h-6 w-32 bg-gray-100 rounded-xl" />
        <div className="h-3 w-56 bg-gray-100 rounded-lg" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gray-100" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-36" />
                  <div className="h-2.5 bg-gray-100 rounded w-52" />
                </div>
                <div className="w-10 h-5.5 bg-gray-100 rounded-full shrink-0" style={{ height: '22px' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
