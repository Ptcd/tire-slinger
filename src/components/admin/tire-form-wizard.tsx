'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { ImageUpload } from '@/components/shared/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIRE_TYPES, TIRE_CONDITIONS, COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'
import { ChevronLeft, ChevronRight, Camera, Check } from 'lucide-react'
import type { BrandOption, ModelOption } from '@/lib/types'

const STEPS = [
  { id: 1, title: 'Photos', description: 'Take pictures of the tire' },
  { id: 2, title: 'Size', description: 'Enter the tire size' },
  { id: 3, title: 'Brand', description: 'Select brand and model' },
  { id: 4, title: 'Details', description: 'Condition and type' },
  { id: 5, title: 'Price', description: 'Set price and quantity' },
]

export function TireFormWizard() {
  const router = useRouter()
  const { organization, loading, error, retry } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form state
  const [images, setImages] = useState<string[]>([])

  // Sync images with sessionStorage for camera button integration
  useEffect(() => {
    // Initialize sessionStorage with current images
    sessionStorage.setItem('currentTireImages', JSON.stringify(images))
    
    // Listen for new images from camera button in bottom nav
    const handleImageAdded = () => {
      const stored = sessionStorage.getItem('currentTireImages')
      if (stored) {
        try {
          const urls = JSON.parse(stored) as string[]
          setImages(urls)
        } catch (e) {
          console.error('Failed to parse images:', e)
        }
      }
    }
    
    window.addEventListener('tireImageAdded', handleImageAdded)
    
    return () => {
      window.removeEventListener('tireImageAdded', handleImageAdded)
    }
  }, []) // Empty deps - only set up listener once

  // Keep sessionStorage in sync when images change (from ImageUpload or camera)
  useEffect(() => {
    sessionStorage.setItem('currentTireImages', JSON.stringify(images))
  }, [images])

  // Clean up sessionStorage when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('currentTireImages')
    }
  }, [])

  const [sizeFormat, setSizeFormat] = useState<'standard' | 'flotation'>('standard')
  const [isLt, setIsLt] = useState(false)
  const [width, setWidth] = useState(205)
  const [aspectRatio, setAspectRatio] = useState(55)
  const [rimDiameter, setRimDiameter] = useState(16)
  const [flotationDiameter, setFlotationDiameter] = useState('')
  const [flotationWidth, setFlotationWidth] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [tireType, setTireType] = useState('all-season')
  const [condition, setCondition] = useState('used')
  const [treadDepth, setTreadDepth] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [dotWeek, setDotWeek] = useState('')
  const [dotYear, setDotYear] = useState('')
  const [saleType, setSaleType] = useState<'individual' | 'pair' | 'set'>('individual')
  const [bundlePrice, setBundlePrice] = useState('')
  
  // Brand/model fetching
  const [availableBrands, setAvailableBrands] = useState<BrandOption[]>([])
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  
  // Fetch brands when size changes (step 2 -> step 3)
  useEffect(() => {
    if (currentStep < 3) return
    
    async function fetchBrands() {
      if (sizeFormat === 'standard') {
        if (!width || !aspectRatio || !rimDiameter) {
          setAvailableBrands([])
          return
        }
      } else {
        if (!flotationDiameter || !flotationWidth || !rimDiameter) {
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
        params.set('flotation_rim', rimDiameter.toString())
      } else {
        params.set('width', width.toString())
        params.set('aspect_ratio', aspectRatio.toString())
        params.set('rim_diameter', rimDiameter.toString())
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
  }, [currentStep, width, aspectRatio, rimDiameter, flotationDiameter, flotationWidth, isLt, sizeFormat])
  
  // Fetch models when brand changes
  useEffect(() => {
    if (!brand || showCustomBrand || currentStep < 3) {
      setAvailableModels([])
      return
    }
    
    async function fetchModels() {
      setLoadingModels(true)
      
      const params = new URLSearchParams()
      params.set('brand', brand)
      
      if (sizeFormat === 'flotation') {
        params.set('is_flotation', 'true')
        params.set('flotation_diameter', flotationDiameter)
        params.set('flotation_width', flotationWidth)
        params.set('flotation_rim', rimDiameter.toString())
      } else {
        params.set('width', width.toString())
        params.set('aspect_ratio', aspectRatio.toString())
        params.set('rim_diameter', rimDiameter.toString())
      }
      if (isLt) params.set('is_lt', 'true')
      
      try {
        const res = await fetch(`/api/tire-catalog/models?${params}`)
        const data = await res.json()
        setAvailableModels(data.models || [])
        
        // Auto-select if only one model
        if (data.models?.length === 1) {
          setModel(data.models[0].model_name)
        }
      } catch (err) {
        console.error('Error fetching models:', err)
        setAvailableModels([])
      } finally {
        setLoadingModels(false)
      }
    }
    
    fetchModels()
  }, [brand, width, aspectRatio, rimDiameter, flotationDiameter, flotationWidth, isLt, sizeFormat, showCustomBrand, currentStep])
  
  const canGoNext = () => {
    switch (currentStep) {
      case 1: 
        // Check if images required
        if (organization?.require_images && images.length === 0) {
          return false
        }
        return true
      case 2: 
        return sizeFormat === 'standard' 
          ? (width && aspectRatio && rimDiameter) 
          : (flotationDiameter && flotationWidth && rimDiameter)
      case 3: 
        // Brand required, model depends on org setting
        if (!brand && !showCustomBrand) return false
        if (organization?.require_model_selection && !model && model !== '__skip__') return false
        return true
      case 4: 
        // Check tread depth and DOT requirements
        if (organization?.require_tread_depth && !treadDepth) return false
        if (organization?.require_dot && (!dotWeek || !dotYear)) return false
        return true
      case 5: 
        return true // Price can be 0 for drafts
      default: 
        return false
    }
  }
  
  const handleSaveDraft = async () => {
    await saveTire(false)
  }
  
  const handleSavePublish = async () => {
    if (!price || parseFloat(price) <= 0) {
      alert('Please enter a price to publish')
      return
    }
    await saveTire(true)
  }
  
  const saveTire = async (publish: boolean) => {
    if (!organization) return
    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Calculate size_display
      let sizeDisplay = ''
      if (sizeFormat === 'flotation') {
        sizeDisplay = `${flotationDiameter}X${flotationWidth}R${rimDiameter}`
      } else {
        sizeDisplay = isLt ? `LT ${width}/${aspectRatio}R${rimDiameter}` : `${width}/${aspectRatio}R${rimDiameter}`
      }
      
      const tireData = {
        org_id: organization.id,
        width: sizeFormat === 'standard' ? width : 0,
        aspect_ratio: sizeFormat === 'standard' ? aspectRatio : 0,
        rim_diameter: rimDiameter,
        size_display: sizeDisplay,
        brand: (showCustomBrand ? customBrand : brand) || null,
        model: model === '__skip__' ? null : (model || null),
        tire_type: tireType,
        condition: condition,
        tread_depth: treadDepth ? parseInt(treadDepth) : null,
        dot_week: dotWeek ? parseInt(dotWeek) : null,
        dot_year: dotYear ? 2000 + parseInt(dotYear) : null,
        price: price ? parseFloat(price) : 0,
        quantity: quantity,
        sale_type: saleType,
        set_price: bundlePrice ? parseFloat(bundlePrice) : null,
        images: images,
        is_active: publish,
        is_lt: isLt,
        is_flotation: sizeFormat === 'flotation',
        flotation_diameter: sizeFormat === 'flotation' ? parseFloat(flotationDiameter) : null,
        flotation_width: sizeFormat === 'flotation' ? parseFloat(flotationWidth) : null,
      }
      
      const { data: newTire, error } = await supabase
        .from('tires')
        .insert(tireData)
        .select()
        .single()
      
      if (error) throw error
      
      // Create marketplace task if tire is published (not draft)
      if (publish && newTire) {
        await supabase.from('external_tasks').insert({
          org_id: organization.id,
          tire_id: newTire.id,
          platform: 'facebook_marketplace',
          task_type: 'create_listing',
          reason: 'new_tire',
          status: 'open',
          priority: 1,
        })
      }
      
      setShowSuccess(true)
    } catch (error: any) {
      console.error('Error saving tire:', error)
      alert(`Failed to save tire: ${error?.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }
  
  const handleAddAnother = () => {
    // Reset form
    setImages([])
    setBrand('')
    setModel('')
    setCustomBrand('')
    setShowCustomBrand(false)
    setPrice('')
    setQuantity(1)
    setDotWeek('')
    setDotYear('')
    setSaleType('individual')
    setBundlePrice('')
    setCurrentStep(1)
    setShowSuccess(false)
  }
  
  if (showSuccess) {
    const displaySize = sizeFormat === 'standard'
      ? `${width}/${aspectRatio}R${rimDiameter}`
      : `${flotationDiameter}X${flotationWidth}R${rimDiameter}`
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {price && parseFloat(price) > 0 ? 'Tire Published!' : 'Draft Saved!'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {showCustomBrand ? customBrand : brand} {model} - {displaySize}
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={handleAddAnother} className="h-14 text-lg bg-yellow-500 hover:bg-yellow-600">
            <Camera className="w-5 h-5 mr-2" />
            Add Another Tire
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/inventory?filter=drafts')} className="h-12">
            View Drafts
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/inventory')}>
            Done for now
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6 px-4">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.id === currentStep
                ? 'bg-yellow-500 text-black'
                : step.id < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
          </div>
        ))}
      </div>
      
      {/* Step title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{STEPS[currentStep - 1].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
      </div>
      
      {/* Step content */}
      <div className="px-4 pb-24">
        {currentStep === 1 && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : error || !organization ? (
              <div className="flex flex-col items-center justify-center h-32 bg-muted rounded-lg space-y-3 p-4">
                <p className="text-muted-foreground text-center text-sm">
                  {error ? error.message : 'Organization not found.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={retry}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <ImageUpload
                  orgId={organization.id}
                  currentImages={images}
                  onImagesChange={setImages}
                />
                {images.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {images.length} photo{images.length !== 1 ? 's' : ''} added
                  </p>
                )}
              </>
            )}
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Size format toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sizeFormat === 'standard' ? 'default' : 'outline'}
                onClick={() => setSizeFormat('standard')}
                className={sizeFormat === 'standard' ? 'bg-yellow-500 hover:bg-yellow-600 flex-1' : 'flex-1'}
              >
                Standard
              </Button>
              <Button
                type="button"
                variant={sizeFormat === 'flotation' ? 'default' : 'outline'}
                onClick={() => setSizeFormat('flotation')}
                className={sizeFormat === 'flotation' ? 'bg-yellow-500 hover:bg-yellow-600 flex-1' : 'flex-1'}
              >
                Flotation
              </Button>
            </div>
            
            {/* LT checkbox */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Checkbox
                id="is_lt"
                checked={isLt}
                onCheckedChange={(checked) => setIsLt(checked === true)}
              />
              <Label htmlFor="is_lt" className="text-base">Light Truck (LT)</Label>
            </div>
            
            {sizeFormat === 'standard' ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Select value={width.toString()} onValueChange={(v) => setWidth(parseInt(v))}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_WIDTHS.map((w) => (
                        <SelectItem key={w} value={w.toString()}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Aspect</Label>
                  <Select value={aspectRatio.toString()} onValueChange={(v) => setAspectRatio(parseInt(v))}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_ASPECT_RATIOS.map((ar) => (
                        <SelectItem key={ar} value={ar.toString()}>{ar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rim</Label>
                  <Select value={rimDiameter.toString()} onValueChange={(v) => setRimDiameter(parseInt(v))}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_RIM_DIAMETERS.map((rd) => (
                        <SelectItem key={rd} value={rd.toString()}>{rd}"</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Diameter</Label>
                  <Input
                    type="number"
                    value={flotationDiameter}
                    onChange={(e) => setFlotationDiameter(e.target.value)}
                    placeholder="35"
                    className="h-14 text-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={flotationWidth}
                    onChange={(e) => setFlotationWidth(e.target.value)}
                    placeholder="12.50"
                    className="h-14 text-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rim</Label>
                  <Select value={rimDiameter.toString()} onValueChange={(v) => setRimDiameter(parseInt(v))}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_RIM_DIAMETERS.map((rd) => (
                        <SelectItem key={rd} value={rd.toString()}>{rd}"</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Size preview */}
            <div className="p-4 bg-muted rounded-lg text-center">
              <span className="text-2xl font-bold">
                {sizeFormat === 'standard'
                  ? `${isLt ? 'LT ' : ''}${width}/${aspectRatio}R${rimDiameter}`
                  : `${flotationDiameter || '??'}X${flotationWidth || '??'}R${rimDiameter}`}
              </span>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Brand Selection */}
            <div>
              <Label>Brand</Label>
              {loadingBrands ? (
                <div className="h-14 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                  Loading brands...
                </div>
              ) : showCustomBrand ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={customBrand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value)
                      setBrand(e.target.value)
                    }}
                    placeholder="Enter brand name"
                    className="h-14 text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomBrand(false)
                      setCustomBrand('')
                      setBrand('')
                      setModel('')
                    }}
                    className="h-14"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select 
                  value={brand || undefined}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setShowCustomBrand(true)
                    } else {
                      setBrand(v)
                      setModel('')
                    }
                  }}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands && availableBrands.length > 0 ? (
                      availableBrands.map((b) => (
                        b.brand ? (
                          <SelectItem key={b.brand} value={b.brand}>
                            {b.brand} ({b.count})
                          </SelectItem>
                        ) : null
                      ))
                    ) : (
                      <SelectItem value="__no_match__" disabled>
                        No brands found for this size
                      </SelectItem>
                    )}
                    {(organization?.allow_custom_brand !== false) && (
                      <SelectItem value="__custom__">Other (type custom)...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* Model Selection */}
            <div>
              <Label>Model {!organization?.require_model_selection && <span className="text-muted-foreground">(optional)</span>}</Label>
              {loadingModels ? (
                <div className="h-14 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                  Loading models...
                </div>
              ) : (
                <Select 
                  value={model || undefined}
                  onValueChange={(v) => setModel(v === '__skip__' ? '' : v)} 
                  disabled={!brand || showCustomBrand}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder={showCustomBrand ? 'Skip for custom brand' : brand ? 'Select model' : 'Select brand first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__skip__">Skip / Unknown</SelectItem>
                    {availableModels && availableModels.length > 0 && availableModels.map((m) => (
                      m.model_name ? (
                        <SelectItem key={m.model_name} value={m.model_name}>
                          {m.model_name}
                        </SelectItem>
                      ) : null
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIRE_CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={tireType} onValueChange={setTireType}>
                  <SelectTrigger className="h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIRE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tread Depth {!organization?.require_tread_depth && <span className="text-muted-foreground">(optional)</span>}</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={treadDepth}
                onChange={(e) => setTreadDepth(e.target.value)}
                placeholder="e.g., 7"
                className="h-14 text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">32nds of an inch (1-12)</p>
            </div>
            
            {/* DOT Date Code - only show if org has DOT tracking enabled */}
            {organization?.dot_tracking_enabled && (
              <div className="space-y-3 pt-4 border-t">
                <Label>DOT Date Code {!organization?.require_dot && <span className="text-muted-foreground">(optional)</span>}</Label>
                <p className="text-xs text-muted-foreground">
                  The 4-digit code on the tire sidewall (e.g., 2419 = week 24, year 2019)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Week (01-52)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={dotWeek}
                      onChange={(e) => setDotWeek(e.target.value)}
                      placeholder="24"
                      className="h-14 text-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Year (2-digit)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={dotYear}
                      onChange={(e) => setDotYear(e.target.value)}
                      placeholder="19"
                      className="h-14 text-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <Label>Price (each)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-16 text-2xl pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave blank to save as draft</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 text-2xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="h-14 text-2xl text-center flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 text-2xl"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Sale Type */}
            <div className="pt-4 border-t">
              <Label>Selling As</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  type="button"
                  variant={saleType === 'individual' ? 'default' : 'outline'}
                  onClick={() => setSaleType('individual')}
                  className={saleType === 'individual' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Single
                </Button>
                <Button
                  type="button"
                  variant={saleType === 'pair' ? 'default' : 'outline'}
                  onClick={() => setSaleType('pair')}
                  className={saleType === 'pair' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Pair
                </Button>
                <Button
                  type="button"
                  variant={saleType === 'set' ? 'default' : 'outline'}
                  onClick={() => setSaleType('set')}
                  className={saleType === 'set' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Set of 4
                </Button>
              </div>
            </div>

            {/* Set/Pair Price - only show if not individual */}
            {saleType !== 'individual' && (
              <div>
                <Label>{saleType === 'pair' ? 'Pair Price' : 'Set Price'}</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    placeholder="0.00"
                    className="h-14 text-lg pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Price for the {saleType === 'pair' ? 'pair (2 tires)' : 'full set (4 tires)'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t z-40 md:relative md:bottom-0 md:border-0 md:mt-8 md:z-auto">
        <div className="flex gap-3 max-w-lg mx-auto">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="h-14 flex-1"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
          )}
          
          {currentStep < 5 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canGoNext()}
              className="h-14 flex-1 bg-yellow-500 hover:bg-yellow-600"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving}
                className="h-14 flex-1"
              >
                Save Draft
              </Button>
              <Button
                onClick={handleSavePublish}
                disabled={saving || !price || parseFloat(price) <= 0}
                className="h-14 flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-5 h-5 mr-1" />
                Publish
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

