'use client'

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

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
    </div>
  )
}
