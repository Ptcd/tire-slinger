'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Plus, ClipboardList, Menu, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navItems = [
  { href: '/admin', icon: Home, label: 'Home' },
  { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/admin/inventory/new', icon: Plus, label: 'Add', isMain: true },
  { href: '/admin/requests', icon: Inbox, label: 'Requests', hasBadge: true },
  { href: '/admin/marketplace/tasks', icon: ClipboardList, label: 'Tasks' },
]

const moreItems = [
  { href: '/admin/import', label: 'Import CSV' },
  { href: '/admin/settings', label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { organization } = useUser()
  const [newRequestCount, setNewRequestCount] = useState(0)

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
    
    const supabase = createClient()
    const channel = supabase
      .channel('request_count_bottom')
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
          const Icon = item.icon
          
          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center w-14 h-14 -mt-4 bg-yellow-500 rounded-full shadow-lg"
              >
                <Icon className="w-7 h-7 text-slate-900" />
              </Link>
            )
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full px-4 relative",
                isActive ? "text-yellow-500" : item.hasBadge && newRequestCount > 0 ? "text-red-500" : "text-slate-400"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
              {item.hasBadge && newRequestCount > 0 && (
                <span className="absolute top-1 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {newRequestCount}
                </span>
              )}
            </Link>
          )
        })}
        
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center h-full px-4 text-slate-400">
              <Menu className="w-6 h-6" />
              <span className="text-xs mt-1">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-slate-900 border-slate-700">
            <SheetHeader>
              <SheetTitle className="text-white">More Options</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-4">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center h-12 px-4 text-white bg-slate-800 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

