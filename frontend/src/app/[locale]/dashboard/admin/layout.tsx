'use client'

import { useCallback, useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { Menu, Leaf } from 'lucide-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useLocale } from 'next-intl'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const closeMobileDrawer = useCallback(() => setMobileDrawerOpen(false), [])
  const locale = useLocale()
  const { email } = useAuthContext()

  const getInitial = () => {
    if (email) return email.charAt(0).toUpperCase()
    return 'A'
  }

  return (
    <RouteGuard requiredRole="admin">
      <div className="min-h-dvh bg-zinc-50 flex flex-col lg:flex-row">
        
        {/* ── Mobile Admin Header (visible < lg) ── */}
        <header className="sticky top-0 z-40 lg:hidden bg-emerald-950 text-white shadow-lg">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Hamburger */}
            <button
              type="button"
              aria-label={locale === 'id' ? 'Buka menu admin' : 'Open admin menu'}
              aria-controls="admin-sidebar"
              aria-expanded={mobileDrawerOpen}
              onClick={() => setMobileDrawerOpen(true)}
              className="h-11 w-11 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] text-white/80 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400/30 to-gold-600/20 flex items-center justify-center border border-white/10">
                <Leaf className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-serif font-bold text-lg tracking-wide text-white">
                Valam<span className="text-gold-400">.</span>
              </span>
              <span className="text-[9px] bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {getInitial()}
            </div>
          </div>
        </header>

        <AdminSidebar 
          isOpen={mobileDrawerOpen} 
          onClose={closeMobileDrawer}
        />
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}
