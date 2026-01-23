import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CSVImporter } from '@/components/admin/csv-importer'
import { Card } from '@/components/ui/card'

export default async function ImportPage() {
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

  // Only admins can access import
  if (profile?.role !== 'admin') {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Tires</h1>
        <p className="text-muted-foreground">Upload a CSV file to bulk import tire listings</p>
      </div>

      <Card className="p-6">
        <CSVImporter />
      </Card>
    </div>
  )
}

