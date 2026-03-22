'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PatientsSearch({ defaultValue }: { defaultValue: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(defaultValue)

  const submit = useCallback((v: string) => {
    const params = new URLSearchParams()
    if (v.trim().length >= 2) params.set('q', v.trim())
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname])

  return (
    <form
      onSubmit={e => { e.preventDefault(); submit(value) }}
      className="relative max-w-md"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        value={value}
        onChange={e => {
          setValue(e.target.value)
          if (e.target.value.length === 0) submit('')
        }}
        placeholder="Rechercher par nom, CIN, téléphone…"
        className={cn(
          'w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900',
          'placeholder-gray-400 shadow-sm',
          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all'
        )}
      />
      {value && (
        <button type="button" onClick={() => { setValue(''); submit('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
