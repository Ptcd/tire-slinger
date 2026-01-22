'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, Mail } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface ContactPurchaseButtonProps {
  organization: Organization
}

export function ContactPurchaseButton({ organization }: ContactPurchaseButtonProps) {
  const [showContact, setShowContact] = useState(false)

  if (showContact) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
          {organization.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${organization.phone}`} className="text-primary hover:underline">
                {organization.phone}
              </a>
            </div>
          )}
          {organization.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${organization.email}`} className="text-primary hover:underline">
                {organization.email}
              </a>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowContact(false)} className="w-full">
          Hide Contact Info
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => setShowContact(true)} className="w-full">
      Contact to Purchase
    </Button>
  )
}

