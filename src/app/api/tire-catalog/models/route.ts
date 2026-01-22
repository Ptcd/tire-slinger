import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const searchParams = request.nextUrl.searchParams
  const brand = searchParams.get('brand')
  const isFlotation = searchParams.get('is_flotation') === 'true'
  const isLt = searchParams.get('is_lt') === 'true'
  
  if (!brand) {
    return NextResponse.json({ error: 'Brand is required' }, { status: 400 })
  }
  
  let query = supabase
    .from('tire_catalog')
    .select('model_name, category')
    .eq('brand', brand)
  
  if (isFlotation) {
    const diameter = searchParams.get('flotation_diameter')
    const width = searchParams.get('flotation_width')
    const rim = searchParams.get('flotation_rim')
    
    if (diameter) query = query.eq('flotation_diameter', parseFloat(diameter))
    if (width) query = query.eq('flotation_width', parseFloat(width))
    if (rim) query = query.eq('flotation_rim', parseInt(rim, 10))
  } else {
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
  
  // Get unique models
  const modelMap = new Map<string, string | null>()
  for (const row of data || []) {
    if (!modelMap.has(row.model_name)) {
      modelMap.set(row.model_name, row.category)
    }
  }
  
  const models = Array.from(modelMap.entries())
    .map(([model_name, category]) => ({ model_name, category }))
    .sort((a, b) => a.model_name.localeCompare(b.model_name))
  
  return NextResponse.json({ models })
}

