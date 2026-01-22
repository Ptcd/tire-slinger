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
import { Checkbox } from '@/components/ui/checkbox'
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
import { TIRE_TYPES, TIRE_CONDITIONS, COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'
import type { Tire, TireFormData, BrandOption, ModelOption } from '@/lib/types'

interface TireFormProps {
  tire?: Tire
  onSuccess?: () => void
}

export function TireForm({ tire, onSuccess }: TireFormProps) {
  const router = useRouter()
  const { organization } = useUser()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  // Size format and catalog state
  const [sizeFormat, setSizeFormat] = useState<'standard' | 'flotation'>(
    tire?.is_flotation ? 'flotation' : 'standard'
  )
  const [isLt, setIsLt] = useState(tire?.is_lt ?? false)
  const [availableBrands, setAvailableBrands] = useState<BrandOption[]>([])
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  
  // Flotation size state
  const [flotationDiameter, setFlotationDiameter] = useState<string>(
    tire?.flotation_diameter?.toString() || ''
  )
  const [flotationWidth, setFlotationWidth] = useState<string>(
    tire?.flotation_width?.toString() || ''
  )

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

  // Fetch brands when size changes
  useEffect(() => {
    async function fetchBrands() {
      // Only fetch if we have a complete size
      if (sizeFormat === 'standard') {
        if (!formData.width || !formData.aspect_ratio || !formData.rim_diameter) {
          setAvailableBrands([])
          return
        }
      } else {
        if (!flotationDiameter || !flotationWidth || !formData.rim_diameter) {
          setAvailableBrands([])
          return
        }
      }
      
      setLoadingBrands(true)
      
      const params = new URLSearchParams()
      if (sizeFormat === 'flotation') {
        params.set('is_flotation', 'true')
        params.set('flotation_diameter', flotationDiameter)
        params.set('flotation_width', flotationWidth)
        params.set('flotation_rim', formData.rim_diameter.toString())
      } else {
        params.set('width', formData.width.toString())
        params.set('aspect_ratio', formData.aspect_ratio.toString())
        params.set('rim_diameter', formData.rim_diameter.toString())
      }
      if (isLt) params.set('is_lt', 'true')
      
      try {
        const res = await fetch(`/api/tire-catalog/brands?${params}`)
        const data = await res.json()
        setAvailableBrands(data.brands || [])
      } catch (err) {
        console.error('Error fetching brands:', err)
        setAvailableBrands([])
      } finally {
        setLoadingBrands(false)
      }
    }
    
    fetchBrands()
  }, [formData.width, formData.aspect_ratio, formData.rim_diameter, flotationDiameter, flotationWidth, isLt, sizeFormat])

  // Fetch models when brand changes
  useEffect(() => {
    async function fetchModels() {
      if (!formData.brand || showCustomBrand) {
        setAvailableModels([])
        return
      }
      
      setLoadingModels(true)
      
      const params = new URLSearchParams()
      params.set('brand', formData.brand)
      
      if (sizeFormat === 'flotation') {
        params.set('is_flotation', 'true')
        params.set('flotation_diameter', flotationDiameter)
        params.set('flotation_width', flotationWidth)
        params.set('flotation_rim', formData.rim_diameter.toString())
      } else {
        params.set('width', formData.width.toString())
        params.set('aspect_ratio', formData.aspect_ratio.toString())
        params.set('rim_diameter', formData.rim_diameter.toString())
      }
      if (isLt) params.set('is_lt', 'true')
      
      try {
        const res = await fetch(`/api/tire-catalog/models?${params}`)
        const data = await res.json()
        setAvailableModels(data.models || [])
        
        // Auto-select if only one model
        if (data.models?.length === 1) {
          form.setValue('model', data.models[0].model_name)
        }
      } catch (err) {
        console.error('Error fetching models:', err)
        setAvailableModels([])
      } finally {
        setLoadingModels(false)
      }
    }
    
    fetchModels()
  }, [formData.brand, formData.width, formData.aspect_ratio, formData.rim_diameter, flotationDiameter, flotationWidth, isLt, sizeFormat, showCustomBrand, form])

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
    
    // Calculate size_display
    let sizeDisplay = ''
    if (sizeFormat === 'flotation') {
      const dia = parseFloat(flotationDiameter) || 0
      const wid = parseFloat(flotationWidth) || 0
      const rim = data.rim_diameter
      sizeDisplay = `${dia}X${wid}R${rim}`
    } else {
      sizeDisplay = `${data.width}/${data.aspect_ratio}R${data.rim_diameter}`
      if (isLt) {
        sizeDisplay = `LT ${sizeDisplay}`
      }
    }
    
    // Calculate diameter_inches
    let diameterInches = 0
    if (sizeFormat === 'flotation') {
      diameterInches = parseFloat(flotationDiameter) || 0
    } else {
      // Standard calculation: rim + 2 * (width * aspect_ratio / 100) / 25.4
      diameterInches = data.rim_diameter + 2 * (data.width * data.aspect_ratio / 100) / 25.4
    }
    
    const tireData: any = {
      org_id: organization.id,
      width: sizeFormat === 'standard' ? data.width : 0,
      aspect_ratio: sizeFormat === 'standard' ? data.aspect_ratio : 0,
      rim_diameter: data.rim_diameter,
      size_display: sizeDisplay,
      diameter_inches: diameterInches,
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
      is_lt: isLt,
      is_flotation: sizeFormat === 'flotation',
      flotation_diameter: sizeFormat === 'flotation' ? parseFloat(flotationDiameter) : null,
      flotation_width: sizeFormat === 'flotation' ? parseFloat(flotationWidth) : null,
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

        {/* Size Format Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={sizeFormat === 'standard' ? 'default' : 'outline'}
            onClick={() => {
              setSizeFormat('standard')
              setFlotationDiameter('')
              setFlotationWidth('')
            }}
            className={sizeFormat === 'standard' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            Standard Size
          </Button>
          <Button
            type="button"
            variant={sizeFormat === 'flotation' ? 'default' : 'outline'}
            onClick={() => {
              setSizeFormat('flotation')
              form.setValue('width', 0)
              form.setValue('aspect_ratio', 0)
            }}
            className={sizeFormat === 'flotation' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            Flotation Size
          </Button>
        </div>

        {/* LT Checkbox */}
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            id="is_lt"
            checked={isLt}
            onCheckedChange={(checked) => setIsLt(checked === true)}
          />
          <Label htmlFor="is_lt">Light Truck (LT)</Label>
        </div>

        {/* Size Inputs */}
        {sizeFormat === 'standard' ? (
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
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Diameter (inches)</Label>
              <Input
                type="number"
                value={flotationDiameter}
                onChange={(e) => setFlotationDiameter(e.target.value)}
                placeholder="35"
              />
            </div>
            <div>
              <Label>Width (inches)</Label>
              <Input
                type="number"
                step="0.5"
                value={flotationWidth}
                onChange={(e) => setFlotationWidth(e.target.value)}
                placeholder="12.50"
              />
            </div>
            <FormField
              control={form.control}
              name="rim_diameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rim</FormLabel>
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
        )}

        {/* Brand and Model */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                {showCustomBrand ? (
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        value={customBrand}
                        onChange={(e) => {
                          setCustomBrand(e.target.value)
                          field.onChange(e.target.value)
                        }}
                        placeholder="Enter brand name"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCustomBrand(false)
                        setCustomBrand('')
                        field.onChange('')
                        form.setValue('model', '')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => {
                      if (value === '__custom__') {
                        setShowCustomBrand(true)
                      } else {
                        field.onChange(value)
                        form.setValue('model', '')
                      }
                    }}
                    disabled={loadingBrands}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBrands ? 'Loading...' : 'Select brand'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBrands.map((b) => (
                        <SelectItem key={b.brand} value={b.brand}>
                          {b.brand} ({b.count})
                        </SelectItem>
                      ))}
                      {(organization?.allow_custom_brand !== false) && (
                        <SelectItem value="__custom__">Other (custom entry)...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Model {(organization?.require_model_selection === true) && <span className="text-red-500">*</span>}
                </FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value === '__unknown__' ? '' : value)}
                  disabled={!formData.brand || loadingModels || showCustomBrand}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingModels ? 'Loading...' : showCustomBrand ? 'Enter brand first' : 'Select model'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableModels.map((m) => (
                      <SelectItem key={m.model_name} value={m.model_name}>
                        {m.model_name} {m.category && `(${m.category})`}
                      </SelectItem>
                    ))}
                    {(organization?.require_model_selection !== true) && (
                      <SelectItem value="__unknown__">Unknown / Skip</SelectItem>
                    )}
                  </SelectContent>
                </Select>
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

