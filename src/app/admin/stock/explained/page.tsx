'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Download, ChevronDown, Search, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import type { StockRecommendation } from '@/lib/types'

export default function ExplainedStockPage() {
  const { organization } = useUser()
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const loadRecommendations = async () => {
    if (!organization) return
    
    const supabase = createClient()
    const { data } = await supabase
      .from('stock_recommendations')
      .select('*')
      .eq('org_id', organization.id)
      .order('priority', { ascending: true })
      .order('action', { ascending: true })
    
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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const exportCSV = () => {
    const headers = ['Size', 'Current', 'Target', 'Need', 'Action', 'Priority', 'Sales 90d', 'Searches 90d', 'Avg Age', 'Reasons']
    const rows = filteredRecs.map(r => [
      r.size_display,
      r.current_stock,
      r.target_stock,
      r.need_units,
      r.action,
      r.priority,
      r.sales_90d,
      r.searches_90d,
      r.avg_age_days || '',
      (r.reasons || []).join('; ')
    ])
    
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-recommendations-detailed-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Filter and search
  let filteredRecs = recommendations
  if (filter !== 'all') {
    filteredRecs = filteredRecs.filter(r => r.action === filter)
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredRecs = filteredRecs.filter(r => 
      r.size_display.toLowerCase().includes(term) ||
      r.size_key.toLowerCase().includes(term)
    )
  }

  if (!organization) return <div className="p-6">Loading...</div>

  const ActionIcon = ({ action }: { action: string }) => {
    if (action === 'stock') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (action === 'purge') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Intelligence</h1>
          <p className="text-muted-foreground">Detailed recommendations with explanations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshRecommendations} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="stock">Need to Stock</SelectItem>
            <SelectItem value="purge">Need to Purge</SelectItem>
            <SelectItem value="hold">Hold (No Action)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Sizes</p>
          <p className="text-2xl font-bold">{recommendations.length}</p>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-sm text-green-700">Need to Stock</p>
          <p className="text-2xl font-bold text-green-700">
            {recommendations.filter(r => r.action === 'stock').length}
          </p>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">Need to Purge</p>
          <p className="text-2xl font-bold text-red-700">
            {recommendations.filter(r => r.action === 'purge').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total in Stock</p>
          <p className="text-2xl font-bold">
            {recommendations.reduce((sum, r) => sum + r.current_stock, 0)}
          </p>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading recommendations...</div>
      ) : filteredRecs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {recommendations.length === 0 
              ? 'No recommendations generated yet.' 
              : 'No results match your filters.'}
          </p>
          {recommendations.length === 0 && (
            <Button className="mt-4" onClick={refreshRecommendations}>
              Generate Recommendations
            </Button>
          )}
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Need</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecs.map((rec) => {
                const isExpanded = expandedRows.has(rec.id)
                return (
                  <>
                    <TableRow 
                      key={rec.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRow(rec.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 transition-transform rotate-180" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{rec.size_display}</TableCell>
                      <TableCell className="text-right">{rec.current_stock}</TableCell>
                      <TableCell className="text-right">{rec.target_stock}</TableCell>
                      <TableCell className={`text-right font-bold ${rec.need_units > 0 ? 'text-green-600' : rec.need_units < 0 ? 'text-red-600' : ''}`}>
                        {rec.need_units > 0 ? `+${rec.need_units}` : rec.need_units}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionIcon action={rec.action} />
                          <span className="capitalize">{rec.action}</span>
                          {rec.flag && rec.flag !== 'normal' && (
                            <Badge variant={rec.flag === 'stale' ? 'destructive' : 'secondary'} className="ml-2">
                              {rec.flag}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' : 
                          rec.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {rec.priority}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2">Demand Signals</h4>
                              <ul className="space-y-1 text-sm">
                                <li>📈 Sales (90 days): <strong>{rec.sales_90d}</strong></li>
                                <li>🔍 Searches (no results): <strong>{rec.searches_90d}</strong></li>
                                <li>📋 Customer Requests: <strong>{rec.requests_90d}</strong></li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Inventory Status</h4>
                              <ul className="space-y-1 text-sm">
                                <li>📦 Current Stock: <strong>{rec.current_stock}</strong></li>
                                <li>🎯 Target Stock: <strong>{rec.target_stock}</strong></li>
                                {rec.avg_age_days && <li>⏱️ Average Age: <strong>{rec.avg_age_days} days</strong></li>}
                                {rec.oldest_age_days && <li>⚠️ Oldest: <strong>{Math.round(rec.oldest_age_days / 365 * 10) / 10} years</strong></li>}
                              </ul>
                            </div>
                            <div className="col-span-2">
                              <h4 className="font-semibold mb-2">Recommendation Reasons</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {(rec.reasons || []).map((reason, i) => (
                                  <li key={i}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

