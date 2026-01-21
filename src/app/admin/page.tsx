import { StatsCards } from '@/components/admin/stats-cards'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your tire inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tire
            </Button>
          </Link>
          <Link href="/admin/inventory">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              View Inventory
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/inventory/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add New Tire
              </Button>
            </Link>
            <Link href="/admin/import">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Import from CSV
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

