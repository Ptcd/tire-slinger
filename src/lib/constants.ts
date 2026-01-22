// CRITICAL: Checkout is disabled. Do not enable without full implementation.
export const CHECKOUT_ENABLED = false

export const TIRE_BRANDS = [
  'BFGoodrich',
  'Bridgestone',
  'Continental',
  'Cooper',
  'Dunlop',
  'Falken',
  'Firestone',
  'General',
  'Goodyear',
  'Hankook',
  'Kumho',
  'Michelin',
  'Nitto',
  'Pirelli',
  'Sumitomo',
  'Toyo',
  'Yokohama',
  'Other',
] as const

export const TIRE_TYPES = [
  { value: 'all-season', label: 'All-Season' },
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'all-terrain', label: 'All-Terrain' },
  { value: 'mud-terrain', label: 'Mud-Terrain' },
  { value: 'performance', label: 'Performance' },
] as const

export const TIRE_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'used', label: 'Used' },
] as const

export const COMMON_WIDTHS = [
  155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315
] as const

export const COMMON_ASPECT_RATIOS = [
  30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85
] as const

export const COMMON_RIM_DIAMETERS = [
  14, 15, 16, 17, 18, 19, 20, 21, 22, 24
] as const

// Common flotation diameters (inches)
export const FLOTATION_DIAMETERS = [
  28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 44
] as const

// Common flotation widths (inches)
export const FLOTATION_WIDTHS = [
  9.50, 10.50, 11.50, 12.50, 13.50, 14.50, 15.50
] as const

export const SALE_TYPES = [
  { value: 'individual', label: 'Individual (sell one at a time)' },
  { value: 'pair', label: 'Pair (sell as 2)' },
  { value: 'set', label: 'Set of 4' },
] as const

