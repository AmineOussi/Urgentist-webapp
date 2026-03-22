#!/usr/bin/env tsx
// ──────────────────────────────────────────────────────────────
//  USS-I.COM — Import référentiel médicaments CNOPS 2014
//  Fichier source : ref-des-medicaments-cnops-2014.xlsx
//
//  Usage:
//    npm run db:seed-meds
//  ou:
//    tsx scripts/import-medicaments.ts
//
//  Prérequis : npx prisma generate doit avoir été exécuté
// ──────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Chemin du fichier CNOPS (adapter si nécessaire)
const XLSX_PATH = path.resolve(
  process.cwd(),
  '../ref-des-medicaments-cnops-2014.xlsx'
)

// ── Mapping colonnes Excel → champs Prisma ────────────────────
// D'après l'analyse du fichier (12 colonnes) :
// EAN | NOM_COMMERCIAL | DCI | DOSAGE | FORME | PRESENTATION |
// PPV | PH | PRIX_BR | PRINCEPS_GENERIQUE | TAUX_REMBOURSEMENT | LABORATOIRE

interface CnopsRow {
  EAN:                  string | number
  NOM_COMMERCIAL:       string
  DCI:                  string
  DOSAGE?:              string
  FORME?:               string
  PRESENTATION?:        string
  PPV?:                 number | string
  PH?:                  number | string   // Prix Hospitalier
  PRIX_BR?:             number | string   // Prix Base Remboursement
  PRINCEPS_GENERIQUE?:  string            // "P" ou "G"
  TAUX_REMBOURSEMENT?:  number | string   // 0 ou 70
  LABORATOIRE?:         string
}

function parseFloat2(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val).replace(',', '.'))
  return isNaN(n) ? null : Math.round(n * 100) / 100
}

function parseInt2(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  const n = parseInt(String(val))
  return isNaN(n) ? 0 : n
}

async function main() {
  console.log('🔄 Lecture du fichier CNOPS...')

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ Fichier introuvable : ${XLSX_PATH}`)
    console.error('   Adapter XLSX_PATH dans ce script.')
    process.exit(1)
  }

  const workbook = XLSX.readFile(XLSX_PATH)
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows: CnopsRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null })

  console.log(`📋 ${rows.length} médicaments trouvés`)

  // Vider la table avant import (on réimporte tout)
  const deleted = await prisma.medicament.deleteMany()
  console.log(`🗑  ${deleted.count} anciens enregistrements supprimés`)

  // Import par batch de 500
  const BATCH = 500
  let imported = 0
  let skipped  = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const data  = batch
      .filter(row => row.EAN && row.NOM_COMMERCIAL && row.DCI)
      .map(row => ({
        id:                    String(row.EAN).trim().padStart(13, '0'),
        nomCommercial:         String(row.NOM_COMMERCIAL).trim(),
        dci:                   String(row.DCI).trim(),
        dosage:                row.DOSAGE   ? String(row.DOSAGE).trim()   : null,
        forme:                 row.FORME    ? String(row.FORME).trim()    : null,
        presentation:          row.PRESENTATION ? String(row.PRESENTATION).trim() : null,
        laboratoire:           row.LABORATOIRE  ? String(row.LABORATOIRE).trim()  : null,
        ppv:                   parseFloat2(row.PPV),
        prixHopital:           parseFloat2(row.PH),
        prixBaseRemboursement: parseFloat2(row.PRIX_BR),
        type:                  (String(row.PRINCEPS_GENERIQUE || 'P').trim().toUpperCase() === 'G')
                                 ? ('G' as const) : ('P' as const),
        tauxRemboursement:     parseInt2(row.TAUX_REMBOURSEMENT) === 70 ? 70 : 0,
        actif:                 true,
      }))

    skipped += batch.length - data.length

    await prisma.medicament.createMany({
      data,
      skipDuplicates: true,
    })

    imported += data.length
    process.stdout.write(`\r   ✅ ${imported} / ${rows.length} importés...`)
  }

  console.log(`\n\n🎉 Import terminé !`)
  console.log(`   ✅ ${imported} médicaments importés`)
  console.log(`   ⚠️  ${skipped} lignes ignorées (EAN ou nom manquant)`)

  // Stats
  const total = await prisma.medicament.count()
  const princeps = await prisma.medicament.count({ where: { type: 'P' } })
  const remb = await prisma.medicament.count({ where: { tauxRemboursement: 70 } })
  console.log(`\n📊 Statistiques table medicaments :`)
  console.log(`   Total     : ${total}`)
  console.log(`   Princeps  : ${princeps} | Génériques : ${total - princeps}`)
  console.log(`   Remboursés (70%) : ${remb} | Non remboursés : ${total - remb}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
