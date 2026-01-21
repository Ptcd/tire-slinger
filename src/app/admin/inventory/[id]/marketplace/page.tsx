import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function MarketplacePackagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace Package</h1>
        <p className="text-muted-foreground">Generate listing content for Facebook Marketplace</p>
      </div>

      <Card className="p-6">
        <Alert>
          <AlertDescription>
            Marketplace package generation will be implemented in Phase 11. This feature helps
            generate copyable titles, descriptions, and photos for posting tires on Facebook
            Marketplace.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  )
}

