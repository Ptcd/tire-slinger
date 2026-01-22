/**
 * Utility functions for tire size normalization and parsing
 */

/**
 * Convert width/aspect/rim to a normalized size_key
 * Example: (205, 55, 16) => "205-55-16"
 */
export function toSizeKey(width: number, aspectRatio: number, rimDiameter: number): string {
  return `${width}-${aspectRatio}-${rimDiameter}`
}

/**
 * Parse a size_key back to components
 * Example: "205-55-16" => { width: 205, aspectRatio: 55, rimDiameter: 16 }
 */
export function parseSizeKey(sizeKey: string): { width: number; aspectRatio: number; rimDiameter: number } | null {
  const parts = sizeKey.split('-')
  if (parts.length !== 3) return null
  
  const width = parseInt(parts[0], 10)
  const aspectRatio = parseInt(parts[1], 10)
  const rimDiameter = parseInt(parts[2], 10)
  
  if (isNaN(width) || isNaN(aspectRatio) || isNaN(rimDiameter)) return null
  
  return { width, aspectRatio, rimDiameter }
}

/**
 * Convert size_key to display format
 * Example: "205-55-16" => "205/55R16"
 */
export function toSizeDisplay(sizeKey: string): string {
  const parsed = parseSizeKey(sizeKey)
  if (!parsed) return sizeKey
  return `${parsed.width}/${parsed.aspectRatio}R${parsed.rimDiameter}`
}

/**
 * Convert display format to size_key
 * Example: "205/55R16" => "205-55-16"
 */
export function fromSizeDisplay(display: string): string | null {
  // Match patterns like "205/55R16" or "205/55/R16" or "205-55-16"
  const match = display.match(/(\d+)[\/\-](\d+)[\/\-]?R?(\d+)/i)
  if (!match) return null
  return `${match[1]}-${match[2]}-${match[3]}`
}

/**
 * Try to extract a tire size from a search query string
 * Examples:
 *   "205/55R16" => "205-55-16"
 *   "I need 205 55 16 tires" => "205-55-16"
 *   "looking for 18 inch tires" => null (not enough info)
 */
export function extractSizeFromQuery(query: string): { sizeKey: string; width: number; aspectRatio: number; rimDiameter: number } | null {
  // Try standard format first: 205/55R16
  const standardMatch = query.match(/(\d{3})[\/\-\s](\d{2})[\/\-\s]?R?(\d{2})/i)
  if (standardMatch) {
    const width = parseInt(standardMatch[1], 10)
    const aspectRatio = parseInt(standardMatch[2], 10)
    const rimDiameter = parseInt(standardMatch[3], 10)
    return {
      sizeKey: toSizeKey(width, aspectRatio, rimDiameter),
      width,
      aspectRatio,
      rimDiameter
    }
  }
  
  // Try finding three numbers that could be a size
  const numbers = query.match(/\d+/g)
  if (numbers && numbers.length >= 3) {
    // Look for typical width (155-315), aspect (30-85), rim (14-24)
    for (let i = 0; i < numbers.length - 2; i++) {
      const w = parseInt(numbers[i], 10)
      const a = parseInt(numbers[i + 1], 10)
      const r = parseInt(numbers[i + 2], 10)
      
      if (w >= 155 && w <= 315 && a >= 30 && a <= 85 && r >= 14 && r <= 24) {
        return {
          sizeKey: toSizeKey(w, a, r),
          width: w,
          aspectRatio: a,
          rimDiameter: r
        }
      }
    }
  }
  
  return null
}

/**
 * Extract quantity from a search query
 * Examples:
 *   "set of 4 tires" => 4
 *   "pair of 205/55R16" => 2
 *   "need 2 tires" => 2
 *   "205/55R16" => 1 (default)
 */
export function extractQuantityFromQuery(query: string): number {
  const lower = query.toLowerCase()
  
  // Check for "set" => 4
  if (lower.includes('set of 4') || lower.includes('set of four') || lower.match(/\bset\b/)) {
    return 4
  }
  
  // Check for "pair" => 2
  if (lower.includes('pair') || lower.includes('set of 2') || lower.includes('set of two')) {
    return 2
  }
  
  // Check for explicit numbers
  const match = lower.match(/(\d+)\s*(tire|tyre)/i)
  if (match) {
    const qty = parseInt(match[1], 10)
    if (qty >= 1 && qty <= 8) return qty
  }
  
  return 1
}

