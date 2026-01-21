'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useAutosave } from '@/hooks/use-autosave'
import { ImageUpload } from '@/components/shared/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { TIRE_BRANDS, TIRE_TYPES, TIRE_CONDITIONS, COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'
import type { Tire, TireFormData } from '@/lib/types'

interface TireFormProps {
  tire?: Tire
  onSuccess?: () => void
}

export function TireForm({ tire, onSuccess }: TireFormProps) {
  const router = useRouter()
  const { organization } = useUser()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const form = useForm<TireFormData>({
    defaultValues: tire ? {
      width: tire.width,
      aspect_ratio: tire.aspect_ratio,
      rim_diameter: tire.rim_diameter,
      brand: tire.brand || '',
      model: tire.model || '',
      tire_type: tire.tire_type,
      condition: tire.condition,
      tread_depth: tire.tread_depth,
      dot_week: tire.dot_week,
      dot_year: tire.dot_year,
      price: tire.price,
      quantity: tire.quantity,
      description: tire.description || '',
      images: tire.images || [],
    } : {
      width: 205,
      aspect_ratio: 55,
      rim_diameter: 16,
      brand: '',
      model: '',
      tire_type: 'all-season',
      condition: 'used',
      tread_depth: null,
      dot_week: null,
      dot_year: null,
      price: 0,
      quantity: 1,
      description: '',
      images: [],
    },
  })

  const formData = form.watch()

  // Autosave for edit mode
  useAutosave(
    formData,
    async (data) => {
      if (!tire || !organization) return
      setSaveStatus('saving')
      await saveTire(data)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    2000
  )

  const saveTire = async (data: TireFormData) => {
    if (!organization) return

    const supabase = createClient()
    const tireData = {
      org_id: organization.id,
      width: data.width,
      aspect_ratio: data.aspect_ratio,
      rim_diameter: data.rim_diameter,
      brand: data.brand || null,
      model: data.model || null,
      tire_type: data.tire_type,
      condition: data.condition,
      tread_depth: data.tread_depth,
      dot_week: data.dot_week,
      dot_year: data.dot_year,
      price: data.price,
      quantity: data.quantity,
      description: data.description || null,
      images: data.images,
    }

    if (tire) {
      // Update existing - check for marketplace listing changes
      const { data: existingListing } = await supabase
        .from('external_listings')
        .select('*')
        .eq('tire_id', tire.id)
        .eq('platform', 'facebook_marketplace')
        .eq('status', 'posted')
        .maybeSingle()

      // Update tire
      const { error } = await supabase
        .from('tires')
        .update(tireData)
        .eq('id', tire.id)

      if (error) throw error

      // Create tasks if listing exists and values changed
      if (existingListing) {
        const tasksToCreate: any[] = []

        // Check if sold out
        if (data.quantity === 0 && tire.quantity > 0) {
          tasksToCreate.push({
            org_id: organization.id,
            tire_id: tire.id,
            external_listing_id: existingListing.id,
            platform: 'facebook_marketplace',
            task_type: 'delete_listing',
            reason: 'sold_out',
            status: 'open',
            priority: 3,
            metadata: { old_quantity: tire.quantity, new_quantity: 0 },
          })
        }
        // Check if price changed
        else if (data.price !== tire.price) {
          tasksToCreate.push({
            org_id: organization.id,
            tire_id: tire.id,
            external_listing_id: existingListing.id,
            platform: 'facebook_marketplace',
            task_type: 'update_listing',
            reason: 'price_changed',
            status: 'open',
            priority: 2,
            metadata: { old_price: tire.price, new_price: data.price },
          })
        }
        // Check if quantity changed (but not to zero)
        else if (data.quantity !== tire.quantity && data.quantity > 0) {
          tasksToCreate.push({
            org_id: organization.id,
            tire_id: tire.id,
            external_listing_id: existingListing.id,
            platform: 'facebook_marketplace',
            task_type: 'update_listing',
            reason: 'quantity_changed',
            status: 'open',
            priority: 2,
            metadata: { old_quantity: tire.quantity, new_quantity: data.quantity },
          })
        }

        // Insert tasks if any
        if (tasksToCreate.length > 0) {
          await supabase.from('external_tasks').insert(tasksToCreate)
        }
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('tires')
        .insert(tireData)

      if (error) throw error
    }
  }

  const onSubmit = async (data: TireFormData) => {
    setSaving(true)
    try {
      await saveTire(data)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/inventory')
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving tire:', error)
      alert('Failed to save tire')
    } finally {
      setSaving(false)
    }
  }

  if (!organization) {
    return <div>Loading...</div>
  }

  const showDOTFields = organization.dot_tracking_enabled

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{tire ? 'Edit Tire' : 'Add New Tire'}</h2>
          <div className="flex items-center gap-4">
            {tire && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/inventory/${tire.id}/marketplace`)}
              >
                Marketplace Package
              </Button>
            )}
            {tire && saveStatus !== 'idle' && (
              <span className="text-sm text-muted-foreground">
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
            )}
          </div>
        </div>

        {/* Size */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMMON_WIDTHS.map((w) => (
                      <SelectItem key={w} value={w.toString()}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aspect_ratio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aspect Ratio</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMMON_ASPECT_RATIOS.map((ar) => (
                      <SelectItem key={ar} value={ar.toString()}>
                        {ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rim_diameter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rim Diameter</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rim" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMMON_RIM_DIAMETERS.map((rd) => (
                      <SelectItem key={rd} value={rd.toString()}>
                        {rd}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Brand and Model */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIRE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Defender T+H" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Type and Condition */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tire_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tire Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIRE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIRE_CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tread Depth */}
        <FormField
          control={form.control}
          name="tread_depth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tread Depth (32nds of an inch)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="e.g., 7"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                />
              </FormControl>
              <FormDescription>Enter the tread depth remaining (1-12)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DOT Fields (conditional) */}
        {showDOTFields && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dot_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOT Week (1-53)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="53"
                      placeholder="e.g., 23"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>Week of manufacture</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dot_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOT Year (YYYY)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2000"
                      max="2099"
                      placeholder="e.g., 2019"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>Year of manufacture</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Price and Quantity */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about the tire..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <ImageUpload
                  orgId={organization.id}
                  currentImages={field.value}
                  onImagesChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : tire ? 'Update Tire' : 'Create Tire'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

