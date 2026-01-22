'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, ExternalLink } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface SettingsFormProps {
  organization: Organization
}

export function SettingsForm({ organization }: SettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [embedHeight, setEmbedHeight] = useState(600)

  // Get base URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://app.tireslingers.com'
  
  const publicUrl = `${baseUrl}/yard/${organization.slug}`
  const embedUrl = `${baseUrl}/embed/${organization.slug}`
  const embedCode = `<iframe 
  src="${embedUrl}"
  width="100%" 
  height="${embedHeight}"
  frameborder="0"
  title="Tire Search">
</iframe>`

  const copyToClipboard = async (text: string, type: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedEmbed(true)
        setTimeout(() => setCopiedEmbed(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const form = useForm<Organization>({
    defaultValues: organization,
  })

  const onSubmit = async (data: Organization) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', organization.id)

      if (error) throw error

      router.refresh()
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yard Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your yard..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Inventory Entry Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Inventory Entry Settings</h2>
          <FormField
            control={form.control}
            name="allow_custom_brand"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Allow Custom Brand Entry</FormLabel>
                  <FormDescription>
                    When enabled, workers can type a custom brand name if not found in the database
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="require_model_selection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Require Model Selection</FormLabel>
                  <FormDescription>
                    When enabled, workers must select a specific tire model (not just brand)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* DOT Tracking Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tire Aging (DOT)</h2>
          <FormField
            control={form.control}
            name="dot_tracking_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Track DOT Date Codes</FormLabel>
                  <FormDescription>
                    Enable tracking of tire manufacturing dates to manage aging inventory
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {form.watch('dot_tracking_enabled') && (
            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="dot_max_age_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tire Age (years)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tires older than this will be flagged as expired
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dot_warning_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warning Threshold (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                      />
                    </FormControl>
                    <FormDescription>
                      Days before expiration to show warning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Storefront & Sharing */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Storefront & Sharing</h2>
          
          {/* Public URL */}
          <div className="space-y-2 mb-6">
            <Label>Public Storefront URL</Label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(publicUrl, 'url')}
              >
                {copiedUrl ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with customers to view your inventory
            </p>
          </div>

          {/* Embed Code */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <Label>Embeddable Widget Code</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="embed-height" className="text-sm text-muted-foreground">
                  Height:
                </Label>
                <Input
                  id="embed-height"
                  type="number"
                  min="300"
                  max="1200"
                  step="50"
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(parseInt(e.target.value) || 600)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={embedCode}
                readOnly
                className="flex-1 font-mono text-sm min-h-[120px]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="self-start"
              >
                {copiedEmbed ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy and paste this code into your website to embed the tire search widget
            </p>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <div className="border border-border rounded-lg overflow-hidden bg-muted">
              <iframe
                src={embedUrl}
                width="100%"
                height={embedHeight}
                style={{ border: 'none' }}
                title="Tire Search Widget Preview"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This is how the widget will appear on your website
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

