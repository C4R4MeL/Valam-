import { SessionSkeleton } from '@/components/skeletons'
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
 * - Shows skeleton during validation (prevents flash of stale content)
 */
export function RouteGuard({ requiredRole, children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuthContext()
  const locale = useLocale()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      window.location.href = `/${locale}/login`
      return
    }

    if (role && role !== requiredRole) {
      window.location.href = `/${locale}/dashboard/${role}`
      return
    }
  }, [isAuthenticated, isLoading, role, requiredRole, locale])

  if (isLoading) {
    return <SessionSkeleton />
  }

  if (!isAuthenticated || (role && role !== requiredRole)) {
    return <SessionSkeleton />
  }

  return <>{children}</>
}
