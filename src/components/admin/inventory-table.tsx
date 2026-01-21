'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { TIRE_TYPES, TIRE_CONDITIONS } from '@/lib/constants'
import type { Tire } from '@/lib/types'

interface InventoryTableProps {
  initialTires: Tire[]
}

export function InventoryTable({ initialTires }: InventoryTableProps) {
  const router = useRouter()
  const [tires, setTires] = useState(initialTires)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')

  const filteredTires = useMemo(() => {
    return tires.filter((tire) => {
      const matchesSearch =
        search === '' ||
        tire.size_display.toLowerCase().includes(search.toLowerCase()) ||
        tire.brand?.toLowerCase().includes(search.toLowerCase()) ||
        tire.model?.toLowerCase().includes(search.toLowerCase())

      const matchesType = typeFilter === 'all' || tire.tire_type === typeFilter
      const matchesCondition = conditionFilter === 'all' || tire.condition === conditionFilter

      return matchesSearch && matchesType && matchesCondition
    })
  }, [tires, search, typeFilter, conditionFilter])

  const handleDelete = async (tireId: string) => {
    if (!confirm('Are you sure you want to delete this tire?')) return

    const supabase = createClient()
    const { error } = await supabase.from('tires').delete().eq('id', tireId)

    if (error) {
      alert('Failed to delete tire')
      return
    }

    setTires(tires.filter((t) => t.id !== tireId))
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by size, brand, or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TIRE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {TIRE_CONDITIONS.map((cond) => (
              <SelectItem key={cond.value} value={cond.value}>
                {cond.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Brand/Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Tread</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTires.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No tires found
                </TableCell>
              </TableRow>
            ) : (
              filteredTires.map((tire) => (
                <TableRow key={tire.id}>
                  <TableCell>
                    {tire.images && tire.images.length > 0 ? (
                      <img
                        src={tire.images[0]}
                        alt={tire.size_display}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-slate-200" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{tire.size_display}</TableCell>
                  <TableCell>
                    {tire.brand} {tire.model && `- ${tire.model}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIRE_TYPES.find((t) => t.value === tire.tire_type)?.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIRE_CONDITIONS.find((c) => c.value === tire.condition)?.label}</Badge>
                  </TableCell>
                  <TableCell>{tire.tread_depth ? `${tire.tread_depth}/32"` : '-'}</TableCell>
                  <TableCell>{formatPrice(tire.price)}</TableCell>
                  <TableCell>
                    <Badge variant={tire.quantity === 0 ? 'destructive' : tire.quantity < 3 ? 'secondary' : 'default'}>
                      {tire.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tire.is_active ? 'default' : 'secondary'}>
                      {tire.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/inventory/${tire.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(tire.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

