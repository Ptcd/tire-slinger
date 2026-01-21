'use client'

import { useUser } from '@/hooks/use-user'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  const { profile, organization } = useUser()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold">{organization?.name || 'Loading...'}</h2>
        <p className="text-sm text-slate-600">Manage your tire inventory</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-slate-600">{profile?.email}</p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

