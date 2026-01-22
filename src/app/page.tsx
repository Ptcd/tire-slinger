import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Search, Phone, CircleDot, Zap, Shield, LogIn, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with Login/Dashboard Button */}
      <header className="relative z-20 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-end">
          {user ? (
            <Link href="/admin">
              <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Tread pattern background */}
        <div className="absolute inset-0 tread-pattern" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-24 text-center">
          {/* Tire icon logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <CircleDot className="h-24 w-24 text-primary" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="text-foreground">TIRE</span>
            <span className="text-primary"> SLINGERS</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Quality used tires from local yards. 
            <span className="text-foreground font-semibold"> Find your size. Contact direct.</span>
          </p>
          
          {/* Road stripe decoration */}
          <div className="road-stripe w-48 mx-auto mb-8 rounded-full" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/yard/demo-yard">
              <Button size="lg" className="text-lg px-8 py-6 font-bold">
                <Search className="mr-2 h-5 w-5" />
                Browse Inventory
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Package className="mr-2 h-5 w-5" />
                List Your Inventory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            WHY <span className="text-primary">TIRE SLINGERS</span>?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            The fastest way to find and sell quality used tires
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Live Inventory</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Real-time stock from local tire yards. No guessing, no wasted trips.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Easy Search</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Find tires by size or search by your vehicle's year, make, and model.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Direct Contact</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Contact sellers directly. No middlemen, no markup, no hassle.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Shield className="h-4 w-4" />
            FOR TIRE YARDS
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to <span className="text-primary">list your tires</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get your inventory online in minutes. Manage listings, track sales, and reach more customers.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6 font-bold">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CircleDot className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Tire Slingers</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Tire Slingers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
