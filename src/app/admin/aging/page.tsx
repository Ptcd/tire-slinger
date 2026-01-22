'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { AlertTriangle, Calendar, ExternalLink } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Tire, Organization, StockRecommendation } from '@/lib/types'

interface TireWithAge extends Tire {
  age_years: number
  age_days: number
  expires_at: Date | null
  days_until_expiration: number | null
  status: 'expired' | 'warning' | 'ok'
}

export default function AgingPage() {
  const router = useRouter()
  const { organization } = useUser()
  const [tires, setTires] = useState<TireWithAge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!organization) return
    loadTires()
  }, [organization, filter])

  function calculateTireAge(dotWeek: number | null, dotYear: number | null): { years: number; days: number } | null {
    if (!dotWeek || !dotYear) return null

    // DOT format: WWYY (e.g., 2319 = week 23 of 2019)
    // Convert to date
    const year = dotYear < 50 ? 2000 + dotYear : 1900 + dotYear
    const startOfYear = new Date(year, 0, 1)
    const weekInMs = (dotWeek - 1) * 7 * 24 * 60 * 60 * 1000
    const manufactureDate = new Date(startOfYear.getTime() + weekInMs)

    const now = new Date()
    const ageMs = now.getTime() - manufactureDate.getTime()
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
    const ageYears = ageDays / 365.25

    return { years: ageYears, days: ageDays }
  }

  function calculateExpirationDate(
    dotWeek: number | null,
    dotYear: number | null,
    maxAgeYears: number
  ): Date | null {
    if (!dotWeek || !dotYear) return null

    const year = dotYear < 50 ? 2000 + dotYear : 1900 + dotYear
    const startOfYear = new Date(year, 0, 1)
    const weekInMs = (dotWeek - 1) * 7 * 24 * 60 * 60 * 1000
    const manufactureDate = new Date(startOfYear.getTime() + weekInMs)

    const expirationDate = new Date(manufactureDate)
    expirationDate.setFullYear(expirationDate.getFullYear() + maxAgeYears)

    return expirationDate
  }

  async function loadTires() {
    if (!organization) return

    const supabase = createClient()
    
    const { data: tireData } = await supabase
      .from('tires')
      .select('*')
      .eq('org_id', organization.id)
      .not('dot_week', 'is', null)
      .not('dot_year', 'is', null)
      .order('dot_year', { ascending: true })
      .order('dot_week', { ascending: true })

    if (!tireData) {
      setLoading(false)
      return
    }

    const maxAgeYears = organization.dot_max_age_years || 8
    const warningDays = organization.dot_warning_days || 60

    const tiresWithAge: TireWithAge[] = tireData.map((tire) => {
      const age = calculateTireAge(tire.dot_week, tire.dot_year)
      const expiresAt = calculateExpirationDate(tire.dot_week, tire.dot_year, maxAgeYears)
      
      let daysUntilExpiration: number | null = null
      let status: 'expired' | 'warning' | 'ok' = 'ok'

      if (expiresAt) {
        const now = new Date()
        daysUntilExpiration = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiration < 0) {
          status = 'expired'
        } else if (daysUntilExpiration <= warningDays) {
          status = 'warning'
        }
      }

      return {
        ...(tire as Tire),
        age_years: age?.years || 0,
        age_days: age?.days || 0,
        expires_at: expiresAt,
        days_until_expiration: daysUntilExpiration,
        status,
      }
    })

    // Apply filter
    let filtered = tiresWithAge
    if (filter === 'expired') {
      filtered = tiresWithAge.filter(t => t.status === 'expired')
    } else if (filter === 'warning') {
      filtered = tiresWithAge.filter(t => t.status === 'warning')
    } else if (filter === 'ok') {
      filtered = tiresWithAge.filter(t => t.status === 'ok')
    }

    setTires(filtered)
    setLoading(false)
  }

  if (!organization) {
    return <div className="p-6">Loading...</div>
  }

  if (!organization.dot_tracking_enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tire Aging (DOT)</h1>
          <p className="text-muted-foreground">Track tire manufacturing dates</p>
        </div>

        <Card className="p-6">
          <Alert>
            <AlertDescription>
              DOT tracking is disabled. Enable it in{' '}
              <Link href="/admin/settings" className="text-primary hover:underline">
                Settings
              </Link>{' '}
              to use this feature.
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const expiredCount = tires.filter(t => t.status === 'expired').length
  const warningCount = tires.filter(t => t.status === 'warning').length
  const okCount = tires.filter(t => t.status === 'ok').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tire Aging & Inventory Health</h1>
          <p className="text-muted-foreground">Track DOT aging and identify overstock</p>
        </div>
      </div>

      <Tabs defaultValue="aging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aging">DOT Aging</TabsTrigger>
          <TabsTrigger value="overstock">Overstock / Stale</TabsTrigger>
        </TabsList>
        
        <TabsContent value="aging">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Manage tires approaching expiration (Max age: {organization.dot_max_age_years} years)
              </p>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tires</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="warning">Warning ({warningCount})</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                </SelectContent>
              </Select>
            </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Warning</p>
              <p className="text-2xl font-bold text-orange-600">{warningCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">OK</p>
              <p className="text-2xl font-bold text-green-600">{okCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Tires Table */}
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>DOT Code</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {filter === 'all' 
                      ? 'No tires with DOT codes found. Add DOT week/year when editing tires.'
                      : `No ${filter} tires found.`}
                  </TableCell>
                </TableRow>
              ) : (
                tires.map((tire) => (
                  <TableRow key={tire.id}>
                    <TableCell className="font-medium">{tire.size_display}</TableCell>
                    <TableCell>
                      {tire.brand} {tire.model && `- ${tire.model}`}
                    </TableCell>
                    <TableCell>
                      {tire.dot_week && tire.dot_year ? (
                        <span className="font-mono">
                          {String(tire.dot_week).padStart(2, '0')}/{tire.dot_year}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {tire.age_years > 0 ? (
                        <div>
                          <div>{tire.age_years.toFixed(1)} years</div>
                          <div className="text-xs text-muted-foreground">
                            ({tire.age_days} days)
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {tire.expires_at ? (
                        <div>
                          <div>{tire.expires_at.toLocaleDateString()}</div>
                          {tire.days_until_expiration !== null && (
                            <div className="text-xs text-muted-foreground">
                              {tire.days_until_expiration < 0
                                ? `${Math.abs(tire.days_until_expiration)} days ago`
                                : `${tire.days_until_expiration} days left`}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {tire.status === 'expired' && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {tire.status === 'warning' && (
                        <Badge variant="default" className="bg-orange-600">
                          Warning
                        </Badge>
                      )}
                      {tire.status === 'ok' && (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tire.quantity === 0 ? 'destructive' : 'default'}>
                        {tire.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/inventory/${tire.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About DOT Date Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            DOT codes indicate when a tire was manufactured. The format is WWYY (e.g., 2319 = week 23 of 2019).
          </p>
          <p>
            Tires expire after {organization.dot_max_age_years} years from manufacture date. Tires within{' '}
            {organization.dot_warning_days} days of expiration are marked with a warning.
          </p>
          <p>
            You can configure the maximum age and warning threshold in{' '}
            <Link href="/admin/settings" className="text-primary hover:underline">
              Settings
            </Link>
            .
          </p>
        </CardContent>
      </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="overstock">
          <OverstockStaleTab orgId={organization.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverstockStaleTab({ orgId }: { orgId: string }) {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('stock_recommendations')
        .select('*')
        .eq('org_id', orgId)
        .in('flag', ['overstock', 'stale'])
        .order('flag', { ascending: true })
        .order('oldest_age_days', { ascending: false })
      
      setRecommendations(data || [])
      setLoading(false)
    }
    load()
  }, [orgId])

  const filtered = filter === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.flag === filter)

  if (loading) return <div className="py-8 text-center">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="overstock">Overstock Only</SelectItem>
            <SelectItem value="stale">Stale Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No overstock or stale inventory found. Great job!</p>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Excess</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{rec.size_display}</TableCell>
                  <TableCell>
                    <Badge variant={rec.flag === 'stale' ? 'destructive' : 'secondary'}>
                      {rec.flag === 'stale' ? 'STALE' : 'OVERSTOCK'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{rec.current_stock}</TableCell>
                  <TableCell className="text-right">{rec.target_stock}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {Math.abs(rec.need_units)}
                  </TableCell>
                  <TableCell>
                    {rec.oldest_age_days 
                      ? `${Math.round(rec.oldest_age_days / 365 * 10) / 10} yrs`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(rec.reasons || [])[0] || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
