import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { KYCForm } from '@/components/kyc/KYCForm'
import { redirect } from 'next/navigation'
import type { KYCStatus } from '@/lib/types'

export default async function KYCPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      .select('phone, created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    kycData = data
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="p-2 rounded-xl border border-border text-gray-500 hover:text-white hover:border-accent transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Identity Verification</h1>
            <p className="text-gray-600 text-xs mt-0.5">Required to sell items on Dinoyor</p>
          </div>
        </div>
        <KYCForm
          currentStatus={(profile?.kyc_status ?? 'none') as KYCStatus}
          phone={kycData?.phone ?? null}
          submittedAt={kycData?.created_at ?? null}
          reviewedAt={kycData?.reviewed_at ?? null}
        />
      </div>
    </div>
  )
}
