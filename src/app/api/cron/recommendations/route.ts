import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { computeRecommendations, saveRecommendations } from '@/lib/recommendations'

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all organizations that need refresh
    const { data: orgs } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('recommendations_stale', true)
    
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ message: 'No organizations need refresh', processed: 0 })
    }
    
    // Process each org
    const results = []
    for (const org of orgs) {
      try {
        const result = await computeRecommendations(org.id, supabaseAdmin)
        await saveRecommendations(org.id, result.recommendations, supabaseAdmin)
        results.push({ org_id: org.id, name: org.name, success: true, count: result.recommendations.length })
      } catch (err) {
        results.push({ org_id: org.id, name: org.name, success: false, error: String(err) })
      }
    }
    
    return NextResponse.json({
      message: 'Cron completed',
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

