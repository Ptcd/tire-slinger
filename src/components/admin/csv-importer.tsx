'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle2, XCircle } from 'lucide-react'

interface CSVRow {
  width: number
  aspect_ratio: number
  rim_diameter: number
  brand?: string
  model?: string
  tire_type?: string
  condition?: string
  tread_depth?: number
  price: number
  quantity: number
  description?: string
  error?: string
}

export function CSVImporter() {
  const router = useRouter()
  const { organization } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [importing, setImporting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = validateRows(results.data as any[])
        setParsedData(validated)
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`)
      },
    })
  }

  const validateRows = (rows: any[]): CSVRow[] => {
    return rows.map((row, index) => {
      const errors: string[] = []

      // Required fields
      if (!row.width || isNaN(parseInt(row.width))) {
        errors.push('Width is required and must be a number')
      }
      if (!row.aspect_ratio || isNaN(parseInt(row.aspect_ratio))) {
        errors.push('Aspect ratio is required and must be a number')
      }
      if (!row.rim_diameter || isNaN(parseInt(row.rim_diameter))) {
        errors.push('Rim diameter is required and must be a number')
      }
      if (!row.price || isNaN(parseFloat(row.price))) {
        errors.push('Price is required and must be a number')
      }
      if (!row.quantity || isNaN(parseInt(row.quantity))) {
        errors.push('Quantity is required and must be a number')
      }

      return {
        width: parseInt(row.width) || 0,
        aspect_ratio: parseInt(row.aspect_ratio) || 0,
        rim_diameter: parseInt(row.rim_diameter) || 0,
        brand: row.brand || null,
        model: row.model || null,
        tire_type: row.tire_type || 'all-season',
        condition: row.condition || 'used',
        tread_depth: row.tread_depth ? parseInt(row.tread_depth) : null,
        price: parseFloat(row.price) || 0,
        quantity: parseInt(row.quantity) || 0,
        description: row.description || null,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      }
    })
  }

  const handleImport = async () => {
    if (!organization) return

    const validRows = parsedData.filter((row) => !row.error)
    if (validRows.length === 0) {
      alert('No valid rows to import')
      return
    }

    setImporting(true)
    const supabase = createClient()

    try {
      const tiresToInsert = validRows.map((row) => ({
        org_id: organization.id,
        width: row.width,
        aspect_ratio: row.aspect_ratio,
        rim_diameter: row.rim_diameter,
        brand: row.brand || null,
        model: row.model || null,
        tire_type: row.tire_type || 'all-season',
        condition: row.condition || 'used',
        tread_depth: row.tread_depth || null,
        price: row.price,
        quantity: row.quantity,
        description: row.description || null,
        images: [],
      }))

      const { error } = await supabase.from('tires').insert(tiresToInsert)

      if (error) throw error

      alert(`Successfully imported ${validRows.length} tires`)
      router.push('/admin/inventory')
      router.refresh()
    } catch (error) {
      console.error('Error importing tires:', error)
      alert('Failed to import tires')
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedData.filter((row) => !row.error).length
  const errorCount = parsedData.filter((row) => row.error).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Upload CSV File</h2>
        <p className="text-sm text-muted-foreground mb-4">
          CSV should include columns: width, aspect_ratio, rim_diameter, brand, model, tire_type, condition, tread_depth, price, quantity, description
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="max-w-sm"
        />
      </div>

      {parsedData.length > 0 && (
        <>
          <div className="flex gap-4 items-center">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {validCount} valid row(s) ready to import
              </AlertDescription>
            </Alert>
            {errorCount > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorCount} row(s) have errors
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((row, index) => (
                  <TableRow key={index} className={row.error ? 'bg-red-50' : ''}>
                    <TableCell>
                      {row.width}/{row.aspect_ratio}R{row.rim_diameter}
                    </TableCell>
                    <TableCell>{row.brand || '-'}</TableCell>
                    <TableCell>${row.price.toFixed(2)}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>
                      {row.error ? (
                        <span className="text-red-600 text-sm">{row.error}</span>
                      ) : (
                        <span className="text-green-600 text-sm">✓ Valid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importing...' : `Import ${validCount} Tire(s)`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

