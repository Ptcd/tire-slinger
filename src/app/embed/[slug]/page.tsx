import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EmbedSearchWidget } from '@/components/embed/embed-search-widget'

export const metadata = {
  title: 'Tire Search Widget',
  description: 'Search for tires by vehicle or size',
}

export default async function EmbedPage({
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

  return (
    <div className="min-h-screen bg-background">
      <EmbedSearchWidget organization={organization} orgSlug={slug} />
    </div>
  )
}

