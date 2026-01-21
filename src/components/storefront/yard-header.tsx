import Image from 'next/image'
import { Phone, Mail, MapPin } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface YardHeaderProps {
  organization: Organization
}

export function YardHeader({ organization }: YardHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {organization.logo_url && (
            <div className="flex-shrink-0">
              <Image
                src={organization.logo_url}
                alt={organization.name}
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
            {organization.description && (
              <p className="text-slate-600 mb-4">{organization.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {organization.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{organization.phone}</span>
                </div>
              )}
              {organization.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{organization.email}</span>
                </div>
              )}
              {organization.city && organization.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
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

