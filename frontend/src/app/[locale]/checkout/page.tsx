'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Factory, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah, validateOrderQuantity } from '@/lib/utils'

export default function CheckoutPage() {
  const { patchouliItems, circularItems, loading, removeItem, fetchCart } = useCart()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Step 1 States
  const [address, setAddress] = useState('')
  const [supplierNotes, setSupplierNotes] = useState<Record<string, string>>({})
  
  // Step 2 States
  const [agreedToEscrow, setAgreedToEscrow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Step 3 States
  const [orderResults, setOrderResults] = useState<{ supplier: string, orderId: string }[]>([])
  
  const router = useRouter()
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  const isId = locale === 'id'

  const searchParams = useSearchParams()
  const isCircular = searchParams.get('type') === 'circular'

  const itemsToCheckout = useMemo(() => {
    return isCircular ? circularItems : patchouliItems
  }, [isCircular, circularItems, patchouliItems])

  // Group items by supplier for review
  const groupedItems = useMemo(() => {
    if (!itemsToCheckout) return {}
    return itemsToCheckout.reduce((acc: any, item: any) => {
      const supplierId = isCircular 
        ? (item.product?.mitra_pengolah_id || 'mitra-unknown') 
        : (item.product?.supplier_id || 'sup-unknown')
      
      const supplierName = isCircular 
        ? (item.product?.mitra_pengolah_nama || 'Mitra Pengolah') 
        : (item.product?.supplier_name || 'Koperasi Mitra')

      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierName,
          items: [],
          totalSubtotal: 0,
          totalKg: 0
        }
      }
      acc[supplierId].items.push(item)
      acc[supplierId].totalSubtotal += item.subtotal
      acc[supplierId].totalKg += item.quantity_kg
      return acc
    }, {} as Record<string, { supplierName: string, items: any[], totalSubtotal: number, totalKg: number }>)
  }, [itemsToCheckout, isCircular])

  // Redirect if cart empty on load (only if not already submitted)
  useEffect(() => {
    if (!loading && (!itemsToCheckout || itemsToCheckout.length === 0) && step !== 3) {
      toast({ title: 'Keranjang Kosong', description: 'Silakan pilih produk terlebih dahulu.', variant: 'destructive' })
      router.push('/cart')
    }
  }, [loading, itemsToCheckout, step, router, toast])

  const handleNextToReview = () => {
    if (!address.trim()) {
      toast({ title: 'Alamat Wajib Diisi', description: 'Silakan isi alamat pengiriman Anda.', variant: 'destructive' })
      return
    }
    setStep(2)
  }

  const handleSubmitOrder = async () => {
    if (!agreedToEscrow) return
    setIsSubmitting(true)
    
    // DOUBLE-CHECK Validasi (Simulasi validasi keamanan di level Backend sebelum proses pembayaran)
    const invalidItem = itemsToCheckout?.find((item: any) => {
      const minOrder = isCircular ? item.product.min_order : item.product.moq_kg
      const stock = isCircular ? item.product.stok_tersedia : item.product.available_volume_kg
      const v = validateOrderQuantity(item.quantity_kg, minOrder || 1, stock)
      return !v.valid
    })
    if (invalidItem) {
      toast({ 
        title: 'Validasi Gagal', 
        description: isCircular 
          ? `Produk ${invalidItem.product.nama} melanggar batas stok/min order. Silakan sesuaikan kembali di Keranjang.`
          : `Batch ${invalidItem.product.batch_code} melanggar batas stok/min order. Silakan sesuaikan kembali di Keranjang.`,
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    // TODO: Integrasi sesungguhnya dengan payment gateway (contoh: Midtrans Snap)
    // TODO: Endpoint backend untuk Split Order per supplier
    // Saat ini disimulasikan sukses dan memecah order secara statis:
    
    setTimeout(async () => {
      const results = Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => ({
        supplier: group.supplierName,
        orderId: isCircular 
          ? `ORD-CIRC-${supplierId.substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 10000)}`
          : `ORD-${group.supplierName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`
      }))
      
      setOrderResults(results)
      
      // Kosongkan HANYA state cart produk sirkular (jika sirkular) atau minyak nilam (jika nilam)
      if (isCircular) {
        for (const item of circularItems) {
          await removeItem(item.id)
        }
      } else {
        for (const item of patchouliItems) {
          await removeItem(item.id)
        }
      }
      await fetchCart() // Refresh state
      
      setIsSubmitting(false)
      setStep(3)
    }, 1500)
  }

  if (loading && step !== 3) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 pb-20">
      {/* Header Minimalis */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 2 && !isCircular ? (
              <button onClick={() => setStep(1)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : step === 1 ? (
              <Link href="/cart" className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : <div className="w-9 h-9" /> /* Placeholder align for step 3 */}
            <h1 className="font-serif font-bold text-xl text-[#1A4D2E]">Checkout</h1>
          </div>
          {/* Desktop Progress Indicator */}
          {!isCircular ? (
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-zinc-400">
              <span className={step === 1 ? 'text-[#1A4D2E]' : 'text-zinc-400'}>1. Pengiriman</span>
              <span className="w-4 h-px bg-zinc-300" />
              <span className={step === 2 ? 'text-[#1A4D2E]' : 'text-zinc-400'}>2. Review & Bayar</span>
              <span className="w-4 h-px bg-zinc-300" />
              <span className={step === 3 ? 'text-[#1A4D2E]' : 'text-zinc-400'}>3. Selesai</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-zinc-400">
              <span className={step === 1 ? 'text-[#B69A1D]' : 'text-zinc-400'}>1. Ringkasan & Pembayaran</span>
              <span className="w-4 h-px bg-zinc-300" />
              <span className={step === 3 ? 'text-[#B69A1D]' : 'text-zinc-400'}>2. Selesai</span>
            </div>
          )}
          {/* Mobile Progress Indicator */}
          <div className={`md:hidden flex items-center px-3 py-1.5 rounded-full border ${isCircular ? 'bg-[#B69A1D]/5 border-[#B69A1D]/10' : 'bg-[#1A4D2E]/5 border-[#1A4D2E]/10'}`}>
            <span className={`text-[10px] font-bold ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>
              {isCircular 
                ? (isId ? `Langkah ${step === 3 ? 2 : 1} dari 2` : `Step ${step === 3 ? 2 : 1} of 2`)
                : (isId ? `Langkah ${step} dari 3` : `Step ${step} of 3`)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 w-full mt-8">
        
        {!isCircular && step === 1 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-serif font-black">{isId ? 'Informasi Pengiriman' : 'Shipping Information'}</h2>
            
            {/* Form Alamat */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#1A4D2E] font-bold">
                <MapPin className="w-5 h-5" />
                <h3>{isId ? 'Alamat Tujuan' : 'Destination Address'}</h3>
              </div>
              <Textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isId ? 'Masukkan alamat lengkap gudang/penerima...' : 'Enter complete warehouse/recipient address...'}
                className="min-h-[120px] rounded-xl border-zinc-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E]/20 resize-none text-sm"
              />
              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {isId ? 'Mendukung pengiriman multi-alamat di masa mendatang.' : 'Multi-address shipping support coming soon.'}
              </p>
            </div>

             {/* Catatan Per Supplier */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-[#1A4D2E] font-bold border-b border-zinc-100 pb-3">
                <Factory className="w-5 h-5" />
                <h3>{isId ? 'Catatan per Koperasi (Opsional)' : 'Notes per Cooperative (Optional)'}</h3>
              </div>
              
              {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                <div key={supplierId} className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">{isId ? `Catatan Tambahan untuk ${group.supplierName}` : `Additional Note for ${group.supplierName}`} (Opsional)</label>
                  <Textarea 
                    value={supplierNotes[supplierId] || ''}
                    onChange={e => setSupplierNotes({...supplierNotes, [supplierId]: e.target.value})}
                    placeholder={isId ? `Pesan khusus untuk ${group.supplierName}...` : `Special request for ${group.supplierName}...`}
                    className="min-h-[80px] rounded-xl text-sm border-zinc-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E]/20 resize-none"
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={handleNextToReview}
              className="w-full h-14 rounded-2xl bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold text-base shadow-md shadow-[#1A4D2E]/20 transition-transform hover:scale-[1.01]"
            >
              {isId ? 'Lanjut ke Review Pembayaran' : 'Proceed to Payment Review'}
            </Button>
          </div>
        )}

        {isCircular && step === 1 && (
          <div className="grid md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Kolom Kiri: Alamat + Review Item per Mitra */}
            <div className="md:col-span-7 space-y-6">
              <h2 className="text-2xl font-serif font-black">{isId ? 'Informasi Pengiriman' : 'Shipping Information'}</h2>
              
              {/* Form Alamat */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#B69A1D] font-bold">
                  <MapPin className="w-5 h-5" />
                  <h3>{isId ? 'Alamat Tujuan' : 'Destination Address'}</h3>
                </div>
                <Textarea 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={isId ? 'Masukkan alamat lengkap penerima...' : 'Enter complete shipping address...'}
                  className="min-h-[100px] rounded-xl border-zinc-200 focus:border-[#B69A1D] focus:ring-[#B69A1D]/20 resize-none text-sm"
                />
              </div>

              {/* Ringkasan Item per Mitra */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 font-serif">{isId ? 'Ringkasan Item per Mitra Pengolah' : 'Item Summary per Processor Partner'}</h3>
                {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                  <div key={supplierId} className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#B69A1D]/10 flex items-center justify-center text-[#B69A1D]">
                          <Factory className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                      </div>
                      <span className="text-xs font-bold text-[#B69A1D] bg-[#B69A1D]/10 px-2.5 py-1 rounded-md">{group.totalKg} Unit</span>
                    </div>
                    
                    <div className="space-y-3">
                      {group.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div>
                            <p className="font-bold text-zinc-800">{item.product.nama}</p>
                            <p className="text-xs text-zinc-400 font-medium">Jenis: {item.product.jenis} ({item.quantity_kg} {item.product.unit || 'Unit'})</p>
                            {(item.sumber_batch_id || item.product.sumber_batch_id) && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                Dari ampas batch #{item.sumber_batch_id || item.product.sumber_batch_id}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-zinc-900">{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-550">{isId ? `Subtotal ${group.supplierName}` : `${group.supplierName} Subtotal`}</span> 
                      <span className="font-black text-[#B69A1D]">{formatRupiah(group.totalSubtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Summary, Pembayaran Escrow Domestik, Button */}
            <div className="md:col-span-5">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm md:sticky md:top-24 space-y-6">
                <h3 className="font-bold text-lg font-serif border-b border-zinc-100 pb-3">{isId ? 'Total Ringkasan' : 'Total Summary'}</h3>
                
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-500">{isId ? 'Total Tagihan' : 'Grand Total'}</span>
                  <span className="text-3xl font-black text-[#B69A1D]">{formatRupiah(itemsToCheckout?.reduce((acc: number, item: any) => acc + item.subtotal, 0) || 0)}</span>
                </div>

                {/* Info Escrow Domestik */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                  <div className="flex items-center gap-2 text-[#B69A1D] font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    <h4>{isId ? 'Pembayaran Transaksi VALAM' : 'VALAM Transaction Payment'}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {isId 
                      ? 'Dana pembayaran produk turunan akan langsung diproses ke rekening Mitra Pengolah untuk mempercepat pengiriman lokal domestik.'
                      : 'Payment for derivative products will be processed directly to the Processor Partner to expedite local domestic shipment.'}
                  </p>
                </div>

                {/* Syarat & Ketentuan Checkbox */}
                <label className="flex items-start gap-3 p-3 bg-white border-2 border-zinc-100 hover:border-[#B69A1D]/30 rounded-xl cursor-pointer transition-colors group">
                  <input 
                    type="checkbox" 
                    checked={agreedToEscrow}
                    onChange={(e) => setAgreedToEscrow(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#B69A1D] rounded border-zinc-300 focus:ring-[#B69A1D]"
                  />
                  <span className="text-xs font-semibold text-zinc-650 group-hover:text-zinc-900 transition-colors leading-relaxed">
                    {isId ? 'Saya setuju dengan syarat & ketentuan transaksi VALAM.' : 'I agree to the VALAM transaction terms & conditions.'}
                  </span>
                </label>

                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!address.trim() || !agreedToEscrow || isSubmitting}
                  className="w-full h-14 rounded-2xl bg-[#B69A1D] hover:bg-[#A38618] text-white font-bold text-base shadow-lg shadow-[#B69A1D]/20 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none transition-all"
                >
                  {isSubmitting ? (isId ? 'Memproses...' : 'Processing...') : (isId ? 'Bayar & Selesaikan Pesanan' : 'Pay & Complete Order')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isCircular && step === 2 && (
          <div className="grid md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="md:col-span-7 space-y-6">
              <h2 className="text-2xl font-serif font-black">{isId ? 'Review Pesanan' : 'Order Review'}</h2>
              
              {/* Ringkasan per Supplier */}
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                  <div key={supplierId} className="bg-zinc-50 rounded-2xl border border-zinc-100 p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-200/60 justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCircular ? 'bg-[#B69A1D]/10 text-[#B69A1D]' : 'bg-[#1A4D2E]/10 text-[#1A4D2E]'}`}>
                          <Factory className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCircular ? 'bg-[#B69A1D]/10 text-[#B69A1D]' : 'bg-[#1A4D2E]/10 text-[#1A4D2E]'}`}>{group.totalKg} {isCircular ? 'Unit' : 'kg'}</span>
                    </div>
                    <div className="p-1 space-y-3">
                      {group.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-zinc-600">
                            {isCircular ? item.product.nama : `Batch ${item.product.batch_code}`} 
                            <span className="text-zinc-400 text-xs"> ({item.quantity_kg}{isCircular ? item.product.unit || 'Unit' : 'kg'})</span>
                          </span>
                          <span className="font-bold text-zinc-900">{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                      {supplierNotes[supplierId] && (
                        <div className="mt-4 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 text-xs text-amber-800">
                          <strong className="block mb-0.5 text-[10px] uppercase tracking-wider">Catatan Buyer:</strong> 
                          {supplierNotes[supplierId]}
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-zinc-200/60 flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-500">{isId ? `Subtotal ${group.supplierName}` : `${group.supplierName} Subtotal`}</span> 
                      <span className={`font-black ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(group.totalSubtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm md:sticky md:top-24 space-y-6">
                <h3 className="font-bold text-lg font-serif border-b border-zinc-100 pb-3">{isId ? 'Total Tagihan' : 'Total Amount'}</h3>
                
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-500">{isId ? 'Total Keseluruhan' : 'Grand Total'}</span>
                  <span className={`text-3xl font-black ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(itemsToCheckout?.reduce((acc: number, item: any) => acc + item.subtotal, 0) || 0)}</span>
                </div>

                {/* Info Escrow */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                  <div className={`flex items-center gap-2 font-bold ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>
                    <ShieldCheck className="w-5 h-5" />
                    <h4>{isCircular 
                      ? (isId ? 'Pembayaran Transaksi VALAM' : 'VALAM Transaction Payment')
                      : (isId ? 'Pembayaran Escrow VALAM' : 'VALAM Escrow Payment')}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {isCircular 
                      ? (isId 
                          ? 'Dana pembayaran produk turunan akan langsung diproses ke rekening Mitra Pengolah untuk mempercepat pengiriman lokal domestik.'
                          : 'Payment for derivative products will be processed directly to the Processor Partner to expedite local domestic shipment.')
                      : (isId 
                          ? 'Dana akan ditahan dengan aman oleh platform dan baru diteruskan ke masing-masing koperasi setelah Anda mengonfirmasi penerimaan batch.'
                          : 'Funds will be securely held by the platform and released to cooperatives only after you confirm batch receipt.')}
                  </p>
                </div>

                {/* Syarat & Ketentuan Checkbox */}
                <label className={`flex items-start gap-3 p-3 bg-white border-2 border-zinc-100 rounded-xl cursor-pointer transition-colors group ${isCircular ? 'hover:border-[#B69A1D]/30' : 'hover:border-[#1A4D2E]/30'}`}>
                  <input 
                    type="checkbox" 
                    checked={agreedToEscrow}
                    onChange={(e) => setAgreedToEscrow(e.target.checked)}
                    className={`mt-0.5 w-4 h-4 rounded border-zinc-300 ${isCircular ? 'text-[#B69A1D] focus:ring-[#B69A1D]' : 'text-[#1A4D2E] focus:ring-[#1A4D2E]'}`}
                  />
                  <span className="text-xs font-semibold text-zinc-600 group-hover:text-zinc-900 transition-colors leading-relaxed">
                    {isCircular 
                      ? (isId ? 'Saya setuju dengan syarat & ketentuan transaksi VALAM.' : 'I agree to the VALAM transaction terms & conditions.')
                      : (isId ? 'Saya setuju dengan syarat & ketentuan escrow VALAM untuk transaksi ini.' : 'I agree to the VALAM escrow terms & conditions for this transaction.')}
                  </span>
                </label>

                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!agreedToEscrow || isSubmitting}
                  className={`w-full h-14 rounded-2xl font-black text-base transition-all disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none ${
                    isCircular
                      ? 'bg-[#B69A1D] hover:bg-[#A38618] text-white shadow-lg shadow-[#B69A1D]/20'
                      : 'bg-[#B69A1D] hover:bg-[#A38618] text-[#1A4D2E] shadow-lg shadow-[#B69A1D]/20'
                  }`}
                >
                  {isSubmitting ? (isId ? 'Memproses...' : 'Processing...') : (isId ? 'Bayar Sekarang' : 'Pay Now')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xl mx-auto mt-10">
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-xl shadow-zinc-200/50 text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-serif font-black text-zinc-900 mb-2">
                {isId ? 'Pesanan Berhasil!' : 'Order Successful!'}
              </h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">
                {isCircular
                  ? (isId ? 'Pesanan produk turunan Anda telah dikirim langsung ke Mitra Pengolah terkait.' : 'Your derivative product order has been sent directly to the corresponding Processor Partner.')
                  : (isId ? 'Pesanan Anda telah kami pecah berdasarkan koperasi untuk mempermudah proses logistik.' : 'Your order has been split by cooperative to simplify logistics.')}
              </p>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 text-left space-y-4 mb-8">
                <h4 className="font-bold text-sm text-zinc-900 border-b border-zinc-200 pb-2">
                  {isId ? 'Referensi Pesanan Anda:' : 'Your Order References:'}
                </h4>
                <div className="space-y-3">
                  {orderResults.map(res => (
                    <div key={res.orderId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">{res.supplier}</p>
                        <p className="font-mono font-bold text-emerald-700 text-sm">{res.orderId}</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase shrink-0">
                        {isId ? 'Menunggu Proses' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button asChild className="w-full h-14 rounded-2xl bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold text-base shadow-md">
                <Link href={isCircular ? "/dashboard/buyer/orders" : "/dashboard/buyer/orders"}>
                  {isId ? 'Lihat Status Pesanan' : 'View Order Status'}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
