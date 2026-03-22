#!/usr/bin/env tsx
// ──────────────────────────────────────────────────────────────
//  USS-I.COM — Seed données de développement
//  Usage: npm run db:seed
// ──────────────────────────────────────────────────────────────

import { PrismaClient, Triage, Sexe, StatutVisite } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding USS-I database...')

  // ── Boxes (si pas déjà créés par la migration) ────────────
  const boxCount = await prisma.box.count()
  if (boxCount === 0) {
    await prisma.box.createMany({
      data: [
        { numero: 1, nom: 'Box 1',         type: 'standard'   },
        { numero: 2, nom: 'Box 2',         type: 'standard'   },
        { numero: 3, nom: 'Box 3',         type: 'standard'   },
        { numero: 4, nom: 'Box Réa',       type: 'reanimation' },
        { numero: 5, nom: 'Box Plâtre',    type: 'platre'     },
        { numero: 6, nom: 'Box Isolement', type: 'isolement'  },
      ],
    })
    console.log('  ✅ Boxes créés')
  }

  // ── Patients de test ─────────────────────────────────────
  const patient1 = await prisma.patient.upsert({
    where:  { cin: 'AB123456' },
    update: {},
    create: {
      cin:           'AB123456',
      nom:           'BENNANI',
      prenom:        'Rachid',
      dateNaissance: new Date('1966-03-15'),
      sexe:          Sexe.M,
      telephone:     '0661-234567',
      groupeSanguin: 'A+',
      mutuelle:      'CNSS',
      medecinTraitant: 'Dr. Alaoui',
    },
  })

  const patient2 = await prisma.patient.upsert({
    where:  { cin: 'CD789012' },
    update: {},
    create: {
      cin:           'CD789012',
      nom:           'ZIANI',
      prenom:        'Fatima',
      dateNaissance: new Date('1990-07-22'),
      sexe:          Sexe.F,
      telephone:     '0662-345678',
      groupeSanguin: 'O-',
      mutuelle:      'CNOPS',
    },
  })

  // ── Allergies ─────────────────────────────────────────────
  await prisma.allergie.createMany({
    data: [
      { patientId: patient1.id, substance: 'Pénicilline', reaction: 'Urticaire',    severite: 'moderee', confirmee: true },
      { patientId: patient1.id, substance: 'AINS',        reaction: 'Bronchospasme', severite: 'severe', confirmee: true },
    ],
    skipDuplicates: true,
  })

  // ── Antécédents ───────────────────────────────────────────
  await prisma.antecedent.createMany({
    data: [
      { patientId: patient1.id, type: 'medical',            description: 'HTA depuis 2018',    dateDebut: new Date('2018-01-01'), actif: true },
      { patientId: patient1.id, type: 'medical',            description: 'Diabète type 2',     dateDebut: new Date('2020-06-01'), actif: true },
      { patientId: patient1.id, type: 'chirurgical',        description: 'Appendicectomie',    dateDebut: new Date('2005-03-10'), actif: true },
      { patientId: patient1.id, type: 'traitement_habituel', description: 'Metformine 1g — 2x/j', actif: true },
      { patientId: patient1.id, type: 'traitement_habituel', description: 'Amlodipine 5mg — 1x/j', actif: true },
    ],
    skipDuplicates: true,
  })

  // ── Visite en cours ───────────────────────────────────────
  const box2 = await prisma.box.findFirst({ where: { numero: 2 } })

  const visite = await prisma.visite.create({
    data: {
      patientId:  patient1.id,
      triage:     Triage.P1,
      motif:      'Douleur thoracique',
      statut:     StatutVisite.EN_COURS,
      boxId:      box2?.id,
    },
  })

  // ── Constantes vitales ─────────────────────────────────────
  const constantes = [
    { releveAt: new Date('2026-01-18T08:12:00'), taSystolique: 155, taDiastolique: 95, fc: 102, spo2: 96, temperature: 38.5, eva: 8 },
    { releveAt: new Date('2026-01-18T09:00:00'), taSystolique: 148, taDiastolique: 92, fc: 108, spo2: 95, temperature: 38.4, eva: 8 },
    { releveAt: new Date('2026-01-18T09:46:00'), taSystolique: 143, taDiastolique: 90, fc: 112, spo2: 93, temperature: 38.2, eva: 7 },
    { releveAt: new Date('2026-01-18T10:30:00'), taSystolique: 138, taDiastolique: 88, fc: 110, spo2: 94, temperature: 38.2, eva: 7 },
    { releveAt: new Date('2026-01-18T11:15:00'), taSystolique: 135, taDiastolique: 85, fc: 105, spo2: 95, temperature: 38.0, eva: 6 },
  ]

  for (const c of constantes) {
    await prisma.constantesVitales.create({ data: { visiteId: visite.id, ...c } })
  }

  // ── Bilans ────────────────────────────────────────────────
  await prisma.bilan.createMany({
    data: [
      { visiteId: visite.id, code: 'NFS',  libelle: 'Numération Formule Sanguine', type: 'biologie', statut: 'CRITIQUE',           resultat: 'GB 14.2 G/L ↑', isCritique: true,  resultatAt: new Date('2026-01-18T10:45:00') },
      { visiteId: visite.id, code: 'CRP',  libelle: 'C-Réactive Protéine',         type: 'biologie', statut: 'RESULTAT_DISPONIBLE', resultat: '48 mg/L ↑',      isCritique: false, resultatAt: new Date('2026-01-18T10:45:00') },
      { visiteId: visite.id, code: 'TROP', libelle: 'Troponine I',                 type: 'biologie', statut: 'RESULTAT_DISPONIBLE', resultat: '< 0.01 ng/mL',   isCritique: false, resultatAt: new Date('2026-01-18T10:45:00') },
      { visiteId: visite.id, code: 'DDI',  libelle: 'D-Dimères',                   type: 'biologie', statut: 'PRESCRIT' },
      { visiteId: visite.id, code: 'ECG',  libelle: 'ECG 12 dérivations',          type: 'ecg',      statut: 'RESULTAT_DISPONIBLE', resultat: 'Rythme sinusal, pas de sus-ST', isCritique: false, resultatAt: new Date('2026-01-18T09:15:00') },
      { visiteId: visite.id, code: 'RX',   libelle: 'Radio Thorax F/P',            type: 'imagerie', statut: 'PRESCRIT' },
    ],
  })

  console.log('  ✅ Patients, visites, constantes et bilans de test créés')
  console.log('\n🎉 Seed terminé !')
  console.log(`   Patient 1: ${patient1.prenom} ${patient1.nom} (${patient1.cin})`)
  console.log(`   Patient 2: ${patient2.prenom} ${patient2.nom} (${patient2.cin})`)
  console.log(`   Visite active: ${visite.id}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
