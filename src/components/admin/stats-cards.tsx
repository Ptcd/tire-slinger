'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

export function StatsCards() {
  const { organization } = useUser()
  const [stats, setStats] = useState({
    totalTires: 0,
    totalQuantity: 0,
    lowStock: 0,
    activeListings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organization) return

    const orgId = organization.id

    async function loadStats() {
      const supabase = createClient()
      
      // Get tire counts
      const { data: tires } = await supabase
        .from('tires')
        .select('quantity, is_active')
        .eq('org_id', orgId)

      if (tires) {
        const totalTires = tires.length
        const totalQuantity = tires.reduce((sum, t) => sum + t.quantity, 0)
        const lowStock = tires.filter((t) => t.quantity > 0 && t.quantity < 3).length

        // Get active marketplace listings (Phase 11)
        const { count: activeListings } = await supabase
          .from('external_listings')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('status', 'posted')

        setStats({
          totalTires,
          totalQuantity,
          lowStock,
          activeListings: activeListings || 0,
        })
      }
      setLoading(false)
    }

    loadStats()
  }, [organization])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Total Tires</CardTitle>
          <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.totalTires}</div>
          <p className="text-xs text-muted-foreground hidden md:block">Active listings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Total Quantity</CardTitle>
          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.totalQuantity}</div>
          <p className="text-xs text-muted-foreground hidden md:block">Tires in stock</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.lowStock}</div>
          <p className="text-xs text-muted-foreground hidden md:block">Need restocking</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Active Listings</CardTitle>
          <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.activeListings}</div>
          <p className="text-xs text-muted-foreground hidden md:block">Marketplace posts</p>
        </CardContent>
      </Card>
    </div>
  )
}

