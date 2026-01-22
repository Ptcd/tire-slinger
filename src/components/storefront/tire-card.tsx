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
    <Card className="overflow-hidden border-2 border-border hover:border-primary/50 transition-colors">
      <Link href={`/yard/${yardSlug}/tire/${tire.id}`}>
        <div className="relative h-48 w-full bg-muted">
          {tire.images && tire.images.length > 0 ? (
            <Image
              src={tire.images[0]}
              alt={tire.size_display}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/yard/${yardSlug}/tire/${tire.id}`}>
          <h3 className="font-bold text-lg mb-1 text-foreground hover:text-primary transition-colors">
            {tire.size_display}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">
          {tire.brand} {tire.model && `- ${tire.model}`}
        </p>
        <div className="flex gap-2 mb-3">
          <Badge variant="secondary">{tire.condition}</Badge>
          {tire.tread_depth && (
            <Badge variant="secondary">{tire.tread_depth}/32"</Badge>
          )}
        </div>
        {tire.sale_type === 'individual' ? (
          <p className="text-2xl font-black text-primary mb-1">{formatPrice(tire.price)} each</p>
        ) : (
          <div className="mb-1">
            <p className="text-2xl font-black text-primary">
              {formatPrice(tire.set_price || tire.price * (tire.sale_type === 'pair' ? 2 : 4))} 
              {tire.sale_type === 'pair' ? ' / pair' : ' / set of 4'}
            </p>
            <p className="text-sm text-muted-foreground">
              ({formatPrice(tire.price)} each if sold individually)
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{tire.quantity}</span> available
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <ContactPurchaseButton organization={organization} />
      </CardFooter>
    </Card>
  )
}
