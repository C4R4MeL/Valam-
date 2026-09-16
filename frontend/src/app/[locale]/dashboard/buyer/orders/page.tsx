'use client'

import { OrdersSkeleton } from '@/components/skeletons'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

export default function DashboardBuyerOrdersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/buyer/orders')
  }, [router])

  return <OrdersSkeleton />
}
