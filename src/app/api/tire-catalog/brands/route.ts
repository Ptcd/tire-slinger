import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const searchParams = request.nextUrl.searchParams
  const isFlotation = searchParams.get('is_flotation') === 'true'
  const isLt = searchParams.get('is_lt') === 'true'
  
  let query = supabase
    .from('tire_catalog')
    .select('brand')
  
  if (isFlotation) {
    // Flotation size query
    const diameter = searchParams.get('flotation_diameter')
    const width = searchParams.get('flotation_width')
    const rim = searchParams.get('flotation_rim')
    
    if (diameter) query = query.eq('flotation_diameter', parseFloat(diameter))
    if (width) query = query.eq('flotation_width', parseFloat(width))
    if (rim) query = query.eq('flotation_rim', parseInt(rim, 10))
  } else {
    // Standard size query
    const width = searchParams.get('width')
    const aspectRatio = searchParams.get('aspect_ratio')
    const rimDiameter = searchParams.get('rim_diameter')
    
    if (width) query = query.eq('width', parseInt(width, 10))
    if (aspectRatio) query = query.eq('aspect_ratio', parseInt(aspectRatio, 10))
    if (rimDiameter) query = query.eq('rim_diameter', parseInt(rimDiameter, 10))
  }
  
  if (isLt) {
    query = query.eq('is_lt', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Get unique brands with counts
  const brandCounts = new Map<string, number>()
  for (const row of data || []) {
    const count = brandCounts.get(row.brand) || 0
    brandCounts.set(row.brand, count + 1)
  }
  
  const brands = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => a.brand.localeCompare(b.brand))
  
  return NextResponse.json({ brands })
}

