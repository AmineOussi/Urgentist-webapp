'use client'

// ──────────────────────────────────────────────────────────────
//  DocumentsTab — upload & view patient documents / scans
// ──────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'
import { Button }   from '@/components/ui/button'
import { Modal }    from '@/components/ui/modal'
import { cn }       from '@/lib/utils'
import {
  Upload, FileText, Image as ImageIcon, Trash2, ExternalLink,
  Plus, FolderOpen, Loader2, X, CheckCircle2, AlertCircle,
  FileScan, FileStack, Microscope, ScrollText, Paperclip,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
export interface PatientDocument {
  id:        string
  nom:       string
  type:      string
  url:       string
  size:      number | null
  mimeType:  string | null
  createdAt: string
}

// ── Document type config ──────────────────────────────────────
const DOC_TYPES = [
  { value: 'radio',      label: 'Radiologie',     icon: <FileScan    className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { value: 'analyse',    label: 'Analyse / Labo', icon: <Microscope  className="w-4 h-4" />, color: 'bg-violet-100 text-violet-700' },
  { value: 'cr',         label: 'Compte-rendu',   icon: <ScrollText  className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ordonnance', label: 'Ordonnance ext.',icon: <FileStack   className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  { value: 'autre',      label: 'Autre',          icon: <Paperclip   className="w-4 h-4" />, color: 'bg-gray-100 text-gray-600' },
]

function docTypeConfig(type: string) {
  return DOC_TYPES.find(d => d.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1]
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isImage(mimeType: string | null): boolean {
  return !!(mimeType?.startsWith('image/'))
}

// ── Upload modal ──────────────────────────────────────────────
interface PendingFile {
  id:      string
  file:    File
  nom:     string
  type:    string
  status:  'pending' | 'uploading' | 'done' | 'error'
  preview: string | null
}

function UploadModal({ patientId, open, onClose, onUploaded }: {
  patientId: string; open: boolean; onClose: () => void; onUploaded: () => void
}) {
  const { toast }                     = useToast()
  const dropRef                       = useRef<HTMLDivElement>(null)
  const fileInputRef                  = useRef<HTMLInputElement>(null)
  const [files, setFiles]             = useState<PendingFile[]>([])
  const [uploading, setUploading]     = useState(false)
  const [dragging, setDragging]       = useState(false)

  function reset() { setFiles([]) }

  function addFiles(rawFiles: FileList | File[]) {
    const arr = Array.from(rawFiles)
    const newEntries: PendingFile[] = arr.map(f => {
      const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
      return {
        id:      crypto.randomUUID(),
        file:    f,
        nom:     f.name.replace(/\.[^.]+$/, ''),
        type:    'autre',
        status:  'pending',
        preview,
      }
    })
    setFiles(prev => [...prev, ...newEntries])
  }

  function removeFile(id: string) {
    setFiles(prev => {
      const found = prev.find(f => f.id === id)
      if (found?.preview) URL.revokeObjectURL(found.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  function updateFile(id: string, patch: Partial<PendingFile>) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function uploadAll() {
    if (!files.length) return
    setUploading(true)
    let successCount = 0

    for (const entry of files) {
      if (entry.status === 'done') continue
      updateFile(entry.id, { status: 'uploading' })

      const form = new FormData()
      form.append('file', entry.file)
      form.append('nom',  entry.nom)
      form.append('type', entry.type)

      const res = await fetch(`/api/patients/${patientId}/documents`, { method: 'POST', body: form })
      if (res.ok) {
        updateFile(entry.id, { status: 'done' })
        successCount++
      } else {
        const err = await res.json().catch(() => ({ error: 'Erreur' }))
        updateFile(entry.id, { status: 'error' })
        toast('error', err.error ?? 'Erreur lors du téléchargement')
      }
    }

    setUploading(false)
    if (successCount > 0) {
      toast('success', `${successCount} document${successCount > 1 ? 's' : ''} ajouté${successCount > 1 ? 's' : ''}`)
      onUploaded()
      reset()
      onClose()
    }
  }

  // Drag-and-drop
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true) }
  function onDragLeave() { setDragging(false) }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const pendingCount = files.filter(f => f.status !== 'done').length

  return (
    <Modal
      open={open}
      onClose={() => { if (!uploading) { reset(); onClose() } }}
      title="Ajouter des documents"
      description="Glissez vos fichiers ou cliquez pour sélectionner. PDF, images acceptés."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={reset}
            disabled={!files.length || uploading}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Tout effacer
          </button>
          <Button
            onClick={uploadAll}
            loading={uploading}
            disabled={!pendingCount}
          >
            Télécharger {pendingCount > 0 && `(${pendingCount})`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            dragging
              ? 'border-brand-400 bg-brand-50 scale-[1.01]'
              : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/40',
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
              dragging ? 'bg-brand-100' : 'bg-gray-100',
            )}>
              <Upload className={cn('w-5 h-5', dragging ? 'text-brand-600' : 'text-gray-400')} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {dragging ? 'Déposez les fichiers ici' : 'Glissez vos fichiers ou cliquez'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, PNG, JPG, TIFF · max 20 MB par fichier</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.tiff"
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files) }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {files.map(entry => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                  entry.status === 'done'      ? 'bg-emerald-50 border-emerald-100' :
                  entry.status === 'error'     ? 'bg-red-50 border-red-100' :
                  entry.status === 'uploading' ? 'bg-brand-50 border-brand-100' :
                                                 'bg-gray-50 border-gray-100',
                )}
              >
                {/* Thumbnail or icon */}
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.preview
                    ? <img src={entry.preview} alt="" className="w-full h-full object-cover" />
                    : <FileText className="w-5 h-5 text-gray-400" />
                  }
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <input
                    value={entry.nom}
                    onChange={e => updateFile(entry.id, { nom: e.target.value })}
                    disabled={entry.status !== 'pending'}
                    className="w-full text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-brand-300 rounded px-1 py-0.5 -ml-1"
                  />
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <select
                      value={entry.type}
                      onChange={e => updateFile(entry.id, { type: e.target.value })}
                      disabled={entry.status !== 'pending'}
                      className="text-[10px] font-semibold border border-gray-200 rounded-lg px-2 py-0.5 bg-white text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {DOC_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400">{fmtSize(entry.file.size)}</span>
                  </div>
                </div>

                {/* Status / actions */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {entry.status === 'uploading' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
                  {entry.status === 'done'      && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {entry.status === 'error'     && <AlertCircle  className="w-4 h-4 text-red-500" />}
                  {entry.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => removeFile(entry.id)}
                      className="p-0.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Document card ─────────────────────────────────────────────
function DocumentCard({ doc, onDelete, readOnly }: { doc: PatientDocument; onDelete: (id: string) => void; readOnly?: boolean }) {
  const { toast }                 = useToast()
  const [deleting, setDeleting]   = useState(false)
  const cfg                       = docTypeConfig(doc.type)

  async function handleDelete() {
    if (!window.confirm(`Supprimer "${doc.nom}" ?`)) return
    setDeleting(true)
    const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast('success', 'Document supprimé')
      onDelete(doc.id)
    } else {
      toast('error', 'Erreur lors de la suppression')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden hover:shadow-card-lg transition-shadow group">
      {/* Preview area */}
      <div className="aspect-[4/3] bg-gray-50 border-b border-gray-100 relative overflow-hidden flex items-center justify-center">
        {isImage(doc.mimeType) ? (
          <img
            src={doc.url}
            alt={doc.nom}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-gray-300" />
            <span className="text-[10px] text-gray-400 font-semibold uppercase">PDF</span>
          </div>
        )}
        {/* Type badge */}
        <div className={cn('absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold', cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </div>
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white rounded-xl text-gray-700 hover:text-brand-600 shadow-lg transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          {!readOnly && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); handleDelete() }}
              disabled={deleting}
              className="p-2.5 bg-white rounded-xl text-gray-700 hover:text-red-600 shadow-lg transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-bold text-gray-800 truncate" title={doc.nom}>{doc.nom}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-gray-400">{fmtDate(doc.createdAt)}</p>
          {doc.size && <p className="text-[10px] text-gray-400">{fmtSize(doc.size)}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────
export default function DocumentsTab({ patientId, onMutate, readOnly }: {
  patientId: string; onMutate: () => void; readOnly?: boolean
}) {
  const [documents, setDocuments]   = useState<PatientDocument[]>([])
  const [loading,   setLoading]     = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [filter,    setFilter]      = useState('all')

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/patients/${patientId}/documents`)
    if (res.ok) setDocuments(await res.json())
    setLoading(false)
  }, [patientId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function handleDelete(id: string) {
    setDocuments(prev => prev.filter(d => d.id !== id))
    onMutate()
  }

  const filtered = filter === 'all'
    ? documents
    : documents.filter(d => d.type === filter)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Documents & Scans</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={() => setUploadOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            size="sm"
          >
            Ajouter
          </Button>
        )}
      </div>

      {/* Type filter */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[{ value: 'all', label: 'Tous' }, ...DOC_TYPES].map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all',
                filter === t.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="p-3 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center py-14 gap-3">
          <FolderOpen className="w-10 h-10 text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-400">
              {filter !== 'all' ? 'Aucun document de ce type' : 'Aucun document pour ce patient'}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              Téléchargez des radios, analyses, comptes-rendus…
            </p>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            size="sm"
          >
            Ajouter un document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} readOnly={readOnly} />
          ))}
        </div>
      )}

      <UploadModal
        patientId={patientId}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { fetchDocs(); onMutate() }}
      />
    </div>
  )
}
