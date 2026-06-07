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

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <KYCForm currentStatus={(profile?.kyc_status ?? 'none') as KYCStatus} />
    </div>
  )
}
