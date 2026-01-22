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
  const { organization } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form state
  const [images, setImages] = useState<string[]>([])
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
  }, [brand, width, aspectRatio, rimDiameter, flotationDiameter, flotationWidth, isLt, sizeFormat, showCustomBrand, currentStep])
  
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return true // Photos optional
      case 2: return sizeFormat === 'standard' ? (width && aspectRatio && rimDiameter) : (flotationDiameter && flotationWidth && rimDiameter)
      case 3: return !!brand || showCustomBrand // Brand required, model optional
      case 4: return true // All have defaults
      case 5: return true // Price can be 0 for drafts
      default: return false
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
      
      // Calculate diameter_inches
      let diameterInches = 0
      if (sizeFormat === 'flotation') {
        diameterInches = parseFloat(flotationDiameter) || 0
      } else {
        diameterInches = rimDiameter + 2 * (width * aspectRatio / 100) / 25.4
      }
      
      const tireData = {
        org_id: organization.id,
        width: sizeFormat === 'standard' ? width : 0,
        aspect_ratio: sizeFormat === 'standard' ? aspectRatio : 0,
        rim_diameter: rimDiameter,
        size_display: sizeDisplay,
        diameter_inches: diameterInches,
        brand: (showCustomBrand ? customBrand : brand) || null,
        model: model || null,
        tire_type: tireType,
        condition: condition,
        tread_depth: treadDepth ? parseInt(treadDepth) : null,
        price: price ? parseFloat(price) : 0,
        quantity: quantity,
        images: images,
        is_active: publish,
        is_lt: isLt,
        is_flotation: sizeFormat === 'flotation',
        flotation_diameter: sizeFormat === 'flotation' ? parseFloat(flotationDiameter) : null,
        flotation_width: sizeFormat === 'flotation' ? parseFloat(flotationWidth) : null,
      }
      
      const { error } = await supabase.from('tires').insert(tireData)
      if (error) throw error
      
      setShowSuccess(true)
    } catch (error) {
      console.error('Error saving tire:', error)
      alert('Failed to save tire')
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
          <div>
            <ImageUpload
              orgId={organization?.id || ''}
              currentImages={images}
              onImagesChange={setImages}
            />
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
            <div>
              <Label>Brand</Label>
              {showCustomBrand ? (
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
                  value={brand} 
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      setShowCustomBrand(true)
                    } else {
                      setBrand(v)
                      setModel('')
                    }
                  }}
                  disabled={loadingBrands}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder={loadingBrands ? 'Loading...' : 'Select brand'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.map((b) => (
                      <SelectItem key={b.brand} value={b.brand}>
                        {b.brand} ({b.count})
                      </SelectItem>
                    ))}
                    {(organization?.allow_custom_brand !== false) && (
                      <SelectItem value="__custom__">Other (type custom)...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Model</Label>
              <Select 
                value={model} 
                onValueChange={setModel} 
                disabled={!brand || loadingModels || showCustomBrand}
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder={loadingModels ? 'Loading...' : showCustomBrand ? 'Enter brand first' : 'Select model'} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.model_name} value={m.model_name}>
                      {m.model_name}
                    </SelectItem>
                  ))}
                  <SelectItem value="">Skip / Unknown</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Tread Depth (optional)</Label>
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

