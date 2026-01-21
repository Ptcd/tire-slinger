import { CSVImporter } from '@/components/admin/csv-importer'
import { Card } from '@/components/ui/card'

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Tires</h1>
        <p className="text-muted-foreground">Upload a CSV file to bulk import tire listings</p>
      </div>

      <Card className="p-6">
        <CSVImporter />
      </Card>
    </div>
  )
}

