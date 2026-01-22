'use client'

import { useEffect, useState } from 'react'
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
  LogOut,
  CircleDot,
  TrendingUp,
  Inbox,
  ChevronDown,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/import', label: 'Import', icon: Upload },
  { 
    href: '/admin/stock', 
    label: 'Stock Intelligence', 
    icon: TrendingUp,
    children: [
      { href: '/admin/stock/simple', label: 'Simple View' },
      { href: '/admin/stock/explained', label: 'Explained' },
    ]
  },
  { href: '/admin/requests', label: 'Requests', icon: Inbox, hasBadge: true },
  { href: '/admin/marketplace/tasks', label: 'Marketplace Tasks', icon: ShoppingBag },
  { href: '/admin/aging', label: 'Aging (DOT)', icon: Calendar },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization } = useUser()
  const router = useRouter()
  const [newRequestCount, setNewRequestCount] = useState(0)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['/admin/stock']))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Load new request count
  useEffect(() => {
    if (!organization) return
    
    async function loadCount() {
      if (!organization) return
      const supabase = createClient()
      const { count } = await supabase
        .from('customer_requests')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization.id)
        .eq('status', 'new')
      
      setNewRequestCount(count || 0)
    }
    
    loadCount()
    
    // Subscribe to changes
    const supabase = createClient()
    const channel = supabase
      .channel('request_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_requests',
          filter: `org_id=eq.${organization.id}`,
        },
        () => loadCount()
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [organization])

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(href)) {
      newExpanded.delete(href)
    } else {
      newExpanded.add(href)
    }
    setExpandedItems(newExpanded)
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
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.has(item.href)
          
          return (
            <div key={item.href}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={cn(
                      'flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block rounded-lg px-3 py-2 text-sm transition-all',
                              childActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : item.hasBadge && newRequestCount > 0
                        ? 'text-red-600 hover:bg-muted hover:text-red-700'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.hasBadge && newRequestCount > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {newRequestCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
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
