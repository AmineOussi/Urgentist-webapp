'use client'

import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast { id: string; type: ToastType; title: string; message?: string }

interface ToastCtx { toast: (type: ToastType, title: string, message?: string) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

const icons = {
  success: <CheckCircle2  className="w-5 h-5 text-emerald-500 shrink-0" />,
  error:   <XCircle       className="w-5 h-5 text-red-500    shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500  shrink-0" />,
  info:    <Info          className="w-5 h-5 text-blue-500   shrink-0" />,
}

const borders = {
  success: 'border-l-4 border-emerald-500',
  error:   'border-l-4 border-red-500',
  warning: 'border-l-4 border-amber-500',
  info:    'border-l-4 border-blue-500',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div className={cn(
      'flex items-start gap-3 bg-white rounded-2xl shadow-card-lg px-4 py-3 animate-slide-up w-80 max-w-full',
      borders[toast.type],
    )}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,  setToasts]  = useState<Toast[]>([])
  // ── Fix hydration: only mount the portal after the first client render ──
  // typeof document check at render time causes server/client mismatch because
  // the server always sees undefined, but the client sees the real document.
  // Using a boolean state + useEffect guarantees the portal is NEVER rendered
  // on the server, avoiding the "expected <div> in <body>" hydration error.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            {toasts.map(t => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
