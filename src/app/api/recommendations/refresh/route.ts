import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRecommendations, saveRecommendations } from '@/lib/recommendations'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get current user's org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    // Compute and save recommendations
    const result = await computeRecommendations(profile.org_id)
    await saveRecommendations(profile.org_id, result.recommendations)
    
    return NextResponse.json({
      success: true,
      count: result.recommendations.length,
      totalStock: result.totalCurrentStock,
      capacityUsed: result.capacityUsed,
    })
  } catch (error) {
    console.error('Error refreshing recommendations:', error)
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 })
  }
}

