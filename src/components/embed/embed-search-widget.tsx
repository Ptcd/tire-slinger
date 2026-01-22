'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'
import { Search, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tire, Organization } from '@/lib/types'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface EmbedSearchWidgetProps {
  organization: Organization
  orgSlug: string
}

export function EmbedSearchWidget({ organization, orgSlug }: EmbedSearchWidgetProps) {
  const [searchMode, setSearchMode] = useState<'vehicle' | 'size'>('vehicle')
  
  // Vehicle search state
  const [years, setYears] = useState<number[]>([])
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMake, setSelectedMake] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loadingYears, setLoadingYears] = useState(false)
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  
  // Size search state
  const [sizeWidth, setSizeWidth] = useState<string>('')
  const [sizeAspectRatio, setSizeAspectRatio] = useState<string>('')
  const [sizeRimDiameter, setSizeRimDiameter] = useState<string>('')
  
  // Results state
  const [tires, setTires] = useState<Tire[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Load years on mount
  useEffect(() => {
    loadYears()
  }, [])

  // Load makes when year changes
  useEffect(() => {
    if (selectedYear) {
      loadMakes(selectedYear)
      setSelectedMake('')
      setSelectedModel('')
      setMakes([])
      setModels([])
    } else {
      setMakes([])
      setModels([])
    }
  }, [selectedYear])

  // Load models when make changes
  useEffect(() => {
    if (selectedYear && selectedMake) {
      loadModels(selectedYear, selectedMake)
      setSelectedModel('')
      setModels([])
    } else {
      setModels([])
    }
  }, [selectedYear, selectedMake])

  const loadYears = async () => {
    setLoadingYears(true)
    try {
      const res = await fetch('/api/fitment/years')
      const data = await res.json()
      setYears(data.years || [])
    } catch (error) {
      console.error('Error loading years:', error)
    } finally {
      setLoadingYears(false)
    }
  }

  const loadMakes = async (year: string) => {
    setLoadingMakes(true)
    try {
      const res = await fetch(`/api/fitment/makes?year=${year}`)
      const data = await res.json()
      setMakes(data.makes || [])
    } catch (error) {
      console.error('Error loading makes:', error)
    } finally {
      setLoadingMakes(false)
    }
  }

  const loadModels = async (year: string, make: string) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/fitment/models?year=${year}&make=${encodeURIComponent(make)}`)
      const data = await res.json()
      setModels(data.models || [])
    } catch (error) {
      console.error('Error loading models:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const searchByVehicle = async () => {
    if (!selectedYear || !selectedMake || !selectedModel) return

    setLoadingResults(true)
    setHasSearched(true)

    try {
      const supabase = createClient()

      // Find matching vehicles
      const { data: vehicles } = await supabase
        .from('fitment_vehicles')
        .select('id')
        .eq('year', parseInt(selectedYear))
        .ilike('make', `%${selectedMake}%`)
        .ilike('model', `%${selectedModel}%`)

      if (!vehicles || vehicles.length === 0) {
        setTires([])
        return
      }

      const vehicleIds = vehicles.map(v => v.id)

      // Get tire sizes for these vehicles
      const { data: sizes } = await supabase
        .from('fitment_tire_sizes')
        .select('width, aspect_ratio, rim_diameter')
        .in('vehicle_id', vehicleIds)

      if (!sizes || sizes.length === 0) {
        setTires([])
        return
      }

      // Get unique size combinations
      const uniqueSizes = Array.from(
        new Set(sizes.map(s => `${s.width}-${s.aspect_ratio}-${s.rim_diameter}`))
      ).map(str => {
        const [w, ar, rd] = str.split('-')
        return { width: parseInt(w), aspect_ratio: parseInt(ar), rim_diameter: parseInt(rd) }
      })

      // Build OR conditions
      const orConditions = uniqueSizes.map(s =>
        `and(width.eq.${s.width},aspect_ratio.eq.${s.aspect_ratio},rim_diameter.eq.${s.rim_diameter})`
      ).join(',')

      // Query tires
      const { data: matchingTires } = await supabase
        .from('tires')
        .select('*')
        .eq('org_id', organization.id)
        .eq('is_active', true)
        .eq('status', 'published')
        .gt('quantity', 0)
        .or(orConditions)
        .order('created_at', { ascending: false })

      setTires(matchingTires || [])
    } catch (error) {
      console.error('Error searching by vehicle:', error)
      setTires([])
    } finally {
      setLoadingResults(false)
    }
  }

  const searchBySize = async () => {
    if (!sizeWidth || !sizeAspectRatio || !sizeRimDiameter) return

    setLoadingResults(true)
    setHasSearched(true)

    try {
      const supabase = createClient()

      const { data: matchingTires } = await supabase
        .from('tires')
        .select('*')
        .eq('org_id', organization.id)
        .eq('is_active', true)
        .eq('status', 'published')
        .eq('width', parseInt(sizeWidth))
        .eq('aspect_ratio', parseInt(sizeAspectRatio))
        .eq('rim_diameter', parseInt(sizeRimDiameter))
        .gt('quantity', 0)
        .order('created_at', { ascending: false })

      setTires(matchingTires || [])
    } catch (error) {
      console.error('Error searching by size:', error)
      setTires([])
    } finally {
      setLoadingResults(false)
    }
  }

  const canSearchVehicle = selectedYear && selectedMake && selectedModel
  const canSearchSize = sizeWidth && sizeAspectRatio && sizeRimDiameter

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Find Tires for Your Vehicle
        </h2>
        <p className="text-sm text-muted-foreground">
          Search by vehicle or tire size
        </p>
      </div>

      <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'vehicle' | 'size')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicle">Search by Vehicle</TabsTrigger>
          <TabsTrigger value="size">Search by Size</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={loadingYears}>
              <SelectTrigger>
                <SelectValue placeholder={loadingYears ? 'Loading...' : 'Select Year'} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedMake}
              onValueChange={setSelectedMake}
              disabled={!selectedYear || loadingMakes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingMakes ? 'Loading...' : selectedYear ? 'Select Make' : 'Select Year First'} />
              </SelectTrigger>
              <SelectContent>
                {makes.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={!selectedMake || loadingModels}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingModels ? 'Loading...' : selectedMake ? 'Select Model' : 'Select Make First'} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={searchByVehicle}
            disabled={!canSearchVehicle || loadingResults}
            className="w-full"
          >
            <Search className="mr-2 h-4 w-4" />
            {loadingResults ? 'Searching...' : 'Search Tires'}
          </Button>
        </TabsContent>

        <TabsContent value="size" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={sizeWidth} onValueChange={setSizeWidth}>
              <SelectTrigger>
                <SelectValue placeholder="Width" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_WIDTHS.map((w) => (
                  <SelectItem key={w} value={w.toString()}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sizeAspectRatio} onValueChange={setSizeAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="Aspect Ratio" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_ASPECT_RATIOS.map((ar) => (
                  <SelectItem key={ar} value={ar.toString()}>
                    {ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sizeRimDiameter} onValueChange={setSizeRimDiameter}>
              <SelectTrigger>
                <SelectValue placeholder="Rim Size" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_RIM_DIAMETERS.map((rd) => (
                  <SelectItem key={rd} value={rd.toString()}>
                    {rd}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={searchBySize}
            disabled={!canSearchSize || loadingResults}
            className="w-full"
          >
            <Search className="mr-2 h-4 w-4" />
            {loadingResults ? 'Searching...' : 'Search Tires'}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {hasSearched && (
        <div className="mt-8">
          {loadingResults ? (
            <div className="text-center py-8 text-muted-foreground">
              Searching...
            </div>
          ) : tires.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Found {tires.length} {tires.length === 1 ? 'Tire' : 'Tires'}
                </h3>
                <Link
                  href={`/yard/${orgSlug}`}
                  target="_blank"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View Full Store <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tires.slice(0, 4).map((tire) => (
                  <div
                    key={tire.id}
                    className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
                  >
                    <Link href={`/yard/${orgSlug}/tire/${tire.id}`} target="_blank">
                      <div className="relative h-32 w-full bg-muted">
                        {tire.images && tire.images.length > 0 ? (
                          <Image
                            src={tire.images[0]}
                            alt={tire.size_display}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/yard/${orgSlug}/tire/${tire.id}`} target="_blank">
                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
                          {tire.size_display}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tire.brand} {tire.model && `- ${tire.model}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {tire.condition}
                        </Badge>
                        {tire.tread_depth && (
                          <Badge variant="secondary" className="text-xs">
                            {tire.tread_depth}/32"
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatPrice(tire.price)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tire.quantity} available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {tires.length > 4 && (
                <div className="text-center pt-4">
                  <Link
                    href={`/yard/${orgSlug}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    View all {tires.length} tires on full store →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No matching tires found.</p>
              <Link
                href={`/yard/${orgSlug}`}
                target="_blank"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View all available tires →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

