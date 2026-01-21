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
  CircleDot,
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
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <CircleDot className="h-8 w-8 text-primary" />
          <span className="text-xl font-black text-foreground">
            TIRE<span className="text-primary">SLINGERS</span>
          </span>
        </Link>
      </div>
      
      {/* Organization name */}
      {organization && (
        <div className="px-6 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Yard</p>
          <p className="text-sm font-semibold text-foreground truncate">{organization.name}</p>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
      {/* Logout */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
