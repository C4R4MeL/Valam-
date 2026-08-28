'use client'
 
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { usePathname, Link } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { LayoutDashboard, FileCheck, ClipboardList, Wallet, Send, ShoppingBag, Recycle } from 'lucide-react'
import { RouteGuard } from '@/components/auth/RouteGuard'
 
export default function SupplierDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useLocale() as 'id' | 'en'
  const [rfqCount, setRfqCount] = useState<number>(0)
  const [orderCount, setOrderCount] = useState<number>(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('valam_token')
        if (!token) return
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
        
        // Fetch RFQ
        const rfqRes = await fetch(`${apiUrl}/rfq/supplier`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (rfqRes.ok) {
          const json = await rfqRes.json()
          const incoming = (json.data || []).filter((r: any) => r.status === 'SENT')
          setRfqCount(incoming.length)
        }

        // Fetch Active Orders
        const orderRes = await fetch(`${apiUrl}/orders/supplier`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (orderRes.ok) {
          const json = await orderRes.json()
          const activeOrders = (json.data || []).filter((o: any) => o.status === 'PENDING' || o.status === 'PACKED' || o.status === 'SHIPPED')
          setOrderCount(activeOrders.length)
        }
      } catch (err) {
        console.error("Failed to fetch notification counts:", err)
      }
    }
    
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])
 
  const menuItems = [
    { name: locale === 'id' ? 'Ringkasan' : 'Overview', href: '/dashboard/supplier', icon: LayoutDashboard, exact: true },
    { name: locale === 'id' ? 'Tambah Batch' : 'Add Batch', href: '/dashboard/supplier/add-batch', icon: FileCheck },
    { name: locale === 'id' ? 'Inventori' : 'Inventory', href: '/dashboard/supplier/inventory', icon: ClipboardList },
    { name: locale === 'id' ? 'Circular Products' : 'Circular Products', href: '/dashboard/supplier/circular', icon: Recycle },
    { name: locale === 'id' ? 'Peluang RFQ' : 'RFQ Opportunities', href: '/dashboard/supplier/rfq', icon: Send },
    { name: locale === 'id' ? 'Pesanan Masuk' : 'Incoming Orders', href: '/dashboard/supplier/orders', icon: ShoppingBag },
    { name: locale === 'id' ? 'Dompet Digital' : 'Digital Wallet', href: '/dashboard/supplier/wallet', icon: Wallet },
  ]

  return (
    <RouteGuard requiredRole="supplier">
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 mt-14 flex flex-col lg:flex-row">
        
        {/* LEFT SIDEBAR - Desktop only */}
        <aside className="hidden lg:block w-64 border-r border-zinc-200 bg-white min-h-[calc(100vh-3.5rem)] shrink-0 sticky top-14">
          <div className="p-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              {locale === 'id' ? 'MENU UTAMA' : 'MAIN MENU'}
            </p>
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? (pathname === item.href || pathname === `/id${item.href}` || pathname === `/en${item.href}`)
                  : pathname.includes(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-sm'
                        : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.href.endsWith('/rfq') && rfqCount > 0 && (
                      <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                        {rfqCount}
                      </span>
                    )}
                    {item.href.endsWith('/orders') && orderCount > 0 && (
                      <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                        {orderCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* MOBILE NAVIGATION BAR - Visible only on mobile/tablet */}
        <div className="lg:hidden border-b border-zinc-200 bg-white sticky top-14 z-20 overflow-x-auto no-scrollbar">
          <div className="flex px-4 py-2 gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? (pathname === item.href || pathname === `/id${item.href}` || pathname === `/en${item.href}`)
                : pathname.includes(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-900 text-white font-semibold'
                      : 'text-zinc-650 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                  {item.href.endsWith('/rfq') && rfqCount > 0 && (
                    <span className="ml-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow-xs">
                      {rfqCount}
                    </span>
                  )}
                  {item.href.endsWith('/orders') && orderCount > 0 && (
                    <span className="ml-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-extrabold shadow-xs">
                      {orderCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>
      </div>
      <Footer />
    </div>
    </RouteGuard>
  )
}
