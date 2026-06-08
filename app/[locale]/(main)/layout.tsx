import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProfileWatcher } from '@/components/layout/ProfileWatcher'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      {userId && <ProfileWatcher userId={userId} />}
    </>
  )
}
