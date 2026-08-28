'use client'

import React from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRole="buyer">
      <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E]">
        <Navbar />
        <main className="flex-1 w-full pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </RouteGuard>
  )
}
