'use client'

import { Button } from "@/components/ui/button"
import { useEffect, useState, useTransition, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, ShoppingBag, Globe, ShoppingCart, Search, X, Bell } from "lucide-react"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { useTranslations, useLocale } from "next-intl"
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useCart } from '@/components/providers/CartProvider'

function IconLeaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
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
  const searchRef = useRef<HTMLInputElement>(null)

  const { role, email, logout, isAuthenticated } = useAuthContext()
  const { totalItems } = useCart()

  useEffect(() => {
    setIsClient(true)
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

  const getNavItemClasses = (targetPath: string, exact: boolean = false) => {
    let isActive = false
    if (targetPath === '/') {
      isActive = pathname === '/'
    } else if (exact) {
      isActive = pathname === targetPath
    } else {
      isActive = pathname.startsWith(targetPath)
    }

    return isActive
      ? "text-valam-gold-300 font-bold"
      : "text-white/70 hover:text-white"
  }

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A4D2E] shadow-lg shadow-[#1A4D2E]/20 hidden md:block">
      <div className="container flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Logo */}
        <Link className="flex items-center gap-2 group shrink-0" href="/">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center transition-transform duration-300 group-hover:scale-110 border border-white/10">
            <IconLeaf className="w-4 h-4 text-valam-gold-300" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif font-bold text-xl tracking-wide text-white">
              VALAM<span className="text-valam-gold">.</span>
            </span>
            <span className="text-[8px] tracking-[0.15em] uppercase text-white/40 font-semibold">
              B2B Managed-Marketplace
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {!isAdminPage && (
            <>
              {role !== 'buyer' && (
                <Link className={`text-xs transition-all hover:translate-y-[-1px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 ${getNavItemClasses('/', true)}`} href="/">
                  {t('Beranda')}
                </Link>
              )}
              <Link className={`text-xs transition-all hover:translate-y-[-1px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 ${getNavItemClasses('/marketplace')}`} href="/marketplace">
                {t('Katalog') || 'Katalog'}
              </Link>
              {(!role || role === 'buyer') && (
                <Link className={`text-xs transition-all hover:translate-y-[-1px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 ${getNavItemClasses('/matching')}`} href="/matching">
                  {t('SmartMatching')}
                </Link>
              )}
              <Link className={`text-xs transition-all hover:translate-y-[-1px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 ${getNavItemClasses('/insights')}`} href="/insights">
                Insights
              </Link>
            </>
          )}
        </nav>

        {/* Right Section: Search + Language + Auth */}
        <div className="flex items-center gap-2">

          {/* Search Toggle / Inline Bar */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 gap-2 backdrop-blur">
                  <Search className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'id' ? "Cari batch, koperasi, PA%..." : "Search batch, cooperative, PA%..."}
                    className="bg-transparent border-0 text-white text-xs placeholder:text-white/40 focus:outline-none w-48 xl:w-64"
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-white/40 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 h-8 px-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all text-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">{locale === 'id' ? 'Cari...' : 'Search...'}</span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-white/40">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-xs font-semibold rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[100px] rounded-xl">
              <DropdownMenuItem
                onClick={() => switchLocale('id')}
                className={`cursor-pointer ${locale === 'id' ? 'bg-emerald-50 text-emerald-900 font-bold' : ''}`}
              >
                Indonesia (ID)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLocale('en')}
                className={`cursor-pointer ${locale === 'en' ? 'bg-emerald-50 text-emerald-900 font-bold' : ''}`}
              >
                English (EN)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bell Icon (Stub) & Cart Icon */}
          <div className="flex items-center gap-1">
            <button className="relative p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#1A4D2E]" />
            </button>

            <Link href="/cart" className="relative p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-valam-gold text-[#1A4D2E] text-[9px] font-black flex items-center justify-center border border-[#1A4D2E] shadow-sm animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Profile / Login + Register */}
          {isClient ? (
            role ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full bg-valam-gold/80 hover:bg-valam-gold text-[#1A4D2E] font-bold text-sm shadow-sm ring-2 ring-white/20">
                    {getInitial()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{email}</p>
                      <p className="text-xs leading-none text-muted-foreground uppercase">{role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={role === 'buyer' ? '/marketplace' : `/dashboard/${role}`} className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>{role === 'buyer' ? (locale === 'id' ? 'Katalog Produk' : 'Product Catalog') : role === 'supplier' ? t('SupplierDashboard') : t('AdminDashboard')}</span>
                    </Link>
                  </DropdownMenuItem>
                  {role === 'buyer' && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/buyer/orders" className="cursor-pointer flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>{t('MyOrders')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('PengaturanProfil')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('KeluarAkun')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" className="h-8 rounded-lg text-xs font-semibold bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all">
                    {t('Masuk')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-8 rounded-lg text-xs font-bold bg-valam-gold hover:bg-valam-gold-300 text-[#1A4D2E] transition-all shadow-sm">
                    {t('Daftar') || (locale === 'id' ? 'Daftar' : 'Register')}
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <div className="h-8 w-16" /> // Placeholder for hydration
          )}
        </div>
      </div>
    </header>
  )
}
