'use client'

// ──────────────────────────────────────────────────────────────
//  DateInput — Segmented DD / MM / YYYY date input
//
//  Props:
//    value       ISO date string "YYYY-MM-DD" or ""
//    onChange    called with ISO "YYYY-MM-DD" or "" when cleared
//    placeholder shown in each segment when empty (default shown)
//    disabled
// ──────────────────────────────────────────────────────────────
import { useRef, useState, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  value:      string
  onChange:   (iso: string) => void
  disabled?:  boolean
  className?: string
}

function pad(n: number | string, len = 2) {
  return String(n).padStart(len, '0')
}

function parseISO(iso: string): { dd: string; mm: string; yyyy: string } {
  if (!iso || !iso.includes('-')) return { dd: '', mm: '', yyyy: '' }
  const [y, m, d] = iso.split('-')
  return { dd: d ?? '', mm: m ?? '', yyyy: y ?? '' }
}

export function DateInput({ value, onChange, disabled, className }: Props) {
  const { dd: initD, mm: initM, yyyy: initY } = parseISO(value)
  const [dd,   setDd]   = useState(initD)
  const [mm,   setMm]   = useState(initM)
  const [yyyy, setYyyy] = useState(initY)
  const [focused, setFocused] = useState(false)

  const refD = useRef<HTMLInputElement>(null)
  const refM = useRef<HTMLInputElement>(null)
  const refY = useRef<HTMLInputElement>(null)

  // Sync outward whenever all three parts are filled
  useEffect(() => {
    if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
      const d = parseInt(dd, 10)
      const m = parseInt(mm, 10)
      const y = parseInt(yyyy, 10)
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        onChange(`${yyyy}-${mm}-${dd}`)
        return
      }
    }
    if (!dd && !mm && !yyyy) onChange('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dd, mm, yyyy])

  // Sync inward when prop changes externally
  useEffect(() => {
    const { dd: d, mm: m, yyyy: y } = parseISO(value)
    setDd(d); setMm(m); setYyyy(y)
  }, [value])

  function handleDay(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    setDd(digits)
    if (digits.length === 2) refM.current?.focus()
  }

  function handleMonth(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    setMm(digits)
    if (digits.length === 2) refY.current?.focus()
  }

  function handleYear(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    setYyyy(digits)
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    current: 'dd' | 'mm' | 'yyyy',
  ) {
    if (e.key === 'Backspace') {
      if (current === 'mm' && mm === '') refD.current?.focus()
      if (current === 'yyyy' && yyyy === '') refM.current?.focus()
    }
    if (e.key === 'ArrowLeft') {
      if (current === 'mm')   refD.current?.focus()
      if (current === 'yyyy') refM.current?.focus()
    }
    if (e.key === 'ArrowRight') {
      if (current === 'dd') refM.current?.focus()
      if (current === 'mm') refY.current?.focus()
    }
  }

  function handleBlurDay()   { if (dd.length   === 1) setDd(pad(dd)) }
  function handleBlurMonth() { if (mm.length   === 1) setMm(pad(mm)) }

  const segCls =
    'bg-transparent outline-none text-sm font-medium text-gray-900 text-center tabular-nums caret-brand-600 w-[2ch] min-w-0'
  const yearCls =
    'bg-transparent outline-none text-sm font-medium text-gray-900 text-center tabular-nums caret-brand-600 w-[4ch] min-w-0'
  const sepCls = 'text-gray-300 text-sm font-medium select-none'

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 px-3 py-2.5 rounded-xl border bg-white transition-all',
        focused
          ? 'border-brand-500 ring-2 ring-brand-500/20'
          : 'border-gray-200 hover:border-gray-300',
        disabled && 'opacity-50 pointer-events-none bg-gray-50',
        className,
      )}
      onClick={() => refD.current?.focus()}
    >
      {/* Day */}
      <input
        ref={refD}
        type="text"
        inputMode="numeric"
        placeholder="JJ"
        value={dd}
        maxLength={2}
        disabled={disabled}
        className={segCls}
        style={{ width: '2.2ch' }}
        onChange={e => handleDay(e.target.value)}
        onKeyDown={e => handleKeyDown(e, 'dd')}
        onBlur={() => { handleBlurDay(); setFocused(false) }}
        onFocus={() => setFocused(true)}
      />
      <span className={sepCls}>/</span>

      {/* Month */}
      <input
        ref={refM}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={mm}
        maxLength={2}
        disabled={disabled}
        className={segCls}
        style={{ width: '2.2ch' }}
        onChange={e => handleMonth(e.target.value)}
        onKeyDown={e => handleKeyDown(e, 'mm')}
        onBlur={() => { handleBlurMonth(); setFocused(false) }}
        onFocus={() => setFocused(true)}
      />
      <span className={sepCls}>/</span>

      {/* Year */}
      <input
        ref={refY}
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        value={yyyy}
        maxLength={4}
        disabled={disabled}
        className={yearCls}
        style={{ width: '4.4ch' }}
        onChange={e => handleYear(e.target.value)}
        onKeyDown={e => handleKeyDown(e, 'yyyy')}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
      />
    </div>
  )
}
