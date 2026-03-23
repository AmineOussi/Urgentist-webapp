'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  footer?: React.ReactNode
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw] h-[90vh]',
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-gray-900/40 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        // Close ONLY if user clicked directly on the backdrop, not on anything inside the panel
        if (e.target === backdropRef.current) {
          console.log('[Modal] backdrop click → closing')
          onClose()
        } else {
          console.log('[Modal] click inside panel, target:', (e.target as HTMLElement).tagName, (e.target as HTMLElement).className?.slice(0, 50))
        }
      }}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-3xl shadow-modal flex flex-col animate-scale-in',
          sizes[size],
          size === 'full' ? 'overflow-hidden' : 'max-h-[90vh]',
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div>
              {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={cn('overflow-y-auto', 'flex-1 px-6 py-5')}>
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Drawer (slide from right)
interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  width?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Drawer({ open, onClose, title, description, width = 'max-w-lg', children, footer }: DrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex bg-gray-900/40 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div
        className={cn(
          'relative ml-auto w-full bg-white flex flex-col shadow-modal animate-slide-right h-full',
          width,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div>
              {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="ml-4 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
