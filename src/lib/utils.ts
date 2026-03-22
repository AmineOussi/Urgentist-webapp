import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('fr-MA', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function waitTime(from: string | Date) {
  const mins = Math.floor((Date.now() - new Date(from).getTime()) / 60000)
  if (mins < 1)  return '< 1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function age(dob: string | Date | null | undefined) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export function initials(nom?: string, prenom?: string) {
  return [(prenom ?? '')[0], (nom ?? '')[0]].filter(Boolean).join('').toUpperCase() || '?'
}
