'use client'

/**
 * Cold-start safe navigation for navbar / bottom nav.
 *
 * Problem: on first page load, Next soft-nav often stalls until RSC cache is warm,
 * so the first click(s) feel dead. After a few navigations it becomes normal.
 *
 * Fix: the first navigation in a tab session uses a full page load (always works).
 * After that, use client soft-nav + prefetch for instant transitions.
 */
import { useCallback, useEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'

const WARM_KEY = 'valam_nav_warm'

function isNavWarm(): boolean {
  try {
    return sessionStorage.getItem(WARM_KEY) === '1'
  } catch {
    return false
  }
}

function markNavWarm() {
  try {
    sessionStorage.setItem(WARM_KEY, '1')
  } catch {
    /* private mode / blocked storage */
  }
}

export function useFastNav(prefetchRoutes: readonly string[] = []) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const pendingHrefRef = useRef<string | null>(null)
  const warmRef = useRef(false)
  const didInitWarm = useRef(false)
  const routesKey = prefetchRoutes.join('|')

  // Sync-read session flag on first client render (before useEffect)
  // so the first click after open doesn't race hydration.
  if (typeof window !== 'undefined' && !didInitWarm.current) {
    didInitWarm.current = true
    warmRef.current = isNavWarm()
  }

  useEffect(() => {
    warmRef.current = isNavWarm()

    const routes = routesKey ? routesKey.split('|') : []
    const warm = () => {
      routes.forEach((href) => {
        try {
          router.prefetch(href)
        } catch {
          /* ignore */
        }
      })
    }

    warm()
    const again = window.setTimeout(warm, 200)
    return () => clearTimeout(again)
  }, [router, routesKey])

  useEffect(() => {
    pendingHrefRef.current = null
  }, [pathname])

  const navigateTo = useCallback(
    (href: string) => {
      if (pathname === href) return
      // Allow retry if a previous soft-nav stalled
      if (pendingHrefRef.current === href) return
      pendingHrefRef.current = href

      // Clear pending lock if navigation never completes (stalled RSC)
      window.setTimeout(() => {
        if (pendingHrefRef.current === href) {
          pendingHrefRef.current = null
        }
      }, 2000)

      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router]
  )

  const onNavPointerDown = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>, href: string) => {
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      try {
        router.prefetch(href)
      } catch {
        /* ignore */
      }
    },
    [router]
  )

  const onNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      // Cold start (first nav in this tab): bypass Next soft-nav entirely.
      // Link would otherwise intercept and stall until RSC is warm.
      if (!warmRef.current) {
        markNavWarm()
        warmRef.current = true
        e.preventDefault()
        window.location.assign((e.currentTarget as HTMLAnchorElement).href)
        return
      }

      e.preventDefault()
      navigateTo(href)
    },
    [navigateTo]
  )

  return { onNavClick, onNavPointerDown, navigateTo, pathname, router }
}
