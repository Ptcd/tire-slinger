'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { COMMON_WIDTHS, COMMON_ASPECT_RATIOS, COMMON_RIM_DIAMETERS } from '@/lib/constants'

interface TireSearchProps {
  orgId: string
  onSearch?: (filters: any) => void
}

export function TireSearch({ orgId, onSearch }: TireSearchProps) {
  const [sizeSearch, setSizeSearch] = useState({
    width: '',
    aspectRatio: '',
    rimDiameter: '',
  })
  const [vehicleSearch, setVehicleSearch] = useState({
    year: '',
    make: '',
    model: '',
  })

  const handleSizeSearch = () => {
    if (onSearch) {
      onSearch({ type: 'size', ...sizeSearch })
    }
  }

  const handleVehicleSearch = () => {
    if (onSearch) {
      onSearch({ type: 'vehicle', ...vehicleSearch })
    }
  }

  return (
    <Tabs defaultValue="size" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="size">Search by Size</TabsTrigger>
        <TabsTrigger value="vehicle">Search by Vehicle</TabsTrigger>
      </TabsList>
      <TabsContent value="size" className="space-y-4">
        <div className="flex gap-4">
          <Select value={sizeSearch.width} onValueChange={(v) => setSizeSearch({ ...sizeSearch, width: v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Width" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_WIDTHS.map((w) => (
                <SelectItem key={w} value={w.toString()}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeSearch.aspectRatio} onValueChange={(v) => setSizeSearch({ ...sizeSearch, aspectRatio: v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Aspect Ratio" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_ASPECT_RATIOS.map((ar) => (
                <SelectItem key={ar} value={ar.toString()}>{ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeSearch.rimDiameter} onValueChange={(v) => setSizeSearch({ ...sizeSearch, rimDiameter: v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Rim Diameter" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_RIM_DIAMETERS.map((rd) => (
                <SelectItem key={rd} value={rd.toString()}>{rd}"</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSizeSearch}>Search</Button>
        </div>
      </TabsContent>
      <TabsContent value="vehicle" className="space-y-4">
        <div className="flex gap-4">
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
          <Button onClick={handleVehicleSearch}>Search</Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

