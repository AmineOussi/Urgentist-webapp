'use client'

import Link             from 'next/link'
import Image            from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useClinicSettings }           from '@/hooks/useClinicSettings'
import type { User } from '@supabase/supabase-js'
import { cn, initials } from '@/lib/utils'
import {
  LayoutDashboard, Users, BarChart3, Settings,
  Heart,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',    label: 'Salle d\'attente', icon: LayoutDashboard },
  { href: '/patients',     label: 'Patients',         icon: Users },
  { href: '/statistiques', label: 'Statistiques',     icon: BarChart3 },
  { href: '/parametres',   label: 'Paramètres',       icon: Settings },
]

// ── Logo component ────────────────────────────────────────────
function ClinicLogo({ size = 40 }: { size?: number }) {
  const { settings } = useClinicSettings()
  const [imgError, setImgError] = useState(false)

  if (settings.logoUrl && !imgError) {
    return (
      <div
        className="rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-lg"
        style={{ width: size, height: size }}
      >
        <Image
          src={settings.logoUrl}
          alt={settings.nom ?? 'Logo'}
          width={size}
          height={size}
          className="object-contain w-full h-full p-1"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl bg-brand-600 flex items-center justify-center shrink-0 shadow-lg"
      style={{ width: size, height: size }}
    >
      <Heart className="text-white fill-white" style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  )
}

// ── Desktop sidebar (icon-only, 72px) ────────────────────────
function DesktopSidebar({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const pathname = usePathname()
  const name = user.user_metadata?.full_name ?? user.email ?? ''
  const ini  = initials(name.split(' ')[1], name.split(' ')[0]) || (user.email ?? 'U')[0].toUpperCase()

  return (
    <aside className="hidden md:flex w-[72px] flex-col items-center py-4 bg-[#0f1b4c] text-white gap-1 shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="mb-5">
        <ClinicLogo size={40} />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 w-full px-2">
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'relative w-full h-11 rounded-2xl flex items-center justify-center transition-all duration-150 group',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/80',
              )}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-6 bg-white rounded-r-full" />
              )}
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg
                opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* User avatar */}
      <button
        onClick={onSignOut}
        title={`Déconnexion — ${user.email}`}
        className="w-9 h-9 rounded-full bg-brand-700 hover:bg-brand-600 flex items-center justify-center text-xs font-bold transition-colors ring-2 ring-white/10"
      >
        {ini}
      </button>
    </aside>
  )
}

// ── Mobile bottom nav ─────────────────────────────────────────
function MobileNav({ onSignOut }: { user: User; onSignOut: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-2px_rgba(0,0,0,.08)]">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV.slice(0, 4).map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                active ? 'text-brand-600' : 'text-gray-400'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function AppSidebar({ user }: { user: User }) {
  const router   = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <DesktopSidebar user={user} onSignOut={signOut} />
      <MobileNav user={user} onSignOut={signOut} />
    </>
  )
}
