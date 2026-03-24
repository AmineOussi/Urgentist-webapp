'use client'

// ──────────────────────────────────────────────────────────────
//  /parametres — Paramètres de la clinique
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import Image           from 'next/image'
import { useToast }    from '@/components/ui/toast'
import { Button }      from '@/components/ui/button'
import { Input }       from '@/components/ui/input'
import { cn }          from '@/lib/utils'
import { invalidateClinicSettings } from '@/hooks/useClinicSettings'
import {
  Building2, User, Bell, Shield, ChevronRight,
  Check, Info, Upload, Trash2, ImageIcon, Loader2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface ClinicForm {
  nom:       string
  adresse:   string
  telephone: string
  email:     string
  doctor:    string
  rpps:      string
}

// ── Section wrapper ───────────────────────────────────────────
function SettingsSection({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function SettingRow({ label, desc, children }: {
  label: string; desc?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'relative rounded-full transition-colors duration-200 focus:outline-none',
        value ? 'bg-brand-600' : 'bg-gray-200',
      )}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform duration-200',
          value ? 'translate-x-[18px]' : 'translate-x-0',
        )}
        style={{ width: 18, height: 18 }}
      />
    </button>
  )
}

// ── Logo uploader ─────────────────────────────────────────────
function LogoUploader({ currentUrl, onUploaded }: {
  currentUrl: string | null
  onUploaded: (url: string | null) => void
}) {
  const { toast }    = useToast()
  const fileRef      = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState<string | null>(currentUrl)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast('error', 'Fichier non supporté. Utilisez PNG, JPG ou SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Image trop grande (max 2 MB)')
      return
    }

    // Local preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const form = new FormData()
    form.append('logo', file)

    try {
      const res  = await fetch('/api/settings/logo', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast('success', 'Logo mis à jour')
      invalidateClinicSettings()
      onUploaded(data.logoUrl)
    } catch (e: any) {
      toast('error', e.message ?? 'Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
        {preview ? (
          <Image src={preview} alt="Logo" width={72} height={72} className="object-contain w-full h-full p-1" unoptimized />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 space-y-2">
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 transition-all"
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-brand-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Téléchargement…</span>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-600">Cliquez ou glissez votre logo</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, SVG · max 2 MB</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(null); onUploaded(null) }}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer le logo
          </button>
        )}
        <p className="text-[11px] text-gray-400">
          Le logo apparaît dans la page de connexion, la barre latérale et les ordonnances PDF.
        </p>
      </div>
    </div>
  )
}

// ── Clinic info form ──────────────────────────────────────────
function ClinicInfoSection() {
  const { toast } = useToast()
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [form,    setForm]      = useState<ClinicForm>({
    nom:       '', adresse:   '', telephone: '',
    email:     '', doctor:    '', rpps:      '',
  })

  // Load current settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then((d: Partial<ClinicForm & { logoUrl?: string }>) => {
        setForm({ nom: d.nom ?? '', adresse: d.adresse ?? '', telephone: d.telephone ?? '', email: d.email ?? '', doctor: d.doctor ?? '', rpps: d.rpps ?? '' })
        setLogoUrl(d.logoUrl ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function set(field: keyof ClinicForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, logoUrl }),
    })
    setSaving(false)
    if (res.ok) {
      toast('success', 'Paramètres enregistrés')
      invalidateClinicSettings()
    } else {
      toast('error', 'Erreur lors de l\'enregistrement')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-20 bg-gray-50 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
          <Building2 className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">Informations de la clinique</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Logo */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Logo</p>
          <LogoUploader currentUrl={logoUrl} onUploaded={setLogoUrl} />
        </div>

        <div className="border-t border-gray-50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Nom du service / établissement" value={form.nom} onChange={set('nom')} placeholder="Ex: Service des Urgences — Hôpital Avicenne" />
          </div>
          <Input label="Adresse"        value={form.adresse}   onChange={set('adresse')}   placeholder="Rue, ville, code postal" />
          <Input label="Téléphone"      value={form.telephone} onChange={set('telephone')} placeholder="+212 5XX-XXXXXX" />
          <Input label="Email"          value={form.email}     onChange={set('email')}     placeholder="urgences@hopital.ma" />
          <Input label="Médecin responsable" value={form.doctor} onChange={set('doctor')}  placeholder="Dr. Prénom NOM" />
          <div className="md:col-span-2">
            <Input label="N° Ordre / RPPS" value={form.rpps} onChange={set('rpps')} placeholder="Numéro d'inscription à l'Ordre des Médecins" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">Ces informations apparaissent sur les ordonnances, bilans et autres documents PDF générés.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving} icon={saving ? undefined : <Check className="w-4 h-4" />}>
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function ParametresPage() {
  const [notifs, setNotifs] = useState({
    nouveauPatient:  true,
    triageP1:        true,
    attenteDepasse:  false,
    clotureVisite:   false,
  })

  const [prefs, setPrefs] = useState({
    afficherPrix:        true,
    confirmSuppression:  true,
    modeCompact:         false,
  })

  return (
    <div className="min-h-full animate-fade-in">
      <header className="bg-white border-b border-gray-100 px-5 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Paramètres</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Configuration du service et préférences d&apos;affichage</p>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 md:px-8 py-6 pb-24 md:pb-8 max-w-3xl mx-auto w-full">

      <ClinicInfoSection />

      <SettingsSection title="Notifications" icon={<Bell className="w-4 h-4" />}>
        <SettingRow label="Nouveau patient" desc="Alerte lors de l'ajout d'un patient">
          <Toggle value={notifs.nouveauPatient} onChange={v => setNotifs(p => ({ ...p, nouveauPatient: v }))} />
        </SettingRow>
        <SettingRow label="Patient P1 en attente" desc="Alerte critique — urgence absolue">
          <Toggle value={notifs.triageP1} onChange={v => setNotifs(p => ({ ...p, triageP1: v }))} />
        </SettingRow>
        <SettingRow label="Temps d'attente dépassé" desc="Si un patient attend plus de 30 min">
          <Toggle value={notifs.attenteDepasse} onChange={v => setNotifs(p => ({ ...p, attenteDepasse: v }))} />
        </SettingRow>
        <SettingRow label="Confirmation de clôture" desc="Confirmation lors de chaque clôture de visite">
          <Toggle value={notifs.clotureVisite} onChange={v => setNotifs(p => ({ ...p, clotureVisite: v }))} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Préférences d'affichage" icon={<User className="w-4 h-4" />}>
        <SettingRow label="Afficher les prix des médicaments" desc="PPV dans l'autocomplete des ordonnances">
          <Toggle value={prefs.afficherPrix} onChange={v => setPrefs(p => ({ ...p, afficherPrix: v }))} />
        </SettingRow>
        <SettingRow label="Demander confirmation avant suppression" desc="Modal de confirmation pour les actions irréversibles">
          <Toggle value={prefs.confirmSuppression} onChange={v => setPrefs(p => ({ ...p, confirmSuppression: v }))} />
        </SettingRow>
        <SettingRow label="Mode compact" desc="Réduit l'espacement pour afficher plus d'informations">
          <Toggle value={prefs.modeCompact} onChange={v => setPrefs(p => ({ ...p, modeCompact: v }))} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Sécurité et accès" icon={<Shield className="w-4 h-4" />}>
        <SettingRow label="Changer le mot de passe" desc="Modifier vos identifiants de connexion">
          <button className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Modifier <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </SettingRow>
        <SettingRow label="Sessions actives" desc="Appareils connectés à votre compte">
          <button className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Voir <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </SettingRow>
      </SettingsSection>

      <p className="text-[11px] text-gray-300 text-center pb-2">
        USS-I · v0.1.0 · © {new Date().getFullYear()} Urgences
      </p>
      </div>
    </div>
  )
}
