import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function TowerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    redirect('/admin')
  }

  // Get all organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*, tires(count)')
    .order('created_at', { ascending: false })

  // Get stats
  const totalYards = organizations?.length || 0
  const totalTires = organizations?.reduce((sum, org) => sum + (org.tires?.[0]?.count || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Yards</h1>
        <p className="text-muted-foreground">View and manage all organizations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Yards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalYards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTires}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Newest Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {organizations && organizations.length > 0
                ? formatDate(organizations[0].created_at)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations && organizations.length > 0 ? (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.slug}</TableCell>
                  <TableCell>{org.tires?.[0]?.count || 0}</TableCell>
                  <TableCell>{formatDate(org.created_at)}</TableCell>
                  <TableCell>
                    <Link href={`/tower/yard/${org.id}`}>
                      <button className="text-primary hover:underline">View</button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

