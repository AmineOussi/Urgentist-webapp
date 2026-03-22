'use client'

/**
 * useRefreshing
 * ─────────────
 * Wraps router.refresh() with a loading state.
 * Shows a subtle top-bar progress indicator while the server
 * re-fetches data after a mutation.
 *
 * Usage:
 *   const { refreshing, refresh } = useRefreshing()
 *   await someApiCall()
 *   refresh()   // fires router.refresh() + sets refreshing=true
 *               // automatically clears when the new RSC payload arrives
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function useRefreshing() {
  const router            = useRouter()
  const [pending, start]  = useTransition()
  const [refreshing, set] = useState(false)
  const timerRef          = useRef<NodeJS.Timeout | null>(null)

  // Mirror the transition "pending" into our state, with a min-display
  // of 400ms so the skeleton flash is never too jarring.
  useEffect(() => {
    if (pending) {
      set(true)
      if (timerRef.current) clearTimeout(timerRef.current)
    } else {
      // Keep refreshing=true for at least 400ms even if the transition
      // resolves instantly (e.g. cached response).
      timerRef.current = setTimeout(() => set(false), 400)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pending])

  const refresh = useCallback(() => {
    start(() => { router.refresh() })
  }, [router, start])

  return { refreshing, refresh }
}
