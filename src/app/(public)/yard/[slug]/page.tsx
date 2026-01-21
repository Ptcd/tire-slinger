import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { YardHeader } from '@/components/storefront/yard-header'
import { TireCard } from '@/components/storefront/tire-card'
import { TireSearch } from '@/components/storefront/tire-search'
import type { Organization, Tire } from '@/lib/types'

export default async function YardStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  // Get active tires
  const { data: tires } = await supabase
    .from('tires')
    .select('*')
    .eq('org_id', organization.id)
    .eq('is_active', true)
    .gt('quantity', 0)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <YardHeader organization={organization} />
      <div className="container mx-auto px-4 py-8">
        <TireSearch orgId={organization.id} />
        <div className="mt-8">
          <h2 className="text-2xl font-black mb-6 text-foreground">
            Available <span className="text-primary">Tires</span>
          </h2>
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
              <p>No tires available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
