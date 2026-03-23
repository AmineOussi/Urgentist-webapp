'use client'

import { useState } from 'react'
import type { Bilan } from '../types'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Plus, FlaskConical, ImageIcon, Heart, FileText, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react'

const BILAN_PRESETS = [
  { category: 'Biologie urgente', items: ['NFS', 'CRP', 'Ionogramme', 'Créatinine', 'Urée', 'TP / TCA', 'Troponine', 'BHC', 'Glycémie', 'Lactates'] },
  { category: 'Imagerie',         items: ['RX Thorax', 'RX Abdomen', 'Écho Abdominale', 'TDM Cérébral', 'TDM Thoracique', 'TDM Abdominal'] },
  { category: 'Cardiologie',      items: ['ECG 12 dérivations', 'Écho cardiaque', 'BNP / NT-proBNP'] },
  { category: 'Microbiologie',    items: ['ECBU', 'Hémocultures x2', 'Coproculture', 'Sérologie COVID'] },
]

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRESCRIT:             { label: 'Prescrit',      color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: <Clock className="w-3.5 h-3.5" /> },
  EN_ATTENTE_RESULTAT:  { label: 'En attente',    color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="w-3.5 h-3.5 animate-spin-slow" /> },
  RESULTAT_DISPONIBLE:  { label: 'Disponible',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CRITIQUE:             { label: 'CRITIQUE',      color: 'bg-red-100 text-red-700 border-red-300',         icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ANNULE:               { label: 'Annulé',        color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: <XCircle className="w-3.5 h-3.5" /> },
}

function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.PRESCRIT
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Modal prescription bilan ──────────────────────────────────
function PrescriptionBilanModal({ visiteId, open, onClose, onMutate }: {
  visiteId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customCode, setCustomCode] = useState('')
  const [customLibelle, setCustomLibelle] = useState('')

  function toggle(item: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  async function submit() {
    const items = Array.from(selected)
    if (customCode && customLibelle) items.push(`${customCode}:${customLibelle}`)
    if (!items.length) return

    setLoading(true)
    let allOk = true
    for (const item of items) {
      const [code, libelle] = item.includes(':') ? item.split(':') : [item, item]
      const type = BILAN_PRESETS[0].items.includes(code) ? 'biologie'
        : BILAN_PRESETS[2].items.includes(code) ? 'cardiologie'
        : BILAN_PRESETS[3].items.includes(code) ? 'microbiologie'
        : 'imagerie'
      const res = await fetch('/api/bilans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visiteId, code, libelle: libelle || code, type }),
      })
      if (!res.ok) allOk = false
    }
    setLoading(false)
    if (allOk) {
      toast('success', `${items.length} bilan${items.length > 1 ? 's' : ''} prescrit${items.length > 1 ? 's' : ''}`)
      setSelected(new Set())
      setCustomCode('')
      setCustomLibelle('')
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de la prescription')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prescrire des bilans"
      description="Sélectionner un ou plusieurs examens à prescrire."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading} disabled={selected.size === 0 && !customLibelle}>
            Prescrire {selected.size > 0 && `(${selected.size})`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {BILAN_PRESETS.map(cat => (
          <div key={cat.category}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{cat.category}</p>
            <div className="flex flex-wrap gap-2">
              {cat.items.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-xl border-2 font-medium transition-all',
                    selected.has(item)
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:text-brand-700',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Examen personnalisé</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())} placeholder="ECG_EFFORT" />
            <Input label="Libellé" value={customLibelle} onChange={e => setCustomLibelle(e.target.value)} placeholder="ECG d'effort" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal saisie résultat ─────────────────────────────────────
function ResultatModal({ bilan, open, onClose, onMutate }: {
  bilan: Bilan; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState(bilan.resultat ?? '')
  const [critique, setCritique] = useState(bilan.isCritique)

  async function submit() {
    setLoading(true)
    const res = await fetch(`/api/bilans/${bilan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultat, isCritique: critique }),
    })
    setLoading(false)
    if (res.ok) {
      toast(critique ? 'error' : 'success', critique ? '⚠ Résultat critique enregistré' : 'Résultat enregistré')
      onClose()
      onMutate()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Résultat — ${bilan.libelle}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={loading} variant={critique ? 'danger' : 'primary'}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Valeur / Résultat</label>
          <textarea
            value={resultat}
            onChange={e => setResultat(e.target.value)}
            rows={3}
            placeholder="Saisir le résultat ou la valeur mesurée…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            autoFocus
          />
        </div>
        <label className={cn(
          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          critique ? 'bg-red-50 border-red-400' : 'bg-gray-50 border-gray-200 hover:border-red-200',
        )}>
          <input type="checkbox" checked={critique} onChange={e => setCritique(e.target.checked)} className="w-4 h-4 accent-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">Résultat critique</p>
            <p className="text-xs text-gray-400">Déclenche une alerte visuelle sur la fiche patient</p>
          </div>
        </label>
      </div>
    </Modal>
  )
}

// ── Main tab ──────────────────────────────────────────────────
export default function BilansTab({ bilans, visiteId, onMutate, readOnly }: {
  bilans: Bilan[]; visiteId: string; onMutate: () => void; readOnly?: boolean
}) {
  const [prescribeOpen, setPrescribeOpen] = useState(false)
  const [resultBilan,   setResultBilan]   = useState<Bilan | null>(null)
  const critiques = bilans.filter(b => b.isCritique && b.resultat)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Bilans & Examens</h2>
          <p className="text-xs text-gray-400 mt-0.5">{bilans.length} examen{bilans.length > 1 ? 's' : ''} prescrit{bilans.length > 1 ? 's' : ''}</p>
        </div>
        {!readOnly && (
          <Button onClick={() => setPrescribeOpen(true)} icon={<Plus className="w-4 h-4" />} size="sm">
            Prescrire
          </Button>
        )}
      </div>

      {/* Critical banner */}
      {critiques.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 animate-pulse-p1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-bold text-red-700">⚠ Résultat{critiques.length > 1 ? 's' : ''} critique{critiques.length > 1 ? 's' : ''}</p>
          </div>
          <div className="space-y-1">
            {critiques.map(b => (
              <p key={b.id} className="text-sm text-red-700">
                <span className="font-bold">{b.libelle}</span> : {b.resultat}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {bilans.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-12 gap-3">
          <FlaskConical className="w-10 h-10 text-gray-300" />
          <p className="text-sm text-gray-400">Aucun bilan prescrit</p>
          <Button onClick={() => setPrescribeOpen(true)} variant="secondary" icon={<Plus className="w-4 h-4" />} size="sm">
            Prescrire un bilan
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card divide-y divide-gray-50 overflow-hidden">
          {bilans.map(b => (
            <div key={b.id} className={cn('px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors', b.isCritique && 'bg-red-50/30')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-bold">{b.code}</span>
                  <StatutBadge statut={b.statut} />
                </div>
                <p className="text-sm font-semibold text-gray-800">{b.libelle}</p>
                {b.resultat && (
                  <p className={cn('text-sm mt-1.5 font-mono px-3 py-1.5 rounded-lg inline-block', b.isCritique ? 'bg-red-100 text-red-800 font-bold' : 'bg-gray-100 text-gray-700')}>
                    {b.resultat}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="text-[11px] text-gray-400 font-mono whitespace-nowrap">
                  {new Date(b.prescritAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {!readOnly && b.statut !== 'ANNULE' && b.statut !== 'RESULTAT_DISPONIBLE' && (
                  <button
                    onClick={() => setResultBilan(b)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Saisir résultat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PrescriptionBilanModal visiteId={visiteId} open={prescribeOpen} onClose={() => setPrescribeOpen(false)} onMutate={onMutate} />
      {resultBilan && (
        <ResultatModal bilan={resultBilan} open={!!resultBilan} onClose={() => setResultBilan(null)} onMutate={onMutate} />
      )}
    </div>
  )
}
