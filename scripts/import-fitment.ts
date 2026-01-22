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

function extractTrim(fullTrim: string, year: number, make: string, model: string): string {
  // Input: "1997 Acura CL 2.2L Tires"
  // Output: "2.2L"
  if (!fullTrim) return 'Base'
  
  // Remove "YYYY Make Model " prefix and " Tires" suffix
  let trim = fullTrim
    .replace(new RegExp(`^${year}\\s+${make}\\s+${model}\\s+`, 'i'), '')
    .replace(/\s+Tires?$/i, '')
    .trim()
  
  // If trim is empty or just whitespace, use "Base"
  if (!trim || trim.length === 0) {
    return 'Base'
  }
  
  return trim
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
    
    // Extract clean trim from full trim description
    const cleanTrim = extractTrim(trim || '', year, make, model)
    
    fitmentRows.push({
      make,
      model,
      year,
      trim: cleanTrim,
      tire_sizes: parseTireSizes(tireSizes)
    })
  }
  
  console.log(`Parsed ${fitmentRows.length} fitment rows (skipped ${skipped})`)
  
  if (fitmentRows.length === 0) {
    console.error('No fitment rows to import! Check CSV file path and format.')
    process.exit(1)
  }
  
  // Insert vehicles directly (each year/trim is a separate row per schema)
  console.log('\n=== Step 1: Inserting vehicles ===')
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

  let insertedVehicles = 0
  for (let i = 0; i < dedupedVehicles.length; i += 100) {
    const batch = dedupedVehicles.slice(i, i + 100)
    const { error } = await supabase
      .from('fitment_vehicles')
      .upsert(batch, { onConflict: 'year,make,model,trim' })
    
    if (error) {
      console.error(`Error inserting vehicles batch ${i}-${i + batch.length}:`, error)
      continue
    }
    
    insertedVehicles += batch.length
    if (i % 500 === 0 || i + batch.length >= dedupedVehicles.length) {
      console.log(`  Inserted ${insertedVehicles}/${dedupedVehicles.length} vehicles...`)
    }
  }
  
  console.log(`✓ Completed: ${insertedVehicles} vehicles inserted`)
  
  // Get vehicle IDs (paginate to get all records)
  console.log('\n=== Step 2: Fetching vehicle IDs ===')
  const vehicleIdMap = new Map<string, string>()
  let offset = 0
  const pageSize = 1000
  let totalFetched = 0
  
  while (true) {
    const { data: vehicleData, error: fetchError } = await supabase
      .from('fitment_vehicles')
      .select('id, year, make, model, trim')
      .range(offset, offset + pageSize - 1)
    
    if (fetchError) {
      console.error('Error fetching vehicle IDs:', fetchError)
      process.exit(1)
    }
    
    if (!vehicleData || vehicleData.length === 0) {
      break
    }
    
    for (const v of vehicleData) {
      vehicleIdMap.set(`${v.year}|${v.make}|${v.model}|${v.trim || ''}`, v.id)
    }
    
    totalFetched += vehicleData.length
    console.log(`  Fetched ${totalFetched} vehicle records...`)
    
    if (vehicleData.length < pageSize) {
      break
    }
    
    offset += pageSize
  }
  
  console.log(`✓ Fetched ${totalFetched} total vehicle records`)
  
  // Build tire size entries
  console.log('\n=== Step 3: Building tire size entries ===')
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
  console.log(`Found ${dedupedSizes.length} unique tire size entries`)
  console.log('\n=== Step 4: Inserting tire sizes ===')

  let insertedSizes = 0
  for (let i = 0; i < dedupedSizes.length; i += 100) {
    const batch = dedupedSizes.slice(i, i + 100)
    const { error } = await supabase
      .from('fitment_tire_sizes')
      .upsert(batch, { onConflict: 'vehicle_id,width,aspect_ratio,rim_diameter' })
    
    if (error) {
      console.error(`Error inserting tire sizes batch ${i}-${i + batch.length}:`, error)
      continue
    }
    
    insertedSizes += batch.length
    if (i % 1000 === 0 || i + batch.length >= dedupedSizes.length) {
      console.log(`  Inserted ${insertedSizes}/${dedupedSizes.length} tire sizes...`)
    }
  }
  
  console.log(`✓ Completed: ${insertedSizes} tire sizes inserted`)
  console.log('\n=== Import Complete ===')
  console.log(`Vehicles: ${insertedVehicles}`)
  console.log(`Tire Sizes: ${insertedSizes}`)
}

main().catch(console.error)

