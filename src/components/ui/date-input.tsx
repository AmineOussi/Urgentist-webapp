'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  value:      string          // ISO "YYYY-MM-DD" or ""
  onChange:   (iso: string) => void
  disabled?:  boolean
  className?: string
}

const MASK = '__/__/____'
//           0123456789

// Positions where digits go (not slashes)
const DIGIT_SLOTS = [0, 1, 3, 4, 6, 7, 8, 9]

function digitsFromMask(masked: string): string {
  return DIGIT_SLOTS.map(i => masked[i] === '_' ? '' : masked[i]).join('')
}

function digitsToMask(digits: string): string {
  const d = digits.padEnd(8, ' ')
  const chars = MASK.split('')
  let di = 0
  for (const slot of DIGIT_SLOTS) {
    chars[slot] = di < digits.length ? d[di] : '_'
    di++
  }
  return chars.join('')
}

function nextDigitSlot(pos: number): number {
  for (const s of DIGIT_SLOTS) {
    if (s >= pos) return s
  }
  return -1
}

function prevDigitSlot(pos: number): number {
  for (let i = DIGIT_SLOTS.length - 1; i >= 0; i--) {
    if (DIGIT_SLOTS[i] < pos) return DIGIT_SLOTS[i]
  }
  return -1
}

function displayToISO(masked: string): string {
  const digits = digitsFromMask(masked)
  if (digits.length !== 8) return ''
  const dd = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const yyyy = digits.slice(4, 8)
  const d = parseInt(dd, 10)
  const m = parseInt(mm, 10)
  const y = parseInt(yyyy, 10)
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return ''
  return `${yyyy}-${mm}-${dd}`
}

function isoToMask(iso: string): string {
  if (!iso || !iso.includes('-')) return MASK
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return MASK
  return digitsToMask(`${d}${m}${y}`)
}

export function DateInput({ value, onChange, disabled, className }: Props) {
  const [masked, setMasked] = useState(() => value ? isoToMask(value) : MASK)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync inward when prop changes externally
  useEffect(() => {
    const expected = value ? isoToMask(value) : MASK
    if (expected !== masked) {
      setMasked(expected)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function setCursorPos(pos: number) {
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(pos, pos)
    })
  }

  function emitChange(newMasked: string) {
    setMasked(newMasked)
    setError('')
    const iso = displayToISO(newMasked)
    if (iso) {
      onChange(iso)
    } else if (newMasked === MASK) {
      onChange('')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart ?? 0
    const selEnd = input.selectionEnd ?? pos

    // Allow tab, escape, etc.
    if (e.key === 'Tab' || e.key === 'Escape') return

    // Digit input
    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      const slot = nextDigitSlot(pos)
      if (slot === -1) return // all slots filled from this position
      const chars = masked.split('')
      chars[slot] = e.key
      const newMasked = chars.join('')
      emitChange(newMasked)
      // Move cursor to next slot
      const next = nextDigitSlot(slot + 1)
      setCursorPos(next !== -1 ? next : slot + 1)
      return
    }

    // Backspace — clear the digit before cursor
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (selEnd > pos) {
        // Selection: clear all digit slots in selection
        const chars = masked.split('')
        for (const s of DIGIT_SLOTS) {
          if (s >= pos && s < selEnd) chars[s] = '_'
        }
        emitChange(chars.join(''))
        setCursorPos(pos)
        return
      }
      const prev = prevDigitSlot(pos)
      if (prev === -1) return
      const chars = masked.split('')
      chars[prev] = '_'
      emitChange(chars.join(''))
      setCursorPos(prev)
      return
    }

    // Delete — clear digit at cursor
    if (e.key === 'Delete') {
      e.preventDefault()
      if (selEnd > pos) {
        const chars = masked.split('')
        for (const s of DIGIT_SLOTS) {
          if (s >= pos && s < selEnd) chars[s] = '_'
        }
        emitChange(chars.join(''))
        setCursorPos(pos)
        return
      }
      const slot = nextDigitSlot(pos)
      if (slot === -1) return
      const chars = masked.split('')
      chars[slot] = '_'
      emitChange(chars.join(''))
      setCursorPos(slot)
      return
    }

    // Arrow keys
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = prevDigitSlot(pos)
      if (prev !== -1) setCursorPos(prev)
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = nextDigitSlot(pos + 1)
      if (next !== -1) setCursorPos(next)
      return
    }

    // Home / End
    if (e.key === 'Home') {
      e.preventDefault()
      setCursorPos(0)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      setCursorPos(MASK.length)
      return
    }

    // Block everything else (including typing "/" or letters)
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
    }
  }

  function handleFocus() {
    setFocused(true)
    setError('')
    // Place cursor at first empty slot
    const firstEmpty = DIGIT_SLOTS.find(s => masked[s] === '_')
    if (firstEmpty !== undefined) {
      setCursorPos(firstEmpty)
    }
  }

  function handleBlur() {
    setFocused(false)
    const digits = digitsFromMask(masked)
    if (digits.length > 0 && !displayToISO(masked)) {
      if (digits.length < 8) {
        setError('Format attendu : JJ/MM/AAAA')
      } else {
        setError('Date invalide')
      }
    }
  }

  // Handle paste
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!pasted) return
    const newMasked = digitsToMask(pasted)
    emitChange(newMasked)
    const nextEmpty = DIGIT_SLOTS.find(s => newMasked[s] === '_')
    setCursorPos(nextEmpty ?? MASK.length)
  }

  // Prevent onChange from doing anything (we handle everything in onKeyDown)
  function handleChange() {}

  // Click: snap cursor to nearest digit slot
  function handleClick() {
    const input = inputRef.current
    if (!input) return
    const pos = input.selectionStart ?? 0
    const nearest = nextDigitSlot(pos) ?? DIGIT_SLOTS[DIGIT_SLOTS.length - 1]
    setCursorPos(nearest)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={masked}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 rounded-xl border bg-white text-sm font-medium transition-all',
          'tabular-nums tracking-wider',
          masked === MASK ? 'text-gray-400' : 'text-gray-900',
          focused
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-gray-200 hover:border-gray-300',
          error && !focused && 'border-red-400',
          disabled && 'opacity-50 pointer-events-none bg-gray-50',
          className,
        )}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onClick={handleClick}
      />
      {error && !focused && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
