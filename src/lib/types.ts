export interface Organization {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  logo_url: string | null
  website: string | null
  description: string | null
  dot_tracking_enabled: boolean
  dot_max_age_years: number
  dot_warning_days: number
  allow_custom_brand?: boolean
  require_model_selection?: boolean
  require_images?: boolean
  require_tread_depth?: boolean
  require_dot?: boolean
  capacity_total_tires: number
  default_packaging_type: 'individual' | 'pair' | 'set'
  recommendations_stale: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  org_id: string | null
  role: 'admin' | 'staff' | 'superadmin'
  created_at: string
  updated_at: string
}

export interface Tire {
  id: string
  org_id: string
  width: number
  aspect_ratio: number
  rim_diameter: number
  size_display: string
  diameter_inches: number
  brand: string | null
  model: string | null
  tire_type: 'all-season' | 'summer' | 'winter' | 'all-terrain' | 'mud-terrain' | 'performance'
  condition: 'new' | 'used' | 'like-new'
  tread_depth: number | null
  dot_week: number | null
  dot_year: number | null
  price: number
  quantity: number
  sale_type: 'individual' | 'pair' | 'set'
  set_price: number | null
  images: string[]
  description: string | null
  is_active: boolean
  is_lt: boolean
  is_flotation: boolean
  flotation_diameter: number | null
  flotation_width: number | null
  size_key: string | null
  last_sold_at: string | null
  created_at: string
  updated_at: string
}

export interface FitmentVehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
}

export interface FitmentTireSize {
  id: string
  vehicle_id: string
  width: number
  aspect_ratio: number
  rim_diameter: number
  is_oem: boolean
}

export interface ExternalListing {
  id: string
  org_id: string
  tire_id: string
  platform: 'facebook_marketplace'
  status: 'draft' | 'posted' | 'deleted'
  listing_url: string | null
  listed_price: number | null
  listed_quantity: number | null
  posted_at: string | null
  posted_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExternalTask {
  id: string
  org_id: string
  tire_id: string
  external_listing_id: string | null
  platform: 'facebook_marketplace'
  task_type: 'create_listing' | 'delete_listing' | 'update_listing' | 'verify_listing'
  reason: 'new_tire' | 'sold_out' | 'deleted' | 'deactivated' | 'delisted' | 'price_changed' | 'quantity_changed' | 'manual'
  status: 'open' | 'done' | 'dismissed'
  priority: number
  assigned_to: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Tire catalog entry (from Teoalida "Tires by brand" database)
export interface TireCatalog {
  id: string
  brand: string
  model_name: string
  category: string | null
  // Standard size fields
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  // Flotation size fields
  flotation_diameter: number | null
  flotation_width: number | null
  flotation_rim: number | null
  // Common
  is_lt: boolean
  size_display: string
}

// For dropdown options
export interface BrandOption {
  brand: string
  count: number
}

export interface ModelOption {
  model_name: string
  category: string | null
}

// Form types
export interface TireFormData {
  width: number
  aspect_ratio: number
  rim_diameter: number
  brand: string
  model: string
  tire_type: Tire['tire_type']
  condition: Tire['condition']
  tread_depth: number | null
  dot_week: number | null
  dot_year: number | null
  price: number
  quantity: number
  sale_type: 'individual' | 'pair' | 'set'
  set_price: number | null
  description: string
  images: string[]
}

// =============================================
// INVENTORY INTELLIGENCE LAYER TYPES
// =============================================

export interface SalesEvent {
  id: string
  org_id: string
  size_key: string
  quantity_sold: number
  packaging_type: 'individual' | 'pair' | 'set'
  unit_price: number | null
  tire_id: string | null
  sold_at: string
}

export interface SearchEvent {
  id: string
  org_id: string
  query: string | null
  requested_size: string | null
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  requested_quantity: number
  result_count: number
  user_role: string
  searched_at: string
}

export interface CustomerRequest {
  id: string
  org_id: string
  customer_name: string | null
  contact_info: string
  requested_size: string
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  requested_quantity: number
  notes: string | null
  status: 'new' | 'in_progress' | 'fulfilled' | 'dismissed'
  handled_by: string | null
  submitted_at: string
  updated_at: string
}

export interface StockRecommendation {
  id: string
  org_id: string
  size_key: string
  size_display: string
  current_stock: number
  target_stock: number
  need_units: number
  action: 'stock' | 'purge' | 'hold'
  priority: 'high' | 'medium' | 'low'
  flag: 'normal' | 'overstock' | 'stale' | null
  sales_90d: number
  searches_90d: number
  requests_90d: number
  avg_age_days: number | null
  oldest_age_days: number | null
  reasons: string[]
  computed_at: string
}

export interface InventorySettings {
  org_id: string
  sales_window_days: number
  search_window_days: number
  min_search_threshold: number
  stale_age_days: number
  overstock_percent: number
  safety_multiplier: number
  packaging_set_size: number
  enable_search_demand: boolean
  enable_request_demand: boolean
  created_at: string
  updated_at: string
}

// Form data for customer request submission
export interface CustomerRequestFormData {
  customer_name?: string
  contact_info: string
  requested_size: string
  requested_quantity: number
  notes?: string
}

