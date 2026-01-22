import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { YardHeader } from '@/components/storefront/yard-header'
import { ContactPurchaseButton } from '@/components/storefront/contact-purchase-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { TIRE_TYPES, TIRE_CONDITIONS } from '@/lib/constants'

export default async function TireDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createClient()

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!organization) {
    notFound()
  }

  // Get tire
  const { data: tire } = await supabase
    .from('tires')
    .select('*')
    .eq('id', id)
    .eq('org_id', organization.id)
    .single()

  if (!tire || !tire.is_active || tire.quantity === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <YardHeader organization={organization} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {tire.images && tire.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-96 w-full rounded-lg overflow-hidden bg-muted border-2 border-border">
                  <Image
                    src={tire.images[0]}
                    alt={tire.size_display}
                    fill
                    className="object-cover"
                  />
                </div>
                {tire.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {tire.images.slice(1).map((img: string, idx: number) => (
                      <div key={idx} className="relative h-24 w-full rounded overflow-hidden bg-muted border border-border">
                        <Image
                          src={img}
                          alt={`${tire.size_display} ${idx + 2}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 w-full rounded-lg bg-muted border-2 border-border flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black mb-2 text-foreground">{tire.size_display}</h1>
              <p className="text-xl text-muted-foreground mb-4">
                {tire.brand} {tire.model && `- ${tire.model}`}
              </p>
              <div className="flex gap-2 mb-4">
                <Badge className="bg-primary text-primary-foreground">
                  {TIRE_TYPES.find((t) => t.value === tire.tire_type)?.label}
                </Badge>
                <Badge variant="secondary">
                  {TIRE_CONDITIONS.find((c) => c.value === tire.condition)?.label}
                </Badge>
                {tire.tread_depth && (
                  <Badge variant="secondary">Tread: {tire.tread_depth}/32"</Badge>
                )}
              </div>
              <p className="text-4xl font-black text-primary mb-6">{formatPrice(tire.price)}</p>
            </div>

            <Card className="border-2 border-border">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold mb-3 text-foreground">Specifications</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium text-foreground">{tire.size_display}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium text-foreground">{tire.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium text-foreground">{tire.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-foreground">{TIRE_TYPES.find((t) => t.value === tire.tire_type)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="font-medium text-foreground">{TIRE_CONDITIONS.find((c) => c.value === tire.condition)?.label}</span>
                    </div>
                    {tire.tread_depth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tread Depth:</span>
                        <span className="font-medium text-foreground">{tire.tread_depth}/32"</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity Available:</span>
                      <span className="font-medium text-primary">{tire.quantity}</span>
                    </div>
                  </div>
                </div>
                {tire.description && (
                  <div>
                    <h3 className="font-bold mb-2 text-foreground">Description</h3>
                    <p className="text-sm text-muted-foreground">{tire.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <ContactPurchaseButton organization={organization} />
          </div>
        </div>
      </div>
    </div>
  )
}
