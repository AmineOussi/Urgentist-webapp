'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function WaitTimer({ from, triage }: { from: string; triage: string }) {
  const [mins, setMins] = useState(0)

  useEffect(() => {
    function update() {
      setMins(Math.floor((Date.now() - new Date(from).getTime()) / 60000))
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [from])

  const urgent = (triage === 'P1' && mins > 0) || (triage === 'P2' && mins > 20) || (triage === 'P3' && mins > 60)

  const display = mins < 60
    ? `${mins}m`
    : `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}`

  return (
    <span className={cn(
      'font-mono text-xs font-semibold tabular-nums',
      urgent ? 'text-red-600' : 'text-gray-500',
    )}>
      {display}
    </span>
  )
}
