import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get invite
    const { data: invite, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'Invite has already been accepted' }, { status: 400 })
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Get organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invite.org_id)
      .single()

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        org_name: org?.name || 'Unknown',
        expires_at: invite.expires_at,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/invites/[token]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

