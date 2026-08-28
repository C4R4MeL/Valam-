'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

export default function DashboardBuyerOrdersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/buyer/orders')
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
    </div>
  )
}
