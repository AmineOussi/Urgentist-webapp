// ──────────────────────────────────────────────────────────────
//  GET /api/prescriptions/[id]/pdf
//
//  Query params:
//    ?action=download   — return PDF bytes directly (default)
//    ?action=store      — generate, upload to Supabase Storage,
//                         return { url, filename } JSON
//    ?action=preview    — return the HTML print page (legacy)
// ──────────────────────────────────────────────────────────────
import { db }                           from '@/lib/db'
import { NextResponse }                 from 'next/server'
import { createSupabaseServerClient }   from '@/lib/supabase-server'
import { generateOrdonnancePDF }        from '@/lib/pdf/ordonnance'
import { uploadFile, BUCKETS }          from '@/lib/storage'

export const dynamic = 'force-dynamic'

async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Fetch clinic settings ────────────────────────────────────
async function getClinicSettings() {
  try {
    const { data } = await db
      .from('clinic_settings')
      .select('data')
      .eq('id', 1)
      .maybeSingle()
    return (data?.data as Record<string, string>) ?? {}
  } catch {
    return {}
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) return new NextResponse('Non autorisé', { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') ?? 'download'

  // ── Fetch prescription + relations ──────────────────────────
  const { data, error } = await db
    .from('prescriptions')
    .select(`
      id, createdAt, isDraft,
      visite:visites (
        createdAt,
        patient:patients ( nom, prenom, "dateNaissance", cin, sexe, telephone )
      ),
      items:prescription_items (
        id, dose, frequence, duree, voie, instructions,
        medicament:medicaments!medicamentId ( "nomCommercial", dci, dosage, forme )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return new NextResponse('Ordonnance introuvable', { status: 404 })

  const clinicSettings = await getClinicSettings()

  // ── Legacy HTML preview ──────────────────────────────────
  if (action === 'preview') {
    return buildHtmlPreview(data as any, clinicSettings)
  }

  // ── Generate PDF bytes ───────────────────────────────────
  const pdfBytes = await generateOrdonnancePDF({
    prescription:  data as any,
    clinicSettings: {
      nom:     clinicSettings.nom,
      adresse: clinicSettings.adresse,
      doctor:  clinicSettings.doctor,
      rpps:    clinicSettings.rpps,
      logoUrl: clinicSettings.logoUrl ?? null,
    },
  })

  const filename = `ordonnance-${params.id.slice(0, 8)}.pdf`

  // ── Store in Supabase Storage ────────────────────────────
  if (action === 'store') {
    const path = `${params.id}/${filename}`
    const url  = await uploadFile(BUCKETS.prescriptions, path, pdfBytes, 'application/pdf')

    return NextResponse.json({ url, filename })
  }

  // ── Return as download (default) ─────────────────────────
  return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}

// ── HTML fallback (for in-browser print) ────────────────────
function buildHtmlPreview(
  data: any,
  clinic: Record<string, string>,
): NextResponse {
  const patient = data.visite?.patient
  const items   = data.items ?? []
  const date    = new Date(data.visite?.createdAt ?? data.createdAt)
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const patAgeRaw = patient?.dateNaissance
    ? Math.floor((Date.now() - new Date(patient.dateNaissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null
  const patAge = patAgeRaw !== null && patAgeRaw >= 0 ? patAgeRaw : null

  const logoHtml = clinic.logoUrl
    ? `<img src="${clinic.logoUrl}" alt="Logo" style="max-height:40px;max-width:120px;object-fit:contain;">`
    : `<div style="font-size:22px;font-weight:800;color:#1e3a8a;">${clinic.nom || 'USS-I · Urgences'}</div>`

  const itemsHtml = items.map((item: any, i: number) => {
    const med  = item.medicament ?? {}
    const pos  = [item.dose, item.frequence, item.duree].filter(Boolean).join(' — ')
    const voie = item.voie && item.voie !== 'Oral' ? ` · Voie ${item.voie}` : ''
    return `<div class="item">
      <div class="num">${i + 1}</div>
      <div class="body">
        <b>${med.nomCommercial ?? '—'}</b>
        <span class="dci">${[med.dci, med.dosage, med.forme].filter(Boolean).join(' · ')}</span>
        ${pos ? `<div class="pos">${pos}${voie}</div>` : ''}
        ${item.instructions ? `<div class="note">Note : ${item.instructions}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Ordonnance</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#0f172a;background:#e2e8f0}
.page{max-width:210mm;margin:20px auto;background:white;padding:20mm 18mm 24mm;min-height:297mm;display:flex;flex-direction:column;border-radius:4px;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:16px}
.dr{text-align:right}.dr b{font-size:13px;color:#1e3a8a}.dr small{display:block;color:#64748b;font-size:11px;margin-top:2px}
.rx{font-size:42px;font-weight:900;color:#1e3a8a;font-style:italic;margin-bottom:12px}
.pat{background:#f1f5f9;border-left:4px solid #1e3a8a;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px}
.pat-name{font-size:16px;font-weight:800;margin-top:4px}.pat-meta{font-size:11px;color:#64748b;margin-top:4px}
.items{flex:1}.item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #f1f5f9}
.item:last-child{border-bottom:none}
.num{width:26px;height:26px;border-radius:50%;background:#1e3a8a;color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.body{flex:1}.body b{font-size:14px}.dci{font-size:11px;color:#64748b;margin-left:6px}
.pos{font-size:12px;color:#334155;margin-top:3px;font-weight:500}.note{font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:4px;padding:3px 8px;margin-top:5px;font-style:italic}
.ftr{margin-top:auto;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
.sig{text-align:center;min-width:160px}.sig-line{border-top:1.5px solid #334155;margin:36px 0 6px}.sig-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
@media print{body{background:white}.page{margin:0;box-shadow:none;border-radius:0}@page{size:A4;margin:0}}
</style></head><body>
<div class="page">
  <div class="hdr"><div>${logoHtml}<div style="font-size:11px;color:#64748b;margin-top:4px">${clinic.adresse || 'Service des Urgences'}</div></div>
  <div class="dr"><b>ORDONNANCE MÉDICALE</b><small>Le ${date}</small></div></div>
  <div class="rx">℞</div>
  <div class="pat"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.5px">Patient</div>
    <div class="pat-name">${patient ? [patient.prenom, patient.nom].filter(Boolean).join(' ') : '—'}</div>
    <div class="pat-meta">${[patAge != null ? patAge + ' ans' : null, patient?.sexe === 'M' ? 'Masculin' : patient?.sexe === 'F' ? 'Féminin' : null, patient?.cin ? 'CIN : ' + patient.cin : null].filter(Boolean).join(' · ')}</div>
  </div>
  <div class="items">${itemsHtml}</div>
  <div class="ftr"><div style="font-size:10px;color:#94a3b8;max-width:200px">Ordonnance valable 3 mois. Ne pas dépasser les doses prescrites.</div>
  <div class="sig"><div class="sig-line"></div><div class="sig-label">Signature &amp; Cachet du médecin</div></div></div>
</div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})</script>
</body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' } })
}
