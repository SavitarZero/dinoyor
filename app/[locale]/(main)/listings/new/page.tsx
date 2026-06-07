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
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-yellow-900/20 border border-yellow-700/40 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Identity Verification Required</h1>
          <p className="text-gray-400 text-sm mt-2">
            You need to verify your identity before you can list items for sale. This helps keep the marketplace safe.
          </p>
        </div>
        <Link
          href="/profile/kyc"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-bold hover:opacity-90 transition-opacity"
        >
          Verify Identity →
        </Link>
        {profile?.kyc_status === 'pending' && (
          <p className="text-yellow-400 text-sm">Your submission is under review. Usually takes 1-2 business days.</p>
        )}
      </div>
    )
  }

  const { data: games } = await supabase.from('games').select('id, name').order('name')

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <Link href="/market" className="text-gray-500 hover:text-white text-sm flex items-center gap-1.5 mb-4 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to market
        </Link>
        <h1 className="text-2xl font-bold text-white">List an Item</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below. Your item will be visible immediately.</p>
      </div>
      <ListingForm games={games ?? []} />
    </div>
  )
}
