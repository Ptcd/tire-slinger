'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'
import { Search } from 'lucide-react'

interface TireSearchProps {
  orgSlug: string
  initialFilters?: {
    width: string
    aspectRatio: string
    rimDiameter: string
    year: string
    make: string
    model: string
  }
}

export function TireSearch({ orgSlug, initialFilters }: TireSearchProps) {
  const router = useRouter()
  const [sizeSearch, setSizeSearch] = useState({
    width: initialFilters?.width || '',
    aspectRatio: initialFilters?.aspectRatio || '',
    rimDiameter: initialFilters?.rimDiameter || '',
  })
  const [vehicleSearch, setVehicleSearch] = useState({
    year: initialFilters?.year || '',
    make: initialFilters?.make || '',
    model: initialFilters?.model || '',
  })

  const handleSizeSearch = () => {
    const params = new URLSearchParams()
    if (sizeSearch.width) params.set('width', sizeSearch.width)
    if (sizeSearch.aspectRatio) params.set('aspect_ratio', sizeSearch.aspectRatio)
    if (sizeSearch.rimDiameter) params.set('rim_diameter', sizeSearch.rimDiameter)
    
    router.push(`/yard/${orgSlug}?${params.toString()}`)
  }

  const handleVehicleSearch = () => {
    const params = new URLSearchParams()
    if (vehicleSearch.year) params.set('year', vehicleSearch.year)
    if (vehicleSearch.make) params.set('make', vehicleSearch.make)
    if (vehicleSearch.model) params.set('model', vehicleSearch.model)
    
    router.push(`/yard/${orgSlug}?${params.toString()}`)
  }

  return (
    <Tabs defaultValue="size" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="size">Search by Size</TabsTrigger>
        <TabsTrigger value="vehicle">Search by Vehicle</TabsTrigger>
      </TabsList>
      
      <TabsContent value="size" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={sizeSearch.width || '__any__'} onValueChange={(v) => setSizeSearch({ ...sizeSearch, width: v === '__any__' ? '' : v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any Width</SelectItem>
              {COMMON_WIDTHS.map((w) => (
                <SelectItem key={w} value={w.toString()}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeSearch.aspectRatio || '__any__'} onValueChange={(v) => setSizeSearch({ ...sizeSearch, aspectRatio: v === '__any__' ? '' : v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Aspect Ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any Ratio</SelectItem>
              {COMMON_ASPECT_RATIOS.map((ar) => (
                <SelectItem key={ar} value={ar.toString()}>{ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeSearch.rimDiameter || '__any__'} onValueChange={(v) => setSizeSearch({ ...sizeSearch, rimDiameter: v === '__any__' ? '' : v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Rim Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any Rim</SelectItem>
              {COMMON_RIM_DIAMETERS.map((rd) => (
                <SelectItem key={rd} value={rd.toString()}>{rd}"</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSizeSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="vehicle" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="number"
            placeholder="Year (e.g., 2020)"
            value={vehicleSearch.year}
            onChange={(e) => setVehicleSearch({ ...vehicleSearch, year: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Make (e.g., Honda)"
            value={vehicleSearch.make}
            onChange={(e) => setVehicleSearch({ ...vehicleSearch, make: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Model (e.g., Civic)"
            value={vehicleSearch.model}
            onChange={(e) => setVehicleSearch({ ...vehicleSearch, model: e.target.value })}
            className="flex-1"
          />
          <Button onClick={handleVehicleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your vehicle info to find tires that fit.
        </p>
      </TabsContent>
    </Tabs>
  )
}
