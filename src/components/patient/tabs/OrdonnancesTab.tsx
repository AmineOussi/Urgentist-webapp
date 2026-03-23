'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Prescription } from '../types'
import { Modal }    from '@/components/ui/modal'
import { Button }   from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn }       from '@/lib/utils'
import {
  Plus, Printer, Pill, Search, X, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, FileText, SlidersHorizontal,
  Info, RefreshCw, Sparkles, Share2, Mail, Copy, Download,
  MessageCircle, Loader2, ExternalLink,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
interface Med {
  id: string
  nomCommercial: string
  dci: string
  dosage?: string | null
  forme?: string | null
  ppv?: number | null
  tauxRemboursement?: number
  type?: string   // 'P' | 'G'
}

interface ItemDraft {
  tempId: string
  medicamentId: string
  nomCommercial: string
  dci: string
  dosage: string        // from DB
  forme: string
  dose: string
  frequence: string
  duree: string
  voie: string
  instructions: string
  showInstructions: boolean
}

// ─────────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────────
const FREQ_CHIPS = ['1×/j', '2×/j', '3×/j', '4×/j', 'Si besoin', 'Dose unique']
const DUREE_CHIPS = ['3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '1 mois']
const VOIE_PRIMARY = ['Oral', 'IV', 'IM', 'SC', 'Inhalé']
const VOIE_MORE    = ['Topique', 'Sublingual', 'Rectal', 'Ophtalmique', 'Nasal']

const CARD_COLORS = [
  'border-l-blue-400',
  'border-l-violet-400',
  'border-l-emerald-400',
  'border-l-amber-400',
  'border-l-rose-400',
  'border-l-cyan-400',
]

// ─────────────────────────────────────────────────────────────────
//  MedSearch — rich autocomplete
// ─────────────────────────────────────────────────────────────────
function MedSearch({ onSelect, autoFocus }: { onSelect: (m: Med) => void; autoFocus?: boolean }) {
  const [q,       setQ]       = useState('')
  const [results, setResults] = useState<Med[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/medicaments?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQ(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 280)
  }

  function pick(m: Med) {
    onSelect(m)
    setQ('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="relative">
      <div className={cn(
        'relative flex items-center rounded-2xl border-2 transition-all duration-200',
        focused ? 'border-brand-500 shadow-[0_0_0_4px_rgba(51,102,255,0.12)]' : 'border-gray-200 hover:border-gray-300',
      )}>
        <Search className="absolute left-4 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
          placeholder="Rechercher un médicament (nom commercial, DCI)…"
          className="w-full pl-11 pr-10 py-3 text-sm bg-transparent focus:outline-none placeholder:text-gray-400"
          autoFocus={autoFocus}
        />
        {loading && (
          <div className="absolute right-4 w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        )}
        {q && !loading && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQ(''); setResults([]); setOpen(false) }}
            className="absolute right-4 p-0.5 text-gray-300 hover:text-gray-500 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-modal overflow-hidden">
          {results.length > 0 ? (
            <>
              <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                {results.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => pick(m)}
                    className="w-full text-left px-4 py-3 hover:bg-brand-50/70 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-brand-700">
                            {m.nomCommercial}
                          </span>
                          {m.type === 'G' && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">GÉN.</span>
                          )}
                          {m.tauxRemboursement != null && m.tauxRemboursement > 0 && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                              RMB {m.tauxRemboursement}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                          {m.dci}
                          {m.dosage ? ` · ${m.dosage}` : ''}
                          {m.forme  ? ` · ${m.forme}`  : ''}
                        </p>
                      </div>
                      {m.ppv != null && m.ppv > 0 && (
                        <span className="text-xs font-semibold text-gray-400 shrink-0 mt-0.5">
                          {m.ppv.toFixed(2)} MAD
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {results.length >= 10 && (
                <p className="text-[11px] text-gray-400 text-center py-2 border-t border-gray-50">
                  Affinez pour voir plus de résultats
                </p>
              )}
            </>
          ) : !loading && q.length >= 2 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Pill className="w-7 h-7 text-gray-200" />
              <p className="text-sm text-gray-400">
                Aucun résultat pour <span className="font-semibold text-gray-600">{q}</span>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Chip selector (frequence / duree / voie)
// ─────────────────────────────────────────────────────────────────
function ChipGroup({ options, value, onChange, color = 'brand' }: {
  options: string[]
  value: string
  onChange: (v: string) => void
  color?: 'brand' | 'violet' | 'emerald'
}) {
  const activeClass = {
    brand:   'bg-brand-600 text-white border-brand-600',
    violet:  'bg-violet-600 text-white border-violet-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
  }[color]

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150 select-none',
            value === opt
              ? activeClass
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Voie selector — primary chips + expandable extras
// ─────────────────────────────────────────────────────────────────
function VoieSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showMore, setShowMore] = useState(false)
  const isMore = VOIE_MORE.includes(value)

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {VOIE_PRIMARY.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(value === v ? '' : v)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150',
              value === v
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            {v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowMore(v => !v)}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150 flex items-center gap-1',
            isMore
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
          )}
        >
          {isMore ? value : 'Autre'}
          {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      {showMore && (
        <div className="flex flex-wrap gap-1.5 pl-1 animate-fade-in">
          {VOIE_MORE.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => { onChange(value === v ? '' : v); setShowMore(false) }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all',
                value === v
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Durée selector — chips + custom text
// ─────────────────────────────────────────────────────────────────
function DureeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isCustom = value !== '' && !DUREE_CHIPS.includes(value)
  const [custom,  setCustom]  = useState(isCustom ? value : '')
  const [showCus, setShowCus] = useState(isCustom)

  function setChip(v: string) {
    setShowCus(false)
    onChange(value === v ? '' : v)
  }

  function onCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustom(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {DUREE_CHIPS.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setChip(d)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all duration-150',
              value === d
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setShowCus(v => !v); if (!showCus) onChange('') }}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all',
            isCustom && !showCus
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
          )}
        >
          Autre…
        </button>
      </div>
      {showCus && (
        <input
          value={custom}
          onChange={onCustomChange}
          autoFocus
          placeholder="Ex: 3 semaines, jusqu'à guérison…"
          className="w-full px-3 py-2 text-sm border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 animate-fade-in"
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Summary pill — compact posologie display at card top
// ─────────────────────────────────────────────────────────────────
function SummaryPill({ item }: { item: ItemDraft }) {
  const parts = [
    item.dose      && item.dose,
    item.frequence && item.frequence,
    item.duree     && item.duree,
    item.voie      && item.voie !== 'Oral' && item.voie,
  ].filter(Boolean)

  if (!parts.length) return (
    <p className="text-[11px] text-gray-400 italic">Posologie à compléter…</p>
  )

  return (
    <p className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
      <Sparkles className="w-3 h-3" />
      {parts.join(' · ')}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────
//  ItemCard — one drug in the prescription form
// ─────────────────────────────────────────────────────────────────
function ItemCard({ item, index, onUpdate, onRemove }: {
  item: ItemDraft
  index: number
  onUpdate: (id: string, field: keyof ItemDraft, val: string | boolean) => void
  onRemove: (id: string) => void
}) {
  const set = (field: keyof ItemDraft) => (val: string | boolean) =>
    onUpdate(item.tempId, field, val)

  const colorClass = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 border-l-4 shadow-card overflow-hidden animate-slide-up',
      colorClass,
    )}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-black text-gray-500">{index + 1}</span>
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-tight">{item.nomCommercial}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              {item.dci}
              {item.dosage && <span className="text-gray-500"> · {item.dosage}</span>}
              {item.forme  && <span className="text-gray-400"> · {item.forme}</span>}
            </p>
            <div className="mt-2">
              <SummaryPill item={item} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.tempId)}
          className="p-1.5 -mr-1 -mt-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-4">

        {/* Dose */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">D</span>
            Dose
          </label>
          <input
            value={item.dose}
            onChange={e => set('dose')(e.target.value)}
            placeholder={item.dosage || 'Ex: 500 mg, 1 cp…'}
            className="w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-400 focus:bg-brand-50/30 transition-all bg-gray-50/50 placeholder:text-gray-300"
          />
        </div>

        {/* Fréquence */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">F</span>
            Fréquence
          </label>
          <ChipGroup options={FREQ_CHIPS} value={item.frequence} onChange={set('frequence')} color="brand" />
        </div>

        {/* Durée */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">T</span>
            Durée
          </label>
          <DureeSelector value={item.duree} onChange={set('duree')} />
        </div>

        {/* Voie */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">V</span>
            Voie d&apos;administration
          </label>
          <VoieSelector value={item.voie} onChange={set('voie')} />
        </div>

        {/* Instructions toggle */}
        <div>
          <button
            type="button"
            onClick={() => set('showInstructions')(!item.showInstructions)}
            className="text-xs font-semibold text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
          >
            <Plus className={cn('w-3.5 h-3.5 transition-transform', item.showInstructions && 'rotate-45')} />
            {item.showInstructions ? 'Masquer les instructions' : 'Ajouter des instructions particulières'}
          </button>
          {item.showInstructions && (
            <input
              value={item.instructions}
              onChange={e => set('instructions')(e.target.value)}
              placeholder="Ex: à prendre pendant les repas, éviter l'alcool…"
              autoFocus
              className="mt-2 w-full px-3 py-2.5 text-sm border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-400 bg-amber-50/40 placeholder:text-gray-300 animate-fade-in"
            />
          )}
          {item.instructions && !item.showInstructions && (
            <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 italic">
              ℹ {item.instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Prescription creation modal
// ─────────────────────────────────────────────────────────────────
function NouvelleOrdonnanceModal({ visiteId, open, onClose, onMutate }: {
  visiteId: string; open: boolean; onClose: () => void; onMutate: () => void
}) {
  const { toast }                     = useToast()
  const [loading, setLoading]         = useState(false)
  const [items,   setItems]           = useState<ItemDraft[]>([])

  function addMed(m: Med) {
    setItems(prev => [...prev, {
      tempId:          crypto.randomUUID(),
      medicamentId:    m.id,
      nomCommercial:   m.nomCommercial,
      dci:             m.dci,
      dosage:          m.dosage ?? '',
      forme:           m.forme  ?? '',
      dose:            m.dosage ?? '',   // auto-fill from DB
      frequence:       '',
      duree:           '',
      voie:            'Oral',           // sensible default
      instructions:    '',
      showInstructions: false,
    }])
  }

  function update(id: string, field: keyof ItemDraft, val: string | boolean) {
    setItems(prev => prev.map(it => it.tempId === id ? { ...it, [field]: val } : it))
  }

  function remove(id: string) {
    setItems(prev => prev.filter(it => it.tempId !== id))
  }

  function reset() { setItems([]) }

  async function submit(isDraft: boolean) {
    if (!items.length) return
    setLoading(true)
    const payload = {
      visiteId,
      isDraft,
      items: items.map(({ tempId, nomCommercial, dci, dosage, forme, showInstructions, ...rest }) => rest),
    }
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) {
      toast('success', isDraft ? 'Brouillon enregistré' : `Ordonnance créée (${items.length} médicament${items.length > 1 ? 's' : ''})`)
      reset()
      onClose()
      onMutate()
    } else {
      toast('error', 'Erreur lors de la création')
    }
  }

  const isReady = items.some(it => it.dose || it.frequence)

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Nouvelle ordonnance"
      description="Recherchez et configurez les médicaments à prescrire."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={reset}
            disabled={!items.length}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tout effacer
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => submit(true)} loading={loading} disabled={!items.length} size="sm">
              Brouillon
            </Button>
            <Button onClick={() => submit(false)} loading={loading} disabled={!items.length} size="sm">
              Valider l&apos;ordonnance
              {items.length > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-xs font-black rounded-lg px-1.5 py-0.5">
                  {items.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search bar — always visible at top */}
        <div className="sticky top-0 z-10 bg-white pb-1">
          <MedSearch onSelect={addMed} autoFocus />
          {items.length === 0 && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <Info className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <p className="text-xs text-gray-400">Tapez au moins 2 lettres pour rechercher dans le répertoire CNOPS</p>
            </div>
          )}
        </div>

        {/* Drug cards */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => (
              <ItemCard key={item.tempId} item={item} index={i} onUpdate={update} onRemove={remove} />
            ))}
          </div>
        )}

        {/* Empty state hint */}
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <Pill className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Ajoutez des médicaments avec la barre de recherche</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Share modal — generate PDF, store in Supabase, share links
// ─────────────────────────────────────────────────────────────────
function ShareModal({ prescriptionId, open, onClose }: {
  prescriptionId: string; open: boolean; onClose: () => void
}) {
  const { toast }                         = useToast()
  const [generating, setGenerating]       = useState(false)
  const [pdfUrl,     setPdfUrl]           = useState<string | null>(null)
  const [filename,   setFilename]         = useState('')
  const [copied,     setCopied]           = useState(false)
  const [patientTel, setPatientTel]       = useState('')

  // Auto-generate on open
  useEffect(() => {
    if (!open) return
    setPdfUrl(null)
    setGenerating(true)
    fetch(`/api/prescriptions/${prescriptionId}/pdf?action=store`)
      .then(r => r.ok ? r.json() : Promise.reject('Erreur serveur'))
      .then(d => { setPdfUrl(d.url); setFilename(d.filename) })
      .catch(() => toast('error', 'Impossible de générer le PDF'))
      .finally(() => setGenerating(false))
  }, [open, prescriptionId, toast])

  function handleCopy() {
    if (!pdfUrl) return
    navigator.clipboard.writeText(pdfUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleWhatsApp() {
    if (!pdfUrl) return
    const text = encodeURIComponent(`Voici votre ordonnance médicale :\n${pdfUrl}`)
    const url  = patientTel
      ? `https://wa.me/${patientTel.replace(/\D/g, '')}?text=${text}`
      : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  function handleEmail() {
    if (!pdfUrl) return
    const subject = encodeURIComponent('Votre ordonnance médicale')
    const body    = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint votre ordonnance médicale :\n${pdfUrl}\n\nCordialement`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function handlePrint() {
    window.open(`/api/prescriptions/${prescriptionId}/pdf?action=preview`, '_blank')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Partager l'ordonnance"
      description="Générez le PDF et partagez-le avec le patient."
      size="sm"
    >
      <div className="space-y-5">
        {/* PDF status */}
        <div className={cn(
          'rounded-2xl border p-4 flex items-center gap-3 transition-all',
          generating     ? 'bg-brand-50 border-brand-100' :
          pdfUrl         ? 'bg-emerald-50 border-emerald-100' :
                           'bg-gray-50 border-gray-100',
        )}>
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-700">Génération du PDF…</p>
                <p className="text-xs text-brand-500 mt-0.5">Veuillez patienter</p>
              </div>
            </>
          ) : pdfUrl ? (
            <>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-700">PDF prêt</p>
                <p className="text-xs text-emerald-600 mt-0.5 truncate">{filename}</p>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-colors"
                title="Ouvrir le PDF"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          ) : (
            <p className="text-sm text-gray-400">Erreur de génération.</p>
          )}
        </div>

        {/* Patient phone (optional, for WhatsApp) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
            N° WhatsApp du patient <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <input
            type="tel"
            value={patientTel}
            onChange={e => setPatientTel(e.target.value)}
            placeholder="+212 6XX-XXXXXX"
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-400 bg-gray-50 placeholder:text-gray-300"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!pdfUrl}
            onClick={handleWhatsApp}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
              pdfUrl
                ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 cursor-pointer'
                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed',
            )}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-bold">WhatsApp</span>
          </button>

          <button
            type="button"
            disabled={!pdfUrl}
            onClick={handleEmail}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
              pdfUrl
                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 text-blue-700 cursor-pointer'
                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed',
            )}
          >
            <Mail className="w-6 h-6" />
            <span className="text-xs font-bold">Email</span>
          </button>

          <button
            type="button"
            disabled={!pdfUrl}
            onClick={handleCopy}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
              pdfUrl
                ? copied
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-gray-50 hover:bg-brand-50 hover:border-brand-200 text-gray-600 cursor-pointer'
                : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed',
            )}
          >
            <Copy className="w-6 h-6" />
            <span className="text-xs font-bold">{copied ? 'Copié !' : 'Copier lien'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
          >
            <Printer className="w-6 h-6" />
            <span className="text-xs font-bold">Imprimer</span>
          </button>
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            download={filename}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Télécharger le PDF
          </a>
        )}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Prescription card (read view)
// ─────────────────────────────────────────────────────────────────
function PrescriptionCard({ p, index }: { p: Prescription; index: number }) {
  const [expanded,   setExpanded]   = useState(index === 0)
  const [shareOpen,  setShareOpen]  = useState(false)
  const colorClass = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 border-l-4 shadow-card overflow-hidden transition-all',
      colorClass,
      p.isDraft && 'opacity-80',
    )}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">
                Ordonnance #{String(index + 1).padStart(2, '0')}
              </p>
              {p.isDraft ? (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Brouillon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Validée
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {p.items.length} médicament{p.items.length > 1 ? 's' : ''} ·{' '}
              {new Date(p.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setShareOpen(true) }}
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Partager / Envoyer"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); window.open(`/api/prescriptions/${p.id}/pdf?action=preview`, '_blank') }}
            className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Aperçu / Imprimer"
          >
            <Printer className="w-4 h-4" />
          </button>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} />
        </div>
      </button>

      <ShareModal
        prescriptionId={p.id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {expanded && (
        <div className="border-t border-gray-50 divide-y divide-gray-50 animate-fade-in">
          {p.items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-4 px-5 py-3.5">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-gray-500">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{item.nomCommercial}</p>
                  <span className="text-xs text-gray-400 italic">{item.dci}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                  {item.dose && (
                    <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-lg">
                      {item.dose}
                    </span>
                  )}
                  {item.frequence && (
                    <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-lg">
                      {item.frequence}
                    </span>
                  )}
                  {item.duree && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-lg">
                      {item.duree}
                    </span>
                  )}
                  {item.voie && item.voie !== 'Oral' && (
                    <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-0.5 rounded-lg">
                      {item.voie}
                    </span>
                  )}
                </div>
                {item.instructions && (
                  <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg mt-2 italic border border-amber-100">
                    ℹ {item.instructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main tab
// ─────────────────────────────────────────────────────────────────
export default function OrdonnancesTab({ prescriptions, visiteId, onMutate, readOnly }: {
  prescriptions: Prescription[]; visiteId: string; onMutate: () => void; readOnly?: boolean
}) {
  const [newOpen, setNewOpen] = useState(false)
  const hasDraft = prescriptions.some(p => p.isDraft)

  const sorted = [...prescriptions].sort((a, b) => {
    if (a.isDraft && !b.isDraft) return -1
    if (!a.isDraft && b.isDraft) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Ordonnances</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {prescriptions.length} ordonnance{prescriptions.length > 1 ? 's' : ''}
            {hasDraft && (
              <span className="ml-1.5 text-amber-600 font-semibold">
                · {prescriptions.filter(p => p.isDraft).length} brouillon{prescriptions.filter(p => p.isDraft).length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {!readOnly && (
          <Button onClick={() => setNewOpen(true)} icon={<Plus className="w-4 h-4" />} size="sm">
            Nouvelle ordonnance
          </Button>
        )}
      </div>

      {hasDraft && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            Des brouillons non validés existent. Validez-les avant de remettre l&apos;ordonnance au patient.
          </p>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-14 gap-3">
          <Pill className="w-10 h-10 text-gray-300" />
          <p className="text-sm text-gray-400">Aucune ordonnance pour cette visite</p>
          <Button onClick={() => setNewOpen(true)} variant="secondary" icon={<Plus className="w-4 h-4" />} size="sm">
            Créer une ordonnance
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((p, i) => <PrescriptionCard key={p.id} p={p} index={i} />)}
        </div>
      )}

      <NouvelleOrdonnanceModal
        visiteId={visiteId}
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onMutate={onMutate}
      />
    </div>
  )
}
