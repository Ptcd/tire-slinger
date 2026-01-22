import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fromSizeDisplay } from '@/lib/size-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { org_id, customer_name, contact_info, requested_size, requested_quantity, notes } = body
    
    if (!org_id || !contact_info || !requested_size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Parse size to get components
    const sizeKey = fromSizeDisplay(requested_size)
    const parsed = sizeKey ? {
      width: parseInt(sizeKey.split('-')[0]),
      aspect_ratio: parseInt(sizeKey.split('-')[1]),
      rim_diameter: parseInt(sizeKey.split('-')[2]),
    } : {}
    
    const { data, error } = await supabase
      .from('customer_requests')
      .insert({
        org_id,
        customer_name: customer_name || null,
        contact_info,
        requested_size,
        requested_quantity: requested_quantity || 1,
        notes: notes || null,
        ...parsed,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating request:', error)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

