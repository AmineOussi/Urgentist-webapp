// ──────────────────────────────────────────────────────────────
//  USS-I.COM — Database access via Supabase JS (REST API)
//  Replaces Prisma — uses HTTPS, no TCP to PostgreSQL needed.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service-role client: bypasses RLS, server-only.
//
// IMPORTANT — cache: 'no-store' on the global fetch override:
// Next.js 14 App Router wraps the native fetch and caches results
// by default (even for non-GET requests made by third-party libs).
// Without this, Supabase JS's internal fetch calls get cached on
// the first request, so subsequent calls return stale data until
// the ISR TTL expires. Setting cache: 'no-store' at the client
// level ensures every query hits the Supabase REST API fresh.
export const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: {
    fetch: (url, options = {}) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
})
