'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Mail, Trash2, UserPlus } from 'lucide-react'
import type { TeamInvite, Profile } from '@/lib/types'

export function TeamList() {
  const { profile, organization } = useUser()
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [members, setMembers] = useState<(Profile & { email: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff')

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <Alert>
        <AlertDescription>
          Only admins can manage team members.
        </AlertDescription>
      </Alert>
    )
  }

  useEffect(() => {
    loadData()
  }, [organization?.id])

  async function loadData() {
    if (!organization?.id) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Load invites
      const inviteResponse = await fetch('/api/invites')
      if (inviteResponse.ok) {
        const { invites: inviteData } = await inviteResponse.json()
        setInvites(inviteData || [])
      }

      // Load team members - profiles table has email field
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false })

      if (profiles) {
        setMembers(profiles.map((p: Profile) => ({
          ...p,
          email: p.email || 'N/A',
        })))
      }
    } catch (err) {
      console.error('Error loading team data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setInviting(true)

    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create invite')
        return
      }

      setSuccess(`Invite created! Share this link with ${inviteEmail}:`)
      setInviteEmail('')
      await loadData()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setInviting(false)
    }
  }

  async function copyInviteUrl(token: string) {
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/invite/${token}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function deleteInvite(inviteId: string) {
    if (!confirm('Are you sure you want to delete this invite?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId)

    if (error) {
      setError('Failed to delete invite')
    } else {
      await loadData()
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading team...</div>
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at)
  const acceptedInvites = invites.filter((i) => i.accepted_at)

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite New Member
        </h3>
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={inviting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'staff')}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Staff can manage tires. Admins have full access.
              </p>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={inviting}>
            {inviting ? 'Creating Invite...' : 'Create Invite'}
          </Button>
        </form>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pending Invites</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Invite Link</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => {
                  const baseUrl = window.location.origin
                  const inviteUrl = `${baseUrl}/invite/${invite.token}`
                  const expiresDate = new Date(invite.expires_at)
                  const isExpired = expiresDate < new Date()

                  return (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <span className="capitalize">{invite.role}</span>
                      </TableCell>
                      <TableCell>
                        <span className={isExpired ? 'text-destructive' : ''}>
                          {expiresDate.toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteUrl(invite.token)}
                        >
                          {copiedToken === invite.token ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Members</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.full_name || 'N/A'}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <span className="capitalize">{member.role}</span>
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

