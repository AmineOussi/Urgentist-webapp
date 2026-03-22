'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Select } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { User, Phone, Heart, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const STEPS = [
  { label: 'Identité',    icon: User  },
  { label: 'Contact',     icon: Phone },
  { label: 'Médical',     icon: Heart },
]

const GROUPE_SANGUIN = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const MUTUELLES = ['CNSS','CNOPS','RMA','SAHAM','AXA','Wafa Assurance','Autre','Aucune']
const VILLES_MA = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Kénitra','Tétouan','Autre']

export default function NouveauPatientForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // Identité
    nom: '', prenom: '', sexe: '', dateNaissance: '', cin: '',
    // Contact
    telephone: '', telephoneUrgence: '', contactUrgence: '', email: '', adresse: '', ville: '',
    // Médical
    groupeSanguin: '', mutuelle: '', medecinTraitant: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      toast('success', 'Patient créé', `${form.prenom} ${form.nom} a été ajouté.`)
      router.push(`/patients/${data.id}`)
    } catch (e: any) {
      toast('error', 'Erreur', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Step indicator */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done   = i < step
            const active = i === step
            return (
              <div key={i} className="flex items-center">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                    active && 'bg-brand-50 text-brand-700',
                    done   && 'text-emerald-600 hover:bg-emerald-50 cursor-pointer',
                    !active && !done && 'text-gray-400 cursor-default',
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    active && 'bg-brand-600 text-white',
                    done   && 'bg-emerald-100 text-emerald-600',
                    !active && !done && 'bg-gray-100 text-gray-400',
                  )}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('w-8 h-px mx-1 transition-colors', i < step ? 'bg-emerald-300' : 'bg-gray-100')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form body */}
      <div className="p-6">
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" value={form.prenom} onChange={set('prenom')} required placeholder="Mohammed" />
              <Input label="Nom" value={form.nom} onChange={set('nom')} required placeholder="ALAMI" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Sexe" value={form.sexe} onChange={set('sexe')} required>
                <option value="">— Choisir —</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </Select>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date de naissance</label>
                <DateInput value={form.dateNaissance} onChange={v => setForm(p => ({ ...p, dateNaissance: v }))} />
              </div>
            </div>
            <Input label="CIN" value={form.cin} onChange={set('cin')} placeholder="AB123456" hint="Carte nationale d'identité (optionnel)" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Téléphone" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="06 12 34 56 78" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="patient@email.ma" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact urgence (nom)" value={form.contactUrgence} onChange={set('contactUrgence')} placeholder="Fatima ALAMI" />
              <Input label="Tél. urgence" type="tel" value={form.telephoneUrgence} onChange={set('telephoneUrgence')} placeholder="06 98 76 54 32" />
            </div>
            <Input label="Adresse" value={form.adresse} onChange={set('adresse')} placeholder="123 Rue Mohammed V" />
            <Select label="Ville" value={form.ville} onChange={set('ville')}>
              <option value="">— Choisir —</option>
              {VILLES_MA.map(v => <option key={v} value={v}>{v}</option>)}
            </Select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Groupe sanguin" value={form.groupeSanguin} onChange={set('groupeSanguin')}>
                <option value="">— Inconnu —</option>
                {GROUPE_SANGUIN.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Select label="Mutuelle" value={form.mutuelle} onChange={set('mutuelle')}>
                <option value="">— Aucune —</option>
                {MUTUELLES.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            <Input label="Médecin traitant" value={form.medecinTraitant} onChange={set('medecinTraitant')} placeholder="Dr. Khalid BENNANI" />

            {/* Summary */}
            <div className="mt-2 p-4 bg-gray-50 rounded-xl space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Récapitulatif</p>
              <SummaryLine label="Nom complet" value={`${form.prenom} ${form.nom}`} />
              <SummaryLine label="Sexe / Âge" value={`${form.sexe === 'M' ? 'Homme' : form.sexe === 'F' ? 'Femme' : '—'}${form.dateNaissance ? ` · né(e) le ${form.dateNaissance}` : ''}`} />
              <SummaryLine label="CIN" value={form.cin || '—'} />
              <SummaryLine label="Téléphone" value={form.telephone || '—'} />
              <SummaryLine label="Ville" value={form.ville || '—'} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Précédent
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            variant="primary"
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && (!form.prenom || !form.nom || !form.sexe)}
            iconRight={<ChevronRight className="w-4 h-4" />}
          >
            Suivant
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={submit}
            loading={loading}
            disabled={!form.prenom || !form.nom || !form.sexe}
            icon={<Check className="w-4 h-4" />}
          >
            Créer le patient
          </Button>
        )}
      </div>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium text-right">{value}</span>
    </div>
  )
}
