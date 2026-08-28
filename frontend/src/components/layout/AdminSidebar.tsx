'use client'

import { LayoutDashboard, Beaker, Users, Settings, LogOut, Leaf, BookOpen, Recycle } from 'lucide-react'
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuthContext } from '@/components/providers/AuthProvider'

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations('Navbar')
  const { email, logout } = useAuthContext()

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const getInitial = () => {
    if (email) return email.charAt(0).toUpperCase()
    return 'A'
  }

  const navItems = [
    {
      title: t('AdminDashboard'),
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: t('AntrianQC'),
      href: '/dashboard/admin/qc',
      icon: Beaker
    },
    {
      title: t('ValidasiSupplier'),
      href: '/dashboard/admin/suppliers',
      icon: Users
    },
    {
      title: 'Circular Products',
      href: '/dashboard/admin/circular-products',
      icon: Recycle
    },
    {
      title: 'Valam Insights',
      href: '/dashboard/admin/insights',
      icon: BookOpen
    }
  ]

  return (
    <aside className="w-72 bg-emerald-950 border-r border-emerald-900 flex flex-col h-screen sticky top-0 shadow-lg z-10 flex-shrink-0 text-white">
      {/* Branding Logo */}
      <div className="p-6 border-b border-emerald-900/50">
        <Link className="flex items-center gap-3 group w-fit" href="/">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 transition-transform group-hover:scale-105">
            <Leaf className="w-5 h-5 text-emerald-950" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-white">
            Valam<span className="text-gold-400">.</span>
          </span>
        </Link>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">
          Admin Control
        </h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
              
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-emerald-800/80 text-white font-bold shadow-sm border border-emerald-700/50' 
                    : 'text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-emerald-500'}`} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* Footer of Sidebar */}
      <div className="p-6 border-t border-emerald-900 bg-emerald-950/50">
        
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold shadow-sm">
            {getInitial()}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold text-white truncate">{email || 'Admin'}</span>
            <span className="text-xs text-emerald-400 uppercase tracking-wider">Administrator</span>
          </div>
        </div>

        <div className="space-y-1">
          <Link 
            href="/dashboard/admin/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm text-emerald-100/70 hover:bg-emerald-900/50 hover:text-white"
          >
            <Settings className="w-4 h-4 text-emerald-500" />
            Pengaturan
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 text-left"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>
        </div>
      </div>
    </aside>
  )
}
