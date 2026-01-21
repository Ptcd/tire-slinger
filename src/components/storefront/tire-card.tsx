import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ContactPurchaseButton } from './contact-purchase-button'
import type { Tire, Organization } from '@/lib/types'

interface TireCardProps {
  tire: Tire
  organization: Organization
  yardSlug: string
}

export function TireCard({ tire, organization, yardSlug }: TireCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/yard/${yardSlug}/tire/${tire.id}`}>
        <div className="relative h-48 w-full bg-slate-200">
          {tire.images && tire.images.length > 0 ? (
            <Image
              src={tire.images[0]}
              alt={tire.size_display}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No Image
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/yard/${yardSlug}/tire/${tire.id}`}>
          <h3 className="font-semibold text-lg mb-1">{tire.size_display}</h3>
        </Link>
        <p className="text-sm text-slate-600 mb-2">
          {tire.brand} {tire.model && `- ${tire.model}`}
        </p>
        <div className="flex gap-2 mb-2">
          <Badge variant="outline">{tire.condition}</Badge>
          {tire.tread_depth && (
            <Badge variant="outline">{tire.tread_depth}/32"</Badge>
          )}
        </div>
        <p className="text-2xl font-bold mb-2">{formatPrice(tire.price)}</p>
        <p className="text-sm text-slate-600">Quantity: {tire.quantity}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <ContactPurchaseButton organization={organization} />
      </CardFooter>
    </Card>
  )
}

