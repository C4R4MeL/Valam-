'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Factory, AlertCircle, Clock, XCircle, RefreshCw, Loader2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah, validateOrderQuantity, getSupplierDisplayName } from '@/lib/utils'
import { CheckoutSkeleton } from '@/components/skeletons'

export default function CheckoutPage() {
  const { patchouliItems, circularItems, loading, removeItem, clearCart, fetchCart } = useCart()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Step 1 States
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  
  // Emsifa API States
  const [provinces, setProvinces] = useState<{ id: string, name: string }[]>([])
  const [cities, setCities] = useState<{ id: string, province_id: string, name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string, regency_id: string, name: string }[]>([])

  const [selectedProvince, setSelectedProvince] = useState<{ id: string, name: string } | null>(null)
  const [selectedCity, setSelectedCity] = useState<{ id: string, name: string } | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<{ id: string, name: string } | null>(null)

  const [biteshipAreaId, setBiteshipAreaId] = useState<string | null>(null)
  const [postalCode, setPostalCode] = useState<string>('')
  const [searchingArea, setSearchingArea] = useState(false)

  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [quoteGroups, setQuoteGroups] = useState<Record<string, any>>({})
  const [selectedRates, setSelectedRates] = useState<Record<string, string>>({})
  const [selectedRateDetails, setSelectedRateDetails] = useState<Record<string, any>>({})
  const [supplierNotes, setSupplierNotes] = useState<Record<string, string>>({})
  
  // Step 2 States
  const [agreedToEscrow, setAgreedToEscrow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Step 3 / Payment States
  const [orderResults, setOrderResults] = useState<{ supplier: string, orderId: string }[]>([])
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'pending' | 'error' | 'closed'>('idle')
  const [currentOrderId, setCurrentOrderId] = useState<string>('')
  const [isPolling, setIsPolling] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  const isId = locale === 'id'

  const searchParams = useSearchParams()
  const isCircular = searchParams.get('type') === 'circular'

  // Direct Buy Now mode
  const isDirect = searchParams.get('direct') === 'true'
  const directProductId = searchParams.get('productId') || ''
  const directQty = parseInt(searchParams.get('qty') || '1')
  const [directProduct, setDirectProduct] = useState<any>(null)
  const [directLoading, setDirectLoading] = useState(isDirect)

  // Fetch product for direct mode
  useEffect(() => {
    if (!isDirect || !directProductId) return
    const fetchDirectProduct = async () => {
      setDirectLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      try {
        // Try patchouli product first
        let res = await fetch(`${apiUrl}/products/${directProductId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setDirectProduct({
            id: `direct-${data.id}`,
            product_id: data.id,
            quantity_kg: directQty,
            subtotal: (data.price_per_kg || 0) * directQty,
            price: data.price_per_kg,
            is_circular: false,
            product: {
              ...data,
              supplier_name: data.supplier_name || data.supplier?.profile?.company_name || 'Koperasi Nilam',
              supplier_id: data.supplier_id || 'supplier-direct',
            }
          })
          setDirectLoading(false)
          return
        }

        // Try circular product
        res = await fetch(`${apiUrl}/circular-products/${directProductId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setDirectProduct({
            id: `direct-${data.id}`,
            product_id: data.id,
            quantity_kg: directQty,
            subtotal: (data.price || 0) * directQty,
            price: data.price,
            is_circular: true,
            product: {
              id: data.id,
              batch_code: data.name,
              nama: data.name,
              supplier_name: data.supplier ? getSupplierDisplayName(data.supplier) : 'Mitra Sirkular',
              supplier_id: data.supplier_id || 'mitra-direct',
              mitra_pengolah_nama: data.supplier ? getSupplierDisplayName(data.supplier) : 'Mitra Sirkular',
              mitra_pengolah_id: data.supplier_id,
              status: data.status,
              origin_district: data.supplier?.supplier_profile?.kabupaten || 'Aceh',
              pa_percentage: 0,
              moisture: 0,
              available_volume_kg: data.stock,
              stok_tersedia: data.stock,
              price_per_kg: data.price,
              harga_per_unit: data.price,
              min_order: data.supplier?.supplier_profile?.minimum_order || 1,
              category: data.category,
              description: data.description,
              unit: data.unit || 'Kg',
            }
          })
          setDirectLoading(false)
          return
        }

        throw new Error('Product not found')
      } catch (err) {
        console.error('Failed to fetch product for direct checkout:', err)
        toast({ title: 'Gagal Memuat Produk', description: 'Produk tidak ditemukan.', variant: 'destructive' })
        router.push('/marketplace')
        setDirectLoading(false)
      }
    }
    fetchDirectProduct()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirect, directProductId])

  const itemsToCheckout = useMemo(() => {
    if (isDirect && directProduct) {
      return [directProduct]
    }
    return isCircular ? circularItems : patchouliItems
  }, [isDirect, directProduct, isCircular, circularItems, patchouliItems])

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

  const shippingTotal = useMemo(() => {
    return Object.values(selectedRateDetails).reduce(
      (sum: number, rate: any) => sum + (Number(rate?.totalOngkir) || 0),
      0,
    )
  }, [selectedRateDetails])

  const itemsSubtotal = useMemo(() => {
    return Object.values(groupedItems).reduce((sum: number, grp: any) => sum + grp.totalSubtotal, 0)
  }, [groupedItems])

  const grandTotal = itemsSubtotal + shippingTotal

  // Redirect if cart empty on load (only if not already submitted and not in direct mode)
  useEffect(() => {
    if (isDirect) return // Don't redirect in direct mode
    if (!loading && (!itemsToCheckout || itemsToCheckout.length === 0) && step !== 3) {
      toast({ title: 'Keranjang Kosong', description: 'Silakan pilih produk terlebih dahulu.', variant: 'destructive' })
      router.push('/cart')
    }
  }, [loading, itemsToCheckout, step, router, toast, isDirect])

  // Fetch Provinces on mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error)
  }, [])

  // Fetch Cities when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([])
      setSelectedCity(null)
      return
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(console.error)
  }, [selectedProvince])

  // Fetch Districts when City changes
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([])
      setSelectedDistrict(null)
      return
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(console.error)
  }, [selectedCity])

  // Fetch Biteship Area ID when District changes
  useEffect(() => {
    if (!selectedDistrict || !selectedCity) {
      setBiteshipAreaId(null)
      setPostalCode('')
      setQuoteGroups({})
      setSelectedRates({})
      setSelectedRateDetails({})
      return
    }
    
    setSearchingArea(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const token = localStorage.getItem('valam_token')
    
    const query = `${selectedDistrict.name} ${selectedCity.name}`
    fetch(`${API_URL}/shipment/areas/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const areas = Array.isArray(data) ? data : data?.areas || []
        if (areas.length > 0) {
          setBiteshipAreaId(areas[0].id)
          setPostalCode(String(areas[0].postal_code || ''))
        } else {
          setBiteshipAreaId(null)
        }
      })
      .catch(console.error)
      .finally(() => setSearchingArea(false))
  }, [selectedDistrict, selectedCity])

  const fetchQuotes = useCallback(async () => {
    const supplierIds = Object.keys(groupedItems)
    if (!supplierIds.length || !biteshipAreaId) return

    setQuoting(true)
    setQuoteError('')
    setQuoteGroups({})
    setSelectedRates({})
    setSelectedRateDetails({})

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      const token = localStorage.getItem('valam_token')
      if (!token) {
        toast({ title: isId ? 'Sesi Berakhir' : 'Session Expired', description: isId ? 'Silakan login kembali.' : 'Please log in again.', variant: 'destructive' })
        router.push('/login')
        return
      }

      const groups = supplierIds.map((supplierId) => {
        const group = groupedItems[supplierId]
        return {
          supplierId,
          items: group.items.map((item: any) => {
            const isCirc = !!(item.is_circular || isCircular || item.circular_product_id)
            return {
              productId: isCirc ? undefined : (item.product_id || item.product?.id),
              circularProductId: isCirc
                ? (item.circular_product_id || item.product_id || item.product?.id)
                : undefined,
              quantityKg: item.quantity_kg,
            }
          }),
        }
      })

      const res = await fetch(`${API_URL}/shipment/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinationAddress: address.trim() || `${selectedDistrict?.name}, ${selectedCity?.name}, ${selectedProvince?.name}`,
          destinationPostalCode: String(postalCode || ''),
          destinationAreaId: biteshipAreaId,
          groups,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          Array.isArray(errData.message)
            ? errData.message.join(', ')
            : errData.message || `Gagal memuat ongkir (${res.status})`,
        )
      }

      const data = await res.json()
      const nextGroups: Record<string, any> = {}
      const nextRates: Record<string, string> = {}
      const nextDetails: Record<string, any> = {}

      for (const g of data.groups || []) {
        nextGroups[g.supplierId] = g
        if (g.rates?.length) {
          nextRates[g.supplierId] = g.rates[0].rateId
          nextDetails[g.supplierId] = g.rates[0]
        }
      }

      setQuoteGroups(nextGroups)
      setSelectedRates(nextRates)
      setSelectedRateDetails(nextDetails)
    } catch (err: any) {
      setQuoteError(err.message || (isId ? 'Gagal memuat ongkir.' : 'Failed to load shipping rates.'))
    } finally {
      setQuoting(false)
    }
  }, [groupedItems, address, isCircular, isId, toast, router])


  const handleSelectRate = (supplierId: string, rate: any) => {
    setSelectedRates((prev) => ({ ...prev, [supplierId]: rate.rateId }))
    setSelectedRateDetails((prev) => ({ ...prev, [supplierId]: rate }))
  }

  const handleNextToReview = () => {
    if (!contactName.trim() || !contactPhone.trim() || !address.trim() || !selectedProvince || !selectedCity || !selectedDistrict) {
      toast({ title: isId ? 'Data Belum Lengkap' : 'Data Incomplete', description: isId ? 'Mohon isi semua field pengiriman.' : 'Please fill all shipping fields.', variant: 'destructive' })
      return
    }
    if (!biteshipAreaId) {
      toast({ title: isId ? 'Area Tidak Didukung' : 'Area Not Supported', description: isId ? 'Area pengiriman tidak terdaftar di sistem ongkir Biteship.' : 'Shipping area is not supported for quotes.', variant: 'destructive' })
      return
    }
    const supplierIds = Object.keys(groupedItems)
    const missing = supplierIds.filter((id) => !selectedRates[id])
    if (missing.length || quoting) {
      toast({ title: isId ? 'Kurir Belum Lengkap' : 'Courier Incomplete', description: isId ? 'Pilih layanan kurir untuk setiap pemasok sebelum lanjut.' : 'Select a courier for every supplier before continuing.', variant: 'destructive' })
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

      if (!token) {
        toast({ title: isId ? 'Sesi Berakhir' : 'Session Expired', description: isId ? 'Silakan login kembali.' : 'Please log in again.', variant: 'destructive' })
        router.push('/login')
        setIsSubmitting(false)
        return
      }

      // 1. Call backend to create order + get Midtrans Snap token
      setPaymentStatus('processing')
      const res = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destinationAddress: {
            address: address.trim(),
            province: selectedProvince?.name,
            city: selectedCity?.name,
            district: selectedDistrict?.name,
            postal_code: postalCode || undefined,
            area_id: biteshipAreaId || undefined,
            contact_name: contactName.trim() || undefined,
            phone: contactPhone.trim() || undefined,
          },
          selectedRates,
          payment_method: isCircular ? 'DIRECT_TRANSFER' : 'ESCROW',
          ...(isDirect && directProduct ? {
            direct: true,
            product_id: directProduct.product_id,
            quantity_kg: directProduct.quantity_kg,
            price_per_kg: directProduct.price,
            is_circular: !!directProduct.is_circular || isCircular,
            type: (directProduct.is_circular || isCircular) ? 'circular' : 'patchouli',
          } : {})
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Checkout failed (${res.status})`)
      }

      const data = await res.json()
      const orderId = data.orderId
      const snapToken = data.snapToken

      setCurrentOrderId(orderId)
      const createdOrders: Array<{ orderId: string; orderNumber?: string }> =
        Array.isArray(data.orders) && data.orders.length
          ? data.orders
          : [{ orderId, orderNumber: data.orderNumber }]

      setOrderResults(Object.values(groupedItems).map((group: any, idx: number) => ({
        supplier: group.supplierName,
        orderId: createdOrders[idx]?.orderId || orderId
      })))

      // Save to localStorage for offline availability on /buyer/orders
      const existingSaved = localStorage.getItem('valam_buyer_orders_' + email)
      const existingOrders = existingSaved ? JSON.parse(existingSaved) : []
      const newOrdersFormatted = Object.entries(groupedItems).map(([supplierId, group]: [string, any], idx: number) => ({
        id: createdOrders[idx]?.orderId || orderId,
        order_number: createdOrders[idx]?.orderNumber || data.orderNumber || orderId,
        status: 'PENDING',
        payment_status: 'pending',
        total_amount: group.totalSubtotal,
        shipping_cost: selectedRateDetails[supplierId]?.totalOngkir || 0,
        shipping_address: {
          address,
          province: selectedProvince?.name,
          city: selectedCity?.name,
          district: selectedDistrict?.name,
          postal_code: postalCode || null,
          area_id: biteshipAreaId || null,
          courier: selectedRateDetails[supplierId]
            ? {
                rateId: selectedRateDetails[supplierId].rateId,
                kurirNama: selectedRateDetails[supplierId].kurirNama,
                serviceNama: selectedRateDetails[supplierId].serviceNama,
                estimasiHari: selectedRateDetails[supplierId].estimasiHari,
              }
            : null,
        },
        created_at: new Date().toISOString(),
        supplier: { profile: { company_name: group.supplierName } },
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
      }))
      localStorage.setItem('valam_buyer_orders_' + email, JSON.stringify([...newOrdersFormatted, ...existingOrders]))

      // Cart stays until payment succeeds (cleared by payment webhook).
      // Refresh cart badge only — do not remove items here.
      if (!isDirect) {
        await fetchCart()
      }

      // 2. Open Midtrans Snap popup — order already created with payment_status=pending
      if (snapToken && typeof window !== 'undefined' && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            setPaymentStatus('success')
            setStep(3)
            setIsSubmitting(false)
            // Verify with backend (don't trust frontend callback alone)
            startPolling(orderId)
          },
          onPending: (result) => {
            setPaymentStatus('pending')
            setStep(3)
            setIsSubmitting(false)
            startPolling(orderId)
          },
          onError: (result) => {
            setPaymentStatus('error')
            setStep(3)
            setIsSubmitting(false)
          },
          onClose: () => {
            // User closed popup without completing payment
            setPaymentStatus('closed')
            setStep(3)
            setIsSubmitting(false)
          },
        })
      } else {
        // Snap.js not loaded — fallback to redirect URL
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank')
          setPaymentStatus('pending')
          setStep(3)
          setIsSubmitting(false)
          startPolling(orderId)
        } else {
          // No snap.js and no redirect URL — show error
          toast({
            title: isId ? 'Payment Gateway Tidak Tersedia' : 'Payment Gateway Unavailable',
            description: isId ? 'Midtrans Snap tidak dapat dimuat. Coba muat ulang halaman.' : 'Midtrans Snap could not be loaded. Try reloading the page.',
            variant: 'destructive'
          })
          setPaymentStatus('error')
          setStep(3)
          setIsSubmitting(false)
        }
      }
    } catch (err: any) {
      console.error('Error submitting order:', err)
      toast({
        title: isId ? 'Gagal Membuat Pesanan' : 'Order Failed',
        description: err.message || (isId ? 'Terjadi kesalahan saat memproses checkout.' : 'An error occurred during checkout.'),
        variant: 'destructive'
      })
      setPaymentStatus('idle')
      setIsSubmitting(false)
    }
  }

  // Polling payment status from backend
  const startPolling = useCallback((orderId: string) => {
    setIsPolling(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const token = localStorage.getItem('valam_token')
    let attempts = 0
    const maxAttempts = 60 // 5 minutes at 5-second intervals

    // Clear any existing interval
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    pollIntervalRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setIsPolling(false)
        return
      }

      try {
        const res = await fetch(`${API_URL}/payment/status/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const statusData = await res.json()
          const ps = String(statusData.paymentStatus || '').toLowerCase()
          if (ps === 'paid' || ps === 'completed') {
            setPaymentStatus('success')
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setIsPolling(false)
            // Refresh cart after paid (backend clears purchased items)
            fetchCart().catch(() => {})
          } else if (ps === 'failed' || ps === 'cancelled') {
            setPaymentStatus('error')
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setIsPolling(false)
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 5000)
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // Handle retry payment (re-open Snap popup)
  const handleRetryPayment = async () => {
    if (!currentOrderId) return
    setIsSubmitting(true)
    setPaymentStatus('processing')

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      const token = localStorage.getItem('valam_token')

      const res = await fetch(`${API_URL}/orders/${currentOrderId}/retry-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to get payment token')

      const data = await res.json()
      const snapToken = data.snapToken

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            setPaymentStatus('success')
            setIsSubmitting(false)
            startPolling(currentOrderId)
          },
          onPending: () => {
            setPaymentStatus('pending')
            setIsSubmitting(false)
            startPolling(currentOrderId)
          },
          onError: () => {
            setPaymentStatus('error')
            setIsSubmitting(false)
          },
          onClose: () => {
            setPaymentStatus('closed')
            setIsSubmitting(false)
          },
        })
      }
    } catch (err: any) {
      toast({
        title: isId ? 'Gagal Membuka Pembayaran' : 'Payment Failed',
        description: err.message,
        variant: 'destructive'
      })
      setPaymentStatus('error')
      setIsSubmitting(false)
    }
  }

  if ((loading || directLoading) && step !== 3) {
    return <CheckoutSkeleton />
  }

  return (
    <div className="min-h-screen valam-grid-bg flex flex-col font-sans text-zinc-900 pb-20">
      {/* Header Minimalis */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === 2 ? (
              <button onClick={() => setStep(1)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : step === 1 ? (
              isDirect ? (
                <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 cursor-pointer">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <Link href="/cart" className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              )
            ) : <div className="w-9 h-9" />}
            <div className="flex items-center gap-2">
              {isDirect && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                  {isId ? '⚡ Beli Langsung' : '⚡ Buy Now'}
                </span>
              )}
              <h1 className="font-serif font-bold text-xl text-[#1B5E3A]">
                {isCircular ? (isId ? 'Checkout Eco Products' : 'Eco Products Checkout') : 'Checkout'}
              </h1>
            </div>
          </div>

          {/* Desktop Progress Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold">
            <span className={step === 1 ? 'text-[#1B5E3A] font-black' : 'text-zinc-400'}>1. {isId ? 'Pengiriman' : 'Shipping'}</span>
            <span className="w-4 h-px bg-zinc-300" />
            <span className={step === 2 ? 'text-[#1B5E3A] font-black' : 'text-zinc-400'}>2. {isId ? 'Review & Bayar' : 'Review & Pay'}</span>
            <span className="w-4 h-px bg-zinc-300" />
            <span className={step === 3 ? 'text-[#1B5E3A] font-black' : 'text-zinc-400'}>3. {isId ? 'Selesai' : 'Completed'}</span>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="md:hidden flex items-center px-3 py-1 rounded-full bg-[#1B5E3A]/5 border border-[#1B5E3A]/10">
            <span className="text-[10px] font-bold text-[#1B5E3A]">
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
                {isId ? 'Pilih area tujuan, lalu tentukan kurir/ongkir per pemasok sebelum bayar.' : 'Choose destination area, then pick courier/rates per supplier before paying.'}
              </p>
            </div>
            
            {/* Form Alamat */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#1B5E3A] font-bold">
                <MapPin className="w-5 h-5" />
                <h3>{isId ? 'Alamat Tujuan' : 'Destination Address'}</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{isId ? 'Nama Penerima' : 'Recipient Name'}</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={isId ? 'Nama PIC / gudang' : 'PIC / warehouse name'}
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm focus:border-[#1B5E3A] focus:ring-[#1B5E3A]/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{isId ? 'No. Telepon' : 'Phone'}</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm focus:border-[#1B5E3A] focus:ring-[#1B5E3A]/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{isId ? 'Provinsi' : 'Province'}</label>
                  <Select 
                    value={selectedProvince?.id || ''} 
                    onValueChange={(val) => {
                      const p = provinces.find(x => x.id === val)
                      setSelectedProvince(p || null)
                      setSelectedCity(null)
                      setSelectedDistrict(null)
                    }}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm focus:ring-[#1B5E3A]/20">
                      <SelectValue placeholder={isId ? 'Pilih Provinsi' : 'Select Province'} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{isId ? 'Kota/Kabupaten' : 'City/Regency'}</label>
                  <Select 
                    value={selectedCity?.id || ''} 
                    onValueChange={(val) => {
                      const c = cities.find(x => x.id === val)
                      setSelectedCity(c || null)
                      setSelectedDistrict(null)
                    }}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm focus:ring-[#1B5E3A]/20">
                      <SelectValue placeholder={isId ? 'Pilih Kota/Kab.' : 'Select City'} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">{isId ? 'Kecamatan' : 'District'}</label>
                  <Select 
                    value={selectedDistrict?.id || ''} 
                    onValueChange={(val) => {
                      const d = districts.find(x => x.id === val)
                      setSelectedDistrict(d || null)
                    }}
                    disabled={!selectedCity}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm focus:ring-[#1B5E3A]/20">
                      <SelectValue placeholder={isId ? 'Pilih Kecamatan' : 'Select District'} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {searchingArea && (
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> {isId ? 'Mencari area pengiriman...' : 'Configuring shipping area...'}
                </p>
              )}
              {biteshipAreaId && !searchingArea && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ {isId ? 'Area pengiriman tersedia' : 'Shipping area available'}
                </p>
              )}

              <Textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isId ? 'Alamat lengkap: nama jalan, nomor, RT/RW, patokan...' : 'Full address: street, number, landmarks...'}
                className="min-h-[100px] rounded-xl border-zinc-200 focus:border-[#1B5E3A] focus:ring-[#1B5E3A]/20 resize-none text-sm"
              />
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {isId ? 'Area digunakan untuk hitung ongkir Biteship; alamat detail untuk kurir.' : 'Area is used for Biteship quoting; detailed address is for the courier.'}
              </p>
            </div>

            {/* Kurir per supplier */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-[#1B5E3A] font-bold border-b border-zinc-100 pb-3">
                <Truck className="w-5 h-5" />
                <h3>{isId ? 'Kurir & Ongkir per Pemasok' : 'Courier & Rates per Supplier'}</h3>
              </div>

              {!biteshipAreaId && (
                <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
                  {isId ? 'Pilih Kecamatan di atas untuk memuat pilihan kurir.' : 'Select a District above to load courier options.'}
                </p>
              )}

              {quoting && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isId ? 'Menghitung ongkir Biteship...' : 'Calculating Biteship rates...'}
                </div>
              )}

              {quoteError && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  {quoteError}
                  {biteshipAreaId && (
                    <button
                      type="button"
                      onClick={() => fetchQuotes()}
                      className="ml-2 font-bold underline"
                    >
                      {isId ? 'Coba lagi' : 'Retry'}
                    </button>
                  )}
                </div>
              )}

              {biteshipAreaId && !quoting && !quoteError && (
                <div className="space-y-4">
                  {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => {
                    const quote = quoteGroups[supplierId]
                const rates = quote?.rates || []
                return (
                  <div key={supplierId} className="space-y-3 border border-zinc-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{group.supplierName}</p>
                        <p className="text-[11px] text-zinc-500">
                          {group.totalKg} {isCircular ? 'unit' : 'kg'} · {formatRupiah(group.totalSubtotal)}
                          {quote?.weightKg ? ` · billable ${quote.billedWeightKg?.toFixed?.(1) || quote.weightKg} kg` : ''}
                        </p>
                      </div>
                    </div>

                    {rates.length > 0 ? (
                      <div className="space-y-2">
                        {rates.map((rate: any) => {
                          const isSelected = selectedRates[supplierId] === rate.rateId
                          return (
                            <button
                              key={rate.rateId}
                              type="button"
                              onClick={() => handleSelectRate(supplierId, rate)}
                              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-[#1B5E3A] bg-emerald-50/60'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <p className="font-bold text-xs text-zinc-800">{rate.kurirNama} — {rate.serviceNama}</p>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">
                                    {isId ? 'Estimasi' : 'ETA'}: {rate.estimasiHari} {isId ? 'hari' : 'days'}
                                  </p>
                                </div>
                                <p className="font-black text-sm text-[#1B5E3A] shrink-0">{formatRupiah(rate.totalOngkir)}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-zinc-500 font-medium">
                                <span>{isId ? 'Dasar' : 'Base'}: {formatRupiah(rate.ongkirDasar)}</span>
                                <span>{isId ? 'Asuransi' : 'Insurance'}: {formatRupiah(rate.biayaAsuransi)}</span>
                                <span>{isId ? 'Packing' : 'Packaging'}: {formatRupiah(rate.biayaPengemasan)}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : biteshipAreaId && !quoting && !quoteError ? (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                        {isId ? 'Tidak ada layanan kurir untuk rute ini.' : 'No courier services for this route.'}
                      </p>
                    ) : null}
                  </div>
                )
              })}
              </div>
            )}
            </div>

            {/* Catatan Per Pemasok */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-[#1B5E3A] font-bold border-b border-zinc-100 pb-3">
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
                    className="min-h-[75px] rounded-xl text-sm border-zinc-200 focus:border-[#1B5E3A] focus:ring-[#1B5E3A]/20 resize-none"
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={handleNextToReview}
              disabled={quoting}
              className="w-full h-14 rounded-2xl bg-[#1B5E3A] hover:bg-[#123320] text-white font-bold text-base shadow-md shadow-[#1B5E3A]/20 transition-transform hover:scale-[1.01] cursor-pointer disabled:opacity-60"
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
                    <MapPin className="w-3.5 h-3.5 text-[#1B5E3A]" /> {isId ? 'Alamat Pengiriman' : 'Shipping Address'}
                  </span>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-[#1B5E3A] hover:underline cursor-pointer">
                    {isId ? 'Ubah' : 'Change'}
                  </button>
                </div>
                {(contactName || contactPhone) && (
                  <p className="text-xs font-bold text-zinc-800">
                    {[contactName, contactPhone].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-zinc-700 font-medium leading-relaxed">{address}</p>
                {(selectedProvince || selectedCity || selectedDistrict) && (
                  <p className="text-[10px] text-zinc-500">
                    {[selectedDistrict?.name, selectedCity?.name, selectedProvince?.name, postalCode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              
              {/* Ringkasan per Supplier */}
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([supplierId, group]: [string, any]) => {
                  const rate = selectedRateDetails[supplierId]
                  return (
                  <div key={supplierId} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCircular ? 'bg-[#C8922A]/10 text-[#C8922A]' : 'bg-[#1B5E3A]/10 text-[#1B5E3A]'}`}>
                          <Factory className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900">{group.supplierName}</h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCircular ? 'bg-[#C8922A]/10 text-[#C8922A]' : 'bg-[#1B5E3A]/10 text-[#1B5E3A]'}`}>
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

                    {rate && (
                      <div className="pt-3 border-t border-zinc-100 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-500 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            {rate.kurirNama} — {rate.serviceNama}
                          </span>
                          <span className="font-bold text-zinc-800">{formatRupiah(rate.totalOngkir)}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          ETA {rate.estimasiHari} {isId ? 'hari' : 'days'} · {isId ? 'Dasar' : 'Base'} {formatRupiah(rate.ongkirDasar)} + {isId ? 'asuransi' : 'insurance'} + packing
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-500">{isId ? `Subtotal ${group.supplierName}` : `${group.supplierName} Subtotal`}</span> 
                      <span className={`font-black ${isCircular ? 'text-[#C8922A]' : 'text-[#1B5E3A]'}`}>
                        {formatRupiah(group.totalSubtotal + (rate?.totalOngkir || 0))}
                      </span>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>

            {/* Kolom Kanan: Rincian Pembayaran & Tombol Bayar */}
            <div className="md:col-span-5">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white p-7 shadow-2xl shadow-zinc-200/60 md:sticky md:top-24 space-y-7 relative overflow-hidden group/payment">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>
                <h3 className="font-bold text-xl font-serif border-b border-zinc-100/80 pb-4">{isId ? 'Rincian Pembayaran' : 'Payment Summary'}</h3>
                
                <div className="space-y-2 pb-2 border-b border-zinc-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">{isId ? 'Subtotal Produk' : 'Items Subtotal'}</span>
                    <span className="font-bold text-zinc-800">{formatRupiah(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">{isId ? 'Total Ongkir' : 'Shipping Total'}</span>
                    <span className="font-bold text-zinc-800">{formatRupiah(shippingTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-500">{isId ? 'Total Tagihan' : 'Grand Total'}</span>
                  <span className={`text-4xl font-black ${isCircular ? 'bg-gradient-to-br from-[#C8922A] to-amber-500' : 'bg-gradient-to-br from-[#1B5E3A] to-emerald-500'} bg-clip-text text-transparent`}>
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                {/* Info Escrow / Proteksi */}
                <div className="relative overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-5 rounded-2xl border border-zinc-200/60 space-y-2.5">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isCircular ? 'bg-[#C8922A]' : 'bg-[#1B5E3A]'}`}></div>
                  <div className={`flex items-center gap-2.5 font-bold relative z-10 ${isCircular ? 'text-[#C8922A]' : 'text-[#1B5E3A]'}`}>
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <h4>{isCircular 
                      ? (isId ? 'Proteksi Transaksi VALAM' : 'VALAM Transaction Protection')
                      : (isId ? 'Pembayaran Rekening Bersama Escrow' : 'VALAM Escrow Payment')}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed relative z-10 font-medium">
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
                <label className={`flex items-start gap-3.5 p-4 bg-white/60 backdrop-blur-md border-2 border-zinc-100/80 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-200/40 group ${isCircular ? 'hover:border-[#C8922A]/40' : 'hover:border-[#1B5E3A]/40'} ${agreedToEscrow ? (isCircular ? 'border-[#C8922A]/50 bg-amber-50/30' : 'border-[#1B5E3A]/50 bg-emerald-50/30') : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={agreedToEscrow}
                    onChange={(e) => setAgreedToEscrow(e.target.checked)}
                    className={`mt-0.5 w-4 h-4 rounded border-zinc-300 transition-colors ${isCircular ? 'text-[#C8922A] focus:ring-[#C8922A]' : 'text-[#1B5E3A] focus:ring-[#1B5E3A]'}`}
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
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 cursor-pointer overflow-hidden relative group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                    isCircular
                      ? 'bg-gradient-to-r from-[#C8922A] to-[#E3A836] hover:from-[#B07E1F] hover:to-[#C8922A] text-white shadow-xl shadow-[#C8922A]/20 hover:shadow-2xl hover:shadow-[#C8922A]/40 hover:-translate-y-1'
                      : 'bg-gradient-to-r from-[#1B5E3A] to-[#2A8253] hover:from-[#134228] hover:to-[#1B5E3A] text-white shadow-xl shadow-[#1B5E3A]/20 hover:shadow-2xl hover:shadow-[#1B5E3A]/40 hover:-translate-y-1'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <span className="relative z-10 flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {isId ? 'Memproses Pesanan...' : 'Processing Order...'}
                      </>
                    ) : (isId ? 'Bayar Sekarang' : 'Pay Now')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 3: HASIL PEMBAYARAN */}
        {step === 3 && (
          <div className="max-w-xl mx-auto mt-6 animate-in zoom-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-10 border border-white shadow-2xl shadow-zinc-200/60 text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${paymentStatus === 'success' ? 'bg-gradient-to-r from-[#1B5E3A] via-emerald-400 to-[#1B5E3A]' : paymentStatus === 'error' ? 'bg-gradient-to-r from-red-600 via-red-400 to-red-600' : paymentStatus === 'pending' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500' : 'bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400'}`}></div>
              
              {/* PAYMENT SUCCESS */}
              {paymentStatus === 'success' && (
                <>
                  <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border border-emerald-100">
                      <CheckCircle2 className="w-14 h-14 drop-shadow-sm" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent mb-4">
                    {isId ? 'Pembayaran Berhasil!' : 'Payment Successful!'}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed font-medium">
                    {isId ? 'Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses oleh pemasok.' : 'Your payment has been confirmed. Your order is being processed by the supplier.'}
                  </p>
                  <Button asChild className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-gradient-to-r from-[#1B5E3A] to-[#257A4C] hover:from-[#134228] hover:to-[#1B5E3A] text-white font-bold shadow-xl shadow-[#1B5E3A]/20 hover:-translate-y-1 transition-all duration-300">
                    <Link href="/buyer/orders">
                      {isId ? 'Lihat Pesanan Saya' : 'View My Orders'}
                    </Link>
                  </Button>
                </>
              )}

              {/* PAYMENT PENDING */}
              {paymentStatus === 'pending' && (
                <>
                  <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse opacity-20"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-full flex items-center justify-center shadow-inner border border-amber-100">
                      <Clock className="w-14 h-14 drop-shadow-sm" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent mb-4">
                    {isId ? 'Menunggu Pembayaran' : 'Awaiting Payment'}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 mb-6 max-w-sm mx-auto leading-relaxed font-medium">
                    {isId 
                      ? 'Selesaikan pembayaran sesuai instruksi dari Midtrans. Status akan otomatis diperbarui.' 
                      : 'Complete your payment according to the Midtrans instructions. Status will update automatically.'}
                  </p>
                  {isPolling && (
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-700 font-bold mb-8 bg-amber-50 py-2.5 px-5 rounded-full w-max mx-auto shadow-sm border border-amber-100">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isId ? 'Memeriksa status pembayaran...' : 'Checking payment status...'}
                    </div>
                  )}
                  <Button asChild variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-bold transition-all hover:-translate-y-1 hover:shadow-md">
                    <Link href="/buyer/orders">
                      {isId ? 'Cek Nanti di Pesanan Saya' : 'Check Later in My Orders'}
                    </Link>
                  </Button>
                </>
              )}

              {/* PAYMENT ERROR */}
              {paymentStatus === 'error' && (
                <>
                  <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-red-100 to-red-50 text-red-600 rounded-full flex items-center justify-center shadow-inner border border-red-100">
                      <XCircle className="w-14 h-14 drop-shadow-sm" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent mb-4">
                    {isId ? 'Pembayaran Gagal' : 'Payment Failed'}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed font-medium">
                    {isId 
                      ? 'Pembayaran tidak berhasil diproses atau dibatalkan. Anda dapat mencoba kembali.' 
                      : 'Payment could not be processed or was cancelled. You can try again.'}
                  </p>
                  <Button
                    onClick={handleRetryPayment}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-xl shadow-red-600/20 hover:-translate-y-1 transition-all duration-300"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                    {isId ? 'Coba Bayar Lagi' : 'Retry Payment'}
                  </Button>
                </>
              )}

              {/* POPUP CLOSED */}
              {paymentStatus === 'closed' && (
                <>
                  <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-zinc-300 rounded-full animate-pulse opacity-30"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-50 text-zinc-500 rounded-full flex items-center justify-center shadow-inner border border-zinc-200">
                      <AlertCircle className="w-14 h-14 drop-shadow-sm" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent mb-4">
                    {isId ? 'Pembayaran Tertunda' : 'Payment Incomplete'}
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed font-medium">
                    {isId 
                      ? 'Anda menutup jendela pembayaran. Pesanan Anda telah tersimpan dengan aman dan Anda bisa melanjutkan pembayaran kapan saja.' 
                      : 'You closed the payment window. Your order is safely saved and you can continue payment anytime.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      onClick={handleRetryPayment}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-[#1B5E3A] to-[#257A4C] hover:from-[#134228] hover:to-[#1B5E3A] text-white font-bold shadow-xl shadow-[#1B5E3A]/20 hover:-translate-y-1 transition-all duration-300"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      {isId ? 'Lanjutkan Pembayaran' : 'Continue Payment'}
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold transition-all hover:-translate-y-1">
                      <Link href="/buyer/orders">
                        {isId ? 'Bayar Nanti' : 'Pay Later'}
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              {/* Order Reference Numbers */}
              {orderResults.length > 0 && (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 text-left space-y-3 mb-6">
                  <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-200 pb-2">
                    {isId ? 'Nomor Referensi Pesanan:' : 'Order References:'}
                  </h4>
                  <div className="space-y-2.5">
                    {orderResults.map(res => (
                      <div key={res.orderId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100 shadow-xs">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">{res.supplier}</p>
                          <p className="font-mono font-bold text-emerald-700 text-sm truncate">{res.orderId}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase shrink-0 ${
                          paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-800' :
                          paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          paymentStatus === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {paymentStatus === 'success' ? (isId ? 'Dibayar' : 'Paid') :
                           paymentStatus === 'pending' ? (isId ? 'Menunggu' : 'Pending') :
                           paymentStatus === 'error' ? (isId ? 'Gagal' : 'Failed') :
                           (isId ? 'Belum Bayar' : 'Unpaid')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button asChild className="w-full h-14 rounded-2xl bg-[#1B5E3A] hover:bg-[#123320] text-white font-bold text-base shadow-md cursor-pointer">
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
