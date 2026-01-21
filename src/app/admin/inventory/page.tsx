import { createClient } from '@/lib/supabase/server'
import { InventoryTable } from '@/components/admin/inventory-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  // Get user's org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <div>Profile not found</div>
  }

  // Get all tires for this org
  const { data: tires } = await supabase
    .from('tires')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your tire listings</p>
        </div>
        <Link href="/admin/inventory/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tire
          </Button>
        </Link>
      </div>

      <InventoryTable initialTires={tires || []} />
    </div>
  )
}

