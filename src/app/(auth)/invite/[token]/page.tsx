import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InviteSignupForm } from '@/components/auth/invite-signup-form'

// Team invite acceptance page

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Get invite directly from database
  const { data: invite } = await supabase
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    redirect('/login?error=invalid_invite')
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', invite.org_id)
    .single()

  const inviteData = {
    email: invite.email,
    role: invite.role as 'admin' | 'staff',
    org_name: org?.name || 'your organization',
    expires_at: invite.expires_at,
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <InviteSignupForm inviteToken={token} inviteData={inviteData} />
      </div>
    </div>
  )
}

