import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingForm } from '@/components/listings/ListingForm'

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [{ data: profile }, { data: games }] = await Promise.all([
    supabase.from('profiles').select('kyc_status').eq('id', user.id).single(),
    supabase.from('games').select('id, name').order('name'),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Create listing</h1>
          <p className="text-gray-600 text-xs mt-0.5">Visible on the marketplace immediately after publishing</p>
        </div>
      </div>
      <ListingForm games={games ?? []} kycStatus={profile?.kyc_status ?? null} />
    </div>
  )
}
