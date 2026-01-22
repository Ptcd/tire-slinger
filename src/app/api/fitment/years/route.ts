import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[API] GET /api/fitment/years - Request started')
  
  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')

    // Use RPC function to get distinct years efficiently
    const { data, error } = await supabase.rpc('get_distinct_years')

    if (error) {
      console.error('[API] Supabase RPC error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to fetch years', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn('[API] No years found in fitment_vehicles table')
      return NextResponse.json({ years: [] })
    }

    // Extract years from the result
    const years = data.map((row: { year: number }) => row.year)
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
