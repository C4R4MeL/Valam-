'use client'

import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredRole="admin">
      <div className="min-h-screen bg-zinc-50 flex">
        <AdminSidebar />
        <main className="flex-1 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}
