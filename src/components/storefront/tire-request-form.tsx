'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

interface TireRequestFormProps {
  orgId: string
  orgName: string
  prefillSize?: string
}

export function TireRequestForm({ orgId, orgName, prefillSize }: TireRequestFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_info: '',
    requested_size: prefillSize || '',
    requested_quantity: 1,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          ...formData,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit request')
      }
      
      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit your request. Please try again or call us directly.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Request Submitted!</p>
              <p className="text-sm">We&apos;ll contact you when we have your tires in stock.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Can&apos;t Find What You Need?</CardTitle>
        <CardDescription>
          Let us know what you&apos;re looking for and we&apos;ll notify you when it&apos;s available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Phone or Email *</Label>
              <Input
                id="contact"
                placeholder="555-123-4567 or email@example.com"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Tire Size *</Label>
              <Input
                id="size"
                placeholder="e.g., 205/55R16"
                value={formData.requested_size}
                onChange={(e) => setFormData({ ...formData, requested_size: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                max={8}
                value={formData.requested_quantity}
                onChange={(e) => setFormData({ ...formData, requested_quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements, brand preferences, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

