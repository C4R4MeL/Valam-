'use client'

import { FormPageSkeleton } from '@/components/skeletons'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DashboardBuyerRfqNewRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : ''
    const target = query ? `/buyer/rfq?${query}&tab=create` : '/buyer/rfq?tab=create'
    router.replace(target)
  }, [router, searchParams])

  return <FormPageSkeleton />
}
