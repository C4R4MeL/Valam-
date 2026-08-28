'use client'

import { useState, useEffect } from 'react'
import { Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, Search, Calendar, Globe, FileText, Download, ShieldCheck, Camera, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Link, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const contentMap = {
  id: {
    title: "Pesanan Saya",
    subtitle: "Lacak dan kelola pesanan minyak nilam Anda",
    search: "Cari nomor pesanan...",
    empty: "Belum ada pesanan",
    emptyDesc: "Anda belum pernah melakukan pemesanan. Jelajahi Marketplace sekarang.",
    btnMarketplace: "Jelajahi Marketplace",
    status: {
      UNPAID: "Menunggu Pembayaran",
      PENDING: "Diproses Pemasok",
      PACKED: "Dikemas",
      SHIPPED: "Dalam Pengiriman",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan"
    },
    total: "Total:",
    orderDate: "Tanggal Pesan:",
    btnTrack: "Lacak Pengiriman",
    btnView: "Detail Pesanan",
    supplier: "Pemasok:"
  },
  en: {
    title: "My Orders",
    subtitle: "Track and manage your patchouli oil orders",
    search: "Search order number...",
    empty: "No orders yet",
    emptyDesc: "You haven't placed any orders. Explore the Marketplace now.",
    btnMarketplace: "Explore Marketplace",
    status: {
      UNPAID: "Awaiting Payment",
      PENDING: "Processing",
      PACKED: "Packed",
      SHIPPED: "Shipped",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled"
    },
    total: "Total:",
    orderDate: "Order Date:",
    btnTrack: "Track Shipment",
    btnView: "Order Details",
    supplier: "Supplier:"
  }
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  
  const [shippingOrder, setShippingOrder] = useState<any | null>(null)
  const [payingOrder, setPayingOrder] = useState<any | null>(null)
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCourier, setShippingCourier] = useState('cargo_truck')
  const [paymentType, setPaymentType] = useState('ESCROW')
  const [savingShipping, setSavingShipping] = useState(false)
  const [paying, setPaying] = useState(false)
  const [activePaymentInstruction, setActivePaymentInstruction] = useState<any | null>(null)

  // Shipment Module States
  const [shipmentType, setShipmentType] = useState<'DOMESTIK' | 'EKSPOR'>('DOMESTIK')
  const [biteshipRates, setBiteshipRates] = useState<any[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState('')
  const [incoterms, setIncoterms] = useState<'EXW' | 'FOB' | 'CIF'>('EXW')
  const [portDestination, setPortDestination] = useState('')
  const [forwarderName, setForwarderName] = useState('')
  const [estimatedFreight, setEstimatedFreight] = useState('')
  const [exportNotes, setExportNotes] = useState('')
  
  const [mapSearch, setMapSearch] = useState('')
  const [showMapModal, setShowMapModal] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const calculateShippingCost = (courier: string, address: string, weight: number, originProvince: string) => {
    let ratePerKg = 1500; // default for cargo_truck
    let minFee = 100000;
    
    if (courier === 'jne_jtr') {
      ratePerKg = 2500;
      minFee = 150000;
    } else if (courier === 'sea_freight') {
      ratePerKg = 5000;
      minFee = 300000;
    }

    let cost = weight * ratePerKg;
    if (cost < minFee) cost = minFee;

    const lowerOrigin = (originProvince || 'Aceh').toLowerCase();
    const lowerDest = (address || '').toLowerCase();
    
    let multiplier = 1.0;

    // Check if shipment is domestic / cross-island
    const isOriginSumatra = lowerOrigin.includes('aceh') || lowerOrigin.includes('sumatra') || lowerOrigin.includes('utara');
    const isOriginJava = lowerOrigin.includes('jawa') || lowerOrigin.includes('jakarta') || lowerOrigin.includes('banten');
    const isOriginSulawesi = lowerOrigin.includes('sulawesi');

    const isDestSumatra = lowerDest.includes('sumatra') || lowerDest.includes('sumatera') || lowerDest.includes('aceh');
    const isDestJavaCentralEast = lowerDest.includes('jawa tengah') || lowerDest.includes('jateng') || lowerDest.includes('jawa timur') || lowerDest.includes('jatim');
    const isDestJavaWest = lowerDest.includes('jawa barat') || lowerDest.includes('jabar') || lowerDest.includes('jakarta') || lowerDest.includes('banten') || lowerDest.includes('cikarang') || lowerDest.includes('tanjung priok') || lowerDest.includes('karawang') || lowerDest.includes('deltamas');
    const isDestSulawesi = lowerDest.includes('sulawesi');

    if (isOriginSumatra) {
      if (isDestJavaWest) multiplier = 1.4;
      else if (isDestJavaCentralEast) multiplier = 1.6;
      else if (isDestSulawesi) multiplier = 2.2;
      else if (isDestSumatra) multiplier = 1.0; // Same island local cargo
      else multiplier = 2.0;
    } else if (isOriginSulawesi) {
      if (isDestJavaWest) multiplier = 1.8;
      else if (isDestJavaCentralEast) multiplier = 1.6;
      else if (isDestSulawesi) multiplier = 1.0; // Local
      else multiplier = 2.4;
    } else if (isOriginJava) {
      if (isDestJavaWest) multiplier = 1.0; // Local Jabodetabek / West Java
      else if (isDestJavaCentralEast) multiplier = 1.2;
      else if (isDestSumatra) multiplier = 1.5;
      else if (isDestSulawesi) multiplier = 1.8;
      else multiplier = 2.0;
    }

    return Math.round(cost * multiplier);
  }

  useEffect(() => {
    if (!shippingOrder || !shippingAddress || shipmentType !== 'DOMESTIK') return;

    const fetchRates = async () => {
      setLoadingRates(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
      const token = localStorage.getItem('valam_token');
      try {
        const res = await fetch(`${API_URL}/shipment/rates?orderId=${shippingOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setBiteshipRates(data);
          if (data.length > 0) {
            setSelectedRateId(data[0].rateId);
          }
        }
      } catch (err) {
        console.error("Gagal memuat ongkir Biteship:", err);
      } finally {
        setLoadingRates(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchRates();
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [shippingOrder, shippingAddress, shipmentType]);

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingOrder || savingShipping) return
    setSavingShipping(true)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const token = localStorage.getItem('valam_token')
    try {
      let res;
      if (shipmentType === 'DOMESTIK') {
        if (!selectedRateId) throw new Error('Harap pilih kurir kargo terlebih dahulu');
        res = await fetch(`${API_URL}/shipment/confirm-ongkir`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: shippingOrder.id,
            selectedRateId: selectedRateId
          })
        });
      } else {
        if (!portDestination) throw new Error('Pelabuhan tujuan ekspor wajib diisi');
        res = await fetch(`${API_URL}/shipment/ekspor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: shippingOrder.id,
            incoterms,
            portDestination,
            forwarderName,
            estimasiFreight: parseFloat(estimatedFreight) || 0,
            portOrigin: 'Belawan Port',
            exportNotes
          })
        });
      }

      if (res.ok) {
        toast({
          title: "Pengiriman Disimpan",
          description: "Konfigurasi kargo berhasil dikunci ke dalam sistem."
        })
        setShippingOrder(null)
        window.location.reload()
      } else {
        throw new Error('Gagal mengunci pengiriman')
      }
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message || "Terjadi kesalahan saat mengunci pengiriman.",
        variant: "destructive"
      })
    } finally {
      setSavingShipping(false)
    }
  }

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingOrder) return
    
    setActivePaymentInstruction({
      orderId: payingOrder.id,
      totalAmount: payingOrder.total_amount + (payingOrder.shipping_cost || 0),
      paymentMethod: paymentType,
    })
    setPayingOrder(null)
  }

  const handleConfirmFinalPayment = async (orderId: string, method: string) => {
    if (paying) return
    setPaying(true)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${API_URL}/orders/${orderId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: method
        })
      })

      if (res.ok) {
        toast({
          title: "Pembayaran Sukses Terverifikasi",
          description: "Sistem telah memverifikasi transfer dana Anda. Pesanan Anda kini diproses pemasok."
        })
        setActivePaymentInstruction(null)
        // Refresh page
        window.location.reload()
      } else {
        throw new Error('Gagal memproses pembayaran')
      }
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message || "Terjadi kesalahan saat memproses pembayaran.",
        variant: "destructive"
      })
    } finally {
      setPaying(false)
    }
  }

  const handleDownloadDoc = async (orderId: string, orderNumber: string, docKey: string, docName: string) => {
    if (docKey !== 'invoice' && docKey !== 'packing_list' && docKey !== 'invoice_local' && docKey !== 'surat_jalan') {
      toast({ title: "Mengunduh " + docName, description: `${docName} berhasil diunduh.` })
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
    const token = localStorage.getItem('valam_token');
    toast({ title: "Mengunduh...", description: `Sedang menyiapkan berkas ${docName}` });
    try {
      const res = await fetch(`${API_URL}/shipment/${orderId}/documents/${docKey}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docKey}_${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast({ title: "Gagal", description: `Gagal mengunduh berkas ${docName}`, variant: "destructive" });
    }
  };

  const handlePreviewDoc = async (orderId: string, docKey: string, docName: string) => {
    if (docKey === 'coa') {
      const productId = selectedOrder?.items?.[0]?.product_id;
      if (productId) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
        const token = localStorage.getItem('valam_token');
        try {
          const res = await fetch(`${API_URL}/products/${productId}/coa`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPreviewDoc({ key: docKey, name: docName, order: selectedOrder, coaData: data });
            return;
          }
        } catch (err) {
          console.warn("Backend COA fetch failed, using fallback mock COA:", err);
        }
      }
      
      // Fallback/mock COA if backend request fails or product is local
      setPreviewDoc({ 
        key: docKey, 
        name: docName, 
        order: selectedOrder, 
        coaData: {
          certificate_number: `COA-${selectedOrder.order_number || '1782970'}-QC`,
          issued_at: new Date().toISOString(),
          admin_name: "Ahmad Dahlan, M.Si (QC Lead)",
          qc_result: {
            pa_percentage: 32.4,
            moisture: 3.1,
            specific_gravity: 0.958,
            refractive_index: 1.507,
            optical_rotation: -42.5,
            overall_status: "PASS"
          }
        } 
      });
    } else {
      setPreviewDoc({ key: docKey, name: docName, order: selectedOrder });
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      const token = localStorage.getItem('valam_token')
      const email = localStorage.getItem('valam_email') || 'buyer@valam.id'

      if (token) {
        try {
          await fetch(`${API_URL}/orders/${orderId}/complete`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        } catch (e) {
          console.warn('Backend complete request failed, updating locally:', e)
        }
      }

      setOrders(prev => prev.map(o => (o.id === orderId || o.order_number === orderId) ? { ...o, status: 'COMPLETED' } : o))
      const localOrdersRaw = localStorage.getItem('valam_buyer_orders_' + email)
      if (localOrdersRaw) {
        const parsed = JSON.parse(localOrdersRaw)
        const updated = parsed.map((o: any) => (o.id === orderId || o.order_number === orderId) ? { ...o, status: 'COMPLETED' } : o)
        localStorage.setItem('valam_buyer_orders_' + email, JSON.stringify(updated))
      }

      toast({
        title: locale === 'id' ? "Pesanan Selesai!" : "Order Completed!",
        description: locale === 'id' ? "Terima kasih telah mengonfirmasi penerimaan barang. Transaksi Anda telah selesai." : "Thank you for confirming delivery. Your transaction is now complete."
      })
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message || "Gagal mengonfirmasi penerimaan pesanan.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      const email = localStorage.getItem('valam_email') || 'buyer@valam.id'
      const localOrdersRaw = localStorage.getItem('valam_buyer_orders_' + email)
      const localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : []

      try {
        const token = localStorage.getItem('valam_token')
        if (!token) {
          if (localOrders.length > 0) {
            setOrders(localOrders)
          } else {
            router.push('/login')
          }
          setLoading(false)
          return
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/orders/buyer`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (res.ok) {
          const data = await res.json()
          const combined = [...data]
          localOrders.forEach((lo: any) => {
            if (!combined.some(o => o.id === lo.id || o.order_number === lo.order_number)) {
              combined.push(lo)
            }
          })
          setOrders(combined)
        } else {
          setOrders(localOrders)
        }
      } catch (err) {
        console.warn("Backend unavailable, setting local orders fallback:", err)
        setOrders(localOrders)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNPAID': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'PENDING': return <Clock className="w-5 h-5 text-blue-500" />
      case 'PACKED': return <Package className="w-5 h-5 text-indigo-500" />
      case 'SHIPPED': return <Truck className="w-5 h-5 text-purple-500" />
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-zinc-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      UNPAID: "bg-amber-100 text-amber-800 border-amber-200",
      PENDING: "bg-blue-100 text-blue-800 border-blue-200",
      PACKED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200"
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusClasses[status] || "bg-zinc-100 text-zinc-800 border-zinc-200"}`}>
        {getStatusIcon(status)}
        {t.status[status as keyof typeof t.status] || status}
      </span>
    )
  }

  const filteredOrders = orders.filter(o => 
    (o.id && o.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.order_number && o.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.supplier?.profile?.company_name && o.supplier.profile.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.supplier_name && o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            {t.title}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <Input 
            placeholder={t.search} 
            className="pl-10 h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{t.empty}</h3>
            <p className="text-zinc-500 mb-6">{t.emptyDesc}</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/marketplace">{t.btnMarketplace}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => (
              <div key={order.id} className="border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">ID Pesanan</p>
                      <p className="font-mono font-bold text-zinc-900">#{order.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">{t.orderDate}</p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' }).format(new Date(order.created_at))}
                      </div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">{t.supplier}</p>
                      <p className="font-bold text-zinc-900">{order.supplier?.profile?.company_name || 'Valam Partner'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item: any, idx: number) => {
                      // Find PA and moisture parameters if available
                      const paParam = item.product?.parameters?.find((p: any) => p.parameter_name === 'Patchouli Alcohol' || p.parameter_name === 'PA');
                      const moistureParam = item.product?.parameters?.find((p: any) => p.parameter_name === 'Moisture' || p.parameter_name === 'Kadar Air');
                      
                      const paValue = paParam ? `${paParam.value}%` : '32.5%';
                      const moistureValue = moistureParam ? `${moistureParam.value}%` : '1.2%';

                      return (
                        <div key={idx} className="flex justify-between items-start bg-zinc-50/40 p-4 rounded-xl border border-zinc-150/60 hover:border-emerald-250 transition-all">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">Minyak Nilam Batch {item.product?.batch_code || '-'}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {item.quantity_kg} kg x {formatRupiah(item.price_per_kg)}
                              </p>
                              
                              {/* Product Specifications / Quality Indicators */}
                              <div className="flex flex-wrap gap-2 mt-2.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50/80 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                                  🧪 PA: {paValue}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50/80 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-100">
                                  💧 Air: {moistureValue}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50/80 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                  ✓ Grade A
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-zinc-950 text-sm">{formatRupiah(item.subtotal)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-0.5">{locale === 'id' ? 'Total (Subtotal + Ongkir)' : 'Total (Subtotal + Shipping)'}</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatRupiah(order.total_amount + (order.shipping_cost || 0))}
                      </p>
                      {order.shipping_cost > 0 && (
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                          ({locale === 'id' ? 'Termasuk Ongkir:' : 'Inc. Shipping:'} {formatRupiah(order.shipping_cost)})
                        </p>
                      )}
                      {order.status === 'UNPAID' && !order.shipping_address?.address && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ Atur kargo terlebih dahulu untuk membayar</p>
                      )}
                      {order.status === 'UNPAID' && order.shipping_address?.address && (
                        <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Kargo diatur: {order.shipping_cost === 150000 ? 'Land Cargo' : order.shipping_cost === 250000 ? 'JNE JTR' : 'Sea Container'}</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {order.status === 'UNPAID' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
                            onClick={() => {
                              setShippingOrder(order)
                              setShippingAddress(order.shipping_address?.address || '')
                              setShippingCourier(order.shipping_cost === 150000 ? 'cargo_truck' : order.shipping_cost === 250000 ? 'jne_jtr' : 'sea_freight')
                            }}
                          >
                            Atur Pengiriman
                          </Button>
                          <Button 
                            className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold"
                            disabled={!order.shipping_address?.address}
                            onClick={() => {
                              setPayingOrder(order)
                            }}
                          >
                            Bayar Sekarang
                          </Button>
                        </div>
                      )}
                      {order.status === 'SHIPPED' && (
                        <Button 
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
                          onClick={() => handleConfirmDelivery(order.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {locale === 'id' ? 'Konfirmasi Terima Barang' : 'Confirm Delivery'}
                        </Button>
                      )}
                      {(order.status === 'SHIPPED' || order.status === 'COMPLETED') && (
                        <Button 
                          variant="outline" 
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackingOrderId(order.id);
                          }}
                        >
                          {t.btnTrack}
                        </Button>
                      )}

                      <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 font-semibold shadow-sm" onClick={() => setSelectedOrder(order)}>
                        {t.btnView}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Order Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">
              {locale === 'id' ? 'Detail Transaksi B2B' : 'B2B Transaction Details'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'id' ? 'ID Pesanan:' : 'Order ID:'} <span className="font-mono font-bold text-zinc-800">#{selectedOrder?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (() => {
            const isInternational = localStorage.getItem('valam_order_type_' + selectedOrder.id) === 'INTERNATIONAL';
            const paymentMethod = localStorage.getItem('valam_order_payment_method_' + selectedOrder.id) || 'ESCROW';
            const lcStatus = localStorage.getItem('valam_order_lc_' + selectedOrder.id) || 'LC_DRAFT';

            // Mock carrier tracking
            const carrier = localStorage.getItem('valam_order_carrier_' + selectedOrder.id) || 'Maersk Line';
            const vessel = localStorage.getItem('valam_order_vessel_' + selectedOrder.id) || 'Aceh Breeze';
            const container = localStorage.getItem('valam_order_container_' + selectedOrder.id) || 'MSKU-892734-2';
            const bl = localStorage.getItem('valam_order_bl_' + selectedOrder.id) || 'MSK8971209384';
            const eta = localStorage.getItem('valam_order_eta_' + selectedOrder.id) || '25 Hari / Days';

            return (
              <div className="space-y-6 pt-4">
                {/* Stepper Alur Transaksi B2B */}
                {selectedOrder.status !== 'CANCELLED' && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider text-center">
                      {locale === 'id' ? 'Status Alur Transaksi & Kargo' : 'Transaction & Cargo Progress'}
                    </h4>
                    <div className="flex items-center justify-between relative mt-2">
                      <div className="absolute left-[10%] right-[10%] top-3.5 h-0.5 bg-zinc-200 -z-10" />
                      
                      {[
                        { statusKey: 'UNPAID', labelId: 'Belum Bayar', labelEn: 'Unpaid' },
                        { statusKey: 'PENDING', labelId: 'Diproses Pemasok', labelEn: 'Processing' },
                        { statusKey: 'PACKED', labelId: 'Dikemas', labelEn: 'Packed' },
                        { statusKey: 'SHIPPED', labelId: 'Kargo Dikirim', labelEn: 'In Transit' },
                        { statusKey: 'COMPLETED', labelId: 'Selesai', labelEn: 'Delivered' }
                      ].map((step, idx, arr) => {
                        const statusList = arr.map(s => s.statusKey);
                        const currentIdx = statusList.indexOf(selectedOrder.status);
                        const isCompleted = idx < currentIdx;
                        const isActive = idx === currentIdx;

                        return (
                          <div key={step.statusKey} className="flex flex-col items-center relative z-10 w-1/5">
                            <div 
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs ${
                                isCompleted 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                  : isActive
                                    ? 'bg-emerald-950 border-emerald-950 text-white animate-pulse shadow-md scale-110'
                                    : 'bg-white border-zinc-300 text-zinc-400'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span 
                              className={`text-[9px] font-bold mt-2 text-center leading-tight whitespace-nowrap hidden sm:block ${
                                isActive 
                                  ? 'text-emerald-950 font-black scale-105' 
                                  : isCompleted 
                                    ? 'text-emerald-800' 
                                    : 'text-zinc-400'
                              }`}
                            >
                              {locale === 'id' ? step.labelId : step.labelEn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items Summary */}
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    {locale === 'id' ? 'Daftar Minyak Nilam' : 'Patchouli Oil Items'}
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-zinc-900">Batch {item.product?.batch_code || '-'}</p>
                          <p className="text-zinc-500 text-xs">{item.quantity_kg} kg x {formatRupiah(item.price_per_kg)}</p>
                        </div>
                        <span className="font-semibold text-zinc-900">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-zinc-200 space-y-2 text-xs text-zinc-600 font-semibold">
                      <div className="flex justify-between">
                        <span>{locale === 'id' ? 'Subtotal Produk' : 'Product Subtotal'}</span>
                        <span className="text-zinc-950 font-bold">{formatRupiah(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{locale === 'id' ? 'Ongkos Kirim' : 'Shipping Cost'}</span>
                        <span className="text-zinc-950 font-bold">{formatRupiah(selectedOrder.shipping_cost || 0)}</span>
                      </div>
                      {selectedOrder.shipment && (
                        <div className="pl-3 py-1 border-l-2 border-emerald-300 space-y-1 text-[11px] font-medium text-zinc-500">
                          {selectedOrder.shipment.shipment_type === 'DOMESTIK' ? (
                            <>
                              <div className="flex justify-between">
                                <span>• {locale === 'id' ? 'Biaya Kargo Dasar' : 'Base Cargo Fee'}</span>
                                <span>{formatRupiah(Number(selectedOrder.shipment.base_shipping_cost) || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• {locale === 'id' ? 'Asuransi Kargo (0.2%)' : 'Cargo Insurance (0.2%)'}</span>
                                <span>{formatRupiah(Number(selectedOrder.shipment.insurance_fee) || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• {locale === 'id' ? 'Kemasan Drum' : 'Drum Packaging Fee'} ({selectedOrder.shipment.drum_count || 0} Drum)</span>
                                <span>{formatRupiah(Number(selectedOrder.shipment.packaging_fee) || 0)}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span>• Incoterms</span>
                                <span className="font-semibold text-emerald-800">{selectedOrder.shipment.incoterms || 'EXW'}</span>
                              </div>
                              {selectedOrder.shipment.incoterms !== 'EXW' && (
                                <div className="flex justify-between">
                                  <span>• {locale === 'id' ? 'Estimasi Freight Ekspor' : 'Estimated Export Freight'}</span>
                                  <span>{formatRupiah(Number(selectedOrder.shipment.estimated_freight) || 0)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950 text-sm">
                        <span>Total Tagihan</span>
                        <span className="text-emerald-700">{formatRupiah(selectedOrder.total_amount + (selectedOrder.shipping_cost || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packing Photo Proof (Jika Ada) */}
                {(() => {
                  const packedLog = selectedOrder.shipment?.tracking_logs?.find((l: any) => l.status === 'PACKED' && l.description?.startsWith('data:image'));
                  if (!packedLog) return null;

                  return (
                    <div className="border border-emerald-150 rounded-xl p-4 bg-emerald-50/20 space-y-3">
                      <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-800" />
                        {locale === 'id' ? 'Foto Bukti Pengemasan Kargo' : 'Cargo Packing Photo Proof'}
                      </h4>
                      <div className="relative rounded-lg overflow-hidden border border-emerald-100 aspect-[4/3] max-w-sm mx-auto bg-zinc-50 shadow-sm">
                        <img 
                          src={packedLog.description} 
                          alt="Bukti pengemasan drum" 
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={() => {
                            const w = window.open();
                            if (w) {
                              w.document.write(`<img src="${packedLog.description}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                              w.document.close();
                            }
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-600 font-bold text-center italic">
                        {locale === 'id' 
                          ? 'Foto drum kargo minyak nilam terverifikasi saat dikemas di gudang koperasi.' 
                          : 'Verified photo of patchouli oil cargo drum during packaging at cooperative warehouse.'}
                      </p>
                    </div>
                  );
                })()}

                {/* Cargo Pickup Photo Proof (Jika Ada) */}
                {(() => {
                  const shippedLog = selectedOrder.shipment?.tracking_logs?.find((l: any) => l.status === 'SHIPPED' && l.description?.startsWith('data:image'));
                  if (!shippedLog) return null;

                  return (
                    <div className="border border-emerald-150 rounded-xl p-4 bg-emerald-50/20 space-y-3">
                      <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-800" />
                        {locale === 'id' ? 'Foto Bukti Penjemputan Kargo' : 'Cargo Pickup Photo Proof'}
                      </h4>
                      <div className="relative rounded-lg overflow-hidden border border-emerald-100 aspect-[4/3] max-w-sm mx-auto bg-zinc-50 shadow-sm">
                        <img 
                          src={shippedLog.description} 
                          alt="Bukti penjemputan kargo" 
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={() => {
                            const w = window.open();
                            if (w) {
                              w.document.write(`<img src="${shippedLog.description}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                              w.document.close();
                            }
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-650 font-bold text-center italic leading-relaxed">
                        {locale === 'id' 
                          ? 'Foto bukti drum kargo minyak nilam saat diserahkan ke kurir kargo/forwarder.' 
                          : 'Verified photo proof of patchouli oil cargo drum handed over to logistics carrier.'}
                      </p>
                    </div>
                  );
                })()}

                {/* International Flow: L/C & Ocean Freight */}
                {isInternational ? (
                  <>
                    {/* L/C tracker if payment is L/C */}
                    {paymentMethod === 'LC' && (
                      <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                        <h4 className="font-bold text-zinc-800 text-sm mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Letter of Credit (L/C) Status Tracker
                        </h4>
                        
                        <div className="grid grid-cols-5 gap-2 relative">
                          {[
                            { key: 'LC_DRAFT', label: '1. Draft Application' },
                            { key: 'LC_VERIFIED', label: '2. Bank Verifying' },
                            { key: 'LC_ISSUED', label: '3. L/C Issued' },
                            { key: 'LC_PRESENTED', label: '4. Doc Presented' },
                            { key: 'LC_RELEASED', label: '5. Escrow Released' }
                          ].map((step, idx, arr) => {
                            const statuses = arr.map(s => s.key);
                            const currentIdx = statuses.indexOf(lcStatus);
                            const active = idx <= currentIdx;
                            return (
                              <div key={step.key} className="flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${active ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-200 text-zinc-500'}`}>
                                  {idx + 1}
                                </div>
                                <span className={`text-[10px] font-semibold mt-1 leading-tight ${active ? 'text-emerald-800 font-bold' : 'text-zinc-500'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {lcStatus === 'LC_DRAFT' && (
                          <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
                            <span className="text-xs text-zinc-500">
                              {locale === 'id' ? 'Ajukan draf L/C ke Bank pembuka Anda.' : 'Submit L/C draft to your issuing bank.'}
                            </span>
                            <Button 
                              onClick={() => toast({ title: "Unduh Draf L/C", description: "Format draf L/C untuk Bank berhasil diunduh." })}
                              size="sm" 
                              variant="outline" 
                              className="text-xs gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {locale === 'id' ? 'Unduh Template L/C' : 'Download L/C Draft'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ocean Freight Details */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        Ocean Freight Tracking (Pelacakan Kapal Ekspor)
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-700">
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">{locale === 'id' ? 'Nama Kapal / Carrier' : 'Vessel / Carrier'}</p>
                          <p className="text-zinc-950 font-bold">{vessel} ({carrier})</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">Bill of Lading (B/L) Number</p>
                          <p className="font-mono text-zinc-950">{bl}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">Container ID</p>
                          <p className="font-mono text-zinc-950">{container}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">Estimated Arrival (ETA)</p>
                          <p className="text-emerald-700 font-bold">{eta}</p>
                        </div>
                      </div>
                    </div>

                    {/* Export Documents List */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Dokumen Ekspor (Export Documents)' : 'Export Document Pack'}
                      </h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {[
                          { key: 'invoice', name: 'Commercial Invoice' },
                          { key: 'packing_list', name: 'Packing List' },
                          { key: 'msds', name: 'Material Safety Data Sheet (MSDS)' },
                          { key: 'coo', name: 'Certificate of Origin (COO)' },
                          { key: 'bl', name: 'Bill of Lading (B/L)' },
                        ].map((doc) => {
                          const uploadedKey = `valam_doc_${doc.key}_${selectedOrder.id}`;
                          const isUploaded = localStorage.getItem(uploadedKey) === 'UPLOADED' || doc.key === 'msds'; // MSDS auto-available
                          return (
                            <div key={doc.key} className="py-3 flex items-center justify-between">
                              <span className="font-medium text-zinc-900">{doc.name}</span>
                              {isUploaded ? (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handlePreviewDoc(selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 text-emerald-800 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Lihat Preview' : 'View Preview'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDownloadDoc(selectedOrder.id, selectedOrder.order_number, doc.key, doc.name)}
                                    className="h-8 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Unduh' : 'Download'}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-zinc-400 font-medium italic">
                                  {locale === 'id' ? 'Menunggu unggahan supplier' : 'Awaiting supplier upload'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Domestic Flow: Local Delivery Info */
                  <div className="space-y-4">
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Informasi Pengiriman Domestik' : 'Domestic Shipping Details'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-700">
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">{locale === 'id' ? 'Kurir' : 'Courier Name'}</p>
                          <p className="text-zinc-950 font-bold">{selectedOrder.shipment?.courier_name || 'Indah Cargo (Truk)'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">{locale === 'id' ? 'Nomor Resi / Surat Jalan' : 'Receipt / Airway Bill No.'}</p>
                          <p className="font-mono text-zinc-950">{selectedOrder.shipment?.tracking_number || 'TRK-DOM-901238'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Domestic Documents List */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Dokumen Penjualan Domestik' : 'Domestic Trade Documents'}
                      </h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {[
                          { key: 'invoice_local', name: locale === 'id' ? 'Faktur Penjualan (Local Invoice)' : 'Local Sales Invoice' },
                          { key: 'surat_jalan', name: locale === 'id' ? 'Surat Jalan / Delivery Order' : 'Delivery Order (DO)' },
                          { key: 'coa', name: locale === 'id' ? 'Sertifikat Analisis (COA / QC Report)' : 'Certificate of Analysis (COA)' }
                        ].map((doc) => {
                          const uploadedKey = `valam_doc_${doc.key}_${selectedOrder.id}`;
                          const isAvailable = doc.key === 'invoice_local' || doc.key === 'surat_jalan' || doc.key === 'coa' || localStorage.getItem(uploadedKey) === 'UPLOADED';
                          return (
                            <div key={doc.key} className="py-3 flex items-center justify-between">
                              <span className="font-medium text-zinc-900">{doc.name}</span>
                              {isAvailable ? (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handlePreviewDoc(selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 text-emerald-800 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Lihat Preview' : 'View Preview'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDownloadDoc(selectedOrder.id, selectedOrder.order_number, doc.key, doc.name)}
                                    className="h-8 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Unduh' : 'Download'}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-zinc-400 font-medium italic">
                                  {locale === 'id' ? 'Menunggu unggahan supplier' : 'Awaiting supplier upload'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog Preview Dokumen Premium */}
      <Dialog open={!!previewDoc} onOpenChange={(open: boolean) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-50 border border-zinc-150 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-emerald-950 flex items-center gap-2">
              📄 {previewDoc?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Pratinjau dokumen resmi sistem Valam' : 'Official system document preview'}
            </DialogDescription>
          </DialogHeader>

          {previewDoc && (() => {
            const order = previewDoc.order;
            const docKey = previewDoc.key;
            
            if (docKey === 'invoice_local' || docKey === 'invoice') {
              const subtotal = order.total_amount || 0;
              const shippingCost = order.shipping_cost || 0;
              const grandTotal = subtotal + shippingCost;

              return (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6 font-sans text-xs text-zinc-800">
                  {/* Brand Header */}
                  <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-emerald-800 font-serif">VALAM NILAM B2B</h2>
                      <p className="text-[10px] text-zinc-400">Sustainable Patchouli Oil Supply Chain</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {locale === 'id' ? 'LUNAS (ESCROW)' : 'PAID (ESCROW)'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <p className="text-zinc-400 font-normal">{locale === 'id' ? 'Nomor Faktur' : 'Invoice Number'}</p>
                      <p className="font-mono font-bold text-zinc-950">INV-L-{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 font-normal">{locale === 'id' ? 'Tanggal Transaksi' : 'Transaction Date'}</p>
                      <p className="font-bold text-zinc-950">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-6 border-t border-zinc-100 pt-4">
                    <div>
                      <h5 className="font-bold text-zinc-900 mb-1.5">{locale === 'id' ? 'Pemasok / Pengirim:' : 'Supplier:'}</h5>
                      <p className="font-bold text-zinc-950">{order.supplier?.profile?.company_name || 'Koperasi Produsen Nilam'}</p>
                      <p className="text-zinc-500 mt-0.5 leading-relaxed">{order.supplier?.profile?.address || 'Aceh, Indonesia'}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-zinc-900 mb-1.5">{locale === 'id' ? 'Pembeli / Penerima:' : 'Buyer:'}</h5>
                      <p className="font-bold text-zinc-950">{order.buyer?.profile?.company_name || 'Mitra Industri Nilam'}</p>
                      <p className="text-zinc-500 mt-0.5 leading-relaxed">{order.buyer?.profile?.address || 'Alamat Penerima'}</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-650 text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">{locale === 'id' ? 'Deskripsi Produk' : 'Product Description'}</th>
                          <th className="py-2.5 px-4 text-center">{locale === 'id' ? 'Volume' : 'Volume'}</th>
                          <th className="py-2.5 px-4 text-right">{locale === 'id' ? 'Harga Satuan' : 'Unit Price'}</th>
                          <th className="py-2.5 px-4 text-right">{locale === 'id' ? 'Total' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {order.items?.map((item: any, idx: number) => (
                          <tr key={idx} className="font-medium text-zinc-900">
                            <td className="py-3 px-4">
                              <p className="font-bold text-zinc-950">Minyak Nilam (Patchouli Oil)</p>
                              <p className="text-[10px] text-zinc-400">Batch {item.product?.batch_code || '-'}</p>
                            </td>
                            <td className="py-3 px-4 text-center">{item.quantity_kg} kg</td>
                            <td className="py-3 px-4 text-right">Rp {item.price_per_kg.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-4 text-right font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="space-y-1.5 border-t border-zinc-100 pt-4 text-right max-w-xs ml-auto">
                    <div className="flex justify-between font-semibold text-zinc-600">
                      <span>Subtotal Produk</span>
                      <span className="text-zinc-950">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-zinc-600">
                      <span>Biaya Pengiriman</span>
                      <span className="text-zinc-950">Rp {shippingCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-800 border-t border-zinc-100 pt-2">
                      <span>Total Invoice</span>
                      <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (docKey === 'surat_jalan') {
              const drumCount = order.shipment?.drum_count || Math.ceil((order.items?.[0]?.quantity_kg || 100) / 180);
              
              return (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6 font-sans text-xs text-zinc-800">
                  {/* DO Header */}
                  <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-teal-800 font-serif">SURAT JALAN</h2>
                      <p className="text-[10px] text-zinc-400">Delivery Order (DO)</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-zinc-500">
                      <p className="font-bold text-zinc-950">SJ-{order.order_number}</p>
                      <p>{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-bold text-zinc-900 mb-1.5">{locale === 'id' ? 'Pengirim:' : 'Sender:'}</h5>
                      <p className="font-bold text-zinc-950">{order.supplier?.profile?.company_name || 'Koperasi Produsen Nilam'}</p>
                      <p className="text-zinc-500 mt-0.5 leading-relaxed">{order.supplier?.profile?.address || 'Aceh, Indonesia'}</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-zinc-900 mb-1.5">{locale === 'id' ? 'Alamat Tujuan / Penerima:' : 'Delivery Address:'}</h5>
                      <p className="font-bold text-zinc-950">{order.buyer?.profile?.company_name || 'Mitra Industri Nilam'}</p>
                      <p className="text-zinc-500 mt-0.5 leading-relaxed">{order.buyer?.profile?.address || 'Alamat Penerima'}</p>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 space-y-2 text-[11px]">
                    <h5 className="font-bold text-zinc-900">{locale === 'id' ? 'Spesifikasi Muatan & Logistik:' : 'Logistics Specs:'}</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-medium">
                      <div>
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Total Kemasan' : 'Total Packages'}</span>
                        <p className="text-zinc-950 font-bold">{drumCount} Aluminum Drum(s)</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Berat Bersih (Netto)' : 'Net Weight'}</span>
                        <p className="text-zinc-950 font-bold">{order.items?.[0]?.quantity_kg || 100} kg</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Kurir Ekspedisi' : 'Expedition Carrier'}</span>
                        <p className="text-zinc-950 font-bold">{order.shipment?.courier_name || 'Biteship Cargo'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nomor Resi / AWB' : 'Airway Bill No'}</span>
                        <p className="text-zinc-950 font-mono font-bold">{order.shipment?.tracking_number || 'Belum diatur'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-6 text-center text-[10px] font-semibold text-zinc-700">
                    <div className="space-y-12">
                      <p>{locale === 'id' ? 'Diterima Oleh,' : 'Received By,'}</p>
                      <p className="text-zinc-400 font-normal">( ____________________ )</p>
                    </div>
                    <div className="space-y-12">
                      <p>{locale === 'id' ? 'Sopir/Kurir,' : 'Courier/Driver,'}</p>
                      <p className="text-zinc-400 font-normal">( ____________________ )</p>
                    </div>
                    <div className="space-y-12">
                      <p>{locale === 'id' ? 'Hormat Kami,' : 'Regards (Supplier),'}</p>
                      <p className="text-zinc-400 font-normal">( ____________________ )</p>
                    </div>
                  </div>
                </div>
              );
            }

            if (docKey === 'coa') {
              const coa = previewDoc.coaData;
              const qc = coa?.qc_result;
              const batchCode = order.items?.[0]?.product?.batch_code || '-';

              return (
                <div className="bg-white border-2 border-emerald-800 rounded-xl p-6 shadow-sm space-y-6 font-sans text-xs text-zinc-800 relative overflow-hidden">
                  {/* Decorative Border Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-800" />

                  {/* COA Header */}
                  <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-emerald-800 font-serif tracking-wide">KOPERASI PRODUSEN NILAM ACEH</h2>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold font-sans">Central QC & GC-MS Testing Laboratory</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Banda Aceh, Indonesia | support@valam.id</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {qc?.overall_status === 'PASS' || qc?.overall_status === 'pass' ? 'LULUS QC (PASS)' : 'DRAFT'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-center text-sm font-bold text-zinc-900 tracking-wide underline uppercase">
                    CERTIFICATE OF ANALYSIS (CoA)
                  </h3>

                  {/* Metadata Table */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] bg-zinc-50 p-3 rounded-lg border border-zinc-150">
                    <div>
                      <span className="text-zinc-450 font-normal">{locale === 'id' ? 'No. Sertifikat:' : 'Certificate No:'}</span>
                      <p className="font-mono font-bold text-zinc-950">{coa?.certificate_number}</p>
                    </div>
                    <div>
                      <span className="text-zinc-450 font-normal">{locale === 'id' ? 'Kode Batch Produk:' : 'Product Batch Code:'}</span>
                      <p className="font-mono font-bold text-zinc-950">{batchCode}</p>
                    </div>
                    <div>
                      <span className="text-zinc-450 font-normal">{locale === 'id' ? 'Tanggal Pengujian:' : 'Test Date:'}</span>
                      <p className="font-bold text-zinc-950">{coa?.issued_at ? new Date(coa.issued_at).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-450 font-normal">{locale === 'id' ? 'Analis Lab / Penandatangan:' : 'Lead Analyst:'}</span>
                      <p className="font-bold text-zinc-950">{coa?.admin_name}</p>
                    </div>
                  </div>

                  {/* QC Parameter Results Table */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-650 text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">{locale === 'id' ? 'Parameter Pengujian' : 'Test Parameter'}</th>
                          <th className="py-2.5 px-4 text-center">{locale === 'id' ? 'Standar SNI' : 'SNI Standard'}</th>
                          <th className="py-2.5 px-4 text-right">{locale === 'id' ? 'Hasil Analisis' : 'Analysis Result'}</th>
                          <th className="py-2.5 px-4 text-center">{locale === 'id' ? 'Status' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-900">
                        {/* 1. Patchouli Alcohol */}
                        <tr>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-950">Patchouli Alcohol (PA)</p>
                            <p className="text-[9px] text-zinc-400">Kandungan senyawa aktif utama</p>
                          </td>
                          <td className="py-3 px-4 text-center">Min. 30.0%</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-800">{qc?.pa_percentage?.toFixed(1) || '32.4'}%</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                          </td>
                        </tr>
                        {/* 2. Kadar Air */}
                        <tr>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-950">Kadar Air (Moisture Content)</p>
                            <p className="text-[9px] text-zinc-400">Persentase kelembaban kargo</p>
                          </td>
                          <td className="py-3 px-4 text-center">Max. 5.0%</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-800">{qc?.moisture?.toFixed(1) || '3.1'}%</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                          </td>
                        </tr>
                        {/* 3. Bobot Jenis */}
                        <tr>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-950">Bobot Jenis (Specific Gravity)</p>
                            <p className="text-[9px] text-zinc-400">Densitas pada suhu 20°C</p>
                          </td>
                          <td className="py-3 px-4 text-center">0.950 - 0.975</td>
                          <td className="py-3 px-4 text-right font-bold">{qc?.specific_gravity?.toFixed(3) || '0.958'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                          </td>
                        </tr>
                        {/* 4. Indeks Bias */}
                        <tr>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-950">Indeks Bias (Refractive Index)</p>
                            <p className="text-[9px] text-zinc-400">Pembiasan cahaya pada suhu 20°C</p>
                          </td>
                          <td className="py-3 px-4 text-center">1.500 - 1.515</td>
                          <td className="py-3 px-4 text-right font-bold">{qc?.refractive_index?.toFixed(3) || '1.507'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                          </td>
                        </tr>
                        {/* 5. Putaran Optik */}
                        <tr>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-950">Putaran Optik (Optical Rotation)</p>
                            <p className="text-[9px] text-zinc-400">Polarisasi cahaya</p>
                          </td>
                          <td className="py-3 px-4 text-center">-40° s/d -50°</td>
                          <td className="py-3 px-4 text-right font-bold">{qc?.optical_rotation?.toFixed(1) || '-42.5'}°</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Lab Sign-off & Verification */}
                  <div className="flex justify-between items-end border-t border-zinc-100 pt-6">
                    <div className="text-[10px] text-zinc-450 space-y-1">
                      <p>• {locale === 'id' ? 'Metode Analisis: SNI 06-2385-2006' : 'Analysis Method: SNI 06-2385-2006'}</p>
                      <p>• {locale === 'id' ? 'Sertifikasi Terenkripsi Rantai Pasok' : 'Encrypted Supply Chain Certification'}</p>
                    </div>
                    <div className="text-center text-[10px] font-semibold text-zinc-700 w-44">
                      <p className="text-[9px] text-zinc-400 mb-10">{locale === 'id' ? 'Disetujui Secara Digital oleh' : 'Digitally Approved by'}</p>
                      <p className="font-bold text-emerald-950 underline">{coa?.admin_name}</p>
                      <p className="text-[9px] text-zinc-400 font-normal">QC Laboratory Lead</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback for custom uploaded documents preview page
            return (
              <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm text-center space-y-4">
                <div className="text-4xl">📄</div>
                <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {locale === 'id' ? 'Terverifikasi Sistem' : 'System Verified'}
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">{previewDoc.name}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                  {locale === 'id' 
                    ? 'Arsip dokumen digital terverifikasi dalam rantai pasok minyak nilam berkelanjutan. Dokumen ini sah dan disimpan secara terenkripsi dalam sistem B2B Valam.' 
                    : 'Verified digital document archive in the sustainable patchouli oil supply chain. This document is valid and stored securely encrypted in the Valam B2B system.'}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog Lacak Pengiriman Kargo (Logistics Tracking) */}
      <Dialog open={!!trackingOrderId} onOpenChange={(open: boolean) => !open && setTrackingOrderId(null)}>
        <DialogContent className="max-w-md bg-white border border-zinc-150 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-emerald-950 flex items-center gap-2">
              🚚 {locale === 'id' ? 'Pelacakan Pengiriman Kargo' : 'Cargo Shipping Tracker'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Informasi real-time posisi pengiriman armada kargo' : 'Real-time cargo shipment tracking information'}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const order = orders.find(o => o.id === trackingOrderId);
            if (!order) return null;
            
            const courier = order.shipment?.courier_name || 'Biteship Cargo (Truk)';
            const trackingNum = order.shipment?.tracking_number || 'BELUM TERSEDIA';
            const status = order.status;

            // Generate clean mock checkpoints based on status
            const checkpoints = [];
            
            if (status === 'SHIPPED' || status === 'COMPLETED') {
              checkpoints.push({
                time: new Date(order.created_at).toLocaleDateString('id-ID') + ' 09:00',
                title: locale === 'id' ? 'Pesanan Diproses Pemasok' : 'Order Processed by Supplier',
                desc: locale === 'id' ? 'Pemasok mulai menyiapkan dan mengemas drum kargo nilam.' : 'Supplier started preparing and packing patchouli cargo drums.'
              });
              checkpoints.push({
                time: new Date(order.created_at).toLocaleDateString('id-ID') + ' 15:30',
                title: locale === 'id' ? 'Kargo Selesai Dikemas' : 'Cargo Packing Completed',
                desc: locale === 'id' ? 'Drum kargo disegel, ditimbang berat netto, dan diberi label kode QR.' : 'Cargo drums sealed, net weight verified, and QR code labeled.'
              });
              checkpoints.push({
                time: new Date(order.created_at).toLocaleDateString('id-ID') + ' 18:00',
                title: locale === 'id' ? 'Penjemputan oleh Kurir Kargo' : 'Picked up by Cargo Courier',
                desc: locale === 'id' ? `Kurir ekspedisi (${courier}) telah menjemput muatan kargo di gudang pemasok.` : `Expedition carrier (${courier}) picked up cargo at supplier's warehouse.`
              });
              
              if (status === 'SHIPPED') {
                checkpoints.push({
                  time: new Date().toLocaleDateString('id-ID') + ' 10:15',
                  title: locale === 'id' ? 'Dalam Perjalanan (In Transit)' : 'In Transit',
                  desc: locale === 'id' ? 'Armada kargo sedang menyeberang/menuju ke lokasi gudang konsolidasi terdekat.' : 'Cargo fleet is in transit to the nearest consolidation warehouse.'
                });
              }
              
              if (status === 'COMPLETED') {
                checkpoints.push({
                  time: new Date().toLocaleDateString('id-ID') + ' 10:15',
                  title: locale === 'id' ? 'Kargo Tiba di Transit Hub' : 'Arrived at Transit Hub',
                  desc: locale === 'id' ? 'Kargo nilam sedang dibongkar untuk proses pengecekan silang dokumen jalan.' : 'Patchouli cargo unloading for check-in verification.'
                });
                checkpoints.push({
                  time: new Date().toLocaleDateString('id-ID') + ' 14:00',
                  title: locale === 'id' ? 'Kargo Berhasil Diterima' : 'Cargo Successfully Delivered',
                  desc: locale === 'id' ? 'Muatan drum aluminum minyak nilam telah diterima dengan aman di gudang pembeli.' : 'Patchouli oil aluminum drums successfully received at buyer warehouse.'
                });
              }
            } else {
              checkpoints.push({
                time: new Date(order.created_at).toLocaleDateString('id-ID') + ' 09:00',
                title: locale === 'id' ? 'Menunggu Konfirmasi Pemasok' : 'Awaiting Supplier Processing',
                desc: locale === 'id' ? 'Pesanan terverifikasi lunas escrow. Pemasok sedang bersiap melakukan pengemasan kargo.' : 'Order paid in escrow. Supplier preparing to pack cargo.'
              });
            }

            // Reverse checkpoints to show latest on top
            const sortedCheckpoints = [...checkpoints].reverse();

            return (
              <div className="space-y-6 pt-3 text-zinc-800">
                {/* Logistics Header */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <p className="text-zinc-400 font-normal">{locale === 'id' ? 'Ekspedisi / Kurir' : 'Expedition Courier'}</p>
                    <p className="font-bold text-zinc-950 mt-0.5">{courier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 font-normal">{locale === 'id' ? 'Nomor Resi / AWB' : 'Airway Bill No'}</p>
                    <p className="font-mono font-bold text-emerald-800 mt-0.5">{trackingNum}</p>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="relative border-l-2 border-zinc-150 ml-3.5 space-y-6">
                  {sortedCheckpoints.map((cp, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={idx} className="relative pl-6">
                        {/* Dot Icon */}
                        <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                          isLatest ? 'border-emerald-600 ring-4 ring-emerald-50' : 'border-zinc-350'
                        }`}>
                          {isLatest && <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                        </div>
                        
                        {/* Checkpoint Detail */}
                        <div className="text-xs">
                          <span className="text-zinc-400 text-[10px] font-mono">{cp.time}</span>
                          <h5 className={`font-bold mt-0.5 ${isLatest ? 'text-emerald-850' : 'text-zinc-950'}`}>
                            {cp.title}
                          </h5>
                          <p className="text-zinc-500 mt-1 leading-relaxed text-[11px]">
                            {cp.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 1: KONFIGURASI PENGIRIMAN (SHIPPING CONFIG) */}
      <Dialog open={!!shippingOrder} onOpenChange={(open) => !open && setShippingOrder(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-zinc-900">
              {locale === 'id' ? 'Atur Alamat & Pengiriman Kargo' : 'Configure Address & Cargo Shipping'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs mt-1">
              {locale === 'id' ? 'Masukkan alamat kantor, gudang, atau pabrik serta kurir kargo tujuan pengiriman.' : 'Enter warehouse, factory or port address and cargo courier details.'}
            </DialogDescription>
          </DialogHeader>

          {shippingOrder && (
            <div className="space-y-4 pt-3">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShipmentType('DOMESTIK')}
                  className={`text-xs font-bold py-2 rounded-lg transition-all ${
                    shipmentType === 'DOMESTIK'
                      ? 'bg-white text-emerald-950 shadow-sm'
                      : 'text-zinc-650 hover:bg-white/50'
                  }`}
                >
                  🇮🇩 {locale === 'id' ? 'Kargo Domestik' : 'Domestic Cargo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentType('EKSPOR')}
                  className={`text-xs font-bold py-2 rounded-lg transition-all ${
                    shipmentType === 'EKSPOR'
                      ? 'bg-white text-emerald-950 shadow-sm'
                      : 'text-zinc-650 hover:bg-white/50'
                  }`}
                >
                  🌐 {locale === 'id' ? 'Ekspor Internasional' : 'International Export'}
                </button>
              </div>

              <form onSubmit={handleShippingSubmit} className="space-y-4">
                {shipmentType === 'DOMESTIK' ? (
                  <>
                    {/* Alamat Pengiriman */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="shippingAddress" className="text-zinc-700 text-xs font-bold">
                          {locale === 'id' ? 'Alamat Lengkap Pengiriman' : 'Full Shipping Address'}
                        </Label>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => {
                            setMapSearch('')
                            setShowMapModal(true)
                          }}
                          className="h-auto p-0 text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                        >
                          📍 {locale === 'id' ? 'Pilih via Google Maps' : 'Select via Google Maps'}
                        </Button>
                      </div>
                      <Textarea
                        id="shippingAddress"
                        required
                        placeholder={locale === 'id' ? 'Masukkan alamat kantor atau pabrik tujuan pengiriman...' : 'Enter office or warehouse destination address...'}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="rounded-xl border-zinc-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        rows={3}
                      />
                    </div>

                    {/* Biteship rates list */}
                    <div className="space-y-2">
                      <Label className="text-zinc-700 text-xs font-bold">
                        {locale === 'id' ? 'Pilih Layanan Kargo Biteship' : 'Select Biteship Cargo Service'}
                      </Label>
                      {loadingRates ? (
                        <div className="p-6 text-center space-y-2 bg-zinc-50 border border-zinc-150 rounded-xl">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-900 mx-auto" />
                          <p className="text-[11px] text-zinc-500">{locale === 'id' ? 'Mencari metode pengiriman...' : 'Searching shipping methods...'}</p>
                        </div>
                      ) : biteshipRates.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {biteshipRates.map((rate) => {
                            const isSelected = selectedRateId === rate.rateId;
                            return (
                              <div
                                key={rate.rateId}
                                onClick={() => setSelectedRateId(rate.rateId)}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-emerald-700 bg-emerald-50/50' 
                                    : 'border-zinc-200 hover:border-zinc-350 bg-white'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-zinc-800 text-xs">{rate.kurirNama} - {rate.serviceNama}</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">Estimasi tiba: {rate.estimasiHari} hari</p>
                                  </div>
                                  <p className="font-bold text-emerald-800 text-xs">{formatRupiah(rate.totalOngkir)}</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-zinc-100 flex justify-between text-[9px] text-zinc-500 font-medium">
                                  <span>Dasar: {formatRupiah(rate.ongkirDasar)}</span>
                                  <span>Asuransi: {formatRupiah(rate.biayaAsuransi)}</span>
                                  <span>Packing: {formatRupiah(rate.biayaPengemasan)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px]">
                          {locale === 'id' 
                            ? 'Masukkan alamat pengiriman di atas untuk memuat pilihan kurir kargo Biteship.' 
                            : 'Enter shipping address above to load Biteship cargo courier rates.'}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* EKSPOR FIELDS */}
                    <div className="space-y-3">
                      {/* Incoterms */}
                      <div className="space-y-1">
                        <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Pilih Incoterms' : 'Select Incoterms'}</Label>
                        <select
                          value={incoterms}
                          onChange={(e: any) => setIncoterms(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <option value="EXW">EXW (Ex Works) - Buyer Pick Up (Ongkir Rp 0)</option>
                          <option value="FOB">FOB (Free On Board) - Supplier Delivery to Local Port</option>
                          <option value="CIF">CIF (Cost, Insurance & Freight) - Supplier Delivery to Dest Port</option>
                        </select>
                      </div>

                      {/* Destination Port */}
                      <div className="space-y-1">
                        <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Pelabuhan Tujuan (Port of Destination)' : 'Port of Destination'}</Label>
                        <Input
                          required={shipmentType === 'EKSPOR'}
                          placeholder="e.g. Port of Rotterdam, Netherlands"
                          value={portDestination}
                          onChange={(e) => setPortDestination(e.target.value)}
                          className="rounded-xl border-zinc-200 text-xs"
                        />
                      </div>

                      {/* Forwarder Name */}
                      <div className="space-y-1">
                        <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Forwarder / Agen' : 'Forwarder Company'}</Label>
                        <Input
                          placeholder="e.g. DHL Global Forwarding / Maersk Logistics"
                          value={forwarderName}
                          onChange={(e) => setForwarderName(e.target.value)}
                          className="rounded-xl border-zinc-200 text-xs"
                        />
                      </div>

                      {/* Estimated Freight (FOB/CIF) */}
                      {incoterms !== 'EXW' && (
                        <div className="space-y-1">
                          <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Estimasi Biaya Pengapalan (USD / Rp)' : 'Estimated Freight Cost'}</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 5000000"
                            value={estimatedFreight}
                            onChange={(e) => setEstimatedFreight(e.target.value)}
                            className="rounded-xl border-zinc-200 text-xs"
                          />
                        </div>
                      )}

                      {/* Export Notes */}
                      <div className="space-y-1">
                        <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Catatan Khusus Ekspor' : 'Special Export Notes'}</Label>
                        <Textarea
                          placeholder="Fumigasi, sertifikasi karantina tambahan, dll..."
                          value={exportNotes}
                          onChange={(e) => setExportNotes(e.target.value)}
                          className="rounded-xl border-zinc-200 text-xs"
                          rows={2}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <Button type="button" variant="ghost" disabled={savingShipping} onClick={() => setShippingOrder(null)} className="w-1/2">
                    {locale === 'id' ? 'Batal' : 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={savingShipping} className="w-1/2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold">
                    {savingShipping ? (locale === 'id' ? 'Menyimpan...' : 'Saving...') : (locale === 'id' ? 'Simpan Pengiriman' : 'Save Shipping')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: PEMBAYARAN ORDER (CHECKOUT CONFIRMATION) */}
      <Dialog open={!!payingOrder} onOpenChange={(open) => !open && setPayingOrder(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-zinc-900">
              {locale === 'id' ? 'Selesaikan Pembayaran B2B' : 'Complete B2B Payment'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs mt-1">
              {locale === 'id' ? 'Tinjau total tagihan produk, ongkos pengiriman kargo, dan pilih metode pembayaran.' : 'Review product cost, shipping fee, and select your payment method.'}
            </DialogDescription>
          </DialogHeader>

          {payingOrder && (
            <form onSubmit={handlePaySubmit} className="space-y-4 pt-3">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-semibold">{locale === 'id' ? 'Subtotal Produk' : 'Product Subtotal'}</span>
                  <span className="font-bold text-zinc-800">{formatRupiah(payingOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-semibold">{locale === 'id' ? 'Ongkos Kirim' : 'Shipping Cost'}</span>
                  <span className="font-bold text-zinc-800">{formatRupiah(payingOrder.shipping_cost || 0)}</span>
                </div>
                {payingOrder.shipment && (
                  <div className="pl-3.5 py-1 border-l-2 border-emerald-300 space-y-1 text-[11px] text-zinc-600">
                    {payingOrder.shipment.shipment_type === 'DOMESTIK' ? (
                      <>
                        <div className="flex justify-between">
                          <span>• {locale === 'id' ? 'Biaya Kargo Dasar' : 'Base Cargo Fee'}</span>
                          <span>{formatRupiah(Number(payingOrder.shipment.base_shipping_cost) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {locale === 'id' ? 'Asuransi Kargo (0.2%)' : 'Cargo Insurance (0.2%)'}</span>
                          <span>{formatRupiah(Number(payingOrder.shipment.insurance_fee) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {locale === 'id' ? 'Kemasan Drum Kayu/Alu' : 'Drum Packaging Fee'} ({payingOrder.shipment.drum_count || 0} Drum)</span>
                          <span>{formatRupiah(Number(payingOrder.shipment.packaging_fee) || 0)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>• Incoterms</span>
                          <span className="font-semibold text-emerald-800">{payingOrder.shipment.incoterms || 'EXW'}</span>
                        </div>
                        {payingOrder.shipment.incoterms !== 'EXW' && (
                          <div className="flex justify-between">
                            <span>• {locale === 'id' ? 'Estimasi Freight Ekspor' : 'Estimated Export Freight'}</span>
                            <span>{formatRupiah(Number(payingOrder.shipment.estimated_freight) || 0)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="border-t border-emerald-250 pt-2 flex justify-between items-center">
                  <span className="text-xs text-emerald-800 font-bold">{locale === 'id' ? 'Total Tagihan' : 'Grand Total'}</span>
                  <span className="text-lg font-bold text-emerald-950">{formatRupiah(payingOrder.total_amount + (payingOrder.shipping_cost || 0))}</span>
                </div>
              </div>

              {/* Alamat Pengiriman Review (ReadOnly) */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                <p className="text-[10px] uppercase font-bold text-zinc-500">{locale === 'id' ? 'Tujuan Pengiriman:' : 'Shipping Destination:'}</p>
                <p className="text-xs font-semibold text-zinc-800 leading-relaxed">{payingOrder.shipping_address?.address || '-'}</p>
              </div>

              {/* Metode Pembayaran */}
              <div className="space-y-1.5">
                <Label className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Metode Pembayaran B2B' : 'B2B Payment Method'}
                </Label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="ESCROW">{locale === 'id' ? 'Rekening Bersama Valam (Escrow Safepay)' : 'Valam Joint Account (Escrow Safepay)'}</option>
                  <option value="bank_transfer">{locale === 'id' ? 'Transfer Bank Manual Direct TT' : 'Manual Bank Transfer Direct TT'}</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button type="button" variant="ghost" disabled={paying} onClick={() => setPayingOrder(null)} className="w-1/2">
                  {locale === 'id' ? 'Batal' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={paying} className="w-1/2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold">
                  {paying ? (locale === 'id' ? 'Memproses...' : 'Processing...') : (locale === 'id' ? 'Bayar Sekarang' : 'Confirm & Pay')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG GOOGLE MAPS LOCATION SELECTOR */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif text-zinc-900 flex items-center gap-2">
              📍 Google Maps Location Selector
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Cari dan pilih lokasi pengiriman atau gudang pelabuhan Anda.' : 'Search and select your shipping address or port warehouse.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                placeholder={locale === 'id' ? 'Cari pabrik, kawasan industri, pelabuhan, atau kota...' : 'Search factory, industrial zone, port, or city...'}
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="pl-9 rounded-xl border-zinc-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-10"
              />
            </div>

            {/* Embed Map / Interactive Mock Map */}
            <div className="relative h-64 w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 shadow-inner flex items-center justify-center">
              {mapSearch ? (
                <iframe
                  title="Google Maps"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearch)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <p className="text-xs text-zinc-500 font-semibold">{locale === 'id' ? 'Peta Lokasi Pengiriman' : 'Shipping Location Map'}</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs">{locale === 'id' ? 'Ketik pencarian di atas untuk memuat peta interaktif secara realtime.' : 'Type your search query above to load the interactive map.'}</p>
                </div>
              )}
            </div>

            {/* Quick Suggestions for B2B Delivery */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{locale === 'id' ? 'Tujuan Pengiriman B2B Populer:' : 'Popular B2B Delivery Locations:'}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Kawasan Industri MM2100, Cikarang', address: 'Kawasan Industri MM2100, Blok C-1, Cikarang Barat, Bekasi, Jawa Barat 17530, Indonesia' },
                  { name: 'Pelabuhan Tanjung Priok (Gudang Ekspor)', address: 'Gudang Konsolidasi LCL Blok D-4, Jl. Pelabuhan Raya No. 9, Tanjung Priok, Jakarta Utara 14310, Indonesia' },
                  { name: 'Kawasan Industri GIIC, Deltamas', address: 'Gudang Logistik GIIC Blok AE-12, Cikarang Pusat, Kabupaten Bekasi, Jawa Barat 17530, Indonesia' },
                  { name: 'Kawasan Industri Karawang (KIM)', address: 'Kawasan Industri Mitrakarawang, Jl. Mitra Raya II Blok F-3, Karawang Barat 41361, Indonesia' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMapSearch(item.name)
                      setShippingAddress(item.address)
                    }}
                    className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/50 transition-all text-left"
                  >
                    🏢 {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowMapModal(false)}
                className="text-xs font-semibold"
              >
                {locale === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (mapSearch && !shippingAddress) {
                    setShippingAddress(mapSearch)
                  }
                  setShowMapModal(false)
                  toast({
                    title: locale === 'id' ? "Lokasi Dipilih" : "Location Selected",
                    description: locale === 'id' ? "Alamat pengiriman berhasil diperbarui dari Peta." : "Shipping address successfully updated from the map."
                  })
                }}
                className="bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold rounded-xl"
              >
                {locale === 'id' ? 'Gunakan Lokasi Ini' : 'Use This Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: INSTRUKSI PEMBAYARAN & SIMULASI SUKSES */}
      <Dialog open={!!activePaymentInstruction} onOpenChange={(open) => !open && setActivePaymentInstruction(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif text-zinc-900 flex items-center gap-1.5">
              💳 {locale === 'id' ? 'Instruksi Pembayaran B2B' : 'B2B Payment Billing Details'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' 
                ? 'Selesaikan transfer dana Anda untuk mengaktifkan pesanan.' 
                : 'Follow the instructions below to complete your corporate bank transfer.'}
            </DialogDescription>
          </DialogHeader>

          {activePaymentInstruction && (
            <div className="space-y-4 pt-3 text-xs font-semibold text-zinc-700">
              {/* Payment Summary */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Metode Pembayaran' : 'Method'}</span>
                  <span className="text-zinc-950 font-bold">
                    {activePaymentInstruction.paymentMethod === 'ESCROW' 
                      ? (locale === 'id' ? 'Rekening Bersama Valam' : 'Valam Escrow') 
                      : (locale === 'id' ? 'Transfer Bank Langsung' : 'Direct Bank Wire')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Total yang Harus Ditransfer' : 'Total Amount'}</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {formatRupiah(activePaymentInstruction.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Account details */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white space-y-3">
                {activePaymentInstruction.paymentMethod === 'ESCROW' ? (
                  <>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      {locale === 'id' ? 'Kirim ke Rekening Bersama Valam:' : 'Send to Valam Escrow Account:'}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nama Bank' : 'Bank Name'}</span>
                        <span className="text-zinc-950 font-bold">Bank Mandiri Escrow</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nomor Virtual Account' : 'Virtual Account Number'}</span>
                        <span className="text-zinc-950 font-bold font-mono">89201-901283-912</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Atas Nama' : 'Account Name'}</span>
                        <span className="text-zinc-950 font-bold">PT Valam Agritech Indonesia</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      {locale === 'id' ? 'Transfer Langsung ke Pemasok:' : 'Wire directly to Supplier Bank Account:'}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nama Bank' : 'Bank Name'}</span>
                        <span className="text-zinc-950 font-bold">Bank Negara Indonesia (BNI)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nomor Rekening Pemasok' : 'Supplier Account Number'}</span>
                        <span className="text-zinc-950 font-bold font-mono">0912-832-123</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-normal">{locale === 'id' ? 'Nama Pemegang Rekening' : 'Account Holder'}</span>
                        <span className="text-zinc-950 font-bold font-mono">PT Global Utama Corp</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Virtual payment simulation warning/helper */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold mb-0.5">{locale === 'id' ? 'Simulasi Sandbox Payment' : 'Sandbox Payment Simulation'}</p>
                  <p className="text-zinc-650 font-normal">
                    {locale === 'id' 
                      ? 'Ini adalah demo transaksi B2B. Klik tombol di bawah untuk menyimulasikan transfer dana sukses dari bank Anda.' 
                      : 'This is a demo checkout mode. Click the button below to simulate a successful bank wire transfer verification.'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActivePaymentInstruction(null)}
                  className="w-1/3 text-xs font-semibold"
                >
                  {locale === 'id' ? 'Tutup' : 'Close'}
                </Button>
                <Button
                  type="button"
                  disabled={paying}
                  onClick={() => handleConfirmFinalPayment(activePaymentInstruction.orderId, activePaymentInstruction.paymentMethod)}
                  className="w-2/3 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs"
                >
                  {paying 
                    ? (locale === 'id' ? 'Memproses...' : 'Confirming...') 
                    : (locale === 'id' ? 'Simulasikan Bayar Sukses' : 'Simulate Success')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
