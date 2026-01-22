import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/sidebar'
import { Header } from '@/components/admin/header'
import { BottomNav } from '@/components/admin/bottom-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      
      {/* Mobile bottom nav - hidden on desktop */}
      <BottomNav />
    </div>
  )
}
