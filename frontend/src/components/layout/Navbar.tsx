'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState, useTransition, useRef, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, ShoppingBag, Globe, ShoppingCart, Search, X, Menu, ChevronRight, Sparkles, BarChart3, Home } from "lucide-react"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { useTranslations, useLocale } from "next-intl"
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useCart } from '@/components/providers/CartProvider'

/* ── Leaf Logo Icon ── */
function IconLeaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

/* ── Navigation Item Config ── */
interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
  condition?: boolean
}

export function Navbar() {
  const t = useTranslations('Navbar')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isClient, setIsClient] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const { role, email, logout, isAuthenticated } = useAuthContext()
  const { totalItems } = useCart()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Scroll listener for navbar glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard shortcut ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  const isAdminPage = pathname.startsWith('/dashboard/admin')
  const isLandingPage = pathname === '/'

  const isNavActive = useCallback((targetPath: string, exact: boolean = false) => {
    if (targetPath === '/') return pathname === '/'
    if (exact) return pathname === targetPath
    return pathname.startsWith(targetPath)
  }, [pathname])

  const getInitial = () => {
    if (email) return email.charAt(0).toUpperCase()
    return 'U'
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Build nav items array
  const navItems: NavItem[] = [
    ...(role !== 'buyer' ? [{
      label: t('Beranda'),
      href: '/',
      icon: <Home className="w-3.5 h-3.5" />,
      exact: true,
      condition: !isAdminPage,
    }] : []),
    {
      label: t('Katalog') || 'Katalog',
      href: '/marketplace',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      condition: !isAdminPage,
    },
    ...(!role || role === 'buyer' ? [{
      label: t('SmartMatching'),
      href: '/matching',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      condition: !isAdminPage,
    }] : []),
    {
      label: 'Insights',
      href: '/insights',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      condition: !isAdminPage,
    },
  ].filter(item => item.condition !== false)

  return (
    <>
      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── DESKTOP NAVBAR ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      <header
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 hidden md:block"
      >
        {/* Outer spacing wrapper — adds padding when floating */}
        <div
          className={`transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
            scrolled ? 'pt-3 px-4' : 'pt-0 px-0'
          }`}
        >
          {/* Visual bar — transitions max-width for symmetric shrink */}
          <div
            className={`relative mx-auto transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden ${
              scrolled
                ? 'max-w-[900px] bg-[#0f2e1b]/90 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-emerald-800/40'
                : 'max-w-[2400px] bg-[#1A4D2E] rounded-none border border-transparent'
            }`}
          >
            {/* Subtle top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-valam-gold/60 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'}`} />

            {/* Content flex container */}
            <div className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              scrolled ? 'h-14 px-5 gap-3' : 'h-16 px-6 lg:px-8 gap-4'
            }`}>

          {/* ── Logo ── */}
          <Link className="flex items-center gap-2 group shrink-0" href="/">
            <div className={`relative rounded-xl bg-gradient-to-br from-valam-gold/20 to-white/5 backdrop-blur-sm flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:from-valam-gold/30 border border-white/10 group-hover:border-valam-gold/30 group-hover:shadow-[0_0_20px_rgba(182,154,29,0.15)] ${scrolled ? 'w-7 h-7 rounded-lg' : 'w-9 h-9'}`}>
              <IconLeaf className={`text-valam-gold-300 transition-all duration-500 group-hover:rotate-[-8deg] ${scrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {/* Glow dot */}
              {!scrolled && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-valam-gold animate-pulse" />}
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-serif font-bold tracking-wide text-white group-hover:text-valam-gold-100 transition-all duration-500 ${scrolled ? 'text-[15px]' : 'text-[22px]'}`}>
                VALAM<span className="text-valam-gold">.</span>
              </span>
              {!scrolled && (
                <span className="text-[7px] tracking-[0.2em] uppercase text-white/30 font-semibold">
                  B2B Marketplace
                </span>
              )}
            </div>
          </Link>

          {/* ── Navigation ── */}
          <nav className={`hidden lg:flex items-center gap-0.5 rounded-2xl border border-white/[0.06] transition-all duration-500 ${scrolled ? 'bg-white/[0.03] px-1 py-0.5 rounded-xl' : 'bg-white/[0.04] px-1.5 py-1'}`}>
            {navItems.map((item) => {
              const active = isNavActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 font-medium rounded-xl transition-all duration-300 group overflow-hidden ${
                    scrolled ? 'text-[12px] px-3 py-1.5' : 'text-[13px] px-4 py-2'
                  } ${
                    active
                      ? 'text-[#1A4D2E] font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {/* Active background pill */}
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-valam-gold/90 to-valam-gold-300/90 shadow-[0_2px_12px_rgba(182,154,29,0.3)] animate-scale-in" />
                  )}
                  
                  {/* Hover background pill (modern animated) */}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] scale-50 group-hover:scale-100" />
                  )}

                  <span className={`relative z-10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:-rotate-6 ${active ? 'text-[#1A4D2E]' : 'group-hover:text-valam-gold-300'}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {/* ── Right Section ── */}
          <div className={`flex items-center transition-all duration-500 ${scrolled ? 'gap-1' : 'gap-1.5'}`}>

            {/* Search Trigger */}
            {!isLandingPage && (
              <button
                onClick={() => setSearchOpen(true)}
                className={`flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] text-white/40 hover:text-white/70 transition-all duration-300 text-xs ${scrolled ? 'h-8 px-2.5' : 'h-9 px-3'}`}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-white/30">{locale === 'id' ? 'Cari...' : 'Search...'}</span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.1] text-[10px] text-white/25 font-mono">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Language Switcher */}
            {!isLandingPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] text-white/50 hover:text-white transition-all duration-300 flex items-center justify-center ${scrolled ? 'h-8 w-8' : 'h-9 w-9'}`}>
                    <Globe className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 mt-2 rounded-xl bg-[#1a3526]/95 backdrop-blur-xl border-white/10 text-white shadow-xl">
                  <DropdownMenuItem
                    onClick={() => switchLocale('id')}
                    className={`cursor-pointer text-sm rounded-lg ${locale === 'id' ? 'text-valam-gold bg-valam-gold/10 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    🇮🇩 Bahasa Indonesia
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => switchLocale('en')}
                    className={`cursor-pointer text-sm rounded-lg ${locale === 'en' ? 'text-valam-gold bg-valam-gold/10 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    🇬🇧 English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart Icon */}
            <Link
              href="/cart"
              className={`relative rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] text-white/50 hover:text-white transition-all duration-300 flex items-center justify-center ${scrolled ? 'h-8 w-8' : 'h-9 w-9'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-valam-gold to-valam-gold-300 text-[#1A4D2E] text-[10px] font-black flex items-center justify-center shadow-[0_2px_8px_rgba(182,154,29,0.4)] animate-scale-in ring-2 ring-[#1A4D2E]">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div className={`w-px bg-white/10 transition-all duration-500 ${scrolled ? 'h-5 mx-0.5' : 'h-6 mx-1'}`} />

            {/* Profile / Login */}
            {isClient ? (
              role ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`p-0 rounded-xl bg-gradient-to-br from-valam-gold to-valam-gold-300 hover:from-valam-gold-300 hover:to-valam-gold text-[#1A4D2E] font-bold text-sm shadow-[0_2px_12px_rgba(182,154,29,0.3)] ring-2 ring-white/10 hover:ring-white/20 transition-all duration-300 hover:scale-105 ${scrolled ? 'h-8 w-8' : 'h-9 w-9'}`}>
                      {getInitial()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 mt-2 rounded-xl bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] border border-white/40">
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A4D2E] to-[#2E8B57] flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {getInitial()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-semibold leading-none truncate text-[#1A4D2E]">{email}</p>
                          <p className="text-[11px] leading-none text-muted-foreground uppercase tracking-wider font-medium bg-valam-gold/10 text-valam-gold-600 px-2 py-0.5 rounded-full w-fit">{role}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={role === 'buyer' ? '/marketplace' : `/dashboard/${role}`} className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#1A4D2E]/5">
                        <div className="w-7 h-7 rounded-lg bg-[#1A4D2E]/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-[#1A4D2E]" />
                        </div>
                        <span className="text-sm">{role === 'buyer' ? (locale === 'id' ? 'Katalog Produk' : 'Product Catalog') : role === 'supplier' ? t('SupplierDashboard') : t('AdminDashboard')}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </DropdownMenuItem>
                    {role === 'buyer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/buyer/orders" className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#1A4D2E]/5">
                          <div className="w-7 h-7 rounded-lg bg-valam-gold/10 flex items-center justify-center">
                            <ShoppingBag className="h-3.5 w-3.5 text-valam-gold-600" />
                          </div>
                          <span className="text-sm">{t('MyOrders')}</span>
                          <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#1A4D2E]/5">
                        <div className="w-7 h-7 rounded-lg bg-[#1A4D2E]/10 flex items-center justify-center">
                          <Settings className="h-3.5 w-3.5 text-[#1A4D2E]" />
                        </div>
                        <span className="text-sm">{t('PengaturanProfil')}</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                        <LogOut className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">{t('KeluarAkun')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className={`rounded-xl text-xs font-semibold bg-gradient-to-r from-valam-gold to-valam-gold-300 hover:from-valam-gold-300 hover:to-valam-gold text-[#1A4D2E] shadow-[0_2px_12px_rgba(182,154,29,0.3)] hover:shadow-[0_4px_20px_rgba(182,154,29,0.4)] transition-all duration-300 hover:scale-[1.03] border border-valam-gold-300/30 ${scrolled ? 'h-8 px-4' : 'h-9 px-5'}`}>
                    {t('Masuk')}
                  </Button>
                </Link>
              )
            ) : (
              <div className="h-9 w-9 rounded-xl bg-white/[0.04] animate-pulse" />
            )}
          </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── MOBILE NAVBAR ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 md:hidden transition-all duration-500 ${
          scrolled
            ? 'bg-[#0f2e1b]/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
            : 'bg-gradient-to-r from-[#1A4D2E] via-[#1d5533] to-[#1A4D2E]'
        }`}
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-valam-gold/50 to-transparent" />

        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link className="flex items-center gap-2 group" href="/">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-valam-gold/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <IconLeaf className="w-4 h-4 text-valam-gold-300" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-white">
              VALAM<span className="text-valam-gold">.</span>
            </span>
          </Link>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            {!isLandingPage && (
              <button
                onClick={() => setSearchOpen(true)}
                className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/50 flex items-center justify-center transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/50 flex items-center justify-center transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-gradient-to-r from-valam-gold to-valam-gold-300 text-[#1A4D2E] text-[9px] font-black flex items-center justify-center ring-2 ring-[#1A4D2E]">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 flex items-center justify-center transition-all"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-Over Menu ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[60] w-[280px] bg-gradient-to-b from-[#122e1d] to-[#0c1f14] md:hidden shadow-[-10px_0_40px_rgba(0,0,0,0.4)] ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transition: 'transform 500ms cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <span className="text-white/40 text-xs font-semibold uppercase tracking-[0.15em]">Menu</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/40 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navItems.map((item, idx) => {
            const active = isNavActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-valam-gold/20 to-valam-gold/5 text-valam-gold border border-valam-gold/20'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  active ? 'bg-valam-gold/20 text-valam-gold' : 'bg-white/[0.04] text-white/40'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-valam-gold" />}
              </Link>
            )
          })}
        </nav>

        {/* Drawer Divider */}
        {!isLandingPage && (
          <>
            <div className="mx-5 border-t border-white/[0.06]" />

            {/* Language Switcher in Drawer */}
            <div className="px-3 py-4">
              <p className="px-3 text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-2">
                {locale === 'id' ? 'Bahasa' : 'Language'}
              </p>
              <div className="flex gap-1.5 px-3">
                <button
                  onClick={() => switchLocale('id')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    locale === 'id'
                      ? 'bg-valam-gold/20 text-valam-gold border border-valam-gold/20'
                      : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08]'
                  }`}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => switchLocale('en')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    locale === 'en'
                      ? 'bg-valam-gold/20 text-valam-gold border border-valam-gold/20'
                      : 'bg-white/[0.04] text-white/40 border border-transparent hover:bg-white/[0.08]'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            {/* Drawer Divider */}
            <div className="mx-5 border-t border-white/[0.06]" />
          </>
        )}

        {/* User Auth in Drawer */}
        <div className="px-3 py-4">
          {isClient && role ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-valam-gold to-valam-gold-300 flex items-center justify-center text-[#1A4D2E] font-bold text-sm">
                  {getInitial()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white/80 truncate max-w-[150px]">{email}</span>
                  <span className="text-[10px] text-valam-gold uppercase tracking-wider font-semibold">{role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10"
              >
                <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5" />
                </span>
                {t('KeluarAkun')}
              </button>
            </div>
          ) : (
            <Link href="/login" className="block">
              <Button className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-valam-gold to-valam-gold-300 text-[#1A4D2E] shadow-[0_2px_12px_rgba(182,154,29,0.25)] hover:shadow-[0_4px_20px_rgba(182,154,29,0.35)] transition-all">
                {t('Masuk')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ─── COMMAND PALETTE SEARCH OVERLAY ─── */}
      {/* ═══════════════════════════════════════════════════ */}
      {!isLandingPage && searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSearchOpen(false)}
            style={{ animation: 'fadeIn 200ms ease-out' }}
          />

          {/* Search Modal */}
          <div
            className="relative w-full max-w-lg mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] border border-white/50 overflow-hidden"
            style={{ animation: 'searchSlideIn 300ms cubic-bezier(0.32, 0.72, 0, 1)' }}
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <Search className="w-5 h-5 text-[#1A4D2E]/40 ml-4 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder={locale === 'id' ? 'Cari produk, supplier...' : 'Search products, suppliers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-14 px-3 bg-transparent text-[#1A4D2E] placeholder:text-[#1A4D2E]/30 text-sm outline-none"
              />
              <div className="flex items-center gap-2 pr-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-md hover:bg-[#1A4D2E]/5 text-[#1A4D2E]/30 hover:text-[#1A4D2E]/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="px-2 py-1 rounded-lg bg-[#1A4D2E]/5 border border-[#1A4D2E]/10 text-[11px] text-[#1A4D2E]/30 font-mono">
                  Esc
                </kbd>
              </div>
            </form>

            {/* Quick Suggestions */}
            {!searchQuery && (
              <div className="border-t border-[#1A4D2E]/5 px-4 py-3">
                <p className="text-[10px] text-[#1A4D2E]/30 uppercase tracking-wider font-semibold mb-2">
                  {locale === 'id' ? 'Saran Pencarian' : 'Quick Actions'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Rempah', 'Kopi', 'Kelapa', 'Kakao', 'Vanilla'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag)
                        handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent)
                        router.push(`/marketplace?q=${encodeURIComponent(tag)}`)
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1A4D2E]/5 hover:bg-[#1A4D2E]/10 text-[#1A4D2E]/60 hover:text-[#1A4D2E] text-xs font-medium transition-all hover:scale-105"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Inline Keyframe Styles ── */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes searchSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
