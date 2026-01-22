'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/use-mobile'
import { InventoryCard } from './inventory-card'
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
import { cn } from '@/lib/utils'
import type { Tire } from '@/lib/types'

interface InventoryTableProps {
  initialTires: Tire[]
}

export function InventoryTable({ initialTires }: InventoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [tires, setTires] = useState(initialTires)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'drafts'>('all')
  
  // Sync with URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam === 'drafts' || filterParam === 'active') {
      setStatusFilter(filterParam)
    }
  }, [searchParams])

  const draftCount = tires.filter((t) => !t.is_active || t.price === 0).length

  const filteredTires = useMemo(() => {
    return tires.filter((tire) => {
      const matchesSearch =
        search === '' ||
        tire.size_display.toLowerCase().includes(search.toLowerCase()) ||
        tire.brand?.toLowerCase().includes(search.toLowerCase()) ||
        tire.model?.toLowerCase().includes(search.toLowerCase())

      const matchesType = typeFilter === 'all' || tire.tire_type === typeFilter
      const matchesCondition = conditionFilter === 'all' || tire.condition === conditionFilter
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && tire.is_active && tire.price > 0) ||
        (statusFilter === 'drafts' && (!tire.is_active || tire.price === 0))

      return matchesSearch && matchesType && matchesCondition && matchesStatus
    })
  }, [tires, search, typeFilter, conditionFilter, statusFilter])

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
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
            statusFilter === 'all' ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
            statusFilter === 'active' ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"
          )}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('drafts')}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
            statusFilter === 'drafts' ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"
          )}
        >
          Drafts {draftCount > 0 && `(${draftCount})`}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by size, brand, or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] md:w-[180px]">
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
            <SelectTrigger className="w-[140px] md:w-[180px]">
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
      </div>

      {/* Mobile cards or desktop table */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredTires.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No tires found
            </div>
          ) : (
            filteredTires.map((tire) => (
              <InventoryCard key={tire.id} tire={tire} onDelete={handleDelete} />
            ))
          )}
        </div>
      ) : (
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
      )}
    </div>
  )
}

