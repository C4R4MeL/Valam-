'use client'

import { LayoutDashboard, Beaker, Users, Settings, LogOut, Leaf, BookOpen, Recycle, X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useEffect } from 'react'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
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

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (onClose) onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

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

  /* ── Shared sidebar content (used by both desktop & mobile) ── */
  const sidebarContent = (
    <>
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
    </>
  )

  return (
    <>
      {/* ═══════════════════════════════════════════════════ */}
      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-72 bg-emerald-950 border-r border-emerald-900 flex-col h-screen sticky top-0 shadow-lg z-10 flex-shrink-0 text-white">
        {sidebarContent}
      </aside>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── MOBILE DRAWER OVERLAY (visible on mobile only) ── */}
      {/* ═══════════════════════════════════════════════════ */}
      
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-emerald-950 lg:hidden shadow-[10px_0_40px_rgba(0,0,0,0.4)] flex flex-col text-white ${
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
        style={{ transition: 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)' }}
        aria-hidden={!isOpen}
      >
        {/* Close button overlaid on top-right of drawer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white/60 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {sidebarContent}
      </div>
    </>
  )
}
