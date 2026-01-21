import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TireForm } from '@/components/admin/tire-form'
import { Card } from '@/components/ui/card'

export default async function EditTirePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tire, error } = await supabase
    .from('tires')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !tire) {
    redirect('/admin/inventory')
  }

  return (
    <Card className="p-6">
      <TireForm tire={tire} />
    </Card>
  )
}

