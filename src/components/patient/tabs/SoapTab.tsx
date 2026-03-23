'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Consultation } from '../types'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Check, Clock, FileText } from 'lucide-react'

const FIELDS = [
  { key: 'subjectif',  letter: 'S', color: 'blue',   label: 'Subjectif',  hint: 'Plainte principale, histoire de la maladie, symptômes rapportés par le patient…' },
  { key: 'objectif',   letter: 'O', color: 'purple', label: 'Objectif',   hint: 'Examen clinique, signes vitaux, observations médicales…' },
  { key: 'assessment', letter: 'A', color: 'orange', label: 'Évaluation', hint: 'Diagnostic principal, diagnostics différentiels, code CIM-10…' },
  { key: 'plan',       letter: 'P', color: 'green',  label: 'Plan',       hint: 'Traitement, médicaments, bilans à prescrire, orientation…' },
] as const

const LETTER_COLORS: Record<string, string> = {
  blue:   'bg-blue-100   text-blue-700',
  purple: 'bg-violet-100 text-violet-700',
  orange: 'bg-orange-100 text-orange-700',
  green:  'bg-emerald-100 text-emerald-700',
}
const BORDER_COLORS: Record<string, string> = {
  blue:   'border-l-blue-400',
  purple: 'border-l-violet-400',
  orange: 'border-l-orange-400',
  green:  'border-l-emerald-400',
}

type SoapState = { subjectif: string; objectif: string; assessment: string; plan: string }

export default function SoapTab({ consultation, visiteId, onSaved, readOnly }: { consultation: Consultation | null; visiteId: string; onSaved?: () => void; readOnly?: boolean }) {
  const { toast } = useToast()
  const [values, setValues] = useState<SoapState>({
    subjectif:  consultation?.subjectif  ?? '',
    objectif:   consultation?.objectif   ?? '',
    assessment: consultation?.assessment ?? '',
    plan:       consultation?.plan       ?? '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync state when consultation prop changes (page refresh / router.refresh)
  useEffect(() => {
    setValues({
      subjectif:  consultation?.subjectif  ?? '',
      objectif:   consultation?.objectif   ?? '',
      assessment: consultation?.assessment ?? '',
      plan:       consultation?.plan       ?? '',
    })
  }, [consultation])

  // Auto-save 1.5s after last keystroke
  const save = useCallback(async (data: SoapState) => {
    setStatus('saving')
    const res = await fetch(`/api/visites/${visiteId}/consultation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
      onSaved?.()
    } else {
      setStatus('idle')
      toast('error', 'Erreur de sauvegarde')
    }
  }, [visiteId, toast])

  function change(key: keyof SoapState, val: string) {
    const next = { ...values, [key]: val }
    setValues(next)
    setStatus('idle')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(next), 1500)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Note SOAP</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {readOnly ? 'Consultation clôturée — lecture seule' : 'Sauvegarde automatique à chaque modification'}
          </p>
        </div>
        {!readOnly && (
        <div className="flex items-center gap-2 h-8 px-3 rounded-xl bg-gray-50 border border-gray-100">
          {status === 'saving' && (
            <><Clock className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span className="text-xs text-amber-600 font-medium">Sauvegarde…</span></>
          )}
          {status === 'saved' && (
            <><Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Sauvegardé</span></>
          )}
          {status === 'idle' && (
            <><FileText className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-xs text-gray-400">
                {consultation ? 'Modifié' : 'Non renseigné'}
              </span></>
          )}
        </div>
        )}
      </div>

      {/* SOAP fields */}
      <div className="space-y-3">
        {FIELDS.map(f => (
          <div key={f.key} className={cn('bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden border-l-4', BORDER_COLORS[f.color])}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
              <span className={cn('w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black shrink-0', LETTER_COLORS[f.color])}>
                {f.letter}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                <p className="text-xs text-gray-400 hidden sm:block">{f.hint}</p>
              </div>
            </div>
            {readOnly ? (
              <div className="px-4 py-3 text-sm text-gray-800 min-h-[3.5rem] whitespace-pre-wrap">
                {values[f.key] || <span className="text-gray-300 italic">Non renseigné</span>}
              </div>
            ) : (
              <textarea
                value={values[f.key]}
                onChange={e => change(f.key, e.target.value)}
                rows={3}
                placeholder={`${f.hint}`}
                className={cn(
                  'w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-300 bg-white',
                  'resize-none outline-none',
                  'focus:bg-gray-50/50 transition-colors duration-150',
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
