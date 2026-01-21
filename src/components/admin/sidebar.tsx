'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Upload,
  ShoppingBag,
  Calendar,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/import', label: 'Import', icon: Upload },
  { href: '/admin/marketplace/tasks', label: 'Marketplace Tasks', icon: ShoppingBag },
  { href: '/admin/aging', label: 'Aging (DOT)', icon: Calendar },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization } = useUser()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Only show Aging if DOT tracking is enabled
  const filteredNavItems = navItems.filter((item) => {
    if (item.href === '/admin/aging') {
      return organization?.dot_tracking_enabled === true
    }
    return true
  })

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-semibold">Tire Slingers</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

