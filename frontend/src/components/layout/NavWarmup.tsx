'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

/** Lightweight early warmer — mounts from layout, not the heavy page tree. */
const ROUTES = [
  '/',
  '/marketplace',
  '/matching',
  '/chat',
  '/insights',
  '/cart',
  '/login',
] as const

export function NavWarmup() {
  const router = useRouter()

  useEffect(() => {
    ROUTES.forEach((href) => {
      try {
        router.prefetch(href)
      } catch {
        /* ignore */
      }
    })
  }, [router])

  return null
}
