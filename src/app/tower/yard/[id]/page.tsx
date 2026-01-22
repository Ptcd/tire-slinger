import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function YardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (!organization) {
    notFound()
  }

  const { data: tires } = await supabase
    .from('tires')
    .select('*')
    .eq('org_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <p className="text-muted-foreground">Yard details and inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yard Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Slug:</span>
            <span className="font-medium">{organization.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Phone:</span>
            <span className="font-medium">{organization.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Email:</span>
            <span className="font-medium">{organization.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Created:</span>
            <span className="font-medium">{formatDate(organization.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory ({tires?.length || 0} tires)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tires && tires.length > 0 ? (
                  tires.map((tire) => (
                    <TableRow key={tire.id}>
                      <TableCell className="font-medium">{tire.size_display}</TableCell>
                      <TableCell>{tire.brand || '-'}</TableCell>
                      <TableCell>{formatPrice(tire.price)}</TableCell>
                      <TableCell>{tire.quantity}</TableCell>
                      <TableCell>
                        {tire.is_active ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No tires found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

