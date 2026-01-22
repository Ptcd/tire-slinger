import { TireForm } from '@/components/admin/tire-form'
import { TireFormWizard } from '@/components/admin/tire-form-wizard'
import { Card } from '@/components/ui/card'
import { headers } from 'next/headers'

export default async function NewTirePage() {
  // Detect mobile from user-agent (server-side)
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-6 hidden md:block">Add New Tire</h1>
      {isMobile ? <TireFormWizard /> : <TireForm />}
    </Card>
  )
}

