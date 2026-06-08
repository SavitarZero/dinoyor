import { createClient } from '@/lib/supabase/server'
import { reviewKYC } from '@/lib/actions/admin'

export default async function AdminKYCPage() {
  const supabase = await createClient()
  const { data: submissions } = await supabase
    .from('kyc_submissions')
    .select('*, profiles!user_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        KYC Queue <span className="text-gray-500 text-lg">({submissions?.length ?? 0})</span>
      </h1>
      {!submissions?.length && (
        <p className="text-gray-500">No pending KYC submissions.</p>
      )}
      <div className="space-y-4">
        {submissions?.map(s => (
          <div key={s.id} className="rounded border border-border bg-surface p-5 space-y-3">
            <div>
              <p className="text-white font-medium">{(s as any).profiles?.username ?? 'Unknown'}</p>
              <p className="text-gray-500 text-xs">{s.user_id}</p>
              <p className="text-gray-400 text-sm mt-1">Phone: {s.phone}</p>
              <p className="text-xs text-gray-500">
                Submitted: {new Date(s.created_at).toLocaleString()}
              </p>
            </div>
            <a
              href={s.id_card_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-accent text-sm underline"
            >
              View ID Card →
            </a>
            <div className="flex gap-3">
              <form action={async () => {
                'use server'
                await reviewKYC(s.id, 'approved')
              }}>
                <button className="px-4 py-2 rounded bg-green-700 text-white text-sm font-medium hover:bg-green-600">
                  Approve
                </button>
              </form>
              <form action={async (fd: FormData) => {
                'use server'
                await reviewKYC(s.id, 'rejected', fd.get('reason') as string)
              }} className="flex gap-2">
                <input
                  name="reason"
                  placeholder="Rejection reason"
                  required
                  className="px-3 py-1 rounded bg-background border border-border text-white text-sm w-48"
                />
                <button className="px-4 py-2 rounded bg-red-700 text-white text-sm font-medium hover:bg-red-600">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
