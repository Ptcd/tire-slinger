import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { YardHeader } from '@/components/storefront/yard-header'
import { TireCard } from '@/components/storefront/tire-card'
import { TireSearch } from '@/components/storefront/tire-search'
import type { Tire } from '@/lib/types'

interface SearchParams {
  width?: string
  aspect_ratio?: string
  rim_diameter?: string
  year?: string
  make?: string
  model?: string
}

export default async function YardStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { slug } = await params
  const search = await searchParams
  const supabase = await createClient()

  // Get organization by slug
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!organization) {
    notFound()
  }

  // Build tire query
  let query = supabase
    .from('tires')
    .select('*')
    .eq('org_id', organization.id)
    .eq('is_active', true)
    .gt('quantity', 0)

  // Apply size filters if provided
  if (search.width) {
    query = query.eq('width', parseInt(search.width))
  }
  if (search.aspect_ratio) {
    query = query.eq('aspect_ratio', parseInt(search.aspect_ratio))
  }
  if (search.rim_diameter) {
    query = query.eq('rim_diameter', parseInt(search.rim_diameter))
  }

  // If vehicle search, look up fitment
  if (search.year && search.make && search.model) {
    // Find matching vehicle
    const { data: vehicles } = await supabase
      .from('fitment_vehicles')
      .select('id')
      .ilike('make', `%${search.make}%`)
      .ilike('model', `%${search.model}%`)
      .eq('year', parseInt(search.year))

    if (vehicles && vehicles.length > 0) {
      const vehicleIds = vehicles.map(v => v.id)
      
      // Get tire sizes for these vehicles
      const { data: sizes } = await supabase
        .from('fitment_tire_sizes')
        .select('width, aspect_ratio, rim_diameter')
        .in('vehicle_id', vehicleIds)

      if (sizes && sizes.length > 0) {
        // Get unique size combinations
        const uniqueSizes = Array.from(
          new Set(sizes.map(s => `${s.width}-${s.aspect_ratio}-${s.rim_diameter}`))
        ).map(str => {
          const [w, ar, rd] = str.split('-')
          return { width: parseInt(w), aspect_ratio: parseInt(ar), rim_diameter: parseInt(rd) }
        })

        // Build OR conditions - each condition matches one size combination
        const orConditions = uniqueSizes.map(s => 
          `and(width.eq.${s.width},aspect_ratio.eq.${s.aspect_ratio},rim_diameter.eq.${s.rim_diameter})`
        ).join(',')
        
        query = query.or(orConditions)
      } else {
        // No matching sizes, return empty by using impossible condition
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      // No matching vehicle, return empty by using impossible condition
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  const { data: tires } = await query.order('created_at', { ascending: false })

  const hasFilters = search.width || search.aspect_ratio || search.rim_diameter || 
                     (search.year && search.make && search.model)

  return (
    <div className="min-h-screen bg-background">
      <YardHeader organization={organization} />
      <div className="container mx-auto px-4 py-8">
        <TireSearch 
          orgSlug={slug}
          initialFilters={{
            width: search.width || '',
            aspectRatio: search.aspect_ratio || '',
            rimDiameter: search.rim_diameter || '',
            year: search.year || '',
            make: search.make || '',
            model: search.model || '',
          }}
        />
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-foreground">
              {hasFilters ? 'Matching' : 'Available'} <span className="text-primary">Tires</span>
            </h2>
            {hasFilters && (
              <a href={`/yard/${slug}`} className="text-sm text-primary hover:underline">
                Clear filters
              </a>
            )}
          </div>
          {tires && tires.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tires.map((tire) => (
                <TireCard
                  key={tire.id}
                  tire={tire}
                  organization={organization}
                  yardSlug={slug}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{hasFilters ? 'No tires match your search.' : 'No tires available at this time.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
