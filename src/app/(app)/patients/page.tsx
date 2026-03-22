import { db } from '@/lib/db'
import Link from 'next/link'
import { formatDate, age } from '@/lib/utils'
import { Users, Search, Plus, ChevronRight, UserCircle2 } from 'lucide-react'
import PatientsSearch from '@/components/patients/PatientsSearch'

// Always fetch fresh data — never serve a cached empty list
export const dynamic = 'force-dynamic'

interface SearchParams { q?: string; page?: string }

export default async function PatientsPage({ searchParams }: { searchParams: SearchParams }) {
  const q    = (searchParams.q ?? '').trim()
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const perPage = 20
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = db
    .from('patients')
    .select('id, cin, nom, prenom, "dateNaissance", sexe, telephone, ville, "createdAt"', { count: 'exact' })
    .order('nom', { ascending: true })
    .range(from, to)

  if (q.length >= 2) {
    query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,cin.ilike.%${q}%,telephone.ilike.%${q}%`)
  }

  const { data: patients, count } = await query
  const total = count ?? 0
  const pages = Math.ceil(total / perPage)

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Patients</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            {total > 0 ? `${total} patient${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''}` : 'Base de données patients'}
          </p>
        </div>
        <Link
          href="/patients/nouveau"
          className="inline-flex items-center gap-2 h-9 px-4 bg-brand-600 text-white text-sm font-semibold rounded-xl
            hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau patient</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </header>

      <div className="px-5 md:px-8 py-6 space-y-5">
        {/* Search */}
        <PatientsSearch defaultValue={q} />

        {/* Results */}
        {(patients ?? []).length === 0 ? (
          <EmptyState query={q} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CIN</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Âge</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscrit le</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(patients ?? []).map((p: any) => (
                    <tr
                      key={p.id}
                      className="relative hover:bg-brand-50/50 hover:shadow-[inset_3px_0_0_0_theme(colors.brand.500)] transition-all duration-150 group cursor-pointer"
                    >
                      {/* Full-row invisible link overlay */}
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/patients/${p.id}`}
                          className="absolute inset-0 z-0"
                          aria-label={`Ouvrir le dossier de ${p.prenom} ${p.nom}`}
                        />
                        <div className="relative z-10 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                            ${p.sexe === 'F' ? 'bg-pink-100 text-pink-700 group-hover:bg-pink-200' : 'bg-brand-100 text-brand-700 group-hover:bg-brand-200'}`}>
                            {(p.prenom?.[0] ?? '').toUpperCase()}{(p.nom?.[0] ?? '').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                              {p.prenom} {p.nom.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-400">{p.sexe === 'M' ? 'Homme' : p.sexe === 'F' ? 'Femme' : '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 relative z-10 font-mono text-gray-500 text-xs">{p.cin ?? '—'}</td>
                      <td className="px-5 py-3.5 relative z-10 text-gray-600">{age(p.dateNaissance) != null ? `${age(p.dateNaissance)} ans` : '—'}</td>
                      <td className="px-5 py-3.5 relative z-10 text-gray-600">{p.telephone ?? '—'}</td>
                      <td className="px-5 py-3.5 relative z-10 text-gray-600">{p.ville ?? '—'}</td>
                      <td className="px-5 py-3.5 relative z-10 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-3.5 relative z-10">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50
                          group-hover:bg-brand-100 group-hover:shadow-sm rounded-xl transition-all">
                          Dossier <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {(patients ?? []).map((p: any) => (
                <Link key={p.id} href={`/patients/${p.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-card p-4 active:scale-[.99] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {(p.prenom?.[0] ?? '')}{(p.nom?.[0] ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{p.nom} {p.prenom}</p>
                      <p className="text-xs text-gray-400">
                        {p.sexe === 'M' ? 'H' : 'F'}{age(p.dateNaissance) ? ` · ${age(p.dateNaissance)} ans` : ''}
                        {p.cin ? ` · ${p.cin}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-400">
                  Page {page} sur {pages}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/patients?q=${q}&page=${page - 1}`}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      ← Précédent
                    </Link>
                  )}
                  {page < pages && (
                    <Link href={`/patients?q=${q}&page=${page + 1}`}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      Suivant →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
        <UserCircle2 className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {query ? `Aucun résultat pour "${query}"` : 'Aucun patient'}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mb-5">
        {query ? 'Essayez avec un autre nom, CIN ou numéro de téléphone.' : 'Commencez par ajouter un patient.'}
      </p>
      {!query && (
        <Link href="/patients/nouveau"
          className="inline-flex items-center gap-2 h-9 px-4 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Nouveau patient
        </Link>
      )}
    </div>
  )
}
