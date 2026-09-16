'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'
import { useAuthContext } from './AuthProvider'

const BUYER_ONLY_ROUTES = [
  '/marketplace',
  '/katalog',
  '/chat',
  '/insights',
  '/matching',
  '/cart'
]

export function RoleGuard() {
  const { role, isLoading } = useAuthContext()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    
    if (role === 'supplier') {
      const isBuyerRoute = BUYER_ONLY_ROUTES.some(route => 
        pathname === route || pathname.startsWith(`${route}/`) || pathname === '/'
      )
      
      if (isBuyerRoute) {
        // Redirect supplier to their dashboard
        router.replace('/dashboard/supplier')
      }
    }
  }, [role, isLoading, pathname, router])

  return null
}
