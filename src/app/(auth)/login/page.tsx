import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { CircleDot } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      {/* Tread pattern background */}
      <div className="absolute inset-0 tread-pattern opacity-50" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <CircleDot className="h-10 w-10 text-primary" />
          <span className="text-2xl font-black text-foreground">
            TIRE<span className="text-primary">SLINGERS</span>
          </span>
        </Link>
        
        <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
