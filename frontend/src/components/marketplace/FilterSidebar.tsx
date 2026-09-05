'use client'

import { useState, useMemo } from 'react'
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[305px] bg-white border-r border-zinc-200 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-[56px] lg:h-[calc(100vh-3.5rem)] lg:z-10 lg:translate-x-0 lg:shadow-none shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`} 
      >
        <div className="h-full flex flex-col">
          
          {/* 1. Tab Switcher at the very top */}
          <div className="p-3 bg-zinc-50 border-b border-zinc-200">
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-200/60 rounded-lg">
              <button
                onClick={() => onTabChange('oil')}
                className={`py-1.5 px-2 text-[9px] sm:text-[10px] font-black rounded-md transition-all ${
                  activeTab === 'oil'
                    ? 'bg-[#1A4D2E] text-white shadow-sm'
                    : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200/30'
                }`}
              >
                {isId ? 'Minyak Nilam' : 'Essential Oil'}
              </button>
              <button
                onClick={() => onTabChange('circular')}
                className={`py-1.5 px-2 text-[9px] sm:text-[10px] font-black rounded-md transition-all ${
                  activeTab === 'circular'
                    ? 'bg-[#1A4D2E] text-white shadow-sm'
                    : 'text-zinc-650 hover:text-zinc-950 hover:bg-zinc-200/30'
                }`}
              >
                Eco Products
              </button>
            </div>
          </div>

          {/* 2. Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-150 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-1.5 font-serif text-sm font-bold text-[#1A4D2E]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isId ? 'FILTER KATALOG' : 'FILTER CATALOG'}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onReset}
                className="text-[10px] font-bold text-zinc-500 hover:text-[#1A4D2E] uppercase tracking-wider underline underline-offset-2 transition-colors"
              >
                {isId ? 'Reset Filter' : 'Reset Filters'}
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="lg:hidden w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-zinc-50/20">
            
            {activeTab === 'oil' ? (
              <>
                {/* 3. Filter Quality Tier */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Tingkat Kualitas' : 'Quality Tier'}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUALITY_TIERS.map((tier) => {
                      const isSelected = filters.qualityTier === tier
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleQualityTierToggle(tier)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all duration-200 ${
                            isSelected 
                              ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white shadow-sm' 
                              : 'bg-white border-zinc-200 text-zinc-650 hover:border-[#1A4D2E]/30 hover:bg-[#1A4D2E]/5 hover:text-[#1A4D2E]'
                          }`}
                        >
                          {tier}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Filter PA% */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <Beaker className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Kadar PA%' : 'PA% Content'}</h3>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm">
                    {/* Quality Label above the slider */}
                    <div className="text-[9px] font-bold text-[#1A4D2E] bg-[#1A4D2E]/5 border border-[#1A4D2E]/10 rounded-md px-2 py-0.5 text-center mb-2.5">
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
                  </div>
                </div>

                {/* 5. Filter Volume */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <Archive className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Volume (Kg)' : 'Volume (Kg)'}</h3>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm">
                    <DualRangeSlider 
                      min={0} 
                      max={5000} 
                      step={50} 
                      value={[filters.minStock || 0, filters.maxStock || 5000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, minStock: val[0], maxStock: val[1] }))}
                      formatLabel={(v) => `${v} Kg`}
                    />
                  </div>
                </div>

                {/* 6. Filter Harga/kg */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <DollarSign className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Harga / Kg (Rp)' : 'Price / Kg (Rp)'}</h3>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm pb-4">
                    <DualRangeSlider 
                      min={500000} 
                      max={1500000} 
                      step={10000} 
                      value={[filters.minPrice || 500000, filters.maxPrice || 1500000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, minPrice: val[0], maxPrice: val[1] }))}
                      formatLabel={(v) => formatRupiah(v).replace('Rp ', '')}
                    />
                  </div>
                </div>

                {/* 7. Filter Metode Penyulingan */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <Factory className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Metode Penyulingan' : 'Distillation'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {['Uap & Air', 'Uap Langsung', 'Air / Hydro'].map((method) => {
                      const isSelected = filters.distillationMethods?.includes(method)
                      const count = distillationCounts[method as keyof typeof distillationCounts] || 0
                      return (
                        <div 
                          key={method}
                          onClick={() => toggleDistillationMethod(method)}
                          className={`cursor-pointer transition-all duration-200 rounded-lg border px-3 py-2 flex items-center justify-between ${
                            isSelected 
                              ? 'bg-valam-gold-50 border-valam-gold-300 text-valam-gold-750 font-black' 
                              : 'bg-white border-zinc-200 text-zinc-650 hover:border-valam-gold-200'
                          }`}
                        >
                          <span className="text-xs">{method}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400">({count})</span>
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-valam-gold-500 text-white border-valam-gold-500' : 'bg-zinc-50 border border-zinc-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 8. Filter Asal Daerah */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <MapPin className="w-3.5 h-3.5 text-[#1A4D2E]" />
                      <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Asal Daerah' : 'Origin Terroir'}</h3>
                    </div>
                    {/* Collapsible Map Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-[10px] font-bold text-[#1A4D2E] hover:text-valam-gold transition-colors flex items-center gap-0.5"
                    >
                      <Map className="w-3 h-3" />
                      <span>{showMap ? (isId ? 'Tutup Peta' : 'Hide Map') : (isId ? 'Lihat Peta' : 'View Map')}</span>
                      {showMap ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  {/* Compact Checkbox list (Default view) */}
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm space-y-1.5 max-h-[140px] overflow-y-auto hide-scrollbar">
                    {DISTRICTS.map((district) => {
                      const isChecked = filters.regions.includes(district)
                      const count = productCounts[district] || 0
                      return (
                        <div 
                          key={district}
                          onClick={() => toggleRegion(district)}
                          className="flex items-center justify-between py-0.5 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              isChecked 
                                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white' 
                                : 'bg-zinc-50 border-zinc-300 group-hover:border-[#1A4D2E]/50'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs ${isChecked ? 'font-bold text-[#1A4D2E]' : 'text-zinc-655'}`}>
                              {district}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400 font-medium">({count})</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Collapsible Interactive Map */}
                  {showMap && (
                    <div className="transition-all duration-300">
                      <AcehMapFilter 
                        selectedRegions={filters.regions}
                        onToggleRegion={toggleRegion}
                        productCounts={productCounts}
                      />
                    </div>
                  )}
                </div>

                {/* Verification Section */}
                <div className="space-y-2 pt-3 border-t border-zinc-200">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Verifikasi' : 'Verification'}</h3>
                  </div>

                  {/* GC-MS Verified */}
                  <div 
                    className="cursor-pointer flex gap-2.5 items-start py-2 px-2.5 bg-white border border-zinc-150 hover:border-[#1A4D2E]/20 rounded-xl shadow-sm transition-all"
                    onClick={() => setFilters((prev: any) => ({ ...prev, gcmsVerified: !prev.gcmsVerified }))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      filters.gcmsVerified ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      {filters.gcmsVerified && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="pl-0.5">
                      <h4 className={`text-xs font-bold ${filters.gcmsVerified ? 'text-[#1A4D2E]' : 'text-zinc-700'}`}>
                        GC-MS Verified
                      </h4>
                      <p className="text-[9px] text-zinc-450 mt-0.5 leading-tight">
                        {isId ? 'Telah diuji dengan spektrometri GC-MS' : 'Tested with GC-MS spectrometry'}
                      </p>
                    </div>
                  </div>

                  {/* CoA Available */}
                  <div 
                    className="cursor-pointer flex gap-2.5 items-start py-2 px-2.5 bg-white border border-zinc-150 hover:border-[#1A4D2E]/20 rounded-xl shadow-sm transition-all"
                    onClick={() => setFilters((prev: any) => ({ ...prev, coaOnly: !prev.coaOnly }))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      filters.coaOnly ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      {filters.coaOnly && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="pl-0.5">
                      <h4 className={`text-xs font-bold ${filters.coaOnly ? 'text-[#1A4D2E]' : 'text-zinc-700'}`}>
                        CoA Available
                      </h4>
                      <p className="text-[9px] text-zinc-450 mt-0.5 leading-tight">
                        {isId ? 'Memiliki sertifikat analisis laboratorium' : 'Lab certificate of analysis uploaded'}
                      </p>
                    </div>
                  </div>

                  {/* QR Traceability */}
                  <div 
                    className="cursor-pointer flex gap-2.5 items-start py-2 px-2.5 bg-white border border-zinc-150 hover:border-[#1A4D2E]/20 rounded-xl shadow-sm transition-all"
                    onClick={() => setFilters((prev: any) => ({ ...prev, qrTraceable: !prev.qrTraceable }))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      filters.qrTraceable ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      {filters.qrTraceable && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="pl-0.5">
                      <h4 className={`text-xs font-bold ${filters.qrTraceable ? 'text-[#1A4D2E]' : 'text-zinc-700'}`}>
                        QR Traceability
                      </h4>
                      <p className="text-[9px] text-zinc-450 mt-0.5 leading-tight">
                        {isId ? 'Rantai pasok terlacak via QR Code' : 'QR code supply chain tracking active'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 9. Filter Sertifikasi */}
                <div className="space-y-2 pt-3 border-t border-zinc-200">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Sertifikasi & Kepatuhan' : 'Certifications'}</h3>
                  </div>

                  <div 
                    className="cursor-pointer flex gap-2.5 items-start py-2 px-2.5 bg-white border border-zinc-150 hover:border-[#1A4D2E]/20 rounded-xl shadow-sm transition-all"
                    onClick={() => setFilters((prev: any) => ({ ...prev, eudrReady: !prev.eudrReady }))}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      filters.eudrReady ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      {filters.eudrReady && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="pl-0.5">
                      <h4 className={`text-xs font-bold flex items-center gap-1 ${filters.eudrReady ? 'text-[#1A4D2E]' : 'text-zinc-700'}`}>
                        EUDR Compliance Ready <Leaf className="w-3 h-3 text-emerald-500" />
                      </h4>
                      <p className="text-[9px] text-zinc-450 mt-0.5 leading-tight">
                        {isId ? 'Ketertelusuran poligon bebas deforestasi' : 'Deforestation-free geolocation'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Circular Specific Filters */}
                {/* Kategori Circular */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Recycle className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black text-zinc-800">{isId ? 'Kategori Eco Products' : 'Eco Products Category'}</h3>
                  </div>
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
                          className={`cursor-pointer transition-all duration-200 rounded-lg border p-2.5 flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white font-semibold' 
                              : 'bg-white border-zinc-200 text-zinc-650 hover:border-emerald-200'
                          }`}
                        >
                          <span className="text-xs">{cat.label}</span>
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-valam-gold-500 text-white' : 'bg-zinc-100 border border-zinc-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Terroir / Map for Circular */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <MapPin className="w-3.5 h-3.5 text-[#1A4D2E]" />
                      <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Asal Daerah' : 'Origin Terroir'}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-[10px] font-bold text-[#1A4D2E] hover:text-valam-gold transition-colors flex items-center gap-0.5"
                    >
                      <Map className="w-3 h-3" />
                      <span>{showMap ? (isId ? 'Tutup Peta' : 'Hide Map') : (isId ? 'Lihat Peta' : 'View Map')}</span>
                      {showMap ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm space-y-1.5 max-h-[140px] overflow-y-auto hide-scrollbar">
                    {DISTRICTS.map((district) => {
                      const isChecked = filters.regions.includes(district)
                      const count = productCounts[district] || 0
                      return (
                        <div 
                          key={district}
                          onClick={() => toggleRegion(district)}
                          className="flex items-center justify-between py-0.5 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              isChecked 
                                ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white' 
                                : 'bg-zinc-50 border-zinc-300 group-hover:border-[#1A4D2E]/50'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={`text-xs ${isChecked ? 'font-bold text-[#1A4D2E]' : 'text-zinc-655'}`}>
                              {district}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400 font-medium">({count})</span>
                        </div>
                      )
                    })}
                  </div>

                  {showMap && (
                    <div className="transition-all duration-300">
                      <AcehMapFilter 
                        selectedRegions={filters.regions}
                        onToggleRegion={toggleRegion}
                        productCounts={productCounts}
                      />
                    </div>
                  )}
                </div>

                {/* Volume / Stok */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <Archive className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Volume Stok' : 'Available Stock'}</h3>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm">
                    <DualRangeSlider 
                      min={0} 
                      max={10000} 
                      step={100} 
                      value={[filters.circularMinStock || 0, filters.circularMaxStock || 10000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, circularMinStock: val[0], circularMaxStock: val[1] }))}
                      formatLabel={(v) => `${v} Kg/L`}
                    />
                  </div>
                </div>

                {/* Rentang Harga */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <DollarSign className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <h3 className="text-[10px] uppercase tracking-wider font-black">{isId ? 'Harga per Unit' : 'Price per Unit'}</h3>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-zinc-150 shadow-sm pb-4">
                    <DualRangeSlider 
                      min={1000} 
                      max={50000} 
                      step={1000} 
                      value={[filters.circularMinPrice || 1000, filters.circularMaxPrice || 50000]}
                      onChange={(val) => setFilters((prev: any) => ({ ...prev, circularMinPrice: val[0], circularMaxPrice: val[1] }))}
                      formatLabel={(v) => formatRupiah(v).replace('Rp ', '')}
                    />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Minimal thin footer */}
          <div className="py-2 border-t border-zinc-150 bg-white sticky bottom-0 z-10 text-center">
            <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">
              {isId ? 'Filter diterapkan secara instan' : 'Filters apply instantly'}
            </span>
          </div>

        </div>
      </div>
    </>
  )
}
