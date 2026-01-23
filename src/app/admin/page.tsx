import { StatsCards } from '@/components/admin/stats-cards'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Package, Upload, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            Dash<span className="text-primary">board</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your tire inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/new">
            <Button className="font-bold" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Tire
            </Button>
          </Link>
          <Link href="/admin/inventory">
            <Button variant="outline" className="border-border" size="sm">
              <Package className="mr-1 h-4 w-4" />
              View Inventory
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/inventory/new">
              <Button variant="outline" className="w-full justify-start border-border hover:border-primary/50">
                <Plus className="mr-2 h-4 w-4 text-primary" />
                Add New Tire
              </Button>
            </Link>
            <Link href="/admin/import">
              <Button variant="outline" className="w-full justify-start border-border hover:border-primary/50">
                <Upload className="mr-2 h-4 w-4 text-primary" />
                Import from CSV
              </Button>
            </Link>
            <Link href="/admin/marketplace/tasks">
              <Button variant="outline" className="w-full justify-start border-border hover:border-primary/50">
                <ExternalLink className="mr-2 h-4 w-4 text-primary" />
                Marketplace Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Getting Started</CardTitle>
            <CardDescription>Tips for managing your tire yard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="text-primary font-semibold">1.</span> Add your tires one-by-one or use CSV import for bulk uploads.
            </p>
            <p>
              <span className="text-primary font-semibold">2.</span> Update your yard info in Settings (phone, address, etc).
            </p>
            <p>
              <span className="text-primary font-semibold">3.</span> Share your storefront link with customers to view inventory.
            </p>
            <p>
              <span className="text-primary font-semibold">4.</span> Use Marketplace Package to generate Facebook listings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
