'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  orgId: string
  currentImages: string[]
  onImagesChange: (urls: string[]) => void
}

export function ImageUpload({ orgId, currentImages, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Compress image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(file, options)

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${orgId}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('tire-images')
          .upload(filePath, compressedFile)

        if (error) throw error

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('tire-images')
          .getPublicUrl(filePath)

        newUrls.push(urlData.publicUrl)
      }

      onImagesChange([...currentImages, ...newUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async (url: string) => {
    // Extract file path from URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const filePath = pathParts.slice(pathParts.indexOf('tire-images') + 1).join('/')

    const supabase = createClient()
    const { error } = await supabase.storage
      .from('tire-images')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return
    }

    onImagesChange(currentImages.filter((img) => img !== url))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {currentImages.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {currentImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Tire ${index + 1}`}
                className="h-24 w-full rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(url)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

