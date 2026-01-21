'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle2, ExternalLink, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { TIRE_CONDITIONS, TIRE_TYPES } from '@/lib/constants'
import type { Tire, ExternalListing } from '@/lib/types'

export default function MarketplacePackagePage() {
  const params = useParams()
  const router = useRouter()
  const tireId = params.id as string
  const [tire, setTire] = useState<Tire | null>(null)
  const [listing, setListing] = useState<ExternalListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: tireData } = await supabase
        .from('tires')
        .select('*')
        .eq('id', tireId)
        .single()

      if (tireData) {
        setTire(tireData as Tire)
      }

      const { data: listingData } = await supabase
        .from('external_listings')
        .select('*')
        .eq('tire_id', tireId)
        .eq('platform', 'facebook_marketplace')
        .maybeSingle()

      if (listingData) {
        setListing(listingData as ExternalListing)
      }

      setLoading(false)
    }

    loadData()
  }, [tireId])

  const generateTitle = (tire: Tire): string => {
    const parts: string[] = []
    
    if (tire.brand) parts.push(tire.brand)
    if (tire.model) parts.push(tire.model)
    parts.push(tire.size_display)
    
    const condition = TIRE_CONDITIONS.find(c => c.value === tire.condition)?.label || tire.condition
    parts.push(condition)
    
    if (tire.tread_depth) {
      parts.push(`${tire.tread_depth}/32" tread`)
    }
    
    if (tire.quantity > 1) {
      parts.push(`Set of ${tire.quantity}`)
    }
    
    return parts.join(' - ')
  }

  const generateDescription = (tire: Tire): string => {
    const lines: string[] = []
    
    lines.push(`Tire Size: ${tire.size_display}`)
    
    if (tire.brand) lines.push(`Brand: ${tire.brand}`)
    if (tire.model) lines.push(`Model: ${tire.model}`)
    
    const type = TIRE_TYPES.find(t => t.value === tire.tire_type)?.label || tire.tire_type
    lines.push(`Type: ${type}`)
    
    const condition = TIRE_CONDITIONS.find(c => c.value === tire.condition)?.label || tire.condition
    lines.push(`Condition: ${condition}`)
    
    if (tire.tread_depth) {
      lines.push(`Tread Depth: ${tire.tread_depth}/32"`)
    }
    
    if (tire.dot_week && tire.dot_year) {
      lines.push(`DOT Date: Week ${tire.dot_week}/${tire.dot_year}`)
    }
    
    lines.push(`Price: ${formatPrice(tire.price)} per tire`)
    
    if (tire.quantity > 1) {
      lines.push(`Quantity Available: ${tire.quantity} tires`)
    }
    
    if (tire.description) {
      lines.push('')
      lines.push(tire.description)
    }
    
    lines.push('')
    lines.push('Contact us for more information or to arrange pickup/delivery.')
    
    return lines.join('\n')
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleMarkAsPosted = async () => {
    if (!tire) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    if (listing) {
      // Update existing listing
      const { error } = await supabase
        .from('external_listings')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          posted_by: user.id,
          listed_price: tire.price,
          listed_quantity: tire.quantity,
        })
        .eq('id', listing.id)

      if (error) {
        alert('Failed to update listing status')
        return
      }
    } else {
      // Create new listing
      const { error } = await supabase
        .from('external_listings')
        .insert({
          org_id: profile.org_id,
          tire_id: tire.id,
          platform: 'facebook_marketplace',
          status: 'posted',
          posted_at: new Date().toISOString(),
          posted_by: user.id,
          listed_price: tire.price,
          listed_quantity: tire.quantity,
        })

      if (error) {
        alert('Failed to create listing')
        return
      }
    }

    router.refresh()
    alert('Listing marked as posted!')
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!tire) {
    return <div className="p-6">Tire not found</div>
  }

  const title = generateTitle(tire)
  const description = generateDescription(tire)
  const isPosted = listing?.status === 'posted'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Package</h1>
          <p className="text-muted-foreground">Generate listing content for Facebook Marketplace</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Tire
        </Button>
      </div>

      {/* Status Badge */}
      {isPosted && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">This tire is marked as posted on Facebook Marketplace</span>
            {listing?.listing_url && (
              <a
                href={listing.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Listing
                </Button>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Title */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listing Title</CardTitle>
              <CardDescription>Copy this title for your Facebook Marketplace listing</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(title, 'title')}
            >
              {copied === 'title' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={title}
            readOnly
            className="font-medium min-h-[60px]"
          />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listing Description</CardTitle>
              <CardDescription>Copy this description for your Facebook Marketplace listing</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(description, 'description')}
            >
              {copied === 'description' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            readOnly
            className="min-h-[300px] whitespace-pre-wrap"
          />
        </CardContent>
      </Card>

      {/* Images */}
      {tire.images && tire.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Use these images in your Facebook Marketplace listing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tire.images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={url}
                    alt={`Tire image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listing URL (if posted) */}
      {isPosted && (
        <Card>
          <CardHeader>
            <CardTitle>Listing URL</CardTitle>
            <CardDescription>Save the Facebook Marketplace listing URL here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Facebook Marketplace Listing URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://www.facebook.com/marketplace/item/..."
                  value={listing?.listing_url || ''}
                  onChange={async (e) => {
                    if (!listing) return
                    const supabase = createClient()
                    await supabase
                      .from('external_listings')
                      .update({ listing_url: e.target.value })
                      .eq('id', listing.id)
                    router.refresh()
                  }}
                />
                {listing?.listing_url && (
                  <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPosted ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                After posting this tire on Facebook Marketplace, click below to mark it as posted.
                This will help track your listings and create tasks when inventory changes.
              </p>
              <Button onClick={handleMarkAsPosted}>
                <Package className="h-4 w-4 mr-2" />
                Mark as Posted on Facebook Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This listing is marked as posted. If you need to update or delete it, tasks will be
                created automatically when you change the tire's price, quantity, or status.
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!listing) return
                  const supabase = createClient()
                  await supabase
                    .from('external_listings')
                    .update({ status: 'deleted' })
                    .eq('id', listing.id)
                  router.refresh()
                  alert('Listing marked as deleted')
                }}
              >
                Mark as Deleted
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
