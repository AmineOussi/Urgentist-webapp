// ──────────────────────────────────────────────────────────────
//  GET /api/stats — dashboard statistics
//  Returns aggregated metrics for the statistiques page.
// ──────────────────────────────────────────────────────────────
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Date helpers
  const now      = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo  = new Date(today.getTime() - 7  * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    { count: totalPatients },
    { count: visitesToday },
    { count: visitesEnAttente },
    { count: visitesEnCours },
    { count: visitesTerminees },
    { data: visites30j },
    { data: triageStats },
    { data: orientationStats },
    { data: visits7days },
  ] = await Promise.all([
    // Total patients
    db.from('patients').select('*', { count: 'exact', head: true }),

    // Visites today
    db.from('visites').select('*', { count: 'exact', head: true })
      .gte('createdAt', today.toISOString()),

    // En attente
    db.from('visites').select('*', { count: 'exact', head: true })
      .eq('statut', 'EN_ATTENTE'),

    // En cours
    db.from('visites').select('*', { count: 'exact', head: true })
      .eq('statut', 'EN_COURS'),

    // Terminées (all time)
    db.from('visites').select('*', { count: 'exact', head: true })
      .eq('statut', 'TERMINE'),

    // Visites last 30 days (for trend chart)
    db.from('visites')
      .select('createdAt, triage, statut, orientation')
      .gte('createdAt', monthAgo.toISOString())
      .order('createdAt', { ascending: true }),

    // Triage distribution
    db.from('visites')
      .select('triage')
      .gte('createdAt', monthAgo.toISOString()),

    // Orientation breakdown (last 30 days)
    db.from('visites')
      .select('orientation')
      .eq('statut', 'TERMINE')
      .gte('createdAt', monthAgo.toISOString()),

    // Daily visits last 7 days (for mini bar chart)
    db.from('visites')
      .select('createdAt')
      .gte('createdAt', weekAgo.toISOString()),
  ])

  // ── Aggregate daily visits for last 7 days ──────────────────
  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const v of (visits7days ?? [])) {
    const key = new Date(v.createdAt).toISOString().slice(0, 10)
    if (key in dailyMap) dailyMap[key]++
  }
  const dailyVisits = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  // ── Triage distribution ────────────────────────────────────
  const triageMap: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
  for (const v of (triageStats ?? [])) {
    if (v.triage && v.triage in triageMap) triageMap[v.triage]++
  }
  const triageData = Object.entries(triageMap).map(([triage, count]) => ({ triage, count }))

  // ── Orientation breakdown ──────────────────────────────────
  const orientMap: Record<string, number> = {}
  for (const v of (orientationStats ?? [])) {
    if (v.orientation) {
      orientMap[v.orientation] = (orientMap[v.orientation] ?? 0) + 1
    }
  }
  const orientData = Object.entries(orientMap).map(([orientation, count]) => ({ orientation, count }))

  // ── Monthly trend (daily aggregation of last 30 days) ──────
  const monthMap: Record<string, number> = {}
  for (const v of (visites30j ?? [])) {
    const key = new Date(v.createdAt).toISOString().slice(0, 10)
    monthMap[key] = (monthMap[key] ?? 0) + 1
  }
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    kpis: {
      totalPatients:    totalPatients    ?? 0,
      visitesToday:     visitesToday     ?? 0,
      visitesEnAttente: visitesEnAttente ?? 0,
      visitesEnCours:   visitesEnCours   ?? 0,
      visitesTerminees: visitesTerminees ?? 0,
    },
    dailyVisits,
    triageData,
    orientData,
    monthlyTrend,
  })
}
