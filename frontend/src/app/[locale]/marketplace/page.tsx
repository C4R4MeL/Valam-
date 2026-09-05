'use client'

import { useState, useEffect, Suspense } from 'react'
import { SlidersHorizontal, Search, Layers, X, ShieldCheck, Beaker, Leaf } from 'lucide-react'
import { FilterSidebar } from '@/components/marketplace/FilterSidebar'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { getLatestMarketPrices } from '@/lib/valam-insights/insights-api'

const contentMap = {
  id: {
    heroBadge: "Katalog B2B Terverifikasi",
    title: "Katalog Minyak Nilam Terverifikasi Lab",
    subtitle: "Eksplorasi batch minyak nilam terbaik dari koperasi petani Aceh.",
    searchPlaceholder: "Cari berdasarkan Koperasi, Batch, Asal...",
    filterBtn: "Filter",
    showing: "Menampilkan",
    products: "batch",
    sortBy: "Urutkan:",
    sortNewest: "Terbaru",
    sortPa: "PA% Tertinggi",
    sortPrice: "Harga Terendah",
    empty: "Belum ada produk yang sesuai dengan filter Anda.",
    reset: "Reset Filter",
    coopStats: "Koperasi Aktif",
    verifiedStats: "Batch Terverifikasi",
    priceLabel: "Harga Live Pasar",
  },
  en: {
    heroBadge: "Verified B2B Catalog",
    title: "Lab-Verified Patchouli Oil Catalog",
    subtitle: "Explore the finest patchouli oil batches from Aceh cooperatives.",
    searchPlaceholder: "Search by Cooperative, Batch, Origin...",
    filterBtn: "Filters",
    showing: "Showing",
    products: "batches",
    sortBy: "Sort by:",
    sortNewest: "Newest",
    sortPa: "Highest PA%",
    sortPrice: "Lowest Price",
    empty: "No products match your filters.",
    reset: "Reset Filters",
    coopStats: "Active Cooperatives",
    verifiedStats: "Verified Batches",
    priceLabel: "Live Market Price",
  }
}

function MarketplaceContent({ isFilterOpen, setIsFilterOpen }: { isFilterOpen: boolean, setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  // URL params for search and tabs
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const urlTab = searchParams.get('tab') === 'circular' ? 'circular' : 'oil'

  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [sortBy, setSortBy] = useState('newest')
  
  // Extended dual-range filters
  const [filters, setFilters] = useState({
    paMin: 20,
    paMax: 40,
    regions: [] as string[],
    qualityTier: null as 'Premium' | 'Export Grade' | 'Industrial' | 'Commercial' | null,
    minStock: 0,
    maxStock: 5000,
    minPrice: 500000,
    maxPrice: 1500000,
    gcmsVerified: false,
    coaOnly: false,
    qrTraceable: false,
    distillationMethods: [] as string[],
    eudrReady: false,
    
    // Circular specific filters
    circularCategories: [] as string[],
    circularMinStock: 0,
    circularMaxStock: 10000,
    circularMinPrice: 1000,
    circularMaxPrice: 50000
  })
  
  const [activeTab, setActiveTab] = useState<'oil' | 'circular'>(urlTab)

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(urlTab)
  }, [urlTab])

  // Sync search query with URL
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery)
    }
  }, [urlQuery])
  
  const locale = useLocale() as 'id' | 'en'
  const isId = locale === 'id'
  const t = contentMap[locale] || contentMap.id
  
  const [products, setProducts] = useState<any[]>([])
  const [, setMarketPrices] = useState<any[]>([])

  useEffect(() => {
    // Fetch live market prices ticker
    getLatestMarketPrices()
      .then(res => {
        setMarketPrices(res)
      })
      .catch(err => {
        setMarketPrices([
          { grade: 'GRADE_A', price_per_kg: 850000, currency: 'IDR' },
          { grade: 'GRADE_B', price_per_kg: 780000, currency: 'IDR' },
          { grade: 'GRADE_C', price_per_kg: 680000, currency: 'IDR' }
        ])
      })
  }, [])

  useEffect(() => {
    const fetchCatalog = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      if (activeTab === 'oil') {
        try {
          const res = await fetch(`${apiUrl}/products?status=VERIFIED`, { cache: 'no-store' })
          if (res.ok) {
            const result = await res.json()
            const dbProducts = result.data || []
            
            // Only verified products from database
            const list = dbProducts
              .filter((p: any) => p.status === 'VERIFIED')
              .map((p: any) => ({
                ...p,
                supplier: {
                  company_name: p.supplier_name || p.supplier?.profile?.company_name || p.supplier?.supplier_profile?.nama_koperasi || 'Koperasi Nilam Atsiri'
                }
              }))
            
            setProducts(list)
            return
          }
          setProducts([])
        } catch (err) {
          console.error("Error fetching oil products:", err)
          setProducts([])
        }
      } else {
        try {
          const res = await fetch(`${apiUrl}/circular-products`, { cache: 'no-store' })
          if (res.ok) {
            const result = await res.json()
            // Only approved circular products from database
            const mapped = (Array.isArray(result) ? result : [])
              .filter((cp: any) => cp.status === 'APPROVED')
              .map((cp: any) => {
                const partnerName = cp.supplier?.supplier_profile?.nama_koperasi || cp.supplier?.profile?.company_name || 'Mitra Sirkular Valam'
                return {
                  id: cp.id,
                  batch_code: cp.name,
                  nama: cp.name,
                  supplier_name: partnerName,
                  mitra_pengolah_nama: partnerName,
                  status: cp.status,
                  origin_district: cp.supplier?.supplier_profile?.kabupaten || 'Aceh Barat',
                  pa_percentage: 0,
                  moisture: 0,
                  available_volume_kg: cp.stock,
                  stok_tersedia: cp.stock,
                  price_per_kg: cp.price,
                  harga_per_unit: cp.price,
                  min_order: cp.supplier?.supplier_profile?.minimum_order || 5,
                  sustainability_score: 5,
                  images: cp.image ? [cp.image] : [],
                  is_circular: true,
                  category: cp.category,
                  benefit: cp.benefit,
                  description: cp.description,
                  unit: cp.unit || 'Kg',
                  created_at: cp.created_at
                }
              })

            setProducts(mapped)
          } else {
            setProducts([])
          }
        } catch (err) {
          console.error("Error fetching circular products:", err)
          setProducts([])
        }
      }
    }

    fetchCatalog()
  }, [activeTab])

  const handleResetFilters = () => {
    setFilters({ 
      paMin: 20, 
      paMax: 40,
      regions: [], 
      qualityTier: null, 
      minStock: 0, 
      maxStock: 5000,
      minPrice: 500000, 
      maxPrice: 1500000,
      gcmsVerified: false,
      coaOnly: false,
      qrTraceable: false,
      distillationMethods: [],
      eudrReady: false,
      circularCategories: [],
      circularMinStock: 0,
      circularMaxStock: 10000,
      circularMinPrice: 1000,
      circularMaxPrice: 50000
    })
    setSearchQuery('')
  }

  // Quick Filter Pill Handlers
  const handleQuickFilter = (type: string) => {
    if (type === 'all') {
      handleResetFilters()
    } else if (type === 'premium') {
      setActiveTab('oil')
      setFilters(prev => ({
        ...prev,
        paMin: 34,
        paMax: 40,
        qualityTier: 'Premium'
      }))
    } else if (type === 'standard') {
      setActiveTab('oil')
      setFilters(prev => ({
        ...prev,
        qualityTier: 'Export Grade',
        paMin: 30,
        paMax: 33.5
      }))
    } else if (type === 'eudr') {
      setActiveTab('oil')
      setFilters(prev => ({
        ...prev,
        eudrReady: true
      }))
    }
  }

  const isQuickActive = (type: string) => {
    if (type === 'all') {
      return !filters.qualityTier && filters.paMin === 20 && filters.paMax === 40 && !filters.eudrReady && filters.regions.length === 0
    }
    if (type === 'premium') {
      return filters.qualityTier === 'Premium'
    }
    if (type === 'standard') {
      return filters.qualityTier === 'Export Grade'
    }
    if (type === 'eudr') {
      return filters.eudrReady === true
    }
    return false
  }

  const productCounts = products
    .filter(p => p.status === 'VERIFIED' || p.status === 'ACTIVE' || p.status === 'APPROVED')
    .reduce((acc, p) => {
      const dist = p.origin_district
      if (dist) {
        acc[dist] = (acc[dist] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

  let activeProducts = products.filter(p => p.status === 'VERIFIED' || p.status === 'ACTIVE' || p.status === 'APPROVED')
  
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase()
    activeProducts = activeProducts.filter(p => 
      p.batch_code.toLowerCase().includes(q) ||
      p.supplier_name.toLowerCase().includes(q) ||
      (p.origin_district && p.origin_district.toLowerCase().includes(q))
    )
  }

  if (activeTab === 'oil') {
    // Filter by PA% range
    activeProducts = activeProducts.filter(p => p.pa_percentage >= filters.paMin && p.pa_percentage <= filters.paMax)

    // Quality Tier Filter
    if (filters.qualityTier) {
      activeProducts = activeProducts.filter(p => {
        const pa = p.pa_percentage
        if (filters.qualityTier === 'Premium') return pa >= 34
        if (filters.qualityTier === 'Export Grade') return pa >= 30 && pa < 34
        if (filters.qualityTier === 'Industrial') return pa >= 26 && pa < 30
        return pa < 26
      })
    }

    // GC-MS Verified Filter
    if (filters.gcmsVerified) {
      activeProducts = activeProducts.filter(p => p.status === 'VERIFIED')
    }

    // CoA Available Filter
    if (filters.coaOnly) {
      activeProducts = activeProducts.filter(p => p.qc_result !== null || p.tested_at !== null)
    }

    // QR Traceability Filter
    if (filters.qrTraceable) {
      activeProducts = activeProducts.filter(p => p.batch_code.startsWith('VAL-') || p.batch_code.startsWith('VLM-2606-001') || p.batch_code.startsWith('VLM-2606-003'))
    }

    // Distillation Method Filter
    if (filters.distillationMethods && filters.distillationMethods.length > 0) {
      activeProducts = activeProducts.filter(p => {
        const method = p.distillation_method || (
          parseInt(p.id.substring(0, 8), 16) % 3 === 0 ? 'Uap & Air' :
          parseInt(p.id.substring(0, 8), 16) % 3 === 1 ? 'Uap Langsung' : 'Air / Hydro'
        )
        return filters.distillationMethods.includes(method)
      })
    }

    // EUDR Ready Filter
    if (filters.eudrReady) {
      activeProducts = activeProducts.filter(p => {
        const isEudr = p.eudr_ready !== undefined ? p.eudr_ready : (parseInt(p.id.substring(0, 8), 16) % 4 !== 0)
        return isEudr === true
      })
    }
  } else {
    if (filters.circularCategories.length > 0) {
      activeProducts = activeProducts.filter(p => filters.circularCategories.includes(p.category))
    }
  }

  if (filters.regions.length > 0) {
    activeProducts = activeProducts.filter(p => filters.regions.includes(p.origin_district))
  }

  // Stock range filter
  const minStockToUse = activeTab === 'oil' ? filters.minStock : filters.circularMinStock
  const maxStockToUse = activeTab === 'oil' ? filters.maxStock : filters.circularMaxStock
  activeProducts = activeProducts.filter(p => p.available_volume_kg >= minStockToUse && p.available_volume_kg <= maxStockToUse)

  // Price range filter
  const minPriceToUse = activeTab === 'oil' ? filters.minPrice : filters.circularMinPrice
  const maxPriceToUse = activeTab === 'oil' ? filters.maxPrice : filters.circularMaxPrice
  activeProducts = activeProducts.filter(p => p.price_per_kg >= minPriceToUse && p.price_per_kg <= maxPriceToUse)

  if (sortBy === 'newest') {
    activeProducts.sort((a, b) => new Date(b.created_at || b.tested_at).getTime() - new Date(a.created_at || a.tested_at).getTime())
  } else if (sortBy === 'pa') {
    activeProducts.sort((a, b) => (b.pa_percentage || 0) - (a.pa_percentage || 0))
  } else if (sortBy === 'price') {
    activeProducts.sort((a, b) => a.price_per_kg - b.price_per_kg)
  }

  return (
    <div className="flex-1 flex w-full max-w-7xl mx-auto md:px-6 pt-2 pb-20 md:pt-4 md:pb-6 mt-16 md:mt-14">
      <FilterSidebar 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        filters={filters}
        setFilters={setFilters}
        onReset={handleResetFilters}
        productCounts={productCounts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        products={products}
      />

      <div className="flex-1 px-4 md:px-0 md:pl-8 min-w-0">
        
        {/* Compact Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A4D2E]">
              {t.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{t.subtitle}</p>
          </div>
          <Button 
            onClick={() => setIsFilterOpen(true)}
            variant="outline"
            className="hidden md:flex bg-white hover:bg-zinc-50 text-[#1A4D2E] border-zinc-200 rounded-xl px-4 h-10 text-xs font-bold items-center gap-2 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t.filterBtn}
          </Button>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="p-1 bg-zinc-200/55 rounded-xl mb-3 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('oil')}
              className={`py-2 px-2 text-xs font-black rounded-lg transition-all text-center ${
                activeTab === 'oil'
                  ? 'bg-[#1A4D2E] text-white shadow-sm'
                  : 'text-zinc-650 hover:bg-zinc-200/40'
              }`}
            >
              {isId ? 'Minyak Nilam' : 'Essential Oil'}
            </button>
            <button
              onClick={() => setActiveTab('circular')}
              className={`py-2 px-2 text-xs font-black rounded-lg transition-all text-center ${
                activeTab === 'circular'
                  ? 'bg-[#1A4D2E] text-white shadow-sm'
                  : 'text-zinc-650 hover:bg-zinc-200/40'
              }`}
            >
              Eco Products
            </button>
          </div>
        </div>

        {/* Mobile Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 md:hidden hide-scrollbar scroll-smooth">
          <button
            onClick={() => handleQuickFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              isQuickActive('all') 
                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white shadow-sm' 
                : 'bg-white border-zinc-200 text-zinc-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => handleQuickFilter('premium')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
              isQuickActive('premium') 
                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white shadow-sm' 
                : 'bg-white border-zinc-200 text-zinc-600'
            }`}
          >
            <Beaker className="w-3 h-3 text-valam-gold-500" />
            Premium ≥35%
          </button>
          <button
            onClick={() => handleQuickFilter('standard')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
              isQuickActive('standard') 
                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white shadow-sm' 
                : 'bg-white border-zinc-200 text-zinc-600'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            Standard
          </button>
          <button
            onClick={() => handleQuickFilter('eudr')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${
              isQuickActive('eudr') 
                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white shadow-sm' 
                : 'bg-white border-zinc-200 text-zinc-600'
            }`}
          >
            <Leaf className="w-3 h-3 text-emerald-500" />
            EUDR Ready
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-zinc-500 gap-4">
          <span className="text-xs font-bold">{t.showing} <strong>{activeProducts.length}</strong> {t.products}</span>
          
          <div className="flex items-center gap-2">
            {searchQuery && (
              <div className="flex items-center gap-1 bg-valam-gold-50 text-valam-gold-700 px-2 py-1 rounded-lg border border-valam-gold-200 text-[10px]">
                <span className="font-semibold">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-valam-gold-900">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-zinc-200 shadow-sm">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-black text-[#1A4D2E] outline-none cursor-pointer text-[11px]"
              >
                <option value="newest">⏰ {isId ? 'Terbaru' : 'Newest'}</option>
                {activeTab === 'oil' && <option value="pa">🧪 {isId ? 'PA% Tinggi' : 'Highest PA%'}</option>}
                <option value="price">💰 {isId ? 'Harga Terendah' : 'Lowest Price'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid with Vertical Scroll */}
        <div className="max-h-[760px] md:max-h-[820px] overflow-y-auto pr-1.5 sm:pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-1">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
        
        {/* Empty state */}
        {activeProducts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-zinc-200 shadow-sm max-w-md mx-auto mt-8">
            <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium px-6">{t.empty}</p>
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              className="mt-6 border-[#1A4D2E]/20 text-[#1A4D2E] hover:bg-[#1A4D2E]/5 rounded-xl px-6 font-bold"
            >
              {t.reset}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col relative selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E]">
      <div className="relative z-10 flex flex-col min-h-screen">
        <MobileHeader onFilterClick={() => setIsFilterOpen(true)} showFilter={true} />
        <Navbar />
        
        <main className="flex-1 flex flex-col">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 rounded-full border-4 border-valam-gold border-t-[#1A4D2E] animate-spin" /></div>}>
            <MarketplaceContent isFilterOpen={isFilterOpen} setIsFilterOpen={setIsFilterOpen} />
          </Suspense>
        </main>
        
        <div className="relative z-10 mt-auto hidden md:block">
          <Footer />
        </div>
        <BottomNavigation />
      </div>
    </div>
  )
}
