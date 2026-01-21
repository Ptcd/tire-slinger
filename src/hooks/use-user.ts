'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Organization } from '@/lib/types'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
        setLoading(false)
      }
    })

    async function loadProfile(userId: string) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
        if (profileData.organizations) {
          setOrganization(profileData.organizations as Organization)
        }
      }
      setLoading(false)
    }

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, organization, loading }
}

