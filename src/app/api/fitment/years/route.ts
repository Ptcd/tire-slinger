import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fitment_vehicles')
      .select('year')
      .order('year', { ascending: false })

    if (error) {
      console.error('Error fetching years:', error)
      return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 })
    }

    // Get distinct years and sort descending
    const years = Array.from(new Set(data.map((v) => v.year))).sort((a, b) => b - a)

    return NextResponse.json({ years })
  } catch (error) {
    console.error('Error in years endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

