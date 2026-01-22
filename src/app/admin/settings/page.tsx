import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/settings-form'
import { Card } from '@/components/ui/card'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.org_id)
    .single()

  if (!organization) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your yard information and preferences</p>
      </div>

      <Card className="p-6">
        <SettingsForm organization={organization} />
      </Card>
    </div>
  )
}

