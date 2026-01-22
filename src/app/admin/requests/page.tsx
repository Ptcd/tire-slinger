'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, CheckCircle, Clock, XCircle, Inbox } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CustomerRequest } from '@/lib/types'

export default function RequestsPage() {
  const { organization, user } = useUser()
  const [requests, setRequests] = useState<CustomerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('new')
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)

  const loadRequests = async () => {
    if (!organization) return
    
    const supabase = createClient()
    let query = supabase
      .from('customer_requests')
      .select('*')
      .eq('org_id', organization.id)
      .order('submitted_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }
    
    const { data } = await query
    setRequests(data || [])
    setLoading(false)
  }

  const updateStatus = async (requestId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase
      .from('customer_requests')
      .update({ 
        status: newStatus,
        handled_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
    
    await loadRequests()
    setSelectedRequest(null)
  }

  useEffect(() => {
    loadRequests()
  }, [organization, filter])

  // Real-time subscription for new requests
  useEffect(() => {
    if (!organization) return
    
    const supabase = createClient()
    const channel = supabase
      .channel('customer_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_requests',
          filter: `org_id=eq.${organization.id}`,
        },
        () => {
          loadRequests()
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [organization])

  const exportCSV = () => {
    const headers = ['Date', 'Customer', 'Contact', 'Size', 'Qty', 'Status', 'Notes']
    const rows = requests.map(r => [
      new Date(r.submitted_at).toLocaleDateString(),
      r.customer_name || 'Anonymous',
      r.contact_info,
      r.requested_size,
      r.requested_quantity,
      r.status,
      r.notes || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customer-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-yellow-500">New</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>
      case 'fulfilled':
        return <Badge className="bg-green-500">Fulfilled</Badge>
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (!organization) return <div className="p-6">Loading...</div>

  const newCount = requests.filter(r => r.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Customer Requests
            {newCount > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {newCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Tire requests from your storefront</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="new">New ({requests.filter(r => r.status === 'new').length})</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'No customer requests yet.' 
              : `No ${filter.replace('_', ' ')} requests.`}
          </p>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow 
                  key={req.id} 
                  className={`cursor-pointer ${req.status === 'new' ? 'bg-yellow-50' : ''}`}
                  onClick={() => setSelectedRequest(req)}
                >
                  <TableCell className="text-sm">
                    {formatDate(req.submitted_at)}
                  </TableCell>
                  <TableCell>{req.customer_name || 'Anonymous'}</TableCell>
                  <TableCell className="text-sm">{req.contact_info}</TableCell>
                  <TableCell className="font-medium">{req.requested_size}</TableCell>
                  <TableCell className="text-center">{req.requested_quantity}</TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {req.status === 'new' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'in_progress')}>
                          <Clock className="h-3 w-3" />
                        </Button>
                      )}
                      {(req.status === 'new' || req.status === 'in_progress') && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatus(req.id, 'fulfilled')}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-gray-400" onClick={() => updateStatus(req.id, 'dismissed')}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Submitted {selectedRequest && formatDate(selectedRequest.submitted_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedRequest.customer_name || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedRequest.contact_info}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tire Size</p>
                  <p className="font-medium text-lg">{selectedRequest.requested_size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedRequest.requested_quantity}</p>
                </div>
              </div>
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedRequest.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div className="flex gap-2 pt-4">
                {selectedRequest.status !== 'fulfilled' && (
                  <Button onClick={() => updateStatus(selectedRequest.id, 'fulfilled')} className="bg-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Fulfilled
                  </Button>
                )}
                {selectedRequest.status === 'new' && (
                  <Button variant="outline" onClick={() => updateStatus(selectedRequest.id, 'in_progress')}>
                    <Clock className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                )}
                {selectedRequest.status !== 'dismissed' && (
                  <Button variant="ghost" onClick={() => updateStatus(selectedRequest.id, 'dismissed')}>
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

