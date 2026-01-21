import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AgingPage() {
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
    .select('dot_tracking_enabled')
    .eq('id', profile.org_id)
    .single()

  if (!organization?.dot_tracking_enabled) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tire Aging (DOT)</h1>
        <p className="text-muted-foreground">Manage tires approaching expiration</p>
      </div>

      <Card className="p-6">
        <Alert>
          <AlertDescription>
            The aging dashboard will be fully implemented in Phase 12. This feature helps you
            track tires by their DOT (Date of Manufacture) codes and identify tires that are
            approaching or past their maximum age.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  )
}

