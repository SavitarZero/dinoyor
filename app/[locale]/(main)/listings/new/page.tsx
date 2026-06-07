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
              className="inline-block mt-3 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors"
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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/market" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-white mt-3">Sell an item</h1>
        <p className="text-gray-500 text-sm mt-1">Your listing will be visible immediately after publishing.</p>
      </div>
      <ListingForm games={games ?? []} />
    </div>
  )
}
