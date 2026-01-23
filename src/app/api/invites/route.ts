import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create invites' }, { status: 403 })
    }

    if (!profile.org_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 400 })
    }

    const body = await request.json()
    const { email, role = 'staff' } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email already has a profile in this org
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('org_id', profile.org_id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'User already belongs to this organization' }, { status: 400 })
    }

    // Check for pending invite
    const { data: pendingInvite } = await supabase
      .from('team_invites')
      .select('id')
      .eq('email', email)
      .eq('org_id', profile.org_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (pendingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 })
    }

    // Generate token using database function
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invite_token')

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Failed to generate invite token' }, { status: 500 })
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        org_id: profile.org_id,
        email,
        role,
        token: tokenData,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Construct invite URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const inviteUrl = `${baseUrl}/invite/${invite.token}`

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        invite_url: inviteUrl,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view invites' }, { status: 403 })
    }

    if (!profile.org_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 400 })
    }

    // Get all invites for this org
    const { data: invites, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error in GET /api/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

