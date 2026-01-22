import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('=== Checking tire_catalog ===')
  
  // Check tire_catalog count
  const { count: catalogCount } = await supabase
    .from('tire_catalog')
    .select('*', { count: 'exact', head: true })
  console.log('tire_catalog total rows:', catalogCount)
  
  // Check for null brands
  const { count: nullCount } = await supabase
    .from('tire_catalog')
    .select('*', { count: 'exact', head: true })
    .is('brand', null)
  console.log('Rows with NULL brand:', nullCount)
  
  // Check sample for 205/55R16
  const { data: sample, error: sampleError } = await supabase
    .from('tire_catalog')
    .select('brand, model_name, width, aspect_ratio, rim_diameter')
    .eq('width', 205)
    .eq('aspect_ratio', 55)
    .eq('rim_diameter', 16)
    .limit(5)
  
  if (sampleError) {
    console.log('Error fetching sample:', sampleError)
  } else {
    console.log('Sample for 205/55R16:', sample?.length ? sample : 'NO DATA')
  }
  
  // Check any data
  const { data: anyData } = await supabase
    .from('tire_catalog')
    .select('brand, width, aspect_ratio, rim_diameter')
    .limit(5)
  console.log('Any tire_catalog data:', anyData)
  
  console.log('\n=== Checking organizations ===')
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
  console.log('Organizations:', orgs)
}

check().catch(console.error)

