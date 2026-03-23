import { cn } from '@/lib/utils'

// ── Primitive ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

// ── Generic rows ───────────────────────────────────────────────
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 animate-pulse">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex gap-8">
        {[80, 120, 160, 100, 80].map((w, i) => (
          <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3 animate-pulse">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

// ── Constantes tab ─────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="w-7 h-7 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-2.5 w-full rounded-full" />
    </div>
  )
}

export function SkeletonConstantesTab() {
  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      {/* History header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0">
            <Skeleton className="h-3 w-16 rounded" />
            {[14, 14, 14, 14, 14].map((_, j) => (
              <Skeleton key={j} className="h-5 w-14 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SOAP tab ───────────────────────────────────────────────────
export function SkeletonSoapTab() {
  return (
    <div className="space-y-4">
      {[
        { w: 'w-16', color: 'bg-blue-200',   label: 'w-20' },
        { w: 'w-20', color: 'bg-purple-200', label: 'w-16' },
        { w: 'w-24', color: 'bg-orange-200', label: 'w-24' },
        { w: 'w-16', color: 'bg-green-200',  label: 'w-20' },
      ].map(({ color, label }, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
          <div className={cn('flex items-center gap-3 px-5 py-3 border-b border-gray-50 border-l-4', color)}>
            <Skeleton className={cn('h-5 w-5 rounded-lg')} />
            <Skeleton className={cn('h-4 rounded', label)} />
          </div>
          <div className="p-4 space-y-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Bilans tab ─────────────────────────────────────────────────
export function SkeletonBilansTab() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded animate-pulse" />
        <Skeleton className="h-8 w-32 rounded-xl animate-pulse" />
      </div>
      {/* Bilan cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Ordonnances tab ────────────────────────────────────────────
export function SkeletonOrdonnancesTab() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>
      {/* Cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
          <div className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="w-4 h-4 rounded" />
          </div>
          <div className="border-t border-gray-50 divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── InfoPatient tab ────────────────────────────────────────────
export function SkeletonInfoTab() {
  return (
    <div className="space-y-6">
      {/* Allergies */}
      <section className="space-y-3">
        <div className="flex items-center justify-between animate-pulse">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 animate-pulse">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <Skeleton className="flex-1 h-3.5 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
      {/* Antécédents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between animate-pulse">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 animate-pulse">
              <Skeleton className="w-7 h-7 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Documents tab ──────────────────────────────────────────────
export function SkeletonDocumentsTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-gray-100" />
            <div className="p-3 space-y-1.5">
              <Skeleton className="h-3 w-2/3 rounded" />
              <Skeleton className="h-2.5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ── Vue générale tab ───────────────────────────────────────────
export function SkeletonVueGeneraleTab() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Alert banner */}
      <Skeleton className="h-10 w-full rounded-xl" />
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-7 h-7 rounded-xl" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton className="w-4 h-4 rounded" />
            </div>
            {/* Card body */}
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonHistoriqueTab() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="w-0.5 bg-gray-100 flex-1 mt-1" />
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <div className="space-y-2 pl-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
