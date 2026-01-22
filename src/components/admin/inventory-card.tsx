'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MoreHorizontal, Edit, Trash, Share } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tire } from '@/lib/types'

interface InventoryCardProps {
  tire: Tire
  onDelete?: (id: string) => void
}

export function InventoryCard({ tire, onDelete }: InventoryCardProps) {
  const isDraft = !tire.is_active || tire.price === 0
  
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Link href={`/admin/inventory/${tire.id}`} className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
          {tire.images?.[0] ? (
            <Image
              src={tire.images[0]}
              alt={tire.size_display}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No img
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-foreground">{tire.size_display}</p>
              <p className="text-sm text-muted-foreground truncate">
                {tire.brand} {tire.model}
              </p>
            </div>
            {isDraft && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                Draft
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-sm">
            {tire.price > 0 ? (
              <span className="font-semibold text-foreground">{formatPrice(tire.price)}</span>
            ) : (
              <span className="text-yellow-500">Needs price</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Qty: {tire.quantity}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground capitalize">{tire.condition}</span>
          </div>
        </div>
      </Link>
      
      {/* Actions */}
      <div className="flex border-t border-border">
        <Link
          href={`/admin/inventory/${tire.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
        <div className="w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted">
            <MoreHorizontal className="w-4 h-4" />
            More
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href={`/admin/inventory/${tire.id}/marketplace`}>
                <Share className="w-4 h-4 mr-2" />
                Marketplace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onDelete?.(tire.id)}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

