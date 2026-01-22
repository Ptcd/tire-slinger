import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year')
  console.log(`[API] GET /api/fitment/makes - year=${year}`)

  if (!year) {
    console.warn('[API] Missing year parameter')
    return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')

    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('make')
      .eq('year', parseInt(year))
      .order('make', { ascending: true })

    if (error) {
      console.error('[API] Supabase query error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to fetch makes', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn(`[API] No makes found for year ${year}`)
      return NextResponse.json({ makes: [] })
    }

    // Get distinct makes
    const makes = Array.from(new Set(data.map((v) => v.make))).sort()
    console.log(`[API] Returning ${makes.length} distinct makes for year ${year}`)

    return NextResponse.json({ makes })
  } catch (error) {
    console.error('[API] Unexpected error in /api/fitment/makes:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
