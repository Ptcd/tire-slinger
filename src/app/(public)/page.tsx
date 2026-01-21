import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Search, Phone } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Find Quality Used Tires</h1>
          <p className="text-xl text-slate-300 mb-8">
            Browse inventory from local tire yards. Contact sellers directly to purchase.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/yard/demo-yard">
              <Button size="lg">Browse Inventory</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">List Your Inventory</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Tire Slingers?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Live Inventory</CardTitle>
                <CardDescription>
                  See real-time availability from local tire yards
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Search className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Easy Search</CardTitle>
                <CardDescription>
                  Find tires by size or vehicle make and model
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Phone className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Direct Contact</CardTitle>
                <CardDescription>
                  Contact sellers directly to arrange purchase
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

