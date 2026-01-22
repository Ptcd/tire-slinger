import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CircleDot, Shield } from 'lucide-react'

export default function TowerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <CircleDot className="h-8 w-8 text-primary" />
              <span className="text-xl font-black text-foreground">
                TIRE<span className="text-primary">SLINGERS</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              <Shield className="h-4 w-4" />
              Control Tower
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="border-border">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
