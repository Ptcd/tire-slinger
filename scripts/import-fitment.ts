import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Path to CSV file - adjust if needed
const CSV_PATH = path.join(process.cwd(), 'data', 'TireSize.csv')

interface FitmentRow {
  make: string
  model: string
  year: number
  trim: string
  tire_sizes: string[] // Array of sizes like ["205/55R16", "215/45R17"]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseTireSizes(sizeString: string): string[] {
  // Input: "205/55R16;215/45R17;" or "205/55R16"
  // Output: ["205/55R16", "215/45R17"]
  if (!sizeString) return []
  return sizeString
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

async function main() {
  console.log('Reading CSV file...')
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const lines = csvContent.split('\n')
  
  const fitmentRows: FitmentRow[] = []
  let skipped = 0
  
  // Skip header rows (first 14 lines are headers/metadata)
  for (let i = 14; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const columns = parseCSVLine(line)
    
    // Columns: [empty], URL, Make, Model, Year, Trim, Tire sizes, ...
    const make = columns[2]
    const model = columns[3]
    const yearStr = columns[4]
    const trim = columns[5]
    const tireSizes = columns[6]
    
    if (!make || !model || !yearStr || !tireSizes) {
      skipped++
      continue
    }
    
    const year = parseInt(yearStr, 10)
    if (isNaN(year)) {
      skipped++
      continue
    }
    
    fitmentRows.push({
      make,
      model,
      year,
      trim: trim || 'Base',
      tire_sizes: parseTireSizes(tireSizes)
    })
  }
  
  console.log(`Parsed ${fitmentRows.length} fitment rows (skipped ${skipped})`)
  
  // Insert vehicles directly (each year/trim is a separate row per schema)
  console.log('Inserting vehicles...')
  const vehicles = fitmentRows.map(row => ({
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim
  }))
  
  // Deduplicate by year, make, model, trim
  const uniqueVehicles = new Map<string, typeof vehicles[0]>()
  for (const v of vehicles) {
    const key = `${v.year}|${v.make}|${v.model}|${v.trim}`
    uniqueVehicles.set(key, v)
  }
  
  const dedupedVehicles = Array.from(uniqueVehicles.values())
  console.log(`Found ${dedupedVehicles.length} unique vehicle entries`)
  
  for (let i = 0; i < dedupedVehicles.length; i += 100) {
    const batch = dedupedVehicles.slice(i, i + 100)
    const { error } = await supabase
      .from('fitment_vehicles')
      .upsert(batch, { onConflict: 'year,make,model,trim' })
    
    if (error) {
      console.error('Error inserting vehicles:', error)
    }
    
    if (i % 500 === 0) {
      console.log(`  Inserted ${i + batch.length} vehicles...`)
    }
  }
  
  // Get vehicle IDs
  console.log('Fetching vehicle IDs...')
  const { data: vehicleData } = await supabase
    .from('fitment_vehicles')
    .select('id, year, make, model, trim')
  
  const vehicleIdMap = new Map<string, string>()
  for (const v of vehicleData || []) {
    vehicleIdMap.set(`${v.year}|${v.make}|${v.model}|${v.trim || ''}`, v.id)
  }
  
  // Build tire size entries
  console.log('Building tire size entries...')
  const tireSizeEntries: { vehicle_id: string, width: number, aspect_ratio: number, rim_diameter: number }[] = []
  
  const sizeRegex = /^(\d+)\/(\d+)R(\d+)$/
  
  for (const row of fitmentRows) {
    const vehicleId = vehicleIdMap.get(`${row.year}|${row.make}|${row.model}|${row.trim}`)
    if (!vehicleId) continue
    
    for (const size of row.tire_sizes) {
      const match = size.match(sizeRegex)
      if (!match) continue
      
      tireSizeEntries.push({
        vehicle_id: vehicleId,
        width: parseInt(match[1], 10),
        aspect_ratio: parseInt(match[2], 10),
        rim_diameter: parseInt(match[3], 10)
      })
    }
  }
  
  // Deduplicate
  const uniqueSizes = new Map<string, typeof tireSizeEntries[0]>()
  for (const entry of tireSizeEntries) {
    const key = `${entry.vehicle_id}|${entry.width}|${entry.aspect_ratio}|${entry.rim_diameter}`
    uniqueSizes.set(key, entry)
  }
  
  const dedupedSizes = Array.from(uniqueSizes.values())
  console.log(`Inserting ${dedupedSizes.length} tire size entries...`)
  
  for (let i = 0; i < dedupedSizes.length; i += 100) {
    const batch = dedupedSizes.slice(i, i + 100)
    const { error } = await supabase
      .from('fitment_tire_sizes')
      .upsert(batch, { onConflict: 'vehicle_id,width,aspect_ratio,rim_diameter' })
    
    if (error) {
      console.error('Error inserting tire sizes:', error)
    }
    
    if (i % 1000 === 0) {
      console.log(`  Inserted ${i + batch.length} tire sizes...`)
    }
  }
  
  console.log('Done!')
}

main().catch(console.error)

