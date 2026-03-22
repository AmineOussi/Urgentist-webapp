import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-gray-700">
            {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400',
              'px-3 transition-all duration-150',
              'hover:border-gray-300',
              'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
              icon && 'pl-9',
              iconRight && 'pr-9',
              className,
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900',
          'px-3 transition-all duration-150 cursor-pointer appearance-none',
          'hover:border-gray-300',
          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400',
          'px-3 py-2.5 transition-all duration-150 resize-none',
          'hover:border-gray-300',
          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
