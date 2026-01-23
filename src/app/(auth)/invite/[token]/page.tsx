import { redirect } from 'next/navigation'
import { InviteSignupForm } from '@/components/auth/invite-signup-form'

async function validateInvite(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/invites/${token}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.invite
  } catch (error) {
    console.error('Error validating invite:', error)
    return null
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await validateInvite(token)

  if (!invite) {
    redirect('/login?error=invalid_invite')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <InviteSignupForm inviteToken={token} inviteData={invite} />
      </div>
    </div>
  )
}

