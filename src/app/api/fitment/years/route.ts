import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[API] GET /api/fitment/years - Request started')
  
  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')

    // Fetch all years - need large limit since Supabase defaults to 1000
    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('year')
      .order('year', { ascending: false })
      .limit(100000)

    if (error) {
      console.error('[API] Supabase query error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to fetch years', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn('[API] No years found in fitment_vehicles table')
      return NextResponse.json({ years: [] })
    }

    // Get distinct years and sort descending
    const years = Array.from(new Set(data.map((v) => v.year))).sort((a, b) => b - a)
    console.log(`[API] Returning ${years.length} distinct years: ${years.slice(0, 5).join(', ')}...`)

    return NextResponse.json({ years })
  } catch (error) {
    console.error('[API] Unexpected error in /api/fitment/years:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
