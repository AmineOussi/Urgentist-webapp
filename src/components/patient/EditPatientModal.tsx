'use client'

import { useState } from 'react'
import { Modal }     from '@/components/ui/modal'
import { Button }    from '@/components/ui/button'
import { DateInput } from '@/components/ui/date-input'
import { useToast }  from '@/components/ui/toast'
import type { PatientData } from './types'

// ── Constants ──────────────────────────────────────────────────
const GROUPE_SANGUIN = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

const INPUT = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white'
const SELECT = INPUT + ' cursor-pointer'

// ── Field label wrapper ────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  patient:  PatientData
  onClose:  () => void
  onSaved:  () => void
}

// ── Component ─────────────────────────────────────────────────
// NOTE: this component is only rendered when the modal is open.
// The parent should do: {editOpen && <EditPatientModal ... />}
// This guarantees the form always starts fresh from current patient data.
export default function EditPatientModal({ patient, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // Initial state comes directly from props — no useEffect needed
  // because this component mounts fresh every time the modal opens.
  const [nom,             setNom]             = useState(patient.nom ?? '')
  const [prenom,          setPrenom]          = useState(patient.prenom ?? '')
  const [dateNaissance,   setDateNaissance]   = useState(patient.dateNaissance ?? '')
  const [sexe,            setSexe]            = useState(patient.sexe ?? 'M')
  const [cin,             setCin]             = useState(patient.cin ?? '')
  const [telephone,       setTelephone]       = useState(patient.telephone ?? '')
  const [groupeSanguin,   setGroupeSanguin]   = useState(patient.groupeSanguin ?? '')
  const [mutuelle,        setMutuelle]        = useState(patient.mutuelle ?? '')
  const [medecinTraitant, setMedecinTraitant] = useState(patient.medecinTraitant ?? '')

  async function handleSubmit() {
    if (!nom.trim() || !prenom.trim()) {
      toast('error', 'Nom et prénom sont obligatoires')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:             nom.trim(),
          prenom:          prenom.trim(),
          dateNaissance:   dateNaissance || null,
          sexe,
          cin:             cin.trim()             || null,
          telephone:       telephone.trim()       || null,
          groupeSanguin:   groupeSanguin           || null,
          mutuelle:        mutuelle.trim()         || null,
          medecinTraitant: medecinTraitant.trim()  || null,
        }),
      })

      if (res.ok) {
        toast('success', 'Dossier patient mis à jour')
        onSaved()
        onClose()
      } else {
        const json = await res.json().catch(() => ({}))
        toast('error', (json as { error?: string }).error ?? 'Erreur lors de la mise à jour')
      }
    } catch {
      toast('error', 'Erreur réseau — réessayez')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Modifier le dossier patient"
      description="Les modifications sont enregistrées immédiatement."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-5">

        {/* Nom / Prénom */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <input
              className={INPUT}
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              placeholder="Prénom"
              autoFocus
            />
          </Field>
          <Field label="Nom">
            <input
              className={INPUT}
              value={nom}
              onChange={e => setNom(e.target.value.toUpperCase())}
              placeholder="NOM"
            />
          </Field>
        </div>

        {/* Date de naissance / Sexe */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date de naissance">
            <DateInput
              value={dateNaissance}
              onChange={setDateNaissance}
            />
          </Field>
          <Field label="Sexe">
            <select className={SELECT} value={sexe} onChange={e => setSexe(e.target.value)}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="A">Autre</option>
            </select>
          </Field>
        </div>

        {/* CIN / Téléphone */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="CIN / N° pièce d'identité">
            <input
              className={INPUT}
              value={cin}
              onChange={e => setCin(e.target.value)}
              placeholder="A212345"
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              className={INPUT}
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              placeholder="06 XX XX XX XX"
            />
          </Field>
        </div>

        {/* Groupe sanguin / Mutuelle / Médecin traitant */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Groupe sanguin">
            <select className={SELECT} value={groupeSanguin} onChange={e => setGroupeSanguin(e.target.value)}>
              <option value="">—</option>
              {GROUPE_SANGUIN.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Mutuelle / Assurance">
            <input
              className={INPUT}
              value={mutuelle}
              onChange={e => setMutuelle(e.target.value)}
              placeholder="CNSS, CNOPS…"
            />
          </Field>
          <Field label="Médecin traitant">
            <input
              className={INPUT}
              value={medecinTraitant}
              onChange={e => setMedecinTraitant(e.target.value)}
              placeholder="Dr. Dupont"
            />
          </Field>
        </div>

      </div>
    </Modal>
  )
}
