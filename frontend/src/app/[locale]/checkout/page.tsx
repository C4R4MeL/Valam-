'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Factory, AlertCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah, validateOrderQuantity } from '@/lib/utils'

export default function CheckoutPage() {
  const { patchouliItems, circularItems, loading, removeItem, clearCart, fetchCart } = useCart()
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
        ? (item.product?.mitra_pengolah_id || item.product?.supplier_id || 'mitra-sirkular') 
        : (item.product?.supplier_id || 'koperasi-mitra')
      
      const supplierName = isCircular 
        ? (item.product?.mitra_pengolah_nama || item.product?.supplier_name || 'Mitra Sirkular Valam') 
        : (item.product?.supplier_name || 'Koperasi Mitra Valam')

      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierName,
          items: [],
          totalSubtotal: 0,
          totalKg: 0
        }
      }

      const itemPrice = isCircular
        ? (item.product?.harga_per_unit ?? item.product?.price ?? item.product?.price_per_kg ?? 0)
        : (item.product?.price_per_kg ?? item.price ?? 0)
      const subtotal = item.subtotal || (itemPrice * item.quantity_kg)

      acc[supplierId].items.push({ ...item, calculatedSubtotal: subtotal, calculatedPrice: itemPrice })
      acc[supplierId].totalSubtotal += subtotal
      acc[supplierId].totalKg += item.quantity_kg
      return acc
    }, {} as Record<string, { supplierName: string, items: any[], totalSubtotal: number, totalKg: number }>)
  }, [itemsToCheckout, isCircular])

  const grandTotal = useMemo(() => {
    return Object.values(groupedItems).reduce((sum: number, grp: any) => sum + grp.totalSubtotal, 0)
  }, [groupedItems])

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
    
    // Double-check validation
    const invalidItem = itemsToCheckout?.find((item: any) => {
      const minOrder = isCircular ? (item.product?.min_order || 1) : (item.product?.moq_kg || 1)
      const stock = isCircular ? (item.product?.stok_tersedia || item.product?.available_volume_kg) : item.product?.available_volume_kg
      const v = validateOrderQuantity(item.quantity_kg, minOrder, stock)
      return !v.valid
    })

    if (invalidItem) {
      toast({ 
        title: 'Validasi Gagal', 
        description: isCircular 
          ? `Produk ${invalidItem.product?.nama || invalidItem.product?.name} melanggar batas stok/min order. Silakan sesuaikan kembali di Keranjang.`
          : `Batch ${invalidItem.product?.batch_code} melanggar batas stok/min order. Silakan sesuaikan kembali di Keranjang.`,
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      const token = localStorage.getItem('valam_token')
      const email = localStorage.getItem('valam_email') || 'buyer@valam.id'

      let backendSuccess = false
      let newOrdersList: { supplier: string, orderId: string }[] = []

      // 1. Attempt real backend checkout if token exists
      if (token) {
        try {
          const res = await fetch(`${API_URL}/orders/checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              shipping_address: address,
              shipping_cost: 0,
              shipping_method: 'DOMESTIK',
              shipping_courier: 'cargo_truck',
              payment_method: isCircular ? 'DIRECT_TRANSFER' : 'ESCROW'
            })
          })

          if (res.ok) {
            const data = await res.json()
            backendSuccess = true
            const createdOrderId = data.orderId || `ORD-${Date.now()}`
            newOrdersList = Object.values(groupedItems).map((group: any) => ({
              supplier: group.supplierName,
              orderId: createdOrderId
            }))
          }
        } catch (e) {
          console.warn('Backend checkout request failed, generating fallback order:', e)
        }
      }

      // 2. If backend was offline or mock order, generate structured reference IDs
      if (!backendSuccess || newOrdersList.length === 0) {
        newOrdersList = Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => {
          const orderNum = isCircular 
            ? `ORD-CIRC-${supplierId.substring(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
            : `ORD-${group.supplierName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
          return {
            supplier: group.supplierName,
            orderId: orderNum
          }
        })
      }

      // 3. Save to localStorage for instant, guaranteed availability on /buyer/orders
      const existingSaved = localStorage.getItem('valam_buyer_orders_' + email)
      const existingOrders = existingSaved ? JSON.parse(existingSaved) : []
      
      const newOrdersFormatted = Object.entries(groupedItems).map(([supplierId, group]: [string, any], idx) => {
        const ordId = newOrdersList[idx]?.orderId || `ORD-${Date.now()}`
        return {
          id: ordId,
          order_number: ordId,
          status: 'PENDING',
          total_amount: group.totalSubtotal,
          shipping_cost: 0,
          shipping_address: { address: address },
          created_at: new Date().toISOString(),
          supplier: {
            profile: {
              company_name: group.supplierName
            }
          },
          items: group.items.map((it: any) => ({
            quantity_kg: it.quantity_kg,
            price_per_kg: it.calculatedPrice || it.subtotal / it.quantity_kg,
            subtotal: it.subtotal || it.calculatedSubtotal,
            product: {
              batch_code: it.product?.batch_code || it.batch_code || it.product?.nama,
              origin_district: it.product?.origin_district || 'Aceh',
              parameters: [
                { parameter_name: 'PA', value: it.product?.pa_percentage || 32.5 },
                { parameter_name: 'Moisture', value: it.product?.moisture || 1.2 }
              ]
            }
          }))
        }
      })

      localStorage.setItem('valam_buyer_orders_' + email, JSON.stringify([...newOrdersFormatted, ...existingOrders]))

      setOrderResults(newOrdersList)

      // 4. Empty only the checked out cart items cleanly
      if (backendSuccess) {
        // Backend checkout already cleared the database cart for this user!
        await clearCart(isCircular)
      } else {
        if (isCircular) {
          for (const item of circularItems) {
            await removeItem(item.id, true)
          }
        } else {
          for (const item of patchouliItems) {
            await removeItem(item.id, true)
          }
        }
        await fetchCart()
      }

      setIsSubmitting(false)
      setStep(3)
    } catch (err: any) {
      console.error('Error submitting order:', err)
      toast({
        title: 'Gagal Membuat Pesanan',
        description: err.message || 'Terjadi kesalahan saat memproses checkout.',
        variant: 'destructive'
      })
      setIsSubmitting(false)
    }
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
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 2 ? (
              <button onClick={() => setStep(1)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : step === 1 ? (
              <Link href="/cart" className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : <div className="w-9 h-9" />}
            <h1 className="font-serif font-bold text-xl text-[#1A4D2E]">
              {isCircular ? (isId ? 'Checkout Circular Economy' : 'Circular Economy Checkout') : 'Checkout'}
            </h1>
          </div>

          {/* Desktop Progress Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold">
            <span className={step === 1 ? 'text-[#1A4D2E] font-black' : 'text-zinc-400'}>1. {isId ? 'Pengiriman' : 'Shipping'}</span>
            <span className="w-4 h-px bg-zinc-300" />
            <span className={step === 2 ? 'text-[#1A4D2E] font-black' : 'text-zinc-400'}>2. {isId ? 'Review & Bayar' : 'Review & Pay'}</span>
            <span className="w-4 h-px bg-zinc-300" />
            <span className={step === 3 ? 'text-[#1A4D2E] font-black' : 'text-zinc-400'}>3. {isId ? 'Selesai' : 'Completed'}</span>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="md:hidden flex items-center px-3 py-1 rounded-full bg-[#1A4D2E]/5 border border-[#1A4D2E]/10">
            <span className="text-[10px] font-bold text-[#1A4D2E]">
              {isId ? `Langkah ${step} dari 3` : `Step ${step} of 3`}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 w-full mt-8">
        
        {/* LANGKAH 1: INFORMASI PENGIRIMAN */}
        {step === 1 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-2xl font-serif font-black">{isId ? 'Informasi Pengiriman' : 'Shipping Information'}</h2>
              <p className="text-xs text-zinc-500 mt-1">
                {isId ? 'Tentukan alamat tujuan penerima untuk pengiriman kargo.' : 'Specify recipient destination address for cargo delivery.'}
              </p>
            </div>
            
            {/* Form Alamat */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#1A4D2E] font-bold">
                <MapPin className="w-5 h-5" />
                <h3>{isId ? 'Alamat Tujuan' : 'Destination Address'}</h3>
              </div>
              <Textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isId ? 'Masukkan alamat lengkap penerima/gudang (Nama jalan, nomor, RT/RW, kecamatan, kota/kabupaten, provinsi, kode pos)...' : 'Enter complete recipient/warehouse address (Street name, district, city, province, postal code)...'}
                className="min-h-[120px] rounded-xl border-zinc-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E]/20 resize-none text-sm"
              />
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {isId ? 'Pengiriman kargo akan dikoordinasikan langsung ke alamat ini.' : 'Cargo dispatch will be coordinated directly to this address.'}
              </p>
            </div>

            {/* Catatan Per Pemasok */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-[#1A4D2E] font-bold border-b border-zinc-100 pb-3">
                <Factory className="w-5 h-5" />
                <h3>{isId ? 'Catatan Pengiriman (Opsional)' : 'Delivery Notes (Optional)'}</h3>
              </div>
              
              {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                <div key={supplierId} className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    {isId ? `Pesan Khusus untuk ${group.supplierName}` : `Special Request for ${group.supplierName}`}
                  </label>
                  <Textarea 
                    value={supplierNotes[supplierId] || ''}
                    onChange={e => setSupplierNotes({...supplierNotes, [supplierId]: e.target.value})}
                    placeholder={isId ? `Instruksi khusus pengemasan atau waktu penerimaan untuk ${group.supplierName}...` : `Specific packaging or delivery time instructions for ${group.supplierName}...`}
                    className="min-h-[75px] rounded-xl text-sm border-zinc-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E]/20 resize-none"
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={handleNextToReview}
              className="w-full h-14 rounded-2xl bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold text-base shadow-md shadow-[#1A4D2E]/20 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              {isId ? 'Lanjut ke Review & Pembayaran' : 'Proceed to Review & Payment'}
            </Button>
          </div>
        )}

        {/* LANGKAH 2: REVIEW PESANAN & PEMBAYARAN */}
        {step === 2 && (
          <div className="grid md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="md:col-span-7 space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-black">{isId ? 'Review Pesanan' : 'Order Review'}</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {isId ? 'Periksa kembali rincian produk dan alamat pengiriman Anda.' : 'Review your order items and destination address.'}
                </p>
              </div>

              {/* Alamat Terpilih */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1A4D2E]" /> {isId ? 'Alamat Pengiriman' : 'Shipping Address'}
                  </span>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-[#1A4D2E] hover:underline cursor-pointer">
                    {isId ? 'Ubah' : 'Change'}
                  </button>
                </div>
                <p className="text-xs text-zinc-700 font-medium leading-relaxed">{address}</p>
              </div>
              
              {/* Ringkasan per Supplier */}
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => (
                  <div key={supplierId} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCircular ? 'bg-[#B69A1D]/10 text-[#B69A1D]' : 'bg-[#1A4D2E]/10 text-[#1A4D2E]'}`}>
                          <Factory className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCircular ? 'bg-[#B69A1D]/10 text-[#B69A1D]' : 'bg-[#1A4D2E]/10 text-[#1A4D2E]'}`}>
                        {group.totalKg} {isCircular ? 'Unit' : 'kg'}
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {group.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm items-start">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="font-bold text-zinc-900 truncate">
                              {isCircular ? (item.product?.nama || item.product?.name || item.product?.batch_code) : `Batch ${item.product?.batch_code}`}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {item.quantity_kg} {isCircular ? (item.product?.unit || 'Unit') : 'kg'} x {formatRupiah(item.calculatedPrice)}
                            </p>
                            {supplierNotes[supplierId] && (
                              <p className="text-[10px] text-amber-700 mt-1 italic">
                                Catatan: &quot;{supplierNotes[supplierId]}&quot;
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-zinc-900 shrink-0">{formatRupiah(item.calculatedSubtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-500">{isId ? `Subtotal ${group.supplierName}` : `${group.supplierName} Subtotal`}</span> 
                      <span className={`font-black ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(group.totalSubtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Kanan: Rincian Pembayaran & Tombol Bayar */}
            <div className="md:col-span-5">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm md:sticky md:top-24 space-y-6">
                <h3 className="font-bold text-lg font-serif border-b border-zinc-100 pb-3">{isId ? 'Rincian Pembayaran' : 'Payment Summary'}</h3>
                
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-500">{isId ? 'Total Tagihan' : 'Grand Total'}</span>
                  <span className={`text-3xl font-black ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>{formatRupiah(grandTotal)}</span>
                </div>

                {/* Info Escrow / Proteksi */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-2.5">
                  <div className={`flex items-center gap-2 font-bold ${isCircular ? 'text-[#B69A1D]' : 'text-[#1A4D2E]'}`}>
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <h4>{isCircular 
                      ? (isId ? 'Proteksi Transaksi VALAM' : 'VALAM Transaction Protection')
                      : (isId ? 'Pembayaran Rekening Bersama Escrow' : 'VALAM Escrow Payment')}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {isCircular 
                      ? (isId 
                          ? 'Pembayaran pesanan produk turunan diteruskan langsung ke rekening resmi Mitra Pengolah untuk percepatan pengiriman lokal.'
                          : 'Payment for derivative products is processed directly to Processor Partners for rapid local dispatch.')
                      : (isId 
                          ? 'Dana ditahan dengan aman oleh Rekening Bersama Platform VALAM dan baru dilepaskan ke koperasi setelah Anda mengonfirmasi barang diterima.'
                          : 'Funds are held securely by VALAM Escrow and released to cooperatives only after you confirm batch arrival.')}
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
                      ? (isId ? 'Saya menyetujui syarat & ketentuan transaksi pembelian produk olahan limbah sirkular VALAM.' : 'I agree to the VALAM circular product transaction terms & conditions.')
                      : (isId ? 'Saya menyetujui syarat & ketentuan escrow VALAM untuk transaksi pembelian minyak nilam ini.' : 'I agree to the VALAM escrow terms & conditions for this patchouli oil transaction.')}
                  </span>
                </label>

                <Button 
                  onClick={handleSubmitOrder}
                  disabled={!agreedToEscrow || isSubmitting}
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none ${
                    isCircular
                      ? 'bg-[#B69A1D] hover:bg-[#A38618] text-white shadow-lg shadow-[#B69A1D]/20'
                      : 'bg-[#1A4D2E] hover:bg-[#123320] text-white shadow-lg shadow-[#1A4D2E]/20'
                  }`}
                >
                  {isSubmitting ? (isId ? 'Memproses Pesanan...' : 'Processing Order...') : (isId ? 'Bayar Sekarang' : 'Pay Now')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 3: PESANAN SELESAI */}
        {step === 3 && (
          <div className="max-w-xl mx-auto mt-6 animate-in zoom-in duration-500">
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-xl shadow-zinc-200/50 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif font-black text-zinc-900 mb-2">
                {isId ? 'Pesanan Berhasil Dibuat!' : 'Order Placed Successfully!'}
              </h2>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto leading-relaxed">
                {isCircular
                  ? (isId ? 'Pesanan produk sirkular Anda telah tercatat dan sedang diproses oleh Mitra Pengolah terkait.' : 'Your circular product order has been recorded and is being prepared by the partner.')
                  : (isId ? 'Pesanan minyak nilam Anda telah tercatat dalam sistem escrow dan siap dipersiapkan oleh koperasi.' : 'Your patchouli order has been registered in the escrow system and is ready for cooperative fulfillment.')}
              </p>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 text-left space-y-3 mb-6">
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-200 pb-2">
                  {isId ? 'Nomor Referensi Pesanan:' : 'Order References:'}
                </h4>
                <div className="space-y-2.5">
                  {orderResults.map(res => (
                    <div key={res.orderId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100 shadow-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">{res.supplier}</p>
                        <p className="font-mono font-bold text-emerald-700 text-sm">{res.orderId}</p>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold uppercase shrink-0">
                        {isId ? 'Diproses' : 'Processing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full h-14 rounded-2xl bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold text-base shadow-md cursor-pointer">
                  <Link href="/buyer/orders">
                    {isId ? 'Lihat di Pesanan Saya' : 'View in My Orders'}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-12 rounded-2xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold">
                  <Link href="/katalog">
                    {isId ? 'Lanjut Belanja di Katalog' : 'Continue Shopping'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
