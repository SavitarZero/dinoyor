import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/listings/ListingForm'

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  if (profile?.kyc_status !== 'approved') {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className={`rounded-xl border p-5 ${
          profile?.kyc_status === 'pending'
            ? 'border-yellow-800/50 bg-yellow-950/20'
            : 'border-border bg-surface'
        }`}>
          <p className={`text-sm font-medium ${profile?.kyc_status === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
            {profile?.kyc_status === 'pending' ? 'Verification in progress' : 'Identity verification required'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {profile?.kyc_status === 'pending'
              ? 'Your documents are being reviewed. Usually takes 1–2 business days.'
              : 'You need to verify your identity before listing items for sale.'}
          </p>
          {profile?.kyc_status !== 'pending' && (
            <Link
              href="/profile/kyc"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Verify identity
            </Link>
          )}
        </div>
      </div>
    )
  }

  const { data: games } = await supabase.from('games').select('id, name').order('name')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/listings" className="p-2 rounded-xl border border-border text-gray-500 hover:text-white hover:border-accent transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Create listing</h1>
            <p className="text-gray-600 text-xs mt-0.5">Visible on the marketplace immediately after publishing</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <ListingForm games={games ?? []} />
        </div>
      </div>
    </div>
  )
}
