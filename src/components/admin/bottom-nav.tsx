'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Plus, ClipboardList, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
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
  { href: '/admin/marketplace/tasks', icon: ClipboardList, label: 'Tasks' },
]

const moreItems = [
  { href: '/admin/import', label: 'Import CSV' },
  { href: '/admin/settings', label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

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
                "flex flex-col items-center justify-center h-full px-4",
                isActive ? "text-yellow-500" : "text-slate-400"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
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

