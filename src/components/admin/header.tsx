'use client'

import { useUser } from '@/hooks/use-user'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export function Header() {
  const { profile, organization } = useUser()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Managing inventory for</p>
          <h2 className="text-lg font-bold text-foreground">{organization?.name || 'Loading...'}</h2>
        </div>
        {organization?.slug && (
          <Link 
            href={`/yard/${organization.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View Storefront
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        <Avatar className="border-2 border-primary">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
