'use client'

/**
 * useClinicSettings
 * ─────────────────
 * Fetches clinic settings from /api/settings once per session
 * and caches them in module-level state (shared across all
 * components that call this hook in the same render tree).
 */

import { useEffect, useState } from 'react'

export interface ClinicSettings {
  nom?:      string
  adresse?:  string
  telephone?: string
  email?:    string
  doctor?:   string
  rpps?:     string
  logoUrl?:  string | null
}

// Module-level cache — avoids refetching on every mount
let _cache:    ClinicSettings | null = null
let _fetching: Promise<ClinicSettings> | null = null

async function fetchSettings(): Promise<ClinicSettings> {
  if (_cache) return _cache
  if (_fetching) return _fetching

  _fetching = fetch('/api/settings')
    .then(r => (r.ok ? r.json() : {}))
    .then(data => { _cache = data; return data })
    .catch(() => ({}))
    .finally(() => { _fetching = null })

  return _fetching
}

// Invalidate cache (call after saving settings)
export function invalidateClinicSettings() {
  _cache = null
}

export function useClinicSettings() {
  const [settings, setSettings] = useState<ClinicSettings>(_cache ?? {})
  const [loading,  setLoading]  = useState(!_cache)

  useEffect(() => {
    if (_cache) { setSettings(_cache); setLoading(false); return }
    fetchSettings().then(s => { setSettings(s); setLoading(false) })
  }, [])

  return { settings, loading }
}
