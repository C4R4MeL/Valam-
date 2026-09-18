'use client'

import { useState, useMemo, type ComponentType, type ReactNode } from 'react'
import { X, SlidersHorizontal, MapPin, Beaker, ShieldCheck, Check, DollarSign, Archive, Recycle, Factory, Leaf, Map, ChevronDown, ChevronUp } from 'lucide-react'
import { AcehMapFilter } from './AcehMapFilter'
import { DualRangeSlider } from './DualRangeSlider'
import { useLocale } from 'next-intl'

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: any
  setFilters: React.Dispatch<React.SetStateAction<any>>
  onReset: () => void
  productCounts: Record<string, number>
  activeTab: 'oil' | 'circular'
  onTabChange: (tab: 'oil' | 'circular') => void
  products: any[]
}

const DISTRICTS = [
  'Aceh Jaya',
  'Aceh Barat',
  'Nagan Raya',
  'Aceh Selatan',
  'Aceh Tengah',
  'Bener Meriah',
  'Gayo Lues'
]

const QUALITY_TIERS = [
  'Premium',
  'Export Grade',
  'Industrial',
  'Commercial'
] as const

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-lg bg-[#1B5E3A]/10 text-[#1B5E3A] flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <h3 className="text-[11px] uppercase tracking-[0.12em] font-semibold text-zinc-700 leading-none">
        {children}
      </h3>
    </div>
  )
}

function FilterCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_2px_rgba(27,94,58,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function FilterSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters, 
  onReset,
  productCounts,
  activeTab,
  onTabChange,
  products
}: FilterSidebarProps) {
  const locale = useLocale()
  const isId = locale === 'id'
  const [showMap, setShowMap] = useState(false)

  // Dynamic batch counts for distillation methods
  const distillationCounts = useMemo(() => {
    const counts = { 'Uap & Air': 0, 'Uap Langsung': 0, 'Air / Hydro': 0 }
    products.forEach((p: any) => {
      if (p.is_circular) return
      const method = p.distillation_method || (
        parseInt(p.id.substring(0, 8), 16) % 3 === 0 ? 'Uap & Air' :
        parseInt(p.id.substring(0, 8), 16) % 3 === 1 ? 'Uap Langsung' : 'Air / Hydro'
      )
      if (method in counts) {
        counts[method as keyof typeof counts]++
      }
    })
    return counts
  }, [products])

  const toggleRegion = (region: string) => {
    setFilters((prev: any) => ({
      ...prev,
      regions: prev.regions.includes(region) 
        ? prev.regions.filter((r: string) => r !== region) 
        : [...prev.regions, region]
    }))
  }

  const handleQualityTierToggle = (tier: typeof QUALITY_TIERS[number]) => {
    setFilters((prev: any) => ({
      ...prev,
      qualityTier: prev.qualityTier === tier ? null : tier
    }))
  }

  const toggleCircularCategory = (cat: string) => {
    setFilters((prev: any) => ({
      ...prev,
      circularCategories: prev.circularCategories.includes(cat)
        ? prev.circularCategories.filter((c: string) => c !== cat)
        : [...prev.circularCategories, cat]
    }))
  }

  const toggleDistillationMethod = (method: string) => {
    setFilters((prev: any) => ({
      ...prev,
      distillationMethods: prev.distillationMethods.includes(method)
        ? prev.distillationMethods.filter((m: string) => m !== method)
        : [...prev.distillationMethods, method]
      }))
  }

  // Quality Label helper for PA% range
  const getPaQualityLabel = (min: number, max: number) => {
    if (min >= 34) return 'PREMIUM (34%+)'
    if (min >= 30) return 'EXPORT GRADE (30% - 33.5%)'
    if (min >= 26) return 'INDUSTRIAL (26% - 29.5%)'
    return 'COMMERCIAL (<26%)'
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('Rp', 'Rp ')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[300px] bg-[#fbfcfb] border-r border-zinc-200/80 transform transition-transform duration-300 ease-out lg:sticky lg:top-[56px] lg:h-[calc(100vh-3.5rem)] lg:z-10 lg:translate-x-0 lg:shadow-none shadow-2xl shadow-zinc-900/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`} 
      >
        <div className="h-full flex flex-col">
          
          {/* 1. Tab Switcher */}
          <div className="px-3.5 pt-3.5 pb-2.5 bg-[#fbfcfb]">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-zinc-200/80 shadow-sm">
              <button
                onClick={() => onTabChange('oil')}
                className={`py-2 px-2 text-[10px] sm:text-[11px] font-semibold tracking-tight rounded-lg transition-all duration-200 ${
                  activeTab === 'oil'
                    ? 'bg-[#1B5E3A] text-white shadow-sm shadow-[#1B5E3A]/20'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                {isId ? 'Minyak Nilam' : 'Essential Oil'}
              </button>
              <button
                onClick={() => onTabChange('circular')}
                className={`py-2 px-2 text-[10px] sm:text-[11px] font-semibold tracking-tight rounded-lg transition-all duration-200 ${
                  activeTab === 'circular'
                    ? 'bg-[#1B5E3A] text-white shadow-sm shadow-[#1B5E3A]/20'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                Eco Products
              </button>
            </div>
          </div>

          {/* 2. Header */}
          <div className="flex items-center justify-between px-4 py-3 border-y border-zinc-200/70 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#1B5E3A]/10 text-[#1B5E3A] flex items-center justify-center">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-zinc-800">
                {isId ? 'Filter Katalog' : 'Filter Catalog'}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={onReset}
                className="text-[10px] font-semibold text-zinc-500 hover:text-[#1B5E3A] tracking-wide transition-colors px-2 py-1 rounded-md hover:bg-[#1B5E3A]/5"
              >
                {isId ? 'Reset Filter' : 'Reset Filters'}
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="lg:hidden w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/80 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 custom-scrollbar">
            
            {activeTab === 'oil' ? (
              <>
                {/* 3. Filter Quality Tier */}
                <div className="space-y-2.5">
                  <SectionTitle icon={ShieldCheck}>
                    {isId ? 'Tingkat Kualitas' : 'Quality Tier'}
                  </SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {QUALITY_TIERS.map((tier) => {
                      const isSelected = filters.qualityTier === tier
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleQualityTierToggle(tier)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold tracking-tight transition-all duration-200 ${
                            isSelected 
                              ? 'bg-[#1B5E3A] border-[#1B5E3A] text-white shadow-sm shadow-[#1B5E3A]/15' 
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#1B5E3A]/35 hover:bg-[#1B5E3A]/[0.04] hover:text-[#1B5E3A]'
                          }`}
                        >
                          {tier}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Filter PA% */}
                <div className="space-y-2.5">
                  <SectionTitle icon={Beaker}>
                    {isId ? 'Kadar PA%' : 'PA% Content'}
                  </SectionTitle>
                  
                  <FilterCard className="p-3.5">
                    <div className="text-[10px] font-semibold tracking-wide text-[#1B5E3A] bg-[#1B5E3A]/[0.06] border border-[#1B5E3A]/10 rounded-lg px-2.5 py-1 text-center mb-3">
                      {getPaQualityLabel(filters.paMin || 20, filters.paMax || 40)}
                    </div>
                    <DualRangeSlider 
                      min={20} 
                      max={40} 
                      step={0.5} 
                      value={[filters.paMin || 20, filters.paMax || 40]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, paMin: val[0], paMax: val[1] }))}
                      formatLabel={(v) => `${v}%`}
                    />
                  </FilterCard>
                </div>

                {/* 5. Filter Volume */}
                <div className="space-y-2.5">
                  <SectionTitle icon={Archive}>
                    {isId ? 'Volume (Kg)' : 'Volume (Kg)'}
                  </SectionTitle>
                  
                  <FilterCard className="p-3.5">
                    <DualRangeSlider 
                      min={0} 
                      max={5000} 
                      step={50} 
                      value={[filters.minStock || 0, filters.maxStock || 5000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, minStock: val[0], maxStock: val[1] }))}
                      formatLabel={(v) => `${v} Kg`}
                    />
                  </FilterCard>
                </div>

                {/* 6. Filter Harga/kg */}
                <div className="space-y-2.5">
                  <SectionTitle icon={DollarSign}>
                    {isId ? 'Harga / Kg (Rp)' : 'Price / Kg (Rp)'}
                  </SectionTitle>
                  
                  <FilterCard className="p-3.5 pb-4">
                    <DualRangeSlider 
                      min={500000} 
                      max={1500000} 
                      step={10000} 
                      value={[filters.minPrice || 500000, filters.maxPrice || 1500000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, minPrice: val[0], maxPrice: val[1] }))}
                      formatLabel={(v) => formatRupiah(v).replace('Rp ', '')}
                    />
                  </FilterCard>
                </div>

                {/* 7. Filter Metode Penyulingan */}
                <div className="space-y-2.5">
                  <SectionTitle icon={Factory}>
                    {isId ? 'Metode Penyulingan' : 'Distillation'}
                  </SectionTitle>
                  <div className="space-y-1.5">
                    {['Uap & Air', 'Uap Langsung', 'Air / Hydro'].map((method) => {
                      const isSelected = filters.distillationMethods?.includes(method)
                      const count = distillationCounts[method as keyof typeof distillationCounts] || 0
                      return (
                        <div 
                          key={method}
                          onClick={() => toggleDistillationMethod(method)}
                          className={`cursor-pointer transition-all duration-200 rounded-xl border px-3 py-2.5 flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#C8922A]/10 border-[#C8922A]/40 text-[#8a6418] shadow-sm' 
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#C8922A]/30 hover:bg-[#C8922A]/[0.03]'
                          }`}
                        >
                          <span className={`text-[12px] ${isSelected ? 'font-semibold' : 'font-medium'}`}>{method}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 tabular-nums">({count})</span>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#C8922A] text-white' : 'bg-zinc-50 border border-zinc-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 8. Filter Asal Daerah */}
                <div className="space-y-2.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <SectionTitle icon={MapPin}>
                      {isId ? 'Asal Daerah' : 'Origin Terroir'}
                    </SectionTitle>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-[10px] font-semibold text-[#1B5E3A] hover:bg-[#1B5E3A]/5 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                    >
                      <Map className="w-3 h-3" />
                      <span>{showMap ? (isId ? 'Tutup Peta' : 'Hide Map') : (isId ? 'Lihat Peta' : 'View Map')}</span>
                      {showMap ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  <FilterCard className="p-3 space-y-0.5 max-h-[148px] overflow-y-auto hide-scrollbar">
                    {DISTRICTS.map((district) => {
                      const isChecked = filters.regions.includes(district)
                      const count = productCounts[district] || 0
                      return (
                        <div 
                          key={district}
                          onClick={() => toggleRegion(district)}
                          className="flex items-center justify-between py-1.5 px-1.5 rounded-lg cursor-pointer group hover:bg-[#1B5E3A]/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isChecked 
                                ? 'bg-[#1B5E3A] border-[#1B5E3A] text-white' 
                                : 'bg-zinc-50 border-zinc-300 group-hover:border-[#1B5E3A]/45'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-[12px] ${isChecked ? 'font-semibold text-[#1B5E3A]' : 'font-medium text-zinc-600'}`}>
                              {district}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium tabular-nums">({count})</span>
                        </div>
                      )
                    })}
                  </FilterCard>

                  {showMap && (
                    <div className="transition-all duration-300 rounded-2xl overflow-hidden border border-zinc-200/80">
                      <AcehMapFilter 
                        selectedRegions={filters.regions}
                        onToggleRegion={toggleRegion}
                        productCounts={productCounts}
                      />
                    </div>
                  )}
                </div>

                {/* Verification Section */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-200/80">
                  <SectionTitle icon={ShieldCheck}>
                    {isId ? 'Verifikasi' : 'Verification'}
                  </SectionTitle>

                  {[
                    {
                      key: 'gcmsVerified' as const,
                      title: 'GC-MS Verified',
                      descId: 'Telah diuji dengan spektrometri GC-MS',
                      descEn: 'Tested with GC-MS spectrometry',
                    },
                    {
                      key: 'coaOnly' as const,
                      title: 'CoA Available',
                      descId: 'Memiliki sertifikat analisis laboratorium',
                      descEn: 'Lab certificate of analysis uploaded',
                    },
                    {
                      key: 'qrTraceable' as const,
                      title: 'QR Traceability',
                      descId: 'Rantai pasok terlacak via QR Code',
                      descEn: 'QR code supply chain tracking active',
                    },
                  ].map((item) => {
                    const checked = !!filters[item.key]
                    return (
                      <div 
                        key={item.key}
                        className={`cursor-pointer flex gap-2.5 items-start py-2.5 px-3 rounded-xl border shadow-sm transition-all duration-200 ${
                          checked
                            ? 'bg-[#1B5E3A]/[0.04] border-[#1B5E3A]/25'
                            : 'bg-white border-zinc-200/90 hover:border-[#1B5E3A]/25'
                        }`}
                        onClick={() => setFilters((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          checked ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]' : 'bg-zinc-50 border-zinc-300'
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-[12px] font-semibold tracking-tight ${checked ? 'text-[#1B5E3A]' : 'text-zinc-700'}`}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                            {isId ? item.descId : item.descEn}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 9. Filter Sertifikasi */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-200/80">
                  <SectionTitle icon={ShieldCheck}>
                    {isId ? 'Sertifikasi & Kepatuhan' : 'Certifications'}
                  </SectionTitle>

                  <div 
                    className={`cursor-pointer flex gap-2.5 items-start py-2.5 px-3 rounded-xl border shadow-sm transition-all duration-200 ${
                      filters.eudrReady
                        ? 'bg-[#1B5E3A]/[0.04] border-[#1B5E3A]/25'
                        : 'bg-white border-zinc-200/90 hover:border-[#1B5E3A]/25'
                    }`}
                    onClick={() => setFilters((prev: any) => ({ ...prev, eudrReady: !prev.eudrReady }))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                      filters.eudrReady ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      {filters.eudrReady && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-[12px] font-semibold tracking-tight flex items-center gap-1.5 ${filters.eudrReady ? 'text-[#1B5E3A]' : 'text-zinc-700'}`}>
                        EUDR Compliance Ready <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        {isId ? 'Ketertelusuran poligon bebas deforestasi' : 'Deforestation-free geolocation'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Circular Specific Filters */}
                <div className="space-y-2.5">
                  <SectionTitle icon={Recycle}>
                    {isId ? 'Kategori Eco Products' : 'Eco Products Category'}
                  </SectionTitle>
                  <div className="space-y-1.5">
                    {[
                      { key: 'Organic Compost', label: 'Organic Compost' },
                      { key: 'Biochar', label: 'Biochar' },
                      { key: 'Patchouli Hydrosol', label: 'Patchouli Hydrosol' }
                    ].map((cat) => {
                      const isSelected = filters.circularCategories?.includes(cat.key)
                      return (
                        <div 
                          key={cat.key}
                          onClick={() => toggleCircularCategory(cat.key)}
                          className={`cursor-pointer transition-all duration-200 rounded-xl border px-3 py-2.5 flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#1B5E3A] border-[#1B5E3A] text-white shadow-sm shadow-[#1B5E3A]/15' 
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50/40'
                          }`}
                        >
                          <span className={`text-[12px] ${isSelected ? 'font-semibold' : 'font-medium'}`}>{cat.label}</span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#C8922A] text-white' : 'bg-zinc-50 border border-zinc-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Terroir / Map for Circular */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <SectionTitle icon={MapPin}>
                      {isId ? 'Asal Daerah' : 'Origin Terroir'}
                    </SectionTitle>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-[10px] font-semibold text-[#1B5E3A] hover:bg-[#1B5E3A]/5 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                    >
                      <Map className="w-3 h-3" />
                      <span>{showMap ? (isId ? 'Tutup Peta' : 'Hide Map') : (isId ? 'Lihat Peta' : 'View Map')}</span>
                      {showMap ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  <FilterCard className="p-3 space-y-0.5 max-h-[148px] overflow-y-auto hide-scrollbar">
                    {DISTRICTS.map((district) => {
                      const isChecked = filters.regions.includes(district)
                      const count = productCounts[district] || 0
                      return (
                        <div 
                          key={district}
                          onClick={() => toggleRegion(district)}
                          className="flex items-center justify-between py-1.5 px-1.5 rounded-lg cursor-pointer group hover:bg-[#1B5E3A]/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isChecked 
                                ? 'bg-[#1B5E3A] border-[#1B5E3A] text-white' 
                                : 'bg-zinc-50 border-zinc-300 group-hover:border-[#1B5E3A]/45'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-[12px] ${isChecked ? 'font-semibold text-[#1B5E3A]' : 'font-medium text-zinc-600'}`}>
                              {district}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium tabular-nums">({count})</span>
                        </div>
                      )
                    })}
                  </FilterCard>

                  {showMap && (
                    <div className="transition-all duration-300 rounded-2xl overflow-hidden border border-zinc-200/80">
                      <AcehMapFilter 
                        selectedRegions={filters.regions}
                        onToggleRegion={toggleRegion}
                        productCounts={productCounts}
                      />
                    </div>
                  )}
                </div>

                {/* Volume / Stok */}
                <div className="space-y-2.5">
                  <SectionTitle icon={Archive}>
                    {isId ? 'Volume Stok' : 'Available Stock'}
                  </SectionTitle>
                  <FilterCard className="p-3.5">
                    <DualRangeSlider 
                      min={0} 
                      max={10000} 
                      step={100} 
                      value={[filters.circularMinStock || 0, filters.circularMaxStock || 10000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, circularMinStock: val[0], circularMaxStock: val[1] }))}
                      formatLabel={(v) => `${v} Kg/L`}
                    />
                  </FilterCard>
                </div>

                {/* Rentang Harga */}
                <div className="space-y-2.5">
                  <SectionTitle icon={DollarSign}>
                    {isId ? 'Harga per Unit' : 'Price per Unit'}
                  </SectionTitle>
                  <FilterCard className="p-3.5 pb-4">
                    <DualRangeSlider 
                      min={1000} 
                      max={50000} 
                      step={1000} 
                      value={[filters.circularMinPrice || 1000, filters.circularMaxPrice || 50000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, circularMinPrice: val[0], circularMaxPrice: val[1] }))}
                      formatLabel={(v) => formatRupiah(v).replace('Rp ', '')}
                    />
                  </FilterCard>
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="px-3.5 py-2.5 border-t border-zinc-200/80 bg-white/95 backdrop-blur-sm sticky bottom-0 z-10">
            <div className="rounded-xl bg-[#1B5E3A]/[0.05] border border-[#1B5E3A]/10 px-3 py-2 text-center">
              <span className="text-[10px] text-[#1B5E3A]/80 font-semibold tracking-[0.08em] uppercase">
                {isId ? 'Filter diterapkan secara instan' : 'Filters apply instantly'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
