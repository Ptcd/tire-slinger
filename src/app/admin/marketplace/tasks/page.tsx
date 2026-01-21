'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { ExternalTask, Tire } from '@/lib/types'

export default function MarketplaceTasksPage() {
  const router = useRouter()
  const { organization } = useUser()
  const [tasks, setTasks] = useState<(ExternalTask & { tire: Tire | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('open')

  useEffect(() => {
    if (!organization) return
    loadTasks()
  }, [organization, statusFilter])

  async function loadTasks() {
    if (!organization) return

    const supabase = createClient()
    
    let query = supabase
      .from('external_tasks')
      .select(`
        *,
        tire:tires(*)
      `)
      .eq('org_id', organization.id)
      .eq('platform', 'facebook_marketplace')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query

    if (data) {
      setTasks(data as (ExternalTask & { tire: Tire | null })[])
    }
    setLoading(false)
  }

  const handleTaskAction = async (taskId: string, action: 'done' | 'dismissed') => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('external_tasks')
      .update({ status: action })
      .eq('id', taskId)

    if (error) {
      alert(`Failed to ${action === 'done' ? 'complete' : 'dismiss'} task`)
      return
    }

    loadTasks()
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'delete_listing':
        return 'Delete Listing'
      case 'update_listing':
        return 'Update Listing'
      case 'verify_listing':
        return 'Verify Listing'
      default:
        return type
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'sold_out':
        return 'Sold Out'
      case 'delisted':
        return 'Delisted'
      case 'price_changed':
        return 'Price Changed'
      case 'quantity_changed':
        return 'Quantity Changed'
      case 'manual':
        return 'Manual'
      default:
        return reason
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'destructive'
    if (priority === 2) return 'default'
    return 'secondary'
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const openTasks = tasks.filter(t => t.status === 'open')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const dismissedTasks = tasks.filter(t => t.status === 'dismissed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Tasks</h1>
          <p className="text-muted-foreground">Manage Facebook Marketplace listing tasks</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Tasks</p>
              <p className="text-2xl font-bold">{openTasks.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{doneTasks.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dismissed</p>
              <p className="text-2xl font-bold">{dismissedTasks.length}</p>
            </div>
            <XCircle className="h-8 w-8 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Tire</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{getTaskTypeLabel(task.task_type)}</div>
                      {task.metadata && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {JSON.stringify(task.metadata)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.tire ? (
                        <div>
                          <div className="font-medium">
                            {task.tire.brand} {task.tire.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.tire.size_display}
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-1"
                            onClick={() => router.push(`/admin/inventory/${task.tire_id}`)}
                          >
                            View Tire →
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Tire deleted</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getReasonLabel(task.reason)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(task.priority)}>
                        Priority {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(task.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {task.status === 'open' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskAction(task.id, 'done')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTaskAction(task.id, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                        {task.status === 'done' && (
                          <Badge variant="default" className="bg-green-600">
                            Completed
                          </Badge>
                        )}
                        {task.status === 'dismissed' && (
                          <Badge variant="secondary">Dismissed</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
