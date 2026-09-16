'use client'

import { DashboardSkeleton } from '@/components/skeletons'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

export default function BuyerDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/marketplace')
  }, [router])

  return <DashboardSkeleton />
}
