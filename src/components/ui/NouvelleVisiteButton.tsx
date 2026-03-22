'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus, AlertCircle } from 'lucide-react'

const TRIAGE = [
  { value: 'P1', label: 'P1', sub: 'Immédiat',    cls: 'border-red-300    bg-red-50    text-red-700',    active: 'border-red-500    bg-red-100    ring-2 ring-red-300' },
  { value: 'P2', label: 'P2', sub: 'Urgent',       cls: 'border-orange-300 bg-orange-50 text-orange-700', active: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300' },
  { value: 'P3', label: 'P3', sub: 'Semi-urgent',  cls: 'border-amber-300  bg-amber-50  text-amber-700',  active: 'border-amber-500  bg-amber-100  ring-2 ring-amber-300' },
  { value: 'P4', label: 'P4', sub: 'Non urgent',   cls: 'border-emerald-300 bg-emerald-50 text-emerald-700', active: 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300' },
]

export default function NouvelleVisiteButton() {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [cin,    setCin]    = useState('')
  const [motif,  setMotif]  = useState('')
  const [triage, setTriage] = useState('P3')

  function reset() { setCin(''); setMotif(''); setTriage('P3'); setError(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res  = await fetch('/api/visites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cin, motif, triage }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    setOpen(false)
    reset()
    router.refresh()
    router.push(`/patients/${data.patientId}?visite=${data.id}`)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} icon={<Plus className="w-4 h-4" />}>
        Nouvelle visite
      </Button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        title="Nouvelle visite"
        description="Saisir le CIN du patient et le niveau de triage."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setOpen(false); reset() }}>Annuler</Button>
            <Button form="visite-form" type="submit" loading={loading} disabled={!cin || !triage}>
              Créer la visite
            </Button>
          </>
        }
      >
        <form id="visite-form" onSubmit={submit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Input
            label="CIN patient"
            required
            value={cin}
            onChange={e => setCin(e.target.value.toUpperCase())}
            placeholder="AB123456"
            hint="Le patient doit déjà être enregistré."
          />

          {/* Triage selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Niveau de triage *</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIAGE.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTriage(t.value)}
                  className={cn(
                    'flex flex-col items-center py-3 rounded-xl border-2 transition-all text-center',
                    triage === t.value ? t.active : t.cls + ' hover:opacity-90',
                  )}
                >
                  <span className="text-base font-bold leading-none">{t.label}</span>
                  <span className="text-[11px] mt-0.5 opacity-80">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Motif"
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Douleur thoracique, fièvre…"
          />
        </form>
      </Modal>
    </>
  )
}
