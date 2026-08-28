'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingCart, ShoppingBag, ShieldCheck, ChevronRight, AlertCircle, MapPin, Factory, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Navbar } from '@/components/layout/Navbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Footer } from '@/components/layout/Footer'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah, getPatchouliTier, getTierColorClass, validateOrderQuantity } from '@/lib/utils'

const getItemImage = (item: any, activeTab: 'patchouli' | 'circular') => {
  if (activeTab === 'circular') {
    const img = item.product?.image || (item.product?.images && item.product.images[0]);
    if (img && !img.includes('placeholder') && !img.includes('premium_oil_dark')) {
      if (img.includes('photo-1605647540924-852290f6b0d5')) return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop";
      if (img.includes('photo-1599599810769-bcde5a160d32')) return "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=300&h=300&fit=crop";
      return img;
    }
    const cat = `${item.product?.category || ''} ${item.product?.nama || ''} ${item.product?.name || ''}`.toLowerCase();
    if (cat.includes('compost') || cat.includes('kompos')) {
      return "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=300&h=300&fit=crop";
    }
    if (cat.includes('biochar') || cat.includes('arang')) {
      return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop";
    }
    if (cat.includes('hydrosol') || cat.includes('hidrosol')) {
      return "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop";
    }
    return "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=300&h=300&fit=crop";
  }

  // Patchouli Oil
  if (item.product?.images && item.product.images.length > 0 && !item.product.images[0].includes('premium_oil_dark')) {
    return item.product.images[0];
  }
  return "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop";
}

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
        ? (item.product?.mitra_pengolah_id || item.product?.supplier_id || 'mitra-sirkular') 
        : (item.product?.supplier_id || 'koperasi-mitra')
      
      const supplierName = activeTab === 'circular' 
        ? (item.product?.mitra_pengolah_nama || item.product?.supplier_name || 'Mitra Sirkular Valam') 
        : (item.product?.supplier_name || 'Koperasi Mitra Valam')

      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierName,
          items: [],
          location: activeTab === 'circular' 
            ? `${item.product?.origin_district || 'Lokal'}, Indonesia`
            : `${item.product?.origin_district || 'Aceh'}, Indonesia`,
          rating: 4.9,
          totalSubtotal: 0,
          totalKg: 0
        }
      }

      const itemPrice = activeTab === 'circular'
        ? (item.product?.harga_per_unit ?? item.product?.price ?? item.product?.price_per_kg ?? 0)
        : (item.product?.price_per_kg ?? item.price ?? 0)
      const subtotal = item.subtotal || (itemPrice * item.quantity_kg)

      acc[supplierId].items.push({ ...item, calculatedSubtotal: subtotal, calculatedPrice: itemPrice })
      acc[supplierId].totalSubtotal += subtotal
      acc[supplierId].totalKg += item.quantity_kg
      return acc
    }, {} as Record<string, { supplierName: string, items: any[], location: string, rating: number, totalSubtotal: number, totalKg: number }>)
  }, [filteredItems, activeTab])

  const totalWeight = filteredItems.reduce((acc: number, item: any) => acc + item.quantity_kg, 0) || 0
  const totalSuppliers = Object.keys(groupedItems).length
  const totalBatches = filteredItems.length || 0

  const totalAmount = useMemo(() => {
    return Object.values(groupedItems).reduce((sum: number, grp: any) => sum + grp.totalSubtotal, 0)
  }, [groupedItems])

  // Check validation
  const hasValidationError = useMemo(() => {
    return filteredItems.some((item: any) => {
      const minOrder = activeTab === 'circular' ? (item.product?.min_order || 1) : (item.product?.moq_kg || 1)
      const stock = activeTab === 'circular' ? (item.product?.stok_tersedia || item.product?.available_volume_kg) : item.product?.available_volume_kg
      const v = validateOrderQuantity(item.quantity_kg, minOrder, stock)
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
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E] font-sans pb-28 lg:pb-12">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileHeader title={isId ? 'Keranjang Belanja' : 'Cart'} showFilter={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full mt-4 md:mt-20">
        
        {/* Breadcrumb */}
        <div className="text-xs font-semibold text-zinc-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#1A4D2E] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-800">{isId ? 'Keranjang' : 'Cart'}</span>
        </div>

        {/* TAB SYSTEM */}
        <div className="bg-zinc-200/60 p-1.5 rounded-2xl w-full max-w-md mb-8 flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('patchouli')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'patchouli' 
                ? 'bg-white text-[#1A4D2E] shadow-sm font-black' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Minyak Nilam</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold transition-colors ${
              activeTab === 'patchouli' ? 'bg-[#1A4D2E] text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {patchouliItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('circular')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'circular' 
                ? 'bg-white text-[#B69A1D] shadow-sm font-black' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Circular Economy</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold transition-colors ${
              activeTab === 'circular' ? 'bg-[#B69A1D] text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {circularItems.length}
            </span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 sm:p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-[#1A4D2E]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-[#1A4D2E]" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 mb-2">
              {activeTab === 'patchouli' 
                ? (isId ? 'Keranjang Minyak Nilam Anda masih kosong' : 'Your patchouli oil cart is empty')
                : (isId ? 'Keranjang Circular Economy masih kosong' : 'Your circular economy cart is empty')}
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {activeTab === 'patchouli' 
                ? (isId ? 'Temukan minyak nilam terverifikasi GC-MS dari koperasi langsung di Katalog kami.' : 'Find verified GC-MS patchouli oil directly from cooperatives in our Catalog.')
                : (isId ? 'Beli pupuk kompos, biochar teraktivasi, dan hidrosol dari mitra pengolah limbah kami.' : 'Purchase organic compost, activated biochar, and hydrosol from circular partners.')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold rounded-xl h-12 px-8 shadow-md">
                <Link href={activeTab === 'patchouli' ? "/katalog" : "/marketplace?tab=circular"}>
                  {activeTab === 'patchouli' 
                    ? (isId ? 'Jelajahi Katalog Nilam' : 'Explore Patchouli Catalog')
                    : (isId ? 'Jelajahi Produk Sirkular' : 'Explore Circular Economy')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* KOLOM KIRI (~65%) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif font-black tracking-wide text-zinc-900">
                  {activeTab === 'circular' ? (isId ? 'Keranjang Produk Sirkular' : 'Circular Economy Cart') : (isId ? 'Keranjang Minyak Nilam' : 'Patchouli Oil Cart')}
                </h1>
                <span className="text-xs font-semibold text-zinc-500">
                  {totalBatches} {activeTab === 'circular' ? (isId ? 'item produk' : 'items') : (isId ? 'batch dipilih' : 'batches')}
                </span>
              </div>
              
              {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                <div key={supplierId} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  
                  {/* Header Group */}
                  <div className="bg-zinc-50/80 px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                        activeTab === 'circular'
                          ? 'bg-[#B69A1D]/10 text-[#B69A1D] border-[#B69A1D]/20'
                          : 'bg-[#1A4D2E]/10 text-[#1A4D2E] border-[#1A4D2E]/20'
                      }`}>
                        <Factory className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {group.location}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-zinc-200 px-2.5 py-1 rounded-xl text-xs font-bold text-zinc-700 flex items-center gap-1 shadow-xs">
                      ⭐ {group.rating}
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="p-5 space-y-6">
                    {group.items.map((item: any, idx: number) => {
                      const tier = activeTab === 'patchouli' ? getPatchouliTier(item.product?.pa_percentage || 0) : null;
                      const tierColor = tier ? getTierColorClass(tier) : '';
                      
                      const minOrder = activeTab === 'circular' ? (item.product?.min_order || 1) : (item.product?.moq_kg || 1);
                      const stock = activeTab === 'circular' ? (item.product?.stok_tersedia ?? item.product?.available_volume_kg) : item.product?.available_volume_kg;
                      const validation = validateOrderQuantity(item.quantity_kg, minOrder, stock);
                      const errorMsg = validation.errorMsg;
                      const unit = activeTab === 'circular' ? (item.product?.unit || 'Unit') : 'kg';
                      const price = item.calculatedPrice;
                      const subtotal = item.calculatedSubtotal;

                      return (
                        <div key={item.id}>
                          {idx > 0 && <div className="border-t border-zinc-100 my-6" />}
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            
                            {/* Product Thumbnail */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200 shadow-xs">
                              <Image
                                src={getItemImage(item, activeTab)}
                                alt={activeTab === 'circular' ? (item.product?.nama || item.product?.name || 'Produk Sirkular') : (item.product?.batch_code || 'Minyak Nilam')}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                                sizes="96px"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Link href={`/katalog/${item.product?.id || item.product_id}`} className="text-base sm:text-lg font-bold text-zinc-900 hover:text-[#1A4D2E] transition-colors truncate">
                                      {activeTab === 'circular' ? (item.product?.nama || item.product?.name || item.product?.batch_code) : `Batch ${item.product?.batch_code || item.batch_code}`}
                                    </Link>
                                    {tier && (
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${tierColor}`}>
                                        {tier}
                                      </span>
                                    )}
                                    {activeTab === 'circular' && (item.product?.category || item.product?.jenis) && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#B69A1D]/30 bg-amber-50 text-[#B69A1D]">
                                        {item.product?.category || item.product?.jenis}
                                      </span>
                                    )}
                                    {activeTab === 'circular' && (item.sumber_batch_id || item.product?.sumber_batch_id) && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                        Dari ampas batch #{item.sumber_batch_id || item.product?.sumber_batch_id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#1A4D2E]">
                                    {formatRupiah(price)}<span className="text-zinc-500 font-normal text-xs">/{unit}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  title={isId ? 'Hapus item' : 'Remove item'}
                                  className="text-zinc-400 hover:text-red-500 p-2 -mr-2 -mt-2 transition-colors shrink-0 rounded-lg hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Stepper & Subtotal Row */}
                              <div className="flex flex-wrap items-center justify-between gap-4 mt-3 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100">
                                <div>
                                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                                    <button 
                                      onClick={() => {
                                        if (item.quantity_kg <= 1) {
                                          removeItem(item.id)
                                        } else {
                                          updateQuantity(item.id, item.quantity_kg - 1)
                                        }
                                      }}
                                      title={item.quantity_kg <= 1 ? (isId ? 'Hapus item' : 'Remove') : (isId ? 'Kurangi' : 'Decrease')}
                                      className={`w-8 h-8 flex items-center justify-center transition-colors ${item.quantity_kg <= 1 ? 'text-red-500 hover:bg-red-50' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                    >
                                      {item.quantity_kg <= 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                    </button>
                                    <div className="px-3 text-center text-xs font-bold text-zinc-900 border-x border-zinc-200 h-8 flex items-center justify-center min-w-[54px]">
                                      {item.quantity_kg} {unit}
                                    </div>
                                    <button 
                                      onClick={() => updateQuantity(item.id, item.quantity_kg + 1)}
                                      title={isId ? 'Tambah' : 'Increase'}
                                      className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {errorMsg && (
                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1.5 ml-1">
                                      <AlertCircle className="w-3 h-3 shrink-0" /> {errorMsg}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-0.5">Subtotal</span>
                                  <span className="font-black text-[#1A4D2E] text-base">{formatRupiah(subtotal)}</span>
                                </div>
                              </div>
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
                    <span>{activeTab === 'circular' ? (isId ? 'Jumlah Mitra' : 'Total Partners') : (isId ? 'Jumlah Koperasi' : 'Total Cooperatives')}</span>
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

                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2 text-[11px] text-blue-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{isId ? 'Pengiriman kargo akan diproses dan dikirim langsung dari lokasi masing-masing mitra.' : 'Cargo shipments are processed and shipped directly from partner locations.'}</p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-900">{isId ? 'Total Tagihan' : 'Total Price'}</span>
                  <span className={`text-2xl font-black leading-none ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(totalAmount)}</span>
                </div>

                <div className="pt-2 hidden lg:block">
                  <Button 
                    onClick={() => router.push(activeTab === 'circular' ? '/checkout?type=circular' : '/checkout')}
                    disabled={hasValidationError || totalBatches === 0}
                    className={`w-full h-12 rounded-xl font-bold text-white text-sm transition-transform cursor-pointer disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none ${
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
                    <p className="text-[10px] text-red-500 text-center font-semibold mt-2">
                      {isId ? 'Perbaiki kuantitas yang melanggar batas stok/min order sebelum checkout.' : 'Adjust quantities violating stock/min order before checkout.'}
                    </p>
                  )}
                </div>

                {/* Trust Info */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 text-[11px] text-zinc-500 font-medium mt-6">
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${activeTab === 'circular' ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`} />
                    <p className="leading-relaxed">
                      {activeTab === 'circular'
                        ? (isId ? 'Pembayaran langsung diteruskan ke rekening resmi Mitra Pengolah terkait.' : 'Payments are directly processed to the corresponding partner.')
                        : (isId ? 'Dana pembayaran ditahan aman di Escrow VALAM hingga barang terkonfirmasi diterima.' : 'Payments are held securely in VALAM Escrow until batch arrival is confirmed.')}
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.08)] z-40 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">{isId ? 'Total Tagihan' : 'Total Amount'}</span>
            <span className="text-lg font-black text-[#1A4D2E] truncate block">{formatRupiah(totalAmount)}</span>
          </div>
          <Button 
            onClick={() => router.push(activeTab === 'circular' ? '/checkout?type=circular' : '/checkout')}
            disabled={hasValidationError || totalBatches === 0}
            className={`flex-1 h-12 rounded-xl font-bold text-sm text-white disabled:bg-zinc-300 disabled:text-zinc-500 shrink-0 ${
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
