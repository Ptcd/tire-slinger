import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('[API] GET /api/tire-catalog/models - Request started')
  
  try {
    const supabase = await createClient()
    console.log('[API] Supabase client created successfully')
    
    const searchParams = request.nextUrl.searchParams
    const brand = searchParams.get('brand')
    const isFlotation = searchParams.get('is_flotation') === 'true'
    const isLt = searchParams.get('is_lt') === 'true'
    
    console.log(`[API] Params: brand=${brand}, isFlotation=${isFlotation}, isLt=${isLt}`)
    
    if (!brand) {
      console.warn('[API] Missing brand parameter')
      return NextResponse.json({ error: 'Brand is required', models: [] }, { status: 400 })
    }
    
    let query = supabase
      .from('tire_catalog')
      .select('model_name, category')
      .eq('brand', brand)
      .not('model_name', 'is', null) // Filter out null model names
    
    if (isFlotation) {
      const diameter = searchParams.get('flotation_diameter')
      const width = searchParams.get('flotation_width')
      const rim = searchParams.get('flotation_rim')
      
      console.log(`[API] Flotation query: diameter=${diameter}, width=${width}, rim=${rim}`)
      
      if (diameter) query = query.eq('flotation_diameter', parseFloat(diameter))
      if (width) query = query.eq('flotation_width', parseFloat(width))
      if (rim) query = query.eq('flotation_rim', parseInt(rim, 10))
    } else {
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
      return NextResponse.json({ error: error.message, models: [] }, { status: 500 })
    }
    
    console.log(`[API] Query returned ${data?.length || 0} rows`)
    
    // Get unique models (with null safety)
    const modelMap = new Map<string, string | null>()
    for (const row of data || []) {
      if (row.model_name && !modelMap.has(row.model_name)) {
        modelMap.set(row.model_name, row.category)
      }
    }
    
    const models = Array.from(modelMap.entries())
      .map(([model_name, category]) => ({ model_name, category }))
      .sort((a, b) => a.model_name.localeCompare(b.model_name))
    
    console.log(`[API] Returning ${models.length} unique models for brand: ${brand}`)
    
    return NextResponse.json({ models })
  } catch (error) {
    console.error('[API] Unexpected error in /api/tire-catalog/models:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', models: [] },
      { status: 500 }
    )
  }
}
