'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Printer, RefreshCw, Tv, Download } from 'lucide-react'
import type { StockRecommendation } from '@/lib/types'

export default function SimpleStockPage() {
  const { organization } = useUser()
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [tvMode, setTvMode] = useState(false)

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
      document.documentElement.requestFullscreen()
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

  return (
    <div className={`space-y-6 ${tvMode ? 'p-8' : ''}`}>
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
        <div className="text-center py-12">Loading recommendations...</div>
      ) : recommendations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No recommendations at this time.</p>
          <Button className="mt-4" onClick={refreshRecommendations}>
            Generate Recommendations
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Need to Stock */}
          {stockRecs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-green-700 print:text-black">
                NEED TO STOCK ({stockRecs.length} sizes)
              </h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Size</TableHead>
                      <TableHead className="text-lg text-right">Current</TableHead>
                      <TableHead className="text-lg text-right">Need</TableHead>
                      <TableHead className="text-lg">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockRecs.map((rec) => (
                      <TableRow key={rec.id} className="text-lg">
                        <TableCell className="font-bold">{rec.size_display}</TableCell>
                        <TableCell className="text-right">{rec.current_stock}</TableCell>
                        <TableCell className="text-right font-bold text-green-600 print:text-black">
                          +{rec.need_units}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Need to Purge */}
          {purgeRecs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-red-700 print:text-black">
                CONSIDER PURGING ({purgeRecs.length} sizes)
              </h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-lg">Size</TableHead>
                      <TableHead className="text-lg text-right">Current</TableHead>
                      <TableHead className="text-lg text-right">Excess</TableHead>
                      <TableHead className="text-lg">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purgeRecs.map((rec) => (
                      <TableRow key={rec.id} className="text-lg">
                        <TableCell className="font-bold">{rec.size_display}</TableCell>
                        <TableCell className="text-right">{rec.current_stock}</TableCell>
                        <TableCell className="text-right font-bold text-red-600 print:text-black">
                          {rec.need_units}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rec.flag === 'stale' ? 'destructive' : 'secondary'}>
                            {rec.flag === 'stale' ? 'STALE' : 'OVERSTOCK'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
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

