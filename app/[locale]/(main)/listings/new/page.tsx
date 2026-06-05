import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/listings/ListingForm'
import Link from 'next/link'

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
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">KYC Required</h1>
        <p className="text-gray-400 mb-6">You must verify your identity before listing items.</p>
        <Link href="/profile/kyc" className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
          Verify Now
        </Link>
      </div>
    )
  }

  const { data: games } = await supabase.from('games').select('id, name').order('name')

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">List an Item</h1>
      <ListingForm games={games ?? []} />
    </div>
  )
}
