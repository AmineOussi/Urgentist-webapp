'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useRouter, useSearchParams }  from 'next/navigation'
import { Heart, Eye, EyeOff } from 'lucide-react'

interface ClinicBranding {
  nom?:     string
  logoUrl?: string | null
}

function LoginForm() {
  const supabase = createSupabaseBrowserClient()
  const router   = useRouter()
  const params   = useSearchParams()
  const next     = params.get('next') ?? '/dashboard'

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [showPwd,   setShowPwd]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [branding,  setBranding]  = useState<ClinicBranding>({})
  const [logoError, setLogoError] = useState(false)

  // Load clinic branding for the login page
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then((d: ClinicBranding) => setBranding(d))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError(authErr.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : authErr.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  const clinicName = branding.nom || 'USS-I'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1b4c] via-blue-900 to-blue-700 px-4">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo + Clinic name */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {branding.logoUrl && !logoError ? (
              <div className="w-20 h-20 rounded-2xl bg-white shadow-2xl flex items-center justify-center overflow-hidden p-2">
                <Image
                  src={branding.logoUrl}
                  alt={clinicName}
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                  onError={() => setLogoError(true)}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center">
                <Heart className="w-10 h-10 text-white fill-white" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{clinicName}</h1>
          <p className="text-blue-200/80 mt-1.5 text-sm font-medium">
            Système d&apos;Information des Urgences
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Connexion</h2>
          <p className="text-sm text-gray-400 mb-6">Accès réservé au personnel médical autorisé</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Email professionnel
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-400 focus:bg-brand-50/30 transition-all bg-gray-50 placeholder:text-gray-300 placeholder:font-normal"
                placeholder="medecin@hopital.ma"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-400 focus:bg-brand-50/30 transition-all bg-gray-50 placeholder:text-gray-300 placeholder:font-normal"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 px-4 mt-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion…
                </span>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200/40 text-xs mt-6">
          USS-I · © {new Date().getFullYear()} Urgences
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
