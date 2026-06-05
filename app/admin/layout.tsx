import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <nav className="w-52 border-r border-border bg-surface p-6 space-y-1">
        <p className="text-accent font-bold text-lg mb-6">Admin</p>
        <Link href="/admin/kyc" className="block text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-background text-sm">
          KYC Queue
        </Link>
        <Link href="/admin/disputes" className="block text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-background text-sm">
          Disputes
        </Link>
        <Link href="/admin/payouts" className="block text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-background text-sm">
          Payouts
        </Link>
        <div className="pt-4 border-t border-border mt-4">
          <Link href="/" className="block text-gray-600 hover:text-gray-400 py-2 px-3 text-xs">
            ← Back to site
          </Link>
        </div>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
