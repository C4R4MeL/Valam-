'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

export default function BuyerDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/marketplace')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
    </div>
  )
}
