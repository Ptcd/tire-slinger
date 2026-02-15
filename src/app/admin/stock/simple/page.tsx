'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Printer, RefreshCw, Tv, Download } from 'lucide-react'
import type { StockRecommendation } from '@/lib/types'

export default function SimpleStockPage() {
  const { organization } = useUser()
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [tvMode, setTvMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadRecommendations = async () => {
    if (!organization) return
    
    const supabase = createClient()
    const { data } = await supabase
      .from('stock_recommendations')
      .select('*')
      .eq('org_id', organization.id)
      .neq('action', 'hold')
      .order('action', { ascending: true })
      .order('priority', { ascending: true })
    
    setRecommendations(data || [])
    setLoading(false)
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/recommendations/refresh', { method: 'POST' })
      await loadRecommendations()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
  }, [organization])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadRecommendations, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [autoRefresh, organization])

  const handlePrint = () => {
    window.print()
  }

  const handleTvMode = () => {
    if (!tvMode) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setTvMode(!tvMode)
  }

  const exportCSV = () => {
    const headers = ['Size', 'Current', 'Need', 'Action']
    const rows = recommendations.map(r => [
      r.size_display,
      r.current_stock,
      r.need_units > 0 ? `+${r.need_units}` : r.need_units,
      r.action.toUpperCase()
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-recommendations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!organization) return <div className="p-6">Loading...</div>

  const stockRecs = recommendations.filter(r => r.action === 'stock')
  const purgeRecs = recommendations.filter(r => r.action === 'purge')
  const watchlistRecs = recommendations.filter(r => r.action === 'watchlist')

  return (
    <div ref={containerRef} className={`space-y-8 ${tvMode ? 'p-8 bg-background' : ''}`}>
      {/* Header - Hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Stock Recommendations</h1>
          <p className="text-muted-foreground">Simple view for print or TV display</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshRecommendations} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleTvMode}>
            <Tv className="h-4 w-4 mr-2" />
            TV Mode
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">{organization.name}</h1>
        <p className="text-lg">Stock Recommendations - {new Date().toLocaleDateString()}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-lg">Loading recommendations...</div>
      ) : recommendations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No recommendations at this time.</p>
          <Button className="mt-4" onClick={refreshRecommendations}>
            Generate Recommendations
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Need to Stock */}
          {stockRecs.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-2xl font-bold text-green-600 print:text-black">
                  NEED TO STOCK
                </h2>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {stockRecs.length} sizes
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {stockRecs.map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-green-500 p-4 flex flex-col gap-2">
                    <div className="font-mono text-2xl font-bold tracking-tight">
                      {rec.size_display}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600 print:text-black">
                        +{rec.need_units}
                      </span>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rec.current_stock} in stock
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Need to Purge */}
          {purgeRecs.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-2xl font-bold text-red-600 print:text-black">
                  CONSIDER PURGING
                </h2>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {purgeRecs.length} sizes
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {purgeRecs.map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-red-500 p-4 flex flex-col gap-2">
                    <div className="font-mono text-2xl font-bold tracking-tight">
                      {rec.size_display}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-red-600 print:text-black">
                        {rec.need_units}
                      </span>
                      <Badge variant={rec.flag === 'stale' ? 'destructive' : 'secondary'}>
                        {rec.flag === 'stale' ? 'STALE' : 'OVERSTOCK'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rec.current_stock} in stock
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Watchlist */}
          {watchlistRecs.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-2xl font-bold text-amber-600 print:text-black">
                  WATCHLIST
                </h2>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {watchlistRecs.length} sizes
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {watchlistRecs.map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-amber-400 p-4 flex flex-col gap-2">
                    <div className="font-mono text-2xl font-bold tracking-tight">
                      {rec.size_display}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {rec.oldest_age_days != null ? `${rec.oldest_age_days}d old` : 'New'}
                      </span>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">
                        WATCHING
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rec.current_stock} in stock
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-8, .space-y-8 * {
            visibility: visible;
          }
          .space-y-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

