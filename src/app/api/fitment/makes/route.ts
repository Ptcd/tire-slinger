import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('make')
      .eq('year', parseInt(year))
      .order('make', { ascending: true })

    if (error) {
      console.error('Error fetching makes:', error)
      return NextResponse.json({ error: 'Failed to fetch makes' }, { status: 500 })
    }

    // Get distinct makes and sort alphabetically
    const makes = Array.from(new Set(data.map((v) => v.make))).sort()

    return NextResponse.json({ makes })
  } catch (error) {
    console.error('Error in makes endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

