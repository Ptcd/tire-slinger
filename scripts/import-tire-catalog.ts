import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Path to CSV file - adjust if needed
const CSV_PATH = path.join(process.cwd(), 'data', 'TireSize.xlsx - Tires by brand.csv')

interface CatalogEntry {
  brand: string
  model_name: string
  category: string | null
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  flotation_diameter: number | null
  flotation_width: number | null
  flotation_rim: number | null
  is_lt: boolean
  size_display: string
}

function parseSize(sizeStr: string): {
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  flotation_diameter: number | null
  flotation_width: number | null
  flotation_rim: number | null
  is_lt: boolean
  size_display: string
} | null {
  if (!sizeStr) return null
  
  let cleanSize = sizeStr.trim()
  let is_lt = false
  
  // Check for LT prefix
  if (cleanSize.startsWith('LT ') || cleanSize.startsWith('LT')) {
    is_lt = true
    cleanSize = cleanSize.replace(/^LT\s*/, '')
  }
  
  // Try standard format: 235/70R18 - only capture 2 digits for rim diameter
  // Rim diameters are 14-24, never more than 2 digits
  // Width can be 2-3 digits (155-315), aspect ratio is always 2 digits (30-85)
  const standardRegex = /^(\d{2,3})\/(\d{2})R(\d{2})/
  const standardMatch = cleanSize.match(standardRegex)
  
  if (standardMatch) {
    const width = parseInt(standardMatch[1], 10)
    const aspect = parseInt(standardMatch[2], 10)
    const rim = parseInt(standardMatch[3], 10)
    
    return {
      width,
      aspect_ratio: aspect,
      rim_diameter: rim,
      flotation_diameter: null,
      flotation_width: null,
      flotation_rim: null,
      is_lt,
      size_display: is_lt ? `LT ${width}/${aspect}R${rim}` : `${width}/${aspect}R${rim}`
    }
  }
  
  // Try flotation format: 35X12.50R20 - only capture 2 digits for rim
  const flotationRegex = /^(\d+)[Xx]([\d.]+)R(\d{2})/
  const flotationMatch = cleanSize.match(flotationRegex)
  
  if (flotationMatch) {
    const diameter = parseFloat(flotationMatch[1])
    const width = parseFloat(flotationMatch[2])
    const rim = parseInt(flotationMatch[3], 10)
    
    return {
      width: null,
      aspect_ratio: null,
      rim_diameter: null,
      flotation_diameter: diameter,
      flotation_width: width,
      flotation_rim: rim,
      is_lt: true, // Flotation sizes are always LT
      size_display: `${diameter}X${width}R${rim}`
    }
  }
  
  // Could not parse
  return null
}

async function main() {
  console.log('Reading CSV file...')
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  
  // Use PapaParse to properly handle multi-line quoted fields
  const parsed = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true
  })
  
  const rows = parsed.data as string[][]
  console.log(`Parsed ${rows.length} total rows from CSV`)
  
  const catalogEntries: CatalogEntry[] = []
  let skipped = 0
  let parseErrors = 0
  
  // Skip header rows (first 14 lines are headers/metadata)
  for (let i = 14; i < rows.length; i++) {
    const columns = rows[i]
    if (!columns || columns.length < 10) {
      skipped++
      continue
    }
    
    // Columns: [empty], URL, Source URL, Brand, Brand logo, Tire name, Tire image, Tire category, Tire description, Size, ...
    const brand = columns[3]?.trim()
    const modelName = columns[5]?.trim()
    const category = columns[7]?.trim() || null
    const sizeStr = columns[9]?.trim()
    
    if (!brand || !modelName || !sizeStr) {
      skipped++
      continue
    }
    
    const parsedSize = parseSize(sizeStr)
    if (!parsedSize) {
      parseErrors++
      continue
    }
    
    catalogEntries.push({
      brand,
      model_name: modelName,
      category,
      ...parsedSize
    })
  }
  
  console.log(`Parsed ${catalogEntries.length} catalog entries`)
  console.log(`Skipped ${skipped} rows (missing data)`)
  console.log(`Parse errors: ${parseErrors} (unusual size formats)`)
  
  // Deduplicate by brand + model + size_display
  const uniqueEntries = new Map<string, CatalogEntry>()
  for (const entry of catalogEntries) {
    const key = `${entry.brand}|${entry.model_name}|${entry.size_display}`
    uniqueEntries.set(key, entry)
  }
  
  const dedupedEntries = Array.from(uniqueEntries.values())
  console.log(`After deduplication: ${dedupedEntries.length} unique entries`)
  
  // Insert in batches
  console.log('Inserting into tire_catalog...')
  
  for (let i = 0; i < dedupedEntries.length; i += 100) {
    const batch = dedupedEntries.slice(i, i + 100)
    
    const { error } = await supabase
      .from('tire_catalog')
      .upsert(batch, { 
        onConflict: 'brand,model_name,size_display',
        ignoreDuplicates: true 
      })
    
    if (error) {
      console.error('Error inserting batch:', error.message)
    }
    
    if (i % 1000 === 0) {
      console.log(`  Inserted ${Math.min(i + 100, dedupedEntries.length)} / ${dedupedEntries.length}...`)
    }
  }
  
  console.log('Done!')
  
  // Print some stats
  const { count: brandCount } = await supabase
    .from('tire_catalog')
    .select('brand', { count: 'exact', head: true })
  
  const { data: brandList } = await supabase
    .from('tire_catalog')
    .select('brand')
    .limit(1000)
  
  const uniqueBrands = new Set(brandList?.map(b => b.brand))
  console.log(`\nTotal unique brands: ${uniqueBrands.size}`)
  console.log('Brands:', Array.from(uniqueBrands).slice(0, 20).join(', '), '...')
}

main().catch(console.error)

