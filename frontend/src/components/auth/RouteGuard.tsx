'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useLocale } from 'next-intl'

interface RouteGuardProps {
  requiredRole: 'admin' | 'buyer' | 'supplier'
  children: React.ReactNode
}

/**
 * RouteGuard — Protects dashboard routes by checking auth state in real-time.
 * 
 * - If not authenticated → redirect to login
 * - If authenticated but wrong role → redirect to correct dashboard
 * - Shows loading overlay during validation (prevents flash of stale content)
 */
export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  const locale = useLocale()

  useEffect(() => {
    // Don't redirect while still hydrating
    if (isLoading) return

    if (!isAuthenticated) {
      // No token → go to login
      window.location.href = `/${locale}/login`
      return
    }

    if (role && role !== requiredRole) {
      // Logged in but wrong role → redirect to correct dashboard
      window.location.href = `/${locale}/dashboard/${role}`
      return
    }
  }, [isAuthenticated, isLoading, role, requiredRole, locale])

  // ── Loading state: prevent any stale content from rendering ──────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-50/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  // ── Not authenticated or wrong role: show loading while redirect happens ──
  if (!isAuthenticated || (role && role !== requiredRole)) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-50/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Mengalihkan...</p>
        </div>
      </div>
    )
  }

  // ── Authenticated + correct role → render children ───────────────
  return <>{children}</>
}
