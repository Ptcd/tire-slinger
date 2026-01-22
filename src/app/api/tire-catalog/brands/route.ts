import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/tire-catalog/brands - Request started')
  
  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')
    
    const searchParams = request.nextUrl.searchParams
    const isFlotation = searchParams.get('is_flotation') === 'true'
    const isLt = searchParams.get('is_lt') === 'true'
    
    console.log(`[API] Params: isFlotation=${isFlotation}, isLt=${isLt}`)
    
    let query = supabase
      .from('tire_catalog')
      .select('brand')
      .not('brand', 'is', null) // Filter out null brands
    
    if (isFlotation) {
      // Flotation size query
      const diameter = searchParams.get('flotation_diameter')
      const width = searchParams.get('flotation_width')
      const rim = searchParams.get('flotation_rim')
      
      console.log(`[API] Flotation query: diameter=${diameter}, width=${width}, rim=${rim}`)
      
      if (diameter) query = query.eq('flotation_diameter', parseFloat(diameter))
      if (width) query = query.eq('flotation_width', parseFloat(width))
      if (rim) query = query.eq('flotation_rim', parseInt(rim, 10))
    } else {
      // Standard size query
      const width = searchParams.get('width')
      const aspectRatio = searchParams.get('aspect_ratio')
      const rimDiameter = searchParams.get('rim_diameter')
      
      console.log(`[API] Standard query: width=${width}, aspectRatio=${aspectRatio}, rimDiameter=${rimDiameter}`)
      
      if (width) query = query.eq('width', parseInt(width, 10))
      if (aspectRatio) query = query.eq('aspect_ratio', parseInt(aspectRatio, 10))
      if (rimDiameter) query = query.eq('rim_diameter', parseInt(rimDiameter, 10))
    }
    
    if (isLt) {
      query = query.eq('is_lt', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('[API] Supabase query error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: error.message, brands: [] }, { status: 500 })
    }
    
    console.log(`[API] Query returned ${data?.length || 0} rows`)
    
    // Get unique brands with counts (with null safety)
    const brandCounts = new Map<string, number>()
    for (const row of data || []) {
      if (row.brand) { // Only count non-null brands
        const count = brandCounts.get(row.brand) || 0
        brandCounts.set(row.brand, count + 1)
      }
    }
    
    const brands = Array.from(brandCounts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => a.brand.localeCompare(b.brand))
    
    console.log(`[API] Returning ${brands.length} unique brands`)
    
    return NextResponse.json({ brands })
  } catch (error) {
    console.error('[API] Unexpected error in /api/tire-catalog/brands:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', brands: [] },
      { status: 500 }
    )
  }
}
