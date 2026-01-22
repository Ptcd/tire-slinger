import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail, MapPin, CircleDot } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface YardHeaderProps {
  organization: Organization
}

export function YardHeader({ organization }: YardHeaderProps) {
  return (
    <div className="bg-card border-b border-border">
      {/* Top bar with logo */}
      <div className="bg-sidebar border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <CircleDot className="h-6 w-6 text-primary" />
            <span className="text-lg font-black text-foreground">
              TIRE<span className="text-primary">SLINGERS</span>
            </span>
          </Link>
        </div>
      </div>
      
      {/* Yard info */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {organization.logo_url && (
            <div className="flex-shrink-0">
              <Image
                src={organization.logo_url}
                alt={organization.name}
                width={120}
                height={120}
                className="rounded-lg border-2 border-border"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black mb-2 text-foreground">{organization.name}</h1>
            {organization.description && (
              <p className="text-muted-foreground mb-4">{organization.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {organization.phone && (
                <a href={`tel:${organization.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{organization.phone}</span>
                </a>
              )}
              {organization.email && (
                <a href={`mailto:${organization.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{organization.email}</span>
                </a>
              )}
              {organization.city && organization.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{organization.city}, {organization.state}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
