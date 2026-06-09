import { createClient } from '@/lib/supabase/server'
import { KYCForm } from '@/components/kyc/KYCForm'
import { redirect } from 'next/navigation'
import type { KYCStatus } from '@/lib/types'

export default async function KYCPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  let kycData = null
  if (profile?.kyc_status === 'approved' || profile?.kyc_status === 'pending') {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    kycData = data
  }

  const hasEmail = !!(user.email && !user.email.endsWith('@dcore.internal'))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">Become a Seller</h1>
        <p className="text-gray-500 text-sm mt-1">Verify your identity to list items for sale on DCORE.</p>
      </div>

      <KYCForm
        currentStatus={(profile?.kyc_status ?? 'none') as KYCStatus}
        submittedAt={kycData?.created_at ?? null}
        reviewedAt={kycData?.reviewed_at ?? null}
        hasEmail={hasEmail}
        email={hasEmail ? user.email : null}
      />
    </div>
  )
}
