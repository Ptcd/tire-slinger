'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Organization } from '@/lib/types'

export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadProfile = async (userId: string) => {
    const supabase = createClient()
    try {
      setError(null) // Clear previous errors
      setLoading(true)
      
      // First, load the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        setError(new Error(`Failed to load profile: ${profileError.message}`))
        setLoading(false)
        return
      }

      if (!profileData) {
        setError(new Error('Profile not found'))
        setLoading(false)
        return
      }

      setProfile(profileData as Profile)

      // Then, load the organization separately if org_id exists
      if (profileData.org_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.org_id)
          .single()

        if (orgError) {
          console.error('Error loading organization:', orgError)
          setError(new Error(`Failed to load organization: ${orgError.message}`))
          setOrganization(null)
        } else if (orgData) {
          setOrganization(orgData as Organization)
          setError(null) // Clear any previous errors if we successfully loaded org
        } else {
          setError(new Error('Organization not found'))
          setOrganization(null)
        }
      } else {
        // Profile exists but has no org_id
        setError(new Error('Your account is not associated with an organization'))
        setOrganization(null)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Unexpected error loading profile:', err)
      setError(err instanceof Error ? err : new Error('Unexpected error occurred'))
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError as Error)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch((err) => {
      setError(err as Error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setError(null) // Clear previous errors on auth state change
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const retry = () => {
    if (user) {
      loadProfile(user.id)
    }
  }

  return { user, profile, organization, loading, error, retry }
}

