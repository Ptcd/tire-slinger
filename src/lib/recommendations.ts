import { createClient } from '@/lib/supabase/server'
import { toSizeKey, toSizeDisplay } from '@/lib/size-utils'
import type { StockRecommendation, InventorySettings } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Default settings if org has no custom settings
const DEFAULT_SETTINGS: Omit<InventorySettings, 'org_id' | 'created_at' | 'updated_at'> = {
  sales_window_days: 90,
  search_window_days: 90,
  min_search_threshold: 3,
  stale_age_days: 1800,
  overstock_percent: 50,
  safety_multiplier: 2.0,
  packaging_set_size: 4,
  enable_search_demand: true,
  enable_request_demand: true,
}

interface SizeMetrics {
  size_key: string
  size_display: string
  current_stock: number
  sales_count: number
  search_count: number
  request_count: number
  avg_age_days: number | null
  oldest_age_days: number | null
}

interface ComputeResult {
  recommendations: Omit<StockRecommendation, 'id' | 'computed_at'>[]
  totalCurrentStock: number
  capacityUsed: number
}

/**
 * Compute stock recommendations for an organization
 */
export async function computeRecommendations(orgId: string, supabaseClient?: SupabaseClient): Promise<ComputeResult> {
  const supabase = supabaseClient || await createClient()
  
  // 1. Get organization and settings
  const { data: org } = await supabase
    .from('organizations')
    .select('capacity_total_tires')
    .eq('id', orgId)
    .single()
  
  const capacity = org?.capacity_total_tires || 200
  
  const { data: settingsRow } = await supabase
    .from('inventory_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  const settings = settingsRow || { ...DEFAULT_SETTINGS, org_id: orgId }
  
  // 2. Get current inventory grouped by size
  const { data: inventory } = await supabase
    .from('tires')
    .select('size_key, quantity, dot_year, dot_week, created_at')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .gt('quantity', 0)
  
  // Group inventory by size_key
  const inventoryBySize: Map<string, { total: number; ages: number[] }> = new Map()
  
  for (const tire of inventory || []) {
    if (!tire.size_key) continue
    
    const existing = inventoryBySize.get(tire.size_key) || { total: 0, ages: [] }
    existing.total += tire.quantity
    
    // Calculate age from DOT or created_at
    let ageDays = 0
    if (tire.dot_year && tire.dot_week) {
      const year = tire.dot_year < 50 ? 2000 + tire.dot_year : 1900 + tire.dot_year
      const startOfYear = new Date(year, 0, 1)
      const manufactureDate = new Date(startOfYear.getTime() + (tire.dot_week - 1) * 7 * 24 * 60 * 60 * 1000)
      ageDays = Math.floor((Date.now() - manufactureDate.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      ageDays = Math.floor((Date.now() - new Date(tire.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }
    
    for (let i = 0; i < tire.quantity; i++) {
      existing.ages.push(ageDays)
    }
    
    inventoryBySize.set(tire.size_key, existing)
  }
  
  // 3. Get sales in window
  const salesWindowStart = new Date()
  salesWindowStart.setDate(salesWindowStart.getDate() - settings.sales_window_days)
  
  const { data: sales } = await supabase
    .from('sales_events')
    .select('size_key, quantity_sold')
    .eq('org_id', orgId)
    .gte('sold_at', salesWindowStart.toISOString())
  
  const salesBySize: Map<string, number> = new Map()
  for (const sale of sales || []) {
    const current = salesBySize.get(sale.size_key) || 0
    salesBySize.set(sale.size_key, current + sale.quantity_sold)
  }
  
  // 4. Get searches in window (no-result only)
  const searchWindowStart = new Date()
  searchWindowStart.setDate(searchWindowStart.getDate() - settings.search_window_days)
  
  const { data: searches } = await supabase
    .from('search_events')
    .select('requested_size, requested_quantity')
    .eq('org_id', orgId)
    .eq('result_count', 0)
    .not('requested_size', 'is', null)
    .gte('searched_at', searchWindowStart.toISOString())
  
  const searchesBySize: Map<string, number> = new Map()
  for (const search of searches || []) {
    if (!search.requested_size) continue
    const current = searchesBySize.get(search.requested_size) || 0
    searchesBySize.set(search.requested_size, current + (search.requested_quantity || 1))
  }
  
  // 5. Get customer requests in window
  const { data: requests } = await supabase
    .from('customer_requests')
    .select('requested_size, requested_quantity')
    .eq('org_id', orgId)
    .in('status', ['new', 'in_progress'])
    .gte('submitted_at', searchWindowStart.toISOString())
  
  const requestsBySize: Map<string, number> = new Map()
  for (const req of requests || []) {
    if (!req.requested_size) continue
    // Convert display format to size_key if needed
    const sizeKey = req.requested_size.includes('-') ? req.requested_size : req.requested_size.replace(/\//g, '-').replace(/R/gi, '-')
    const current = requestsBySize.get(sizeKey) || 0
    requestsBySize.set(sizeKey, current + (req.requested_quantity || 1))
  }
  
  // 6. Combine all sizes we know about
  const allSizes = new Set<string>([
    ...inventoryBySize.keys(),
    ...salesBySize.keys(),
    ...searchesBySize.keys(),
    ...requestsBySize.keys(),
  ])
  
  // 7. Calculate metrics for each size
  const metrics: SizeMetrics[] = []
  
  for (const sizeKey of allSizes) {
    const inv = inventoryBySize.get(sizeKey)
    const ages = inv?.ages || []
    
    metrics.push({
      size_key: sizeKey,
      size_display: toSizeDisplay(sizeKey),
      current_stock: inv?.total || 0,
      sales_count: salesBySize.get(sizeKey) || 0,
      search_count: searchesBySize.get(sizeKey) || 0,
      request_count: requestsBySize.get(sizeKey) || 0,
      avg_age_days: ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null,
      oldest_age_days: ages.length > 0 ? Math.max(...ages) : null,
    })
  }
  
  // 8. Calculate recommendations for each size
  const recommendations: Omit<StockRecommendation, 'id' | 'computed_at'>[] = []
  
  for (const m of metrics) {
    const reasons: string[] = []
    
    // Calculate monthly demand
    const salesPerMonth = (m.sales_count / settings.sales_window_days) * 30
    const searchesPerMonth = settings.enable_search_demand && m.search_count >= settings.min_search_threshold
      ? (m.search_count / settings.search_window_days) * 30
      : 0
    const requestsPerMonth = settings.enable_request_demand
      ? (m.request_count / settings.search_window_days) * 30
      : 0
    
    // Target = max demand * safety multiplier
    const maxDemand = Math.max(salesPerMonth, searchesPerMonth, requestsPerMonth)
    const targetStock = Math.ceil(maxDemand * settings.safety_multiplier)
    
    // Need units
    let needUnits = targetStock - m.current_stock
    
    // Determine action
    let action: 'stock' | 'purge' | 'hold' = 'hold'
    let flag: 'normal' | 'overstock' | 'stale' | null = 'normal'
    
    // Check for stale
    if (m.oldest_age_days && m.oldest_age_days > settings.stale_age_days) {
      flag = 'stale'
      reasons.push(`Old inventory: ${Math.round(m.oldest_age_days / 365)} years old`)
      if (m.current_stock > 0) {
        action = 'purge'
        needUnits = -m.current_stock // Purge all stale
      }
    }
    // Check for overstock
    else if (m.current_stock > targetStock * (1 + settings.overstock_percent / 100)) {
      flag = 'overstock'
      const excess = m.current_stock - targetStock
      reasons.push(`Overstocked: ${excess} units above target`)
      action = 'purge'
      needUnits = -(m.current_stock - targetStock)
    }
    // Check if need to stock
    else if (needUnits > 0) {
      action = 'stock'
    }
    
    // Add demand reasons
    if (m.sales_count > 0) {
      reasons.push(`${m.sales_count} sold in last ${settings.sales_window_days} days`)
    }
    if (m.search_count > 0 && settings.enable_search_demand) {
      reasons.push(`${m.search_count} searches with no results`)
    }
    if (m.request_count > 0 && settings.enable_request_demand) {
      reasons.push(`${m.request_count} customer requests`)
    }
    if (m.current_stock === 0 && maxDemand > 0) {
      reasons.push('Out of stock with active demand')
    }
    if (reasons.length === 0 && m.current_stock > 0) {
      reasons.push('No recent demand signals')
    }
    
    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low'
    if (action === 'stock') {
      if (m.current_stock === 0 && maxDemand >= 2) priority = 'high'
      else if (needUnits >= 4) priority = 'high'
      else if (needUnits >= 2) priority = 'medium'
    } else if (action === 'purge') {
      if (flag === 'stale') priority = 'high'
      else if (Math.abs(needUnits) >= 6) priority = 'high'
      else if (Math.abs(needUnits) >= 3) priority = 'medium'
    }
    
    recommendations.push({
      org_id: orgId,
      size_key: m.size_key,
      size_display: m.size_display,
      current_stock: m.current_stock,
      target_stock: targetStock,
      need_units: needUnits,
      action,
      priority,
      flag,
      sales_90d: m.sales_count,
      searches_90d: m.search_count,
      requests_90d: m.request_count,
      avg_age_days: m.avg_age_days,
      oldest_age_days: m.oldest_age_days,
      reasons,
    })
  }
  
  // 9. Enforce capacity limits for "stock" recommendations
  const totalCurrentStock = recommendations.reduce((sum, r) => sum + r.current_stock, 0)
  let projectedStock = totalCurrentStock
  
  // Sort stock recommendations by priority (high first), then by demand
  const stockRecs = recommendations
    .filter(r => r.action === 'stock')
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return (b.sales_90d + b.searches_90d) - (a.sales_90d + a.searches_90d)
    })
  
  for (const rec of stockRecs) {
    const available = capacity - projectedStock
    if (available <= 0) {
      rec.need_units = 0
      rec.action = 'hold'
      rec.reasons.push('Capacity limit reached')
    } else if (rec.need_units > available) {
      rec.need_units = available
      rec.reasons.push(`Limited by capacity (${available} slots available)`)
    }
    projectedStock += rec.need_units
  }
  
  return {
    recommendations,
    totalCurrentStock,
    capacityUsed: projectedStock,
  }
}

/**
 * Save recommendations to database
 */
export async function saveRecommendations(orgId: string, recommendations: Omit<StockRecommendation, 'id' | 'computed_at'>[], supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || await createClient()
  
  // Delete old recommendations for this org
  await supabase
    .from('stock_recommendations')
    .delete()
    .eq('org_id', orgId)
  
  // Insert new recommendations
  if (recommendations.length > 0) {
    await supabase
      .from('stock_recommendations')
      .insert(recommendations.map(r => ({
        ...r,
        computed_at: new Date().toISOString(),
      })))
  }
  
  // Mark recommendations as fresh
  await supabase
    .from('organizations')
    .update({ recommendations_stale: false })
    .eq('id', orgId)
}

/**
 * Get cached recommendations for an organization
 */
export async function getRecommendations(orgId: string): Promise<StockRecommendation[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('stock_recommendations')
    .select('*')
    .eq('org_id', orgId)
    .order('priority', { ascending: true })
    .order('need_units', { ascending: false })
  
  return data || []
}

/**
 * Check if recommendations need refresh
 */
export async function needsRefresh(orgId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('organizations')
    .select('recommendations_stale')
    .eq('id', orgId)
    .single()
  
  return data?.recommendations_stale ?? true
}

