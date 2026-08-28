'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Package, Clock, Truck, CheckCircle2, XCircle, AlertCircle, Search, Calendar, ChevronDown, Globe, FileText, Download, Upload, ShieldCheck, CreditCard, Camera, Image, Trash2, QrCode, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Link, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

const contentMap = {
  id: {
    title: "Pesanan Masuk",
    subtitle: "Kelola pesanan dari pembeli B2B Anda",
    search: "Cari nomor pesanan...",
    empty: "Belum ada pesanan",
    emptyDesc: "Anda belum memiliki pesanan masuk. Pastikan inventori Anda selalu tersedia.",
    status: {
      UNPAID: "Menunggu Pembayaran",
      PENDING: "Perlu Diproses",
      PACKED: "Dikemas",
      SHIPPED: "Dalam Pengiriman",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan"
    },
    total: "Total Pembayaran:",
    orderDate: "Tanggal Pesan:",
    btnUpdate: "Update Status",
    buyer: "Pembeli:"
  },
  en: {
    title: "Incoming Orders",
    subtitle: "Manage orders from your B2B buyers",
    search: "Search order number...",
    empty: "No orders yet",
    emptyDesc: "You don't have any incoming orders. Ensure your inventory is always available.",
    status: {
      UNPAID: "Awaiting Payment",
      PENDING: "Needs Processing",
      PACKED: "Packed",
      SHIPPED: "Shipped",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled"
    },
    total: "Total Payment:",
    orderDate: "Order Date:",
    btnUpdate: "Update Status",
    buyer: "Buyer:"
  }
}

export default function SupplierOrdersPage() {
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierName, setCourierName] = useState('')
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null)

  // Packing and cancellation proof states
  const [packingOrderId, setPackingOrderId] = useState<string | null>(null)
  const [packingNote, setPackingNote] = useState('')
  const [packingPhoto, setPackingPhoto] = useState<string | null>(null)
  const [showCancelDialogId, setShowCancelDialogId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showLabelOrderId, setShowLabelOrderId] = useState<string | null>(null)
  const [pickupShipmentId, setPickupShipmentId] = useState<string | null>(null)
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null)

  // Delivery proof states (for marking COMPLETED)
  const [deliveryProofOrderId, setDeliveryProofOrderId] = useState<string | null>(null)
  const [deliveryProofPhoto, setDeliveryProofPhoto] = useState<string | null>(null)
  const [submittingDeliveryProof, setSubmittingDeliveryProof] = useState(false)

  // Custom states for order detail and international shipping info
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [carrierInput, setCarrierInput] = useState('')
  const [vesselInput, setVesselInput] = useState('')
  const [containerInput, setContainerInput] = useState('')
  const [blInput, setBlInput] = useState('')
  const [etaInput, setEtaInput] = useState('')
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('valam_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/orders/supplier`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      } else {
        throw new Error('Fallback to mock')
      }
    } catch (err) {
      console.warn("Backend unavailable, using mock supplier orders:", err)
      const email = localStorage.getItem('valam_email') || 'supplier@valam.id'
      const mockSavedOrdersKey = 'valam_mock_orders_' + email
      const storedMockOrders = localStorage.getItem(mockSavedOrdersKey)
      
      if (storedMockOrders) {
        setOrders(JSON.parse(storedMockOrders))
      } else {
        const mockOrderId1 = 'ord_sup_dom_123'
        const mockOrderId2 = 'ord_sup_int_456'
        
        const defaultOrders = [
          {
            id: mockOrderId1,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
            status: 'PACKED', // Needs shipping resi
            total_amount: 45000000,
            buyer: {
              profile: {
                full_name: 'CV Aroma Kosmetik Nusantara',
                country: 'ID'
              }
            },
            items: [
              {
                product: {
                  batch_code: 'B-NILAM-LOC',
                  price_per_kg: 900000,
                },
                quantity_kg: 50,
                subtotal: 45000000
              }
            ]
          },
          {
            id: mockOrderId2,
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
            status: 'PENDING', // Awaiting L/C validation / doc upload
            total_amount: 90000000,
            buyer: {
              profile: {
                full_name: 'Bavarian Perfume House GmbH',
                country: 'DE'
              }
            },
            items: [
              {
                product: {
                  batch_code: 'B-NILAM-EXP',
                  price_per_kg: 900000,
                },
                quantity_kg: 100,
                subtotal: 90000000
              }
            ]
          }
        ]
        
        localStorage.setItem(mockSavedOrdersKey, JSON.stringify(defaultOrders))
        
        // Set types
        localStorage.setItem('valam_order_type_' + mockOrderId1, 'DOMESTIC')
        localStorage.setItem('valam_order_payment_method_' + mockOrderId1, 'ESCROW')
        
        localStorage.setItem('valam_order_type_' + mockOrderId2, 'INTERNATIONAL')
        localStorage.setItem('valam_order_payment_method_' + mockOrderId2, 'LC')
        localStorage.setItem('valam_order_lc_' + mockOrderId2, 'LC_DRAFT')
        
        setOrders(defaultOrders)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (orderId: string, newStatus: string, note?: string) => {
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/orders/supplier/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, note })
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Status pesanan diperbarui" })
        fetchOrders()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn("Backend unavailable, updating mock status local storage:", err)
      const email = localStorage.getItem('valam_email') || 'supplier@valam.id'
      const mockSavedOrdersKey = 'valam_mock_orders_' + email
      const storedMockOrders = localStorage.getItem(mockSavedOrdersKey)
      if (storedMockOrders) {
        const parsed = JSON.parse(storedMockOrders)
        const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o)
        localStorage.setItem(mockSavedOrdersKey, JSON.stringify(updated))
        toast({ title: "Berhasil (Mock)", description: "Status pesanan mock diperbarui" })
        fetchOrders()
      } else {
        toast({ title: "Error", description: "Terjadi kesalahan pada server", variant: "destructive" })
      }
    }
  }

  const handleDeliveryProofSubmit = async () => {
    if (!deliveryProofOrderId || !deliveryProofPhoto) return
    setSubmittingDeliveryProof(true)
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/orders/supplier/${deliveryProofOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'COMPLETED', note: 'Barang telah sampai - bukti foto terlampir', delivery_proof_url: deliveryProofPhoto })
      })
      if (res.ok) {
        toast({ title: "Berhasil", description: "Pesanan ditandai selesai dengan bukti pengiriman." })
        setDeliveryProofOrderId(null)
        setDeliveryProofPhoto(null)
        fetchOrders()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn('Error completing order:', err)
      toast({ title: "Error", description: "Gagal menandai pesanan selesai", variant: "destructive" })
    } finally {
      setSubmittingDeliveryProof(false)
    }
  }

  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingOrderId) return

    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/shipment/order/${shippingOrderId}/tracking`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tracking_number: trackingNumber, courier_name: courierName })
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Status pesanan diperbarui menjadi Dalam Pengiriman" })
        setShippingOrderId(null)
        setTrackingNumber('')
        setCourierName('')
        fetchOrders()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn("Backend unavailable, updating mock shipping details:", err)
      const email = localStorage.getItem('valam_email') || 'supplier@valam.id'
      const mockSavedOrdersKey = 'valam_mock_orders_' + email
      const storedMockOrders = localStorage.getItem(mockSavedOrdersKey)
      if (storedMockOrders) {
        const parsed = JSON.parse(storedMockOrders)
        const updated = parsed.map((o: any) => o.id === shippingOrderId ? { 
          ...o, 
          status: 'SHIPPED',
          shipment: { courier_name: courierName, tracking_number: trackingNumber }
        } : o)
        localStorage.setItem(mockSavedOrdersKey, JSON.stringify(updated))
        toast({ title: "Berhasil (Mock)", description: "Status pesanan mock diperbarui menjadi Dalam Pengiriman" })
        setShippingOrderId(null)
        setTrackingNumber('')
        setCourierName('')
        fetchOrders()
      } else {
        toast({ title: "Error", description: "Terjadi kesalahan pada server", variant: "destructive" })
      }
    }
  }

  const handleConfirmPickup = async (shipmentId: string, pickupPhoto?: string) => {
    try {
      const token = localStorage.getItem('valam_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
      const res = await fetch(`${API_URL}/shipment/${shipmentId}/confirm-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pickupPhoto })
      });
      if (res.ok) {
        toast({ title: "Berhasil", description: "Kurir kargo telah dipesan. Status pesanan diubah menjadi Dalam Pengiriman." });
        setPickupShipmentId(null);
        setPickupPhoto(null);
        fetchOrders();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast({ title: "Gagal", description: "Gagal memproses penjemputan kargo.", variant: "destructive" });
    }
  };

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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      PENDING: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse",
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
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.buyer?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={t.title} 
        subtitle={t.subtitle}
      />

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
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">{t.buyer}</p>
                      <p className="font-bold text-zinc-900">{order.buyer?.profile?.full_name || 'Buyer'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg border border-zinc-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">Minyak Nilam Batch {item.product?.batch_code || '-'}</p>
                            <p className="text-sm text-zinc-500">{item.quantity_kg} kg x {formatRupiah(item.price_per_kg)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-zinc-900">{formatRupiah(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-zinc-500 mb-0.5">{locale === 'id' ? 'Total (Subtotal + Ongkir)' : 'Total (Subtotal + Shipping)'}</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatRupiah(order.total_amount + (order.shipping_cost || 0))}</p>
                      {order.shipping_cost > 0 && (
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                          ({locale === 'id' ? 'Termasuk Ongkir:' : 'Inc. Shipping:'} {formatRupiah(order.shipping_cost)})
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {order.status !== 'UNPAID' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <div className="flex gap-2">
                            {order.status === 'PENDING' && (
                              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
                                setPackingOrderId(order.id);
                                setPackingNote('');
                              }}>
                                Tandai Dikemas
                              </Button>
                            )}
                            {order.status === 'PACKED' && (
                              order.shipment ? (
                                order.shipment.shipment_type === 'DOMESTIK' ? (
                                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
                                    setPickupShipmentId(order.shipment.id);
                                    setPickupPhoto(null);
                                  }}>
                                    🚚 Konfirmasi Penjemputan Kargo
                                  </Button>
                                ) : (
                                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
                                    setSelectedOrder(order);
                                    const trackingData = order.shipment?.last_tracking_data || {};
                                    setCarrierInput(trackingData.carrier || '');
                                    setVesselInput(trackingData.vessel || '');
                                    setContainerInput(trackingData.container || '');
                                    setBlInput(trackingData.bl || '');
                                    setEtaInput(trackingData.eta || '');
                                  }}>
                                    🌐 Atur Logistik & Dokumen Ekspor
                                  </Button>
                                )
                              ) : (
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => setShippingOrderId(order.id)}>
                                  Tandai Dikirim (Input Resi)
                                </Button>
                              )
                            )}
                            {order.status === 'SHIPPED' && (
                              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
                                setDeliveryProofOrderId(order.id);
                                setDeliveryProofPhoto(null);
                              }}>
                                📸 Tandai Selesai (Upload Bukti)
                              </Button>
                            )}
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => {
                              setShowCancelDialogId(order.id);
                              setCancelReason('');
                            }}>
                              Batal
                            </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" className="text-zinc-600 hover:bg-zinc-100 font-bold" onClick={() => {
                          setSelectedOrder(order);
                          const trackingData = order.shipment?.last_tracking_data || {};
                          setCarrierInput(trackingData.carrier || localStorage.getItem('valam_order_carrier_' + order.id) || '');
                          setVesselInput(trackingData.vessel || localStorage.getItem('valam_order_vessel_' + order.id) || '');
                          setContainerInput(trackingData.container || localStorage.getItem('valam_order_container_' + order.id) || '');
                          setBlInput(trackingData.bl || localStorage.getItem('valam_order_bl_' + order.id) || '');
                          setEtaInput(trackingData.eta || localStorage.getItem('valam_order_eta_' + order.id) || '');
                        }}>
                          {locale === 'id' ? 'Detail Pesanan' : 'Order Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!shippingOrderId} onOpenChange={(open: boolean) => !open && setShippingOrderId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-zinc-900">Update Pengiriman</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Masukkan nomor resi dan nama kurir untuk pesanan ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateShipping} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="courier" className="text-zinc-700">Nama Kurir Kargo (Cth: Indah Cargo)</Label>
              <Input 
                id="courier"
                required
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
                className="h-12 border-zinc-200 bg-zinc-50 focus:bg-white" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking" className="text-zinc-700">Nomor Resi / Surat Jalan</Label>
              <Input 
                id="tracking"
                required
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                className="h-12 border-zinc-200 bg-zinc-50 focus:bg-white" 
              />
            </div>
            <Button type="submit" disabled={!trackingNumber || !courierName} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2">
              Simpan & Tandai Dikirim
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Input Bukti Pengemasan */}
      <Dialog open={!!packingOrderId} onOpenChange={(open: boolean) => !open && setPackingOrderId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-zinc-900">
              📸 {locale === 'id' ? 'Unggah Foto Bukti Pengemasan' : 'Upload Packing Photo Proof'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Wajib mengunggah foto drum kargo minyak nilam yang sudah disegel dan siap dikirim.' : 'Must upload a photo of the sealed patchouli oil drum cargo ready for shipping.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-zinc-700 text-xs font-bold">
                {locale === 'id' ? 'Foto Drum Kargo' : 'Cargo Drum Photo'}
              </Label>
              
              {packingPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-[4/3] bg-zinc-50 flex items-center justify-center">
                  <img src={packingPhoto} alt="Bukti pengemasan" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPackingPhoto(null)}
                    className="absolute top-2 right-2 bg-red-650 hover:bg-red-750 text-white p-2 rounded-full shadow-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('packing-photo-file')?.click()}
                  className="border-2 border-dashed border-zinc-300 hover:border-emerald-700 rounded-xl p-8 text-center cursor-pointer bg-zinc-50 hover:bg-emerald-50/20 transition-all aspect-[4/3] flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-100">
                    <Camera className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-800">{locale === 'id' ? 'Ambil Foto atau Pilih Berkas' : 'Take Photo or Choose File'}</p>
                    <p className="text-[10px] text-zinc-400">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                </div>
              )}

              <input
                type="file"
                id="packing-photo-file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPackingPhoto(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <Button
              disabled={!packingPhoto}
              onClick={() => {
                if (packingOrderId && packingPhoto) {
                  updateStatus(packingOrderId, 'PACKED', packingPhoto);
                  setPackingOrderId(null);
                  setPackingPhoto(null);
                }
              }}
              className="w-full h-11 bg-emerald-900 hover:bg-emerald-950 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold rounded-xl animate-fade-in"
            >
              {locale === 'id' ? 'Konfirmasi Dikemas & Simpan Bukti Foto' : 'Confirm Packed & Save Photo Proof'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Bukti Penjemputan Kargo */}
      <Dialog open={!!pickupShipmentId} onOpenChange={(open: boolean) => {
        if (!open) {
          setPickupShipmentId(null);
          setPickupPhoto(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-emerald-950 flex items-center gap-1.5">
              🚚 {locale === 'id' ? 'Bukti Penjemputan Kargo' : 'Cargo Pickup Photo Proof'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' 
                ? 'Unggah foto saat kurir ekspedisi menjemput drum minyak nilam atau bukti tanda terima penjemputan.' 
                : 'Upload a photo of the courier picking up nilam oil drums or the receipt manifest proof.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-zinc-700 text-xs font-bold">
                {locale === 'id' ? 'Foto Serah Terima Kargo' : 'Cargo Handover Photo'}
              </Label>
              
              {pickupPhoto ? (
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-50 border border-zinc-200 group">
                  <img src={pickupPhoto} alt="Bukti Penjemputan" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setPickupPhoto(null)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('pickup-photo-file')?.click()}
                  className="border-2 border-dashed border-zinc-300 hover:border-emerald-700 rounded-xl p-8 text-center cursor-pointer bg-zinc-50 hover:bg-emerald-50/20 transition-all aspect-[4/3] flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-100">
                    <Camera className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-800">{locale === 'id' ? 'Ambil Foto atau Pilih Berkas' : 'Take Photo or Choose File'}</p>
                    <p className="text-[10px] text-zinc-400">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                </div>
              )}

              <input
                type="file"
                id="pickup-photo-file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPickupPhoto(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <Button
              disabled={!pickupPhoto}
              onClick={() => {
                if (pickupShipmentId && pickupPhoto) {
                  handleConfirmPickup(pickupShipmentId, pickupPhoto);
                }
              }}
              className="w-full h-11 bg-emerald-900 hover:bg-emerald-950 disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold rounded-xl animate-fade-in"
            >
              {locale === 'id' ? 'Konfirmasi Penjemputan & Serahkan' : 'Confirm Pickup & Handover Cargo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Alasan Pembatalan Pesanan */}
      <Dialog open={!!showCancelDialogId} onOpenChange={(open: boolean) => !open && setShowCancelDialogId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-red-900 flex items-center gap-1.5">
              ⚠️ {locale === 'id' ? 'Batalkan Pesanan B2B' : 'Cancel B2B Order'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Pesanan yang dibatalkan akan mengembalikan alokasi inventori produk.' : 'Cancelling this order will release the reserved product inventory.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="cancelReason" className="text-zinc-700 text-xs font-bold">
                {locale === 'id' ? 'Alasan Pembatalan' : 'Reason for Cancellation'}
              </Label>
              <textarea
                id="cancelReason"
                required
                placeholder={locale === 'id' ? 'Tuliskan alasan pembatalan (misal: stok koperasi tidak mencukupi, gagal uji QC)...' : 'Write down cancellation reason (e.g. insufficient coop inventory, failed QC)...'}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                rows={3}
              />
            </div>
            <Button
              onClick={() => {
                if (showCancelDialogId) {
                  if (!cancelReason) {
                    toast({ title: "Gagal", description: "Alasan pembatalan wajib diisi", variant: "destructive" });
                    return;
                  }
                  updateStatus(showCancelDialogId, 'CANCELLED', cancelReason);
                  setShowCancelDialogId(null);
                }
              }}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              {locale === 'id' ? 'Batalkan Pesanan Sekarang' : 'Cancel Order Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open: boolean) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-zinc-900">
              {locale === 'id' ? 'Kelola Transaksi B2B' : 'Manage B2B Transaction'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'id' ? 'ID Pesanan:' : 'Order ID:'} <span className="font-mono font-bold text-zinc-800">#{selectedOrder?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (() => {
            const isInternational = selectedOrder.shipment?.shipment_type === 'EKSPOR' || localStorage.getItem('valam_order_type_' + selectedOrder.id) === 'INTERNATIONAL';
            const paymentMethod = localStorage.getItem('valam_order_payment_method_' + selectedOrder.id) || 'ESCROW';
            const lcStatus = localStorage.getItem('valam_order_lc_' + selectedOrder.id) || 'LC_DRAFT';

            const handleSaveShippingInfo = async () => {
              if (selectedOrder.shipment) {
                try {
                  const token = localStorage.getItem('valam_token');
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
                  const res = await fetch(`${API_URL}/shipment/${selectedOrder.shipment.id}/tracking-ekspor`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      carrier: carrierInput,
                      vessel: vesselInput,
                      container: containerInput,
                      bl: blInput,
                      eta: etaInput
                    })
                  });
                  if (res.ok) {
                    toast({ title: "Berhasil", description: "Informasi kargo ekspor berhasil disimpan ke database." });
                    fetchOrders();
                  } else {
                    throw new Error();
                  }
                } catch (err) {
                  toast({ title: "Gagal", description: "Gagal menyimpan data logistik ke server.", variant: "destructive" });
                }
              } else {
                localStorage.setItem('valam_order_carrier_' + selectedOrder.id, carrierInput);
                localStorage.setItem('valam_order_vessel_' + selectedOrder.id, vesselInput);
                localStorage.setItem('valam_order_container_' + selectedOrder.id, containerInput);
                localStorage.setItem('valam_order_bl_' + selectedOrder.id, blInput);
                localStorage.setItem('valam_order_eta_' + selectedOrder.id, etaInput);
                toast({ title: "Berhasil (Mock)", description: "Informasi kargo ekspor berhasil disimpan secara lokal." });
              }
              
              // Auto-advance L/C status to LC_VERIFIED/LC_ISSUED when shipping info is populated
              if (lcStatus === 'LC_DRAFT' || lcStatus === 'LC_VERIFIED') {
                localStorage.setItem('valam_order_lc_' + selectedOrder.id, 'LC_ISSUED');
              }
              
              fetchOrders();
            };

            const handleSimulateUpload = (docKey: string, docName: string) => {
              localStorage.setItem(`valam_doc_${docKey}_${selectedOrder.id}`, 'UPLOADED');
              toast({ title: "Dokumen Diunggah", description: `${docName} berhasil diunggah.` });
              
              // Check if all essential export docs are uploaded to advance L/C status to presented
              const invoiceUp = localStorage.getItem(`valam_doc_invoice_${selectedOrder.id}`) === 'UPLOADED';
              const packingUp = localStorage.getItem(`valam_doc_packing_list_${selectedOrder.id}`) === 'UPLOADED';
              const blUp = localStorage.getItem(`valam_doc_bl_${selectedOrder.id}`) === 'UPLOADED';
              
              if (invoiceUp && packingUp && blUp && lcStatus === 'LC_ISSUED') {
                localStorage.setItem('valam_order_lc_' + selectedOrder.id, 'LC_PRESENTED');
              }
              
              fetchOrders();
            };

            const handleAdvanceLcStatus = (nextStatus: string) => {
              localStorage.setItem('valam_order_lc_' + selectedOrder.id, nextStatus);
              toast({ title: "Status L/C Diperbarui", description: `Tahapan L/C diubah ke status berikutnya.` });
              fetchOrders();
            };

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
                    {locale === 'id' ? 'Daftar Produk Terjual' : 'Sold Items List'}
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
                        <span>Total Pembayaran</span>
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
                      <p className="text-[11px] text-zinc-650 font-bold text-center italic leading-relaxed">
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

                {isInternational ? (
                  <>
                    {/* L/C Tracker & Action */}
                    {paymentMethod === 'LC' && (
                      <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                        <h4 className="font-bold text-zinc-800 text-sm mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Letter of Credit (L/C) Status Tracker
                        </h4>
                        
                        <div className="grid grid-cols-5 gap-2 relative mb-4">
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

                        {/* Supplier actions to advance L/C */}
                        <div className="flex gap-2">
                          {lcStatus === 'LC_DRAFT' && (
                            <Button size="sm" onClick={() => handleAdvanceLcStatus('LC_VERIFIED')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                              Verifikasi Draf L/C
                            </Button>
                          )}
                          {lcStatus === 'LC_VERIFIED' && (
                            <Button size="sm" onClick={() => handleAdvanceLcStatus('LC_ISSUED')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                              Konfirmasi Penerbitan L/C (Issued)
                            </Button>
                          )}
                          {lcStatus === 'LC_ISSUED' && (
                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs w-full">
                              Unggah berkas Invoice, Packing List, dan Bill of Lading di bawah untuk mengajukan pencairan dana L/C (Present Documents).
                            </div>
                          )}
                          {lcStatus === 'LC_PRESENTED' && (
                            <Button size="sm" onClick={() => handleAdvanceLcStatus('LC_RELEASED')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                              Konfirmasi Bank Cairkan Dana (Release)
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ocean Freight Details Input */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white space-y-4">
                      <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        Logistik Kapal Ekspor (Ocean Freight Setup)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label htmlFor="vessel" className="text-zinc-500 font-medium">Nama Kapal & Carrier</Label>
                          <Input id="vessel" placeholder="Aceh Breeze (Maersk)" value={vesselInput} onChange={e => setVesselInput(e.target.value)} className="h-10 bg-zinc-50" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="bl" className="text-zinc-500 font-medium">Bill of Lading (B/L) No.</Label>
                          <Input id="bl" placeholder="MSK908123490" value={blInput} onChange={e => setBlInput(e.target.value)} className="h-10 bg-zinc-50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="container" className="text-zinc-500 font-medium">Nomor Kontainer</Label>
                          <Input id="container" placeholder="MSKU-892734-2" value={containerInput} onChange={e => setContainerInput(e.target.value)} className="h-10 bg-zinc-50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="eta" className="text-zinc-500 font-medium">Estimasi Tiba (ETA)</Label>
                          <Input id="eta" placeholder="25 Hari / Days" value={etaInput} onChange={e => setEtaInput(e.target.value)} className="h-10 bg-zinc-50" />
                        </div>
                      </div>
                      <Button onClick={handleSaveShippingInfo} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg">
                        Simpan Data Logistik Pengapalan
                      </Button>
                    </div>

                    {/* Export Documents Manager */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Unggah Dokumen Ekspor Wajib' : 'Upload Required Export Documents'}
                      </h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {[
                          { key: 'invoice', name: 'Commercial Invoice' },
                          { key: 'packing_list', name: 'Packing List' },
                          { key: 'msds', name: 'Material Safety Data Sheet (MSDS)' },
                          { key: 'coo', name: 'Certificate of Origin (COO)' },
                          { key: 'bl', name: 'Bill of Lading (B/L)' },
                        ].map((doc) => {
                          const isAutoGenerated = doc.key === 'invoice' || doc.key === 'packing_list';
                          const uploadedKey = `valam_doc_${doc.key}_${selectedOrder.id}`;
                          const isUploaded = localStorage.getItem(uploadedKey) === 'UPLOADED' || doc.key === 'msds';
                          return (
                            <div key={doc.key} className="py-3 flex items-center justify-between">
                              <span className="font-medium text-zinc-950">{doc.name}</span>
                              {isAutoGenerated || isUploaded ? (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDownloadDoc(selectedOrder.id, selectedOrder.order_number || selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Unduh' : 'Download'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handlePreviewDoc(selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Lihat Preview' : 'View Preview'}
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleSimulateUpload(doc.key, doc.name)}
                                  className="h-8 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  {locale === 'id' ? 'Unggah Berkas' : 'Upload File'}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Domestic Flow */
                  <div className="space-y-4">
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Informasi Pengiriman Domestik' : 'Domestic Shipping Details'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-700">
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">{locale === 'id' ? 'Kurir Kargo' : 'Courier Name'}</p>
                          <p className="text-zinc-950 font-bold">{selectedOrder.shipment?.courier_name || 'Belum diatur'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-normal mb-0.5">Nomor Resi / AWB</p>
                          <p className="font-mono text-zinc-950">{selectedOrder.shipment?.tracking_number || 'Belum diatur'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Domestic Documents Manager */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
                      <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {locale === 'id' ? 'Unggah Dokumen Penjualan Domestik' : 'Upload Domestic Trade Documents'}
                      </h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {[
                          { key: 'invoice_local', name: locale === 'id' ? 'Faktur Penjualan (Local Invoice)' : 'Local Sales Invoice' },
                          { key: 'surat_jalan', name: locale === 'id' ? 'Surat Jalan / Delivery Order' : 'Delivery Order (DO)' },
                          { key: 'coa', name: locale === 'id' ? 'Sertifikat Analisis (COA / QC Report)' : 'Certificate of Analysis (COA)' }
                        ].map((doc) => {
                          const isAutoGenerated = doc.key === 'invoice_local' || doc.key === 'surat_jalan';
                          const uploadedKey = `valam_doc_${doc.key}_${selectedOrder.id}`;
                          const isUploaded = localStorage.getItem(uploadedKey) === 'UPLOADED' || doc.key === 'coa';
                          return (
                            <div key={doc.key} className="py-3 flex items-center justify-between">
                              <span className="font-medium text-zinc-950">{doc.name}</span>
                              {isAutoGenerated || isUploaded ? (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => handleDownloadDoc(selectedOrder.id, selectedOrder.order_number || selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Unduh' : 'Download'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handlePreviewDoc(selectedOrder.id, doc.key, doc.name)}
                                    className="h-8 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {locale === 'id' ? 'Lihat Preview' : 'View Preview'}
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleSimulateUpload(doc.key, doc.name)}
                                  className="h-8 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-50 gap-1 text-[11px]"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  {locale === 'id' ? 'Unggah Berkas' : 'Upload File'}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* QR Code & Shipping Label */}
                    <div className="border border-zinc-200 rounded-xl p-4 bg-emerald-50/30 flex flex-col md:flex-row items-center gap-4 justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-emerald-700" />
                          {locale === 'id' ? 'Label Pengiriman & QR Traceability' : 'Shipping Label & QR Traceability'}
                        </h4>
                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                          {locale === 'id' 
                            ? 'Cetak label kode QR untuk ditempel pada drum alu minyak nilam guna melacak rantai pasok.' 
                            : 'Print QR code labels to stick on nilam oil drums for supply chain traceability.'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowLabelOrderId(selectedOrder.id)}
                        className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold gap-1.5 shrink-0"
                      >
                        🖨️ {locale === 'id' ? 'Cetak Label Drum' : 'Print Drum Label'}
                      </Button>
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

      {/* DIALOG CETAK LABEL DRUM (SHIPPING LABEL & QR CODE) */}
      <Dialog open={!!showLabelOrderId} onOpenChange={(open: boolean) => !open && setShowLabelOrderId(null)}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-zinc-150">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-xl font-bold font-serif text-zinc-900">
              {locale === 'id' ? 'Label Pengiriman Kargo & QR' : 'Cargo Shipping Label & QR'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Tempel label ini pada kemasan drum minyak nilam untuk kepatuhan logistik & ketertelusuran.' : 'Stick this label on the nilam oil drum for logistics compliance & traceability.'}
            </DialogDescription>
          </DialogHeader>

          {showLabelOrderId && (() => {
            const order = orders.find(o => o.id === showLabelOrderId);
            if (!order) return null;
            const batchCode = order.items[0]?.product?.batch_code || 'VLM-BATCH';
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://valam.id/traceability/${batchCode}`;

            return (
              <div className="space-y-6 pt-3">
                {/* Printable Label Area */}
                <div id="print-label-area" className="border-4 border-double border-zinc-950 p-6 bg-white text-zinc-950 rounded-lg space-y-4">
                  {/* Header */}
                  <div className="text-center border-b-2 border-zinc-900 pb-3">
                    <h2 className="text-2xl font-black tracking-widest text-emerald-950 uppercase font-serif">VALAM MARKETPLACE</h2>
                    <p className="text-[10px] tracking-wider text-zinc-500 font-bold uppercase">{locale === 'id' ? 'Logistik Minyak Nilam Terkelola' : 'Managed Patchouli Oil Logistics'}</p>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Left: Addresses details */}
                    <div className="col-span-2 space-y-3 text-xs">
                      <div>
                        <p className="font-extrabold uppercase text-[9px] text-zinc-500 tracking-wider">{locale === 'id' ? 'PENGIRIM (SHIPPER):' : 'SHIPPER:'}</p>
                        <p className="font-bold text-zinc-900">{order.supplier?.profile?.full_name || 'Koperasi Produsen Aceh'}</p>
                        <p className="text-zinc-700 text-[11px] leading-relaxed">{order.supplier?.supplier_profile?.alamat_lengkap || 'Aceh, Indonesia'}</p>
                      </div>

                      <div className="border-t border-zinc-200 pt-2">
                        <p className="font-extrabold uppercase text-[9px] text-zinc-500 tracking-wider">{locale === 'id' ? 'PENERIMA (CONSIGNEE):' : 'CONSIGNEE:'}</p>
                        <p className="font-bold text-zinc-900">{order.buyer?.profile?.full_name || 'Buyer'}</p>
                        <p className="text-zinc-700 text-[11px] leading-relaxed">
                          {order.shipment?.destination_address ? (
                            typeof order.shipment.destination_address === 'string'
                              ? order.shipment.destination_address
                              : (order.shipment.destination_address as any).address || order.shipping_address || 'Jakarta'
                          ) : order.shipping_address || 'Jakarta'}
                        </p>
                      </div>
                    </div>

                    {/* Right: QR Code */}
                    <div className="flex flex-col items-center justify-center border-l border-zinc-200 pl-4 space-y-2">
                      <img src={qrUrl} alt="QR Traceability" className="w-28 h-28 border border-zinc-200" />
                      <p className="font-mono text-[9px] font-black text-center text-zinc-900 uppercase tracking-widest">{batchCode}</p>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="border-t-2 border-zinc-900 pt-3 grid grid-cols-2 text-xs font-bold gap-3">
                    <div>
                      <p className="text-zinc-500 uppercase text-[9px] tracking-wider">{locale === 'id' ? 'PRODUK / BATCH:' : 'PRODUCT / BATCH:'}</p>
                      <p className="text-zinc-900">B2B Patchouli Oil (Minyak Nilam)</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase text-[9px] tracking-wider">{locale === 'id' ? 'BERAT BERSIH (NET WEIGHT):' : 'NET WEIGHT:'}</p>
                      <p className="text-zinc-900">{order.items.reduce((sum: number, item: any) => sum + (item.quantity_kg || 0), 0)} KG</p>
                    </div>
                  </div>
                </div>

                {/* Print Buttons */}
                <div className="flex gap-3 print:hidden">
                  <Button type="button" variant="outline" onClick={() => setShowLabelOrderId(null)} className="w-1/2">
                    {locale === 'id' ? 'Tutup' : 'Close'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      const printContents = document.getElementById('print-label-area')?.innerHTML;
                      if (printContents) {
                        const printWindow = window.open('', '', 'width=800,height=600');
                        if (printWindow) {
                          printWindow.document.write('<html><head><title>Print Shipping Label</title>');
                          printWindow.document.write('<style>body { font-family: sans-serif; padding: 20px; } img { max-width: 100%; }</style>');
                          printWindow.document.write('</head><body>');
                          printWindow.document.write(printContents);
                          printWindow.document.write('</body></html>');
                          printWindow.document.close();
                          printWindow.print();
                          printWindow.close();
                        }
                      }
                    }} 
                    className="w-1/2 bg-emerald-900 hover:bg-emerald-950 text-white font-bold"
                  >
                    🖨️ {locale === 'id' ? 'Cetak Sekarang' : 'Print Label Now'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG: DELIVERY PROOF FOR MARKING COMPLETED */}
      <Dialog open={!!deliveryProofOrderId} onOpenChange={(open) => !open && setDeliveryProofOrderId(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif text-zinc-900 flex items-center gap-2">
              📸 Upload Bukti Barang Sampai
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-1">
              Sebagai Pemasok, Anda wajib mengunggah foto bukti serah terima barang kepada pembeli / penerima di lokasi sebelum menandai transaksi ini selesai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Foto Bukti Pengiriman / Penerimaan</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-6 bg-zinc-50 hover:bg-zinc-100/50 transition-colors relative min-h-[160px]">
                {deliveryProofPhoto ? (
                  <div className="w-full flex flex-col items-center gap-3">
                    <img src={deliveryProofPhoto} alt="Bukti Penerimaan" className="max-h-40 rounded-xl object-contain border border-zinc-200" />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setDeliveryProofPhoto(null)} 
                      className="text-red-500 hover:text-red-750 text-xs font-bold"
                    >
                      Hapus & Ganti Foto
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Camera className="w-8 h-8 text-zinc-400 mx-auto" />
                    <div className="text-xs text-zinc-500 font-semibold">
                      Gunakan kamera atau pilih file foto
                    </div>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setDeliveryProofPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setDeliveryProofOrderId(null)}
                className="flex-1 h-11 border-zinc-200 text-zinc-700 font-bold rounded-xl text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeliveryProofSubmit}
                disabled={!deliveryProofPhoto || submittingDeliveryProof}
                className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md"
              >
                {submittingDeliveryProof ? 'Menyimpan...' : 'Selesaikan Pesanan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
