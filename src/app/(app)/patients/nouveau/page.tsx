import NouveauPatientForm from '@/components/patients/NouveauPatientForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NouveauPatientPage() {
  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-gray-100 px-5 md:px-8 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link href="/patients"
          className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Nouveau patient</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Créer un nouveau dossier patient</p>
        </div>
      </header>
      <div className="px-5 md:px-8 py-6 max-w-2xl">
        <NouveauPatientForm />
      </div>
    </div>
  )
}
