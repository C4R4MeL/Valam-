'use client'

import { Home, Compass, User, BarChart2, ShoppingCart } from "lucide-react"
import { Link, usePathname } from "@/i18n/routing"
import { useLocale } from "next-intl"
import { useAuthContext } from '@/components/providers/AuthProvider'

export function BottomNavigation() {
  const pathname = usePathname()
  const locale = useLocale()
  const isId = locale === 'id'
  const { role } = useAuthContext()

  const navItems = [
    ...(role !== 'buyer' ? [{
      label: isId ? 'Beranda' : 'Home',
      icon: <Home className="w-5 h-5" />,
      href: '/',
      isActive: pathname === '/'
    }] : []),
    {
      label: isId ? 'Katalog' : 'Catalog',
      icon: <Compass className="w-5 h-5" />,
      href: '/marketplace',
      isActive: pathname.startsWith('/marketplace')
    },
    {
      label: 'Matching',
      icon: <BarChart2 className="w-6 h-6" />,
      href: '/matching',
      isActive: pathname.startsWith('/matching'),
      isCenter: true
    },
    ...(role === 'buyer' ? [{
      label: 'Cart',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/cart',
      isActive: pathname.startsWith('/cart')
    }] : []),
    {
      label: 'Akun',
      icon: <User className="w-5 h-5" />,
      href: role ? (role === 'buyer' ? '/dashboard/buyer/orders' : `/dashboard/${role}`) : '/login',
      isActive: pathname.startsWith('/dashboard') || pathname.startsWith('/profile')
    }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <Link 
                key={index}
                href={item.href}
                className="relative -top-5 flex flex-col items-center justify-center group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 ${
                  item.isActive 
                    ? 'bg-gradient-to-br from-valam-gold-300 to-valam-gold-500 text-[#1A4D2E] shadow-valam-gold-400/40' 
                    : 'bg-gradient-to-br from-[#1A4D2E] to-forest-900 text-white shadow-forest-900/30'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight ${
                  item.isActive ? 'text-valam-gold-600' : 'text-[#1A4D2E]'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                item.isActive 
                  ? 'text-[#1A4D2E]' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className={`transition-transform ${item.isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] tracking-tight ${item.isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
