'use client'
 
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RouteGuard } from '@/components/auth/RouteGuard'
 
export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRole="buyer">
      <div className="min-h-screen valam-grid-bg flex flex-col selection:bg-[#1B5E3A]/10 selection:text-[#1B5E3A]">
        <Navbar />
        <main className="flex-1 w-full pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </RouteGuard>
  )
}
