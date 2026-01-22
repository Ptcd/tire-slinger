import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const make = searchParams.get('make')

    if (!year || !make) {
      return NextResponse.json({ error: 'Year and make parameters are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('model')
      .eq('year', parseInt(year))
      .ilike('make', make)
      .order('model', { ascending: true })

    if (error) {
      console.error('Error fetching models:', error)
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }

    // Get distinct models and sort alphabetically
    const models = Array.from(new Set(data.map((v) => v.model))).sort()

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Error in models endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

