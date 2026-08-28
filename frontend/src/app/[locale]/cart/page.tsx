'use client'

import React, { useMemo, useState } from 'react'
import { Trash2, Plus, Minus, ShoppingCart, ShoppingBag, ShieldCheck, ChevronRight, AlertCircle, MapPin, Factory } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Navbar } from '@/components/layout/Navbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Footer } from '@/components/layout/Footer'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah, getPatchouliTier, getTierColorClass, validateOrderQuantity } from '@/lib/utils'

export default function CartPage() {
  const { patchouliItems, circularItems, loading, updateQuantity, removeItem } = useCart()
  const router = useRouter()
  const locale = useLocale() as 'id' | 'en'
  const isId = locale === 'id'

  const [activeTab, setActiveTab] = useState<'patchouli' | 'circular'>('patchouli')

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    return activeTab === 'circular' ? circularItems : patchouliItems
  }, [patchouliItems, circularItems, activeTab])

  // Helper to get grouped items
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc: any, item: any) => {
      const supplierId = activeTab === 'circular' 
        ? (item.product?.mitra_pengolah_id || 'mitra-unknown') 
        : (item.product?.supplier_id || 'sup-unknown')
      
      const supplierName = activeTab === 'circular' 
        ? (item.product?.mitra_pengolah_nama || 'Mitra Pengolah') 
        : (item.product?.supplier_name || 'Koperasi Mitra')

      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierName,
          items: [],
          location: activeTab === 'circular' ? 'Lokal Domestik' : `${item.product?.origin_district || 'Aceh'}, Indonesia`,
          rating: 4.8,
          totalSubtotal: 0,
          totalKg: 0
        }
      }
      acc[supplierId].items.push(item)
      acc[supplierId].totalSubtotal += item.subtotal
      acc[supplierId].totalKg += item.quantity_kg
      return acc
    }, {} as Record<string, { supplierName: string, items: any[], location: string, rating: number, totalSubtotal: number, totalKg: number }>)
  }, [filteredItems, activeTab])

  const totalWeight = filteredItems.reduce((acc: number, item: any) => acc + item.quantity_kg, 0) || 0
  const totalSuppliers = Object.keys(groupedItems).length
  const totalBatches = filteredItems.length || 0

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((acc: number, item: any) => acc + item.subtotal, 0)
  }, [filteredItems])

  // Check validation
  const hasValidationError = useMemo(() => {
    return filteredItems.some((item: any) => {
      const minOrder = activeTab === 'circular' ? item.product.min_order : item.product.moq_kg
      const stock = activeTab === 'circular' ? item.product.stok_tersedia : item.product.available_volume_kg
      const v = validateOrderQuantity(item.quantity_kg, minOrder || 1, stock)
      return !v.valid
    })
  }, [filteredItems, activeTab])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E] font-sans pb-24 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileHeader title={isId ? 'Keranjang' : 'Cart'} showFilter={false} />

      {/* Mobile Tab Switcher Horizontal */}
      <div className="md:hidden fixed top-12 left-0 right-0 bg-white border-b border-zinc-200 z-40 px-4 py-2 flex gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('patchouli')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
            activeTab === 'patchouli' 
              ? 'bg-[#1A4D2E]/5 border-[#1A4D2E] text-[#1A4D2E]' 
              : 'bg-white border-zinc-200 text-zinc-550'
          }`}
        >
          <span>Minyak Nilam</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
            activeTab === 'patchouli' ? 'bg-[#1A4D2E] text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {patchouliItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('circular')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
            activeTab === 'circular' 
              ? 'bg-[#B69A1D]/10 border-[#B69A1D] text-[#B69A1D]' 
              : 'bg-white border-zinc-200 text-zinc-550'
          }`}
        >
          <span>Circular Economy</span>
          <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
            activeTab === 'circular' ? 'bg-[#B69A1D] text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {circularItems.length}
          </span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full mt-[108px] md:mt-20">
        
        {/* Breadcrumb */}
        <div className="text-xs font-semibold text-zinc-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A4D2E] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-800">{isId ? 'Keranjang' : 'Cart'}</span>
        </div>

        {/* TAB SYSTEM */}
        <div className="hidden md:flex bg-zinc-200/50 p-1 rounded-xl w-full max-w-md mb-8">
          <button
            onClick={() => setActiveTab('patchouli')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'patchouli' ? 'bg-white text-[#1A4D2E] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            <span>Minyak Nilam</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'patchouli' ? 'bg-[#1A4D2E] text-white' : 'bg-zinc-200 text-zinc-650'}`}>
              {patchouliItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('circular')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'circular' ? 'bg-white text-[#1B4B27] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            <span>Produk Sirkular Economy</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'circular' ? 'bg-[#B69A1D] text-white' : 'bg-zinc-200 text-zinc-650'}`}>
              {circularItems.length}
            </span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-[#1A4D2E]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-[#1A4D2E]" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 mb-2">
              {activeTab === 'patchouli' 
                ? (isId ? 'Keranjang kamu masih kosong' : 'Your cart is empty')
                : (isId ? 'Keranjang produk sirkular masih kosong' : 'Your circular cart is empty')}
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {activeTab === 'patchouli' 
                ? (isId ? 'Temukan minyak nilam berkualitas dari koperasi terverifikasi di Katalog kami.' : 'Find high-quality patchouli oil from verified cooperatives in our Catalog.')
                : (isId ? 'Beli kompos dan biochar ramah lingkungan dari mitra pengolah kami.' : 'Buy eco-friendly compost and biochar from our processor partners.')}
            </p>
            <Button asChild className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold rounded-xl h-12 px-8 shadow-md hover:scale-[1.02] transition-transform">
              <Link href={activeTab === 'patchouli' ? "/katalog" : "/marketplace?tab=circular"}>
                {activeTab === 'patchouli' 
                  ? (isId ? 'Jelajahi Katalog' : 'Explore Catalog')
                  : (isId ? 'Jelajahi Circular Economy' : 'Explore Circular Economy')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* KOLOM KIRI (~65%) */}
            <div className="lg:col-span-8 space-y-6">
              <h1 className="text-2xl font-serif font-black tracking-wide text-zinc-900 mb-4">{isId ? 'Keranjang Belanja' : 'Shopping Cart'}</h1>
              
              {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                <div key={supplierId} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  
                  {/* Header Group */}
                  <div className="bg-zinc-50 px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                        activeTab === 'circular'
                          ? 'bg-[#B69A1D]/10 text-[#B69A1D] border-[#B69A1D]/20'
                          : 'bg-[#1A4D2E]/10 text-[#1A4D2E] border-[#1A4D2E]/20'
                      }`}>
                        <Factory className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {group.location}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-zinc-200 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-700 flex items-center gap-1 shadow-sm">
                      ⭐ {group.rating}
                    </div>
                  </div>

                  {/* List Batch */}
                  <div className="p-5 space-y-5">
                    {group.items.map((item: any, idx: number) => {
                      const tier = activeTab === 'patchouli' ? getPatchouliTier(item.product.pa_percentage || 0) : null;
                      const tierColor = tier ? getTierColorClass(tier) : '';
                      
                      const minOrder = activeTab === 'circular' ? item.product.min_order : item.product.moq_kg;
                      const stock = activeTab === 'circular' ? item.product.stok_tersedia : item.product.available_volume_kg;
                      const validation = validateOrderQuantity(item.quantity_kg, minOrder || 1, stock);
                      const errorMsg = validation.errorMsg;
                      const hasError = !validation.valid;
                      const unit = activeTab === 'circular' ? item.product.unit || 'Unit' : 'kg';
                      const price = activeTab === 'circular' ? item.product.harga_per_unit : item.product.price_per_kg;

                      return (
                        <div key={item.id}>
                          {idx > 0 && <div className="border-t border-zinc-100 my-5" />}
                          <div className="flex flex-col sm:flex-row gap-5">
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Link href={activeTab === 'circular' ? `/marketplace/product/${item.product.id}` : `/katalog/${item.product.id}`} className="text-lg font-black text-zinc-900 hover:text-[#1A4D2E] transition-colors truncate">
                                      {activeTab === 'circular' ? item.product.nama : `Batch ${item.product.batch_code}`}
                                    </Link>
                                    {tier && (
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${tierColor}`}>
                                        {tier}
                                      </span>
                                    )}
                                    {activeTab === 'circular' && item.product.jenis && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#B69A1D]/30 bg-valam-gold-50 text-[#B69A1D]">
                                        {item.product.jenis}
                                      </span>
                                    )}
                                    {activeTab === 'circular' && (item.sumber_batch_id || item.product.sumber_batch_id) && (
                                      <span className="text-[9px] bg-amber-155 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-250">
                                        Dari ampas batch #{item.sumber_batch_id || item.product.sumber_batch_id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#1A4D2E]">
                                    {formatRupiah(price)}<span className="text-zinc-500 font-medium text-xs">/{unit}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-zinc-400 hover:text-red-500 p-2 -mr-2 -mt-2 transition-colors shrink-0 rounded-lg hover:bg-zinc-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Stepper & Subtotal Row */}
                          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                            <div>
                              <div className="flex items-center bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity_kg - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-12 text-center text-xs font-bold text-zinc-900 border-x border-zinc-200 h-8 flex items-center justify-center">
                                  {item.quantity_kg}
                                </div>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity_kg + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {errorMsg && (
                                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1.5 ml-1">
                                  <AlertCircle className="w-3 h-3" /> {errorMsg}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-0.5">Subtotal</span>
                              <span className="font-black text-[#1A4D2E] text-base">{formatRupiah(item.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Group Subtotal */}
                  <div className={`px-5 py-4 border-t flex justify-between items-center ${
                    activeTab === 'circular'
                      ? 'bg-[#B69A1D]/5 border-[#B69A1D]/10'
                      : 'bg-[#1A4D2E]/5 border-[#1A4D2E]/10'
                  }`}>
                    <span className={`text-xs font-bold ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>
                      {isId ? `Total ${group.supplierName}` : `${group.supplierName} Total`} ({group.totalKg} {activeTab === 'circular' ? group.items[0]?.product?.unit || 'Unit' : 'kg'})
                    </span>
                    <span className={`text-sm font-black ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(group.totalSubtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* KOLOM KANAN (~35%, sticky) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm lg:sticky lg:top-28 space-y-5">
                <h3 className="text-lg font-bold text-zinc-900 font-serif">{isId ? 'Ringkasan Pesanan' : 'Order Summary'}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>{activeTab === 'circular' ? (isId ? 'Jumlah Mitra Pengolah' : 'Total Partners') : (isId ? 'Jumlah Supplier' : 'Total Suppliers')}</span>
                    <span className="font-bold text-zinc-900">{totalSuppliers}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>{activeTab === 'circular' ? (isId ? 'Jumlah Produk' : 'Total Products') : (isId ? 'Jumlah Batch' : 'Total Batches')}</span>
                    <span className="font-bold text-zinc-900">{totalBatches}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>{isId ? 'Total Volume' : 'Total Volume'}</span>
                    <span className="font-bold text-zinc-900">{totalWeight} {activeTab === 'circular' ? (isId ? 'Unit' : 'Units') : 'kg'}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-start gap-2 text-[10px] text-blue-700 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>{isId ? 'Pengiriman akan diproses terpisah per koperasi.' : 'Shipments will be processed separately per cooperative.'}</p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-900">{isId ? 'Total Harga' : 'Total Price'}</span>
                  <span className={`text-2xl font-black leading-none ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(totalAmount)}</span>
                </div>

                <div className="pt-2 hidden lg:block">
                  <Button 
                    onClick={() => router.push(activeTab === 'circular' ? '/checkout?type=circular' : '/checkout')}
                    disabled={hasValidationError}
                    className={`w-full h-12 rounded-xl font-bold text-white text-sm transition-transform disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none ${
                      activeTab === 'circular'
                        ? 'bg-[#B69A1D] hover:bg-[#A38618] shadow-md shadow-[#B69A1D]/20'
                        : 'bg-[#1A4D2E] hover:bg-[#123320] shadow-md shadow-[#1A4D2E]/20'
                    }`}
                  >
                    {activeTab === 'circular' 
                      ? (isId ? 'Checkout Produk Sirkular' : 'Checkout Circular Products')
                      : (isId ? 'Lanjutkan ke Checkout' : 'Proceed to Checkout')}
                  </Button>
                  {hasValidationError && (
                    <p className="text-[10px] text-red-550 text-center font-semibold mt-2">
                      {isId ? 'Perbaiki jumlah pesanan yang melanggar batas stok/min order sebelum melanjutkan.' : 'Fix order quantities violating stock/min order before proceeding.'}
                    </p>
                  )}
                </div>

                {/* Trust Info */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 text-[10px] text-zinc-500 font-medium mt-6">
                  <div className="flex gap-2 items-start justify-center">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`} />
                    <p>
                      {activeTab === 'circular'
                        ? (isId ? 'Pembayaran langsung diteruskan ke rekening Mitra Pengolah terkait.' : 'Payments are directly processed to the corresponding partner.')
                        : (isId ? 'Pembayaran ditahan escrow hingga batch terkonfirmasi buyer.' : 'Payments are held in escrow until batch is confirmed.')}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* STICKY BOTTOM BAR (Mobile Only) */}
      {filteredItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-40 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">{isId ? 'Total Tagihan' : 'Total Amount'}</span>
            <span className="text-lg font-black text-[#1A4D2E] truncate block">{formatRupiah(totalAmount)}</span>
          </div>
          <Button 
            onClick={() => router.push(activeTab === 'circular' ? '/checkout?type=circular' : '/checkout')}
            disabled={hasValidationError}
            className={`flex-1 h-12 rounded-xl font-bold text-sm text-white disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none shrink-0 ${
              activeTab === 'circular'
                ? 'bg-[#B69A1D] hover:bg-[#A38618]'
                : 'bg-[#1A4D2E] hover:bg-[#123320]'
            }`}
          >
            {activeTab === 'circular' 
              ? (isId ? 'Checkout Sirkular' : 'Checkout Circular')
              : (isId ? 'Checkout' : 'Checkout')}
          </Button>
        </div>
      )}

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  )
}
