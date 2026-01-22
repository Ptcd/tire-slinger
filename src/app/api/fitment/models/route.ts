import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year')
  const make = request.nextUrl.searchParams.get('make')
  console.log(`[API] GET /api/fitment/models - year=${year}, make=${make}`)

  if (!year || !make) {
    console.warn('[API] Missing year or make parameter')
    return NextResponse.json({ error: 'Year and make parameters are required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')

    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('model')
      .eq('year', parseInt(year))
      .ilike('make', make)
      .order('model', { ascending: true })

    if (error) {
      console.error('[API] Supabase query error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to fetch models', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn(`[API] No models found for year ${year}, make ${make}`)
      return NextResponse.json({ models: [] })
    }

    // Get distinct models
    const models = Array.from(new Set(data.map((v) => v.model))).sort()
    console.log(`[API] Returning ${models.length} distinct models for ${year} ${make}`)

    return NextResponse.json({ models })
  } catch (error) {
    console.error('[API] Unexpected error in /api/fitment/models:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
