'use client'

import { ArrowLeft, SlidersHorizontal, MapPin, ShoppingCart } from "lucide-react"
import { useRouter, Link } from "@/i18n/routing"
import { useLocale } from "next-intl"
import { useCart } from "@/components/providers/CartProvider"

interface MobileHeaderProps {
  title?: string
  subtitle?: string
  onFilterClick?: () => void
  showFilter?: boolean
  rightAction?: React.ReactNode
}

export function MobileHeader({ 
  title = "Katalog VALAM", 
  subtitle,
  onFilterClick,
  showFilter = true,
  rightAction
}: MobileHeaderProps) {
  const router = useRouter()
  const locale = useLocale()
  const isId = locale === 'id'
  const { totalItems } = useCart()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A4D2E] text-white shadow-md md:hidden h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors -ml-1 text-white/90"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-serif font-bold text-base leading-tight truncate max-w-[180px]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-white/60 font-medium tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3 text-valam-gold-400" />
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link 
          href="/cart"
          className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors text-white shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-valam-gold text-[#1A4D2E] text-[9px] font-black flex items-center justify-center border border-[#1A4D2E] shadow-sm animate-scale-in">
              {totalItems}
            </span>
          )}
        </Link>

        {showFilter && (
          <button
            onClick={onFilterClick}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors text-valam-gold-300 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {rightAction}
      </div>
    </header>
  )
}
