  'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Factory, MapPin, FileText, ShoppingCart, Info, MessageSquare, FlaskConical, Tractor, Microscope, Warehouse, ShieldCheck, Star, Download, Beaker, Globe, Leaf } from 'lucide-react'
import { mockProducts, mockCircularProducts, formatRupiah } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { RadarChart } from '@/components/marketplace/RadarChart'
import { ParameterGauge } from '@/components/marketplace/ParameterGauge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from '@/i18n/routing'
import { useCart } from '@/components/providers/CartProvider'

const resolveProductImage = (imagePath?: string) => {
  if (!imagePath) return '/images/premium_oil_dark.png';
  if (imagePath.includes('compost')) {
    return "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=400&fit=crop";
  }
  if (imagePath.includes('biochar')) {
    return "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=600&h=400&fit=crop";
  }
  if (imagePath.includes('hydrosol')) {
    return "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&h=400&fit=crop";
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads/')) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
    const origin = API_URL.replace(/\/api$/, '');
    return `${origin}${imagePath}`;
  }
  return imagePath;
}

const contentMap = {
  id: {
    notFound: {
      title: "Produk tidak ditemukan",
      desc: "Batch yang Anda cari mungkin sudah terjual atau tidak tersedia.",
      btnBack: "Kembali ke Etalase"
    },
    breadcrumb: {
      marketplace: "Marketplace",
      category: "Minyak Nilam"
    },
    supplier: {
      partner: "Mitra Pemasok",
      partnerBadge: "Mitra Binaan Valam",
      profile: "Profil Pemasok",
      sales: "Penjualan Total",
      rating: "Rating",
      location: "Lokasi",
      btnViewStore: "Lihat Toko Pemasok"
    },
    hero: {
      verified: "Terverifikasi Lab",
      titleStart: "Minyak Nilam Aceh",
      titleEnd: "(Patchouli Oil)",
      batchPrefix: "Batch:",
      pure: "100% Pure Essential Oil",
      originTitle: "Terroir Asal",
      originDescPrefix: "Desa",
      paTitle: "Kadar Patchouli Alcohol",
      paDescTestedPrefix: "Diuji"
    },
    tabs: {
      specs: "Spesifikasi",
      coa: "CoA",
      traceability: "Traceability"
    },
    specs: {
      title: "Parameter Kimiawi",
      desc: "Hasil pengujian spektrometer & GC-MS",
      radarStandard: "Standar SNI",
      radarResult: "Hasil Lab Batch",
      infoText: "Minyak nilam ini memiliki kadar PA {pa}%, melampaui standar minimal industri (30%) dengan tingkat kejernihan premium."
    },
    coa: {
      title: "Certificate of Analysis (CoA)",
      desc: "Sertifikat hasil uji laboratorium resmi (GC-MS)",
      btnDownload: "Unduh PDF",
      verifiedTitle: "Dokumen Terverifikasi",
      verifiedDesc: "Batch ini telah lolos standar kontrol kualitas internal Valam dan teruji oleh laboratorium independen.",
      btnDownloadFull: "Unduh Dokumen Penuh"
    },
    trace: {
      title: "Jejak Perjalanan (Traceability)",
      step1: "Tahap 1",
      step1Title: "Panen Daun Nilam",
      step1Desc: "Diobservasi di perkebunan Desa {village} oleh kelompok tani binaan.",
      step2: "Tahap 2",
      step2Title: "Penyulingan (Distilasi)",
      step2Desc: "Diekstraksi menggunakan metode penyulingan uap bertekanan rendah selama 72 jam.",
      step3: "Tahap 3",
      step3Title: "Pengujian Laboratorium",
      step3Desc: "Lulus uji GC-MS pada {date} dengan standar kualitas ekspor.",
      step4: "Tahap 4",
      step4Title: "Penyimpanan Terstandar",
      step4Desc: "Disimpan di suhu dan kelembaban terkontrol dalam drum *stainless steel* (Food Grade)."
    },
    checkout: {
      priceLabel: "Harga B2B / Kg",
      stockLabel: "Stok Tersedia",
      minOrderLabel: "Minimum Order",
      shippingLabel: "Kondisi Pengiriman",
      btnBuy: "Beli Sekarang",
      btnAddToCart: "Masukkan Keranjang",
      btnOffer: "Ajukan Penawaran",
      btnSample: "Minta Sampel (10ml)",
      protectionText: "Pembayaran dilindungi secara otomatis melalui Sistem Rekening Bersama (Escrow) hingga barang diterima dan lolos verifikasi."
    }
  },
  en: {
    notFound: {
      title: "Product not found",
      desc: "The batch you are looking for may have been sold or is unavailable.",
      btnBack: "Back to Marketplace"
    },
    breadcrumb: {
      marketplace: "Marketplace",
      category: "Patchouli Oil"
    },
    supplier: {
      partner: "Supply Partner",
      partnerBadge: "Valam Partner",
      profile: "Supplier Profile",
      sales: "Total Sales",
      rating: "Rating",
      location: "Location",
      btnViewStore: "View Supplier Store"
    },
    hero: {
      verified: "Lab Verified",
      titleStart: "Aceh Patchouli Oil",
      titleEnd: "(Patchouli Oil)",
      batchPrefix: "Batch:",
      pure: "100% Pure Essential Oil",
      originTitle: "Origin Terroir",
      originDescPrefix: "Village",
      paTitle: "Patchouli Alcohol Content",
      paDescTestedPrefix: "Tested"
    },
    tabs: {
      specs: "Specifications",
      coa: "CoA",
      traceability: "Traceability"
    },
    specs: {
      title: "Chemical Parameters",
      desc: "Spectrometer & GC-MS test results",
      radarStandard: "SNI Standard",
      radarResult: "Batch Lab Result",
      infoText: "This patchouli oil has a PA content of {pa}%, exceeding the industry minimum standard (30%) with premium clarity."
    },
    coa: {
      title: "Certificate of Analysis (CoA)",
      desc: "Official laboratory test certificate (GC-MS)",
      btnDownload: "Download PDF",
      verifiedTitle: "Verified Document",
      verifiedDesc: "This batch has passed Valam's internal quality control standards and has been tested by an independent laboratory.",
      btnDownloadFull: "Download Full Document"
    },
    trace: {
      title: "Journey Traceability",
      step1: "Phase 1",
      step1Title: "Patchouli Leaf Harvest",
      step1Desc: "Observed at the {village} village plantation by fostered farmer groups.",
      step2: "Phase 2",
      step2Title: "Distillation",
      step2Desc: "Extracted using low-pressure steam distillation method for 72 hours.",
      step3: "Phase 3",
      step3Title: "Laboratory Testing",
      step3Desc: "Passed GC-MS testing on {date} with export quality standards.",
      step4: "Phase 4",
      step4Title: "Standardized Storage",
      step4Desc: "Stored in temperature and humidity controlled stainless steel drums (Food Grade)."
    },
    checkout: {
      priceLabel: "B2B Price / Kg",
      stockLabel: "Available Stock",
      minOrderLabel: "Minimum Order",
      shippingLabel: "Shipping Terms",
      btnBuy: "Buy Now",
      btnAddToCart: "Add to Cart",
      btnOffer: "Make an Offer",
      btnSample: "Request Sample (10ml)",
      protectionText: "Payments are automatically protected through the Escrow System until goods are received and verified."
    }
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [activeTab, setActiveTab] = useState<'spesifikasi' | 'coa' | 'traceability' | 'supplier' | 'exportDocs'>('spesifikasi')
  const [activeTraceStep, setActiveTraceStep] = useState<1 | 2 | 3 | 4>(1)
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)

  const handleDownloadCoA = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/products/${productId}/coa/download`)
      if (!res.ok) throw new Error('Gagal mengunduh CoA.')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CoA-${product?.batch_code || productId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast({
        title: "Gagal Mengunduh",
        description: err.message || "Terjadi kesalahan saat mengunduh berkas.",
        variant: "destructive"
      })
    }
  }
  
  const [product, setProduct] = useState<any | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  
  // Auth state for conditional rendering
  const [role, setRole] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [country, setCountry] = useState<string>('ID')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const token = localStorage.getItem('valam_token')
    setIsLoggedIn(!!token)
    const storedRole = localStorage.getItem('valam_role')
    if (storedRole) setRole(storedRole)
    const storedCountry = localStorage.getItem('valam_country')
    if (storedCountry) setCountry(storedCountry)

    const fetchProduct = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      try {
        let res = await fetch(`${apiUrl}/products/${productId}`, { cache: 'no-store' })
        if (res.ok) {
          const result = await res.json()
          setProduct({
            ...result,
            supplier: {
              company_name: result.supplier_name || 'Koperasi Nilam Atsiri'
            }
          })
          setLoadingProduct(false)
          return
        }
        
        // If not found, try circular product endpoint
        res = await fetch(`${apiUrl}/circular-products/${productId}`)
        if (res.ok) {
          const result = await res.json()
          setProduct({
            id: result.id,
            batch_code: result.name,
            supplier_name: result.supplier?.profile?.company_name || 'N/A',
            status: result.status,
            origin_district: result.supplier?.supplier_profile?.kabupaten || 'Aceh',
            pa_percentage: 0,
            moisture: 0,
            available_volume_kg: result.stock,
            price_per_kg: result.price,
            images: result.image ? [result.image] : [],
            is_circular: true,
            category: result.category,
            benefit: result.benefit,
            description: result.description,
            unit: result.unit,
            supplier_id: result.supplier_id,
            supplier: {
              company_name: result.supplier?.profile?.company_name || 'N/A',
              address: result.supplier?.profile?.address || 'Aceh, Indonesia'
            }
          })
          setLoadingProduct(false)
          return
        }
        
        throw new Error('Offline fallback')
      } catch (err) {
        console.warn("Backend offline, loading product from mock data or local storage:", err)
        let found: any = mockProducts.find(p => p.id === productId || p.batch_code === productId)
        if (!found) {
          const cp = mockCircularProducts.find(c => c.id === productId || (c as any).nama === productId)
          if (cp) {
            found = {
              id: cp.id,
              batch_code: cp.nama,
              supplier_name: cp.mitra_pengolah_nama,
              status: cp.status,
              origin_district: cp.origin_district,
              pa_percentage: 0,
              moisture: 0,
              available_volume_kg: cp.stok_tersedia,
              price_per_kg: cp.harga_per_unit,
              images: cp.images,
              is_circular: true,
              category: cp.category,
              benefit: cp.benefit,
              description: cp.description,
              unit: cp.unit,
              supplier: {
                company_name: cp.mitra_pengolah_nama,
                address: `${cp.origin_district}, Aceh`
              }
            }
          }
        }
        if (!found) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('valam_supplier_batches_')) {
              const email = key.replace('valam_supplier_batches_', '')
              const batches = JSON.parse(localStorage.getItem(key) || '[]')
              const b = batches.find((x: any) => x.id === productId || x.batch_code === productId)
              if (b) {
                found = {
                  ...b,
                  origin_district: b.origin_district || 'Aceh Jaya',
                  price_per_kg: b.price_per_kg || 900000,
                  supplier: {
                    company_name: localStorage.getItem('valam_user_company_' + email) || 'Koperasi Nilam Atsiri'
                  }
                }
                break
              }
            }
          }
        }
        setProduct(found || null)
        setLoadingProduct(false)
      }
    }

    fetchProduct()
  }, [productId, locale])

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    )
  }



  const { addToCart } = useCart()

  const handleAddToCart = async () => {
    if (role !== 'buyer') {
      toast({
        title: "Login Dibutuhkan",
        description: "Silakan masuk ke akun Buyer (Pembeli) untuk menambahkan produk ke keranjang. Mengarahkan ke halaman login...",
        variant: "destructive"
      })
      setTimeout(() => {
        window.location.href = `/${locale}/login?redirect=/marketplace/product/${productId}`
      }, 1200)
      return
    }

    setIsAdding(true)
    const success = await addToCart(product?.id, product?.moq_kg || 1)
    setIsAdding(false)

    if (success) {
      router.push('/cart')
    }
  }

  const handleOfferClick = () => {
    if (role !== 'buyer') {
      toast({
        title: "Login Dibutuhkan",
        description: "Silakan masuk ke akun Buyer (Pembeli) untuk mengajukan penawaran RFQ. Mengarahkan ke halaman login...",
        variant: "destructive"
      })
      setTimeout(() => {
        window.location.href = `/${locale}/login?redirect=/marketplace/product/${productId}`
      }, 1200)
      return
    }
    router.push(`/buyer/rfq?product=${product?.id}&supplier=${(product as any)?.supplier_id || 'mock_supplier_id'}`)
  }

  const handleRequestSample = () => {
    if (role !== 'buyer') {
      toast({
        title: "Login Dibutuhkan",
        description: "Silakan masuk ke akun Buyer (Pembeli) untuk mengajukan permintaan sampel. Mengarahkan ke halaman login...",
        variant: "destructive"
      })
      setTimeout(() => {
        window.location.href = `/${locale}/login?redirect=/marketplace/product/${productId}`
      }, 1200)
      return
    }

    toast({
      title: "Permintaan Sampel Diproses",
      description: `Membuka WhatsApp untuk mengirimkan rincian pengiriman sampel 10ml Batch ${product.batch_code} ke ${product.supplier_name}...`,
    })

    const message = `Halo ${product.supplier_name}, saya tertarik dengan Minyak Nilam Batch ${product.batch_code} di Valam Marketplace. Saya ingin meminta sampel 10ml untuk uji lab kelayakan sebelum melakukan pembelian volume besar.`
    const url = `https://wa.me/628123456789?text=${encodeURIComponent(message)}`
    
    setTimeout(() => {
      window.open(url, '_blank')
    }, 800)
  }
  
  if (!product) {
    return (
    <div className="min-h-screen flex flex-col bg-zinc-50/80 relative selection:bg-emerald-100 selection:text-emerald-900">
      {/* Premium subtle dotted background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center mt-14">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t.notFound.title}</h1>
            <p className="text-zinc-500 mb-6">{t.notFound.desc}</p>
            <Link href="/marketplace">
              <Button className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-md shadow-gold-500/20">{t.notFound.btnBack}</Button>
            </Link>
          </div>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
    )
  }

  // Radar chart data mapping
  // Map values to 0-100 scale purely for visual chart balance
  const radarData = [
    { subject: 'Patchouli Alcohol', A: (product.pa_percentage / 40) * 100, B: (30 / 40) * 100, fullMark: 100 },
    { subject: 'Moisture', A: 100 - (product.moisture / 5) * 100, B: 100 - (3 / 5) * 100, fullMark: 100 }, // Reversed (lower is better)
    { subject: 'Specific Gravity', A: 95, B: 90, fullMark: 100 },
    { subject: 'Refractive Index', A: 98, B: 95, fullMark: 100 },
    { subject: 'Optical Rotation', A: 92, B: 90, fullMark: 100 },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 relative selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Premium background pattern - made more visible */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-transparent to-zinc-200/20 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        
        <div className="flex-1 mt-14 pb-20">
          <h2 className="sr-only">{locale === 'id' ? 'Detail Informasi Batch Minyak Nilam' : 'Batch Patchouli Oil Details'}</h2>
        {/* Header Navigation Premium */}
        <div className="bg-white/90 backdrop-blur-md border-b border-zinc-200 relative z-20 shadow-sm mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/marketplace" 
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-zinc-200 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="hidden sm:flex items-center gap-3 text-sm text-zinc-500">
                <Link href="/marketplace" className="hover:text-emerald-700 transition-colors">{t.breadcrumb.marketplace}</Link>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-900 font-medium">{t.breadcrumb.category}</span>
                <span className="text-zinc-300">/</span>
                <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-sm">{product.batch_code}</span>
              </div>
              
              <div className="sm:hidden">
                <h1 className="text-lg font-semibold text-zinc-900 font-mono">
                  {product.batch_code}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 hidden md:flex">
               <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                 <Factory className="w-4 h-4 text-zinc-400" />
               </div>
               <div className="text-left">
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.supplier.partner}</p>
                 <p className="text-sm font-bold text-zinc-900">{product.supplier_name}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL: Images & Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Premium Hero Visuals */}
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="relative md:w-2/5 aspect-square md:aspect-auto min-h-[300px] md:min-h-full bg-zinc-100">
                 <Image 
                  src={resolveProductImage(product.images[0])} 
                  alt={`Batch ${product.batch_code}`}
                  fill
                  className="object-cover"
                />
                
                {/* Lab Badge Overlay */}
                {product.status === 'VERIFIED' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-md border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t.hero.verified}
                  </div>
                )}
              </div>
              
              <div className="md:w-3/5 p-8 flex flex-col justify-center bg-white relative">
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                     <div className="w-6 h-6 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-200">
                       <Factory className="w-3 h-3 text-zinc-500" />
                     </div>
                     <span className="text-sm font-medium text-zinc-600">{product.supplier_name}</span>
                   </div>
                   
                   <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 leading-tight">
                      {product.is_circular ? (
                        <>
                          <span className="text-emerald-800 font-serif">{product.batch_code}</span>
                        </>
                      ) : (
                        <>
                          {t.hero.titleStart} <br className="hidden sm:block" />
                          <span className="text-emerald-700">{t.hero.titleEnd}</span>
                        </>
                      )}
                    </h1>
                    
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-8">
                      <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-mono text-sm border border-emerald-200 font-semibold shadow-sm">
                        {product.is_circular ? (locale === 'id' ? "Circular Product" : "Circular Product") : `${t.hero.batchPrefix} ${product.batch_code}`}
                      </span>
                      <span className="text-zinc-400 text-sm">|</span>
                      <span className="text-zinc-650 text-sm font-medium">{product.is_circular ? (locale === 'id' ? "Olahan Hasil Samping Sulingan" : "Distillation Side-Product") : t.hero.pure}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-zinc-900">{locale === 'id' ? 'Lokasi Pemasok' : 'Supplier Location'}</h4>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {product.origin_district}, Aceh, Indonesia
                          </p>
                        </div>
                      </div>
                      
                      {product.is_circular ? (
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-emerald-900">{locale === 'id' ? 'Kategori Circular' : 'Circular Category'}</h4>
                            <p className="text-sm text-emerald-700/80 mt-0.5 font-bold uppercase tracking-wider">
                              {product.category}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <Beaker className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-emerald-900">{t.hero.paTitle}</h4>
                            <p className="text-sm text-emerald-700/80 mt-0.5">
                              <strong className="text-emerald-700">{product.pa_percentage}%</strong> ({t.hero.paDescTestedPrefix} {product.tested_at ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' }).format(new Date(product.tested_at)) : '-'})
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[580px] flex flex-col">
              <div className="flex border-b border-zinc-100 overflow-x-auto hide-scrollbar">
                {(product.is_circular ? ['spesifikasi', 'traceability'] : ['spesifikasi', 'coa', 'traceability', ...(country !== 'ID' ? ['exportDocs'] : [])]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-8 py-5 text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab 
                        ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    {product.is_circular && tab === 'spesifikasi' 
                       ? (locale === 'id' ? 'Deskripsi & Manfaat' : 'Description & Benefits') 
                       : (t.tabs[tab as keyof typeof t.tabs] || tab)}
                  </button>
                ))}
              </div>

              <div className="p-8 flex-1 flex flex-col justify-start">
                {/* TAB CONTENT: Spesifikasi */}
                {activeTab === 'spesifikasi' && (
                  product.is_circular ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="border-b border-zinc-100 pb-4">
                        <h3 className="text-xl font-serif font-bold text-emerald-950">
                          {locale === 'id' ? 'Detail & Manfaat Produk Circular' : 'Circular Product Details & Usage'}
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          {locale === 'id' ? 'Karakteristik olahan limbah suling nilam' : 'Characteristics of processed patchouli distillation residue'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                        <div className="space-y-4">
                          <h4 className="font-bold text-emerald-955 text-sm uppercase tracking-wider">{locale === 'id' ? 'Deskripsi Produk' : 'Product Description'}</h4>
                          <p className="text-zinc-650 text-sm leading-relaxed font-sans">{product.description}</p>
                        </div>
                        
                        <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 space-y-4">
                          <h4 className="font-bold text-emerald-955 text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
                            {locale === 'id' ? 'Manfaat Utama & Kegunaan' : 'Key Benefits & Usage'}
                          </h4>
                          <p className="text-emerald-900 text-sm leading-relaxed font-sans font-medium">{product.benefit}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="border-b border-zinc-100 pb-4">
                      <h3 className="text-xl font-serif font-bold text-emerald-950">{locale === 'id' ? 'Hasil Analisis Kimiawi & Fisik' : 'Chemical & Physical Analysis'}</h3>
                      <p className="text-zinc-500 text-sm mt-1">{locale === 'id' ? 'Hasil pengujian komprehensif GC-MS sesuai Standar Nasional Indonesia (SNI 06-2385-2006)' : 'Comprehensive GC-MS test results complying with Indonesian National Standard (SNI 06-2385-2006)'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Summary Metrics Cards */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">
                          <h4 className="font-bold text-zinc-900 text-sm tracking-wide uppercase">{locale === 'id' ? 'Indikator Utama Mutu' : 'Key Quality Indicators'}</h4>
                          
                          {/* PA Card */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-xs text-zinc-550 font-medium block">Patchouli Alcohol (PA)</span>
                                <span className="text-2xl font-bold font-serif text-emerald-950">{product.pa_percentage}%</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mb-1">
                                {locale === 'id' ? 'Standar: Min. 30%' : 'Standard: Min. 30%'}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                              <div 
                                className="h-full rounded-full bg-emerald-700 shadow-sm"
                                style={{ width: `${Math.min((product.pa_percentage / 40) * 100, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Moisture Card */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-xs text-zinc-550 font-medium block">{locale === 'id' ? 'Kadar Air (Moisture)' : 'Moisture Content'}</span>
                                <span className="text-2xl font-bold font-serif text-zinc-900">{product.moisture}%</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mb-1">
                                {locale === 'id' ? 'Standar: Max. 3.0%' : 'Standard: Max. 3.0%'}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                              <div 
                                className="h-full rounded-full bg-emerald-600 shadow-sm"
                                style={{ width: `${Math.max(100 - (product.moisture / 5) * 100, 10)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex gap-3 text-xs text-emerald-800 leading-relaxed shadow-3xs">
                          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <p>{t.specs.infoText.replace('{pa}', product.pa_percentage.toString())}</p>
                        </div>
                      </div>
                      
                      {/* Right: Comparative Parameters Table */}
                      <div className="lg:col-span-7">
                        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider">
                                <th className="py-3 px-4 font-semibold">{locale === 'id' ? 'Parameter Uji' : 'Test Parameter'}</th>
                                <th className="py-3 px-4 font-semibold">{locale === 'id' ? 'Acuan SNI' : 'SNI Reference'}</th>
                                <th className="py-3 px-4 font-semibold">{locale === 'id' ? 'Hasil Pengujian' : 'Batch Result'}</th>
                                <th className="py-3 px-4 font-semibold text-center">{locale === 'id' ? 'Status' : 'Status'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-zinc-700 font-sans">
                              <tr>
                                <td className="py-3.5 px-4 font-semibold text-zinc-900">Patchouli Alcohol</td>
                                <td className="py-3.5 px-4 font-mono text-zinc-500">Min. 30.0%</td>
                                <td className="py-3.5 px-4 font-bold text-emerald-800">{product.pa_percentage}%</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'id' ? 'Lolos' : 'Passed'}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-semibold text-zinc-900">{locale === 'id' ? 'Kadar Air' : 'Moisture Content'}</td>
                                <td className="py-3.5 px-4 font-mono text-zinc-500">Max. 3.0%</td>
                                <td className="py-3.5 px-4 font-bold text-zinc-800">{product.moisture}%</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'id' ? 'Lolos' : 'Passed'}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-semibold text-zinc-900">{locale === 'id' ? 'Bobot Jenis (20°C)' : 'Specific Gravity (20°C)'}</td>
                                <td className="py-3.5 px-4 font-mono text-zinc-500">0.950 - 0.990</td>
                                <td className="py-3.5 px-4 font-mono font-medium text-zinc-850">{product.specific_gravity || '0.962'}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'id' ? 'Lolos' : 'Passed'}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-semibold text-zinc-900">{locale === 'id' ? 'Indeks Bias (20°C)' : 'Refractive Index (20°C)'}</td>
                                <td className="py-3.5 px-4 font-mono text-zinc-500">1.505 - 1.515</td>
                                <td className="py-3.5 px-4 font-mono font-medium text-zinc-850">{product.refractive_index || '1.508'}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'id' ? 'Lolos' : 'Passed'}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-3.5 px-4 font-semibold text-zinc-900">{locale === 'id' ? 'Putaran Optik' : 'Optical Rotation'}</td>
                                <td className="py-3.5 px-4 font-mono text-zinc-500">-48° s.d. -65°</td>
                                <td className="py-3.5 px-4 font-mono font-medium text-zinc-850">{product.optical_rotation || '-54°'}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {locale === 'id' ? 'Lolos' : 'Passed'}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                )}

                {/* TAB CONTENT: CoA */}
                {activeTab === 'coa' && (
                  <div className="animate-in fade-in duration-500 space-y-6">
                    {isLoggedIn ? (
                      <>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900">{locale === 'id' ? 'Pratinjau Sertifikat Analisis (CoA)' : 'Certificate of Analysis (CoA) Preview'}</h3>
                          <p className="text-zinc-500 text-sm mt-1">{locale === 'id' ? 'Lembar sertifikat keaslian hasil pengujian laboratorium resmi untuk batch ini' : 'Official laboratory authentication certificate preview for this product batch'}</p>
                        </div>

                        {/* Realistic Paper CoA Document Container */}
                        <div className="relative w-full max-w-2xl mx-auto bg-white rounded-3xl border-2 border-zinc-200/80 shadow-md p-8 md:p-12 font-serif text-zinc-800 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] overflow-hidden">
                          {/* Decorative border */}
                          <div className="absolute inset-4 border border-zinc-300 pointer-events-none rounded-xl" />
                          
                          {/* Header Section */}
                          <div className="relative z-10 text-center border-b-2 border-zinc-900 pb-6 mb-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <ShieldCheck className="w-8 h-8 text-emerald-800" />
                              <span className="text-xl md:text-2xl font-bold tracking-wide uppercase text-zinc-900">Valam Atsiri Lab</span>
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-sans font-bold">Laboratorium Analisis Kemurnian & Mutu Minyak Atsiri</p>
                            <p className="text-[9px] text-zinc-400 font-sans mt-0.5">ISO/IEC 17025 Certified Testing Center • Aceh, Indonesia</p>
                          </div>

                          {/* Document Details Block */}
                          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mb-8">
                            <div className="space-y-1.5">
                              <div>
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{locale === 'id' ? 'Nomor Sertifikat' : 'Certificate No.'}</span>
                                <p className="font-bold text-zinc-900 font-mono">COA/{product.batch_code}/{new Date(product.tested_at || Date.now()).getFullYear()}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{locale === 'id' ? 'Nama Produk' : 'Product Name'}</span>
                                <p className="font-bold text-zinc-900">{locale === 'id' ? 'Minyak Nilam Murni (100% Pure)' : 'Pure Patchouli Oil (100%)'}</p>
                              </div>
                            </div>
                            <div className="space-y-1.5 md:text-right">
                              <div>
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Batch Code</span>
                                <p className="font-bold text-zinc-900 font-mono">{product.batch_code}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{locale === 'id' ? 'Tanggal Pengujian' : 'Analysis Date'}</span>
                                <p className="font-bold text-zinc-900">{product.tested_at ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'long' }).format(new Date(product.tested_at)) : '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Chemical Test Results Block */}
                          <div className="relative z-10 mb-8 border border-zinc-300 rounded-lg overflow-hidden bg-white/70">
                            <table className="w-full text-left text-xs font-sans">
                              <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-300 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                  <th className="py-2.5 px-3 font-semibold">{locale === 'id' ? 'Spesifikasi Analisis' : 'Analysis Specification'}</th>
                                  <th className="py-2.5 px-3 font-semibold text-center">{locale === 'id' ? 'Batas Standard SNI' : 'SNI Limit'}</th>
                                  <th className="py-2.5 px-3 font-semibold text-right">{locale === 'id' ? 'Hasil Analisis' : 'Test Result'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                <tr>
                                  <td className="py-3 px-3 font-semibold text-zinc-900">Patchouli Alcohol (PA)</td>
                                  <td className="py-3 px-3 text-center font-mono text-zinc-500">Min. 30.0%</td>
                                  <td className="py-3 px-3 text-right font-bold text-emerald-800">{product.pa_percentage}%</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-3 font-semibold text-zinc-900">{locale === 'id' ? 'Kadar Air' : 'Moisture Content'}</td>
                                  <td className="py-3 px-3 text-center font-mono text-zinc-500">Max. 3.0%</td>
                                  <td className="py-3 px-3 text-right font-bold text-zinc-800">{product.moisture}%</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-3 font-semibold text-zinc-900">{locale === 'id' ? 'Bobot Jenis (20°C)' : 'Specific Gravity (20°C)'}</td>
                                  <td className="py-3 px-3 text-center font-mono text-zinc-500">0.950 - 0.990</td>
                                  <td className="py-3 px-3 text-right font-mono text-zinc-800">{product.specific_gravity || '0.962'}</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-3 font-semibold text-zinc-900">{locale === 'id' ? 'Indeks Bias (20°C)' : 'Refractive Index (20°C)'}</td>
                                  <td className="py-3 px-3 text-center font-mono text-zinc-500">1.505 - 1.515</td>
                                  <td className="py-3 px-3 text-right font-mono text-zinc-800">{product.refractive_index || '1.508'}</td>
                                </tr>
                                <tr>
                                  <td className="py-3 px-3 font-semibold text-zinc-900">{locale === 'id' ? 'Putaran Optik' : 'Optical Rotation'}</td>
                                  <td className="py-3 px-3 text-center font-mono text-zinc-500">-48° s.d. -65°</td>
                                  <td className="py-3 px-3 text-right font-mono text-zinc-800">{product.optical_rotation || '-54°'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Approval Section */}
                          <div className="relative z-10 flex justify-between items-end border-t border-zinc-200 pt-6 text-xs font-sans">
                            <div>
                              <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 text-[10px] font-bold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                {locale === 'id' ? 'MUTU TERVERIFIKASI' : 'QUALITY APPROVED'}
                              </div>
                              <p className="text-[9px] text-zinc-400 mt-2 font-mono">Scan QR Code on drum to verify digitally</p>
                            </div>
                            <div className="text-right space-y-4">
                              <div className="w-24 h-10 border border-zinc-200/50 bg-zinc-50 rounded flex items-center justify-center font-serif text-[10px] text-zinc-450 italic opacity-85 select-none mx-auto md:mr-0">
                                VALAM SEAL
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900">Dr. Teuku Iskandar, M.Sc</p>
                                <p className="text-[10px] text-zinc-500">Quality Assurance Director</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="max-w-md mx-auto text-center py-12 px-6 bg-white border border-zinc-200 rounded-3xl shadow-xs space-y-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-serif font-bold text-zinc-900 text-lg">
                            {locale === 'id' ? 'Sertifikat Analisis Terkunci' : 'Certificate of Analysis Locked'}
                          </h4>
                          <p className="text-sm text-zinc-500 leading-relaxed font-sans">
                            {locale === 'id' 
                              ? 'Untuk menjaga integritas dan kerahasiaan data pengujian, dokumen Certificate of Analysis (CoA) hanya dapat diakses oleh pengguna terdaftar.' 
                              : 'To protect test integrity and confidentiality, Certificate of Analysis (CoA) documents are restricted to registered users only.'}
                          </p>
                        </div>
                        <Button 
                          onClick={() => window.location.href = `/${locale}/login?redirect=/marketplace/product/${productId}`}
                          className="w-full bg-[#0b2f1c] hover:bg-[#12422a] text-white font-bold rounded-xl shadow-md h-11 text-xs"
                        >
                          {locale === 'id' ? 'Masuk Sekarang untuk Melihat' : 'Log In to View Document'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: Traceability */}
                {activeTab === 'traceability' && (
                  <div className="animate-in fade-in duration-500 space-y-6">
                    <div className="border-b border-zinc-100 pb-4">
                      <h3 className="text-lg font-bold text-zinc-900">{t.trace.title}</h3>
                      <p className="text-zinc-500 text-sm mt-1">{locale === 'id' ? 'Lacak jejak rantai pasok terverifikasi untuk batch minyak nilam ini' : 'Trace the verified supply chain history for this specific patchouli oil batch'}</p>
                    </div>

                    {/* Interactive Horizontal Progress Stepper */}
                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-8 border-b border-zinc-100 pb-6">
                      {/* Connecting line for desktop */}
                      <div className="absolute top-7 left-12 right-12 h-0.5 bg-zinc-200/80 -z-0 hidden md:block" />
                      <div 
                        className="absolute top-7 left-12 h-0.5 bg-emerald-600 transition-all duration-500 -z-0 hidden md:block"
                        style={{ width: `${((activeTraceStep - 1) / 3) * 82}%` }}
                      />

                      {(product.is_circular ? [
                        { step: 1, label: locale === 'id' ? '1. Sourcing Limbah' : '1. Waste Sourcing', desc: locale === 'id' ? 'Ampas Suling Nilam' : 'Distillation Residue', icon: Tractor },
                        { step: 2, label: locale === 'id' ? '2. Pengolahan Kompos/Bio' : '2. Circular Processing', desc: locale === 'id' ? 'Fermentasi Organik' : 'Recycling Process', icon: Factory },
                        { step: 3, label: locale === 'id' ? '3. Validasi Admin' : '3. Admin Validation', desc: locale === 'id' ? 'Lulus Review Mutu' : 'Approved Listing', icon: ShieldCheck },
                        { step: 4, label: locale === 'id' ? '4. Distribusi Hijau' : '4. Eco Distribution', desc: locale === 'id' ? 'Kemasan & Escrow' : 'Escrow Dispatch', icon: Warehouse },
                      ] : [
                        { step: 1, label: locale === 'id' ? '1. Kebun Nilam' : '1. Patchouli Farm', desc: locale === 'id' ? 'Asal Bahan Baku' : 'Sourcing Origin', icon: Tractor },
                        { step: 2, label: locale === 'id' ? '2. Distilasi' : '2. Distillation', desc: locale === 'id' ? 'Proses Penyulingan' : 'Extraction Process', icon: Factory },
                        { step: 3, label: locale === 'id' ? '3. Analisis Lab' : '3. Quality Testing', desc: locale === 'id' ? 'Uji GC-MS' : 'GC-MS Testing', icon: Microscope },
                        { step: 4, label: locale === 'id' ? '4. Packaging & QR' : '4. Sealing & QR', desc: locale === 'id' ? 'Segel & Tag QR' : 'Authenticity Seal', icon: ShieldCheck },
                      ]).map((item) => {
                        const IconComponent = item.icon
                        return (
                          <button
                            key={item.step}
                            onClick={() => setActiveTraceStep(item.step as any)}
                            className="relative z-10 flex flex-col items-center group text-center focus:outline-none"
                          >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                              activeTraceStep === item.step 
                                ? 'bg-emerald-750 border-emerald-750 text-white scale-110 shadow-emerald-500/20' 
                                : activeTraceStep > item.step
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                                  : 'bg-white border-zinc-200 text-zinc-400 group-hover:border-zinc-300 group-hover:text-zinc-600'
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <p className={`text-xs font-bold mt-3 transition-colors ${
                              activeTraceStep === item.step ? 'text-emerald-950' : 'text-zinc-500 group-hover:text-zinc-800'
                            }`}>{item.label}</p>
                            <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">{item.desc}</p>
                          </button>
                        )
                      })}
                    </div>

                    {/* Active Step Details Panel */}
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
                      {product.is_circular ? (
                        <>
                          {activeTraceStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-in fade-in duration-300">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Sumber Limbah' : 'Residue Source'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Penyulingan Minyak Nilam</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Ampas daun & ranting kering</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Lokasi Pengambilan' : 'Collection Site'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Basecamp Penyulingan Terroir</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Dikelola kelompok tani binaan</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Prinsip Circular' : 'Circular Concept'}</span>
                                <span className="text-xs font-bold text-emerald-800 mt-2 block flex items-center gap-1.5">
                                  <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
                                  100% Zero-Waste Economy
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Mengurangi emisi karbon limbah</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kuantitas Limbah' : 'Waste Volume'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Hingga 5 Ton/Bulan</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Dari proses penyulingan rutin</span>
                              </div>
                            </div>
                          )}
                          {activeTraceStep === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-in fade-in duration-300">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Metode Pengolahan' : 'Processing Method'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Dekomposisi Organik & Pirolisis</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Pembakaran lambat tanpa oksigen (biochar)</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Bahan Pendukung' : 'Natural Additives'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Bio-Aktivator & EM4 Organik</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Aman tanpa zat kimia berbahaya</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Lama Pengolahan' : 'Fermentation Time'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">14 - 30 Hari</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Hingga matang sempurna</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kandungan Hara' : 'Nutrient Profile'}</span>
                                <span className="text-sm font-bold text-emerald-800 mt-2 block">Kaya Karbon Aktif & Nitrogen</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Menyeimbangkan ekosistem tanah</span>
                              </div>
                            </div>
                          )}
                          {activeTraceStep === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-in fade-in duration-300">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Standar Kualitas' : 'Quality Standards'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Uji Fisik & Kandungan Organik</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Lolos verifikasi mutu Valam</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Verifikator' : 'Approved By'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Tim Admin Valam B2B</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Validasi keabsahan mitra</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Status Listing' : 'Listing Status'}</span>
                                <span className="text-xs font-bold text-emerald-800 mt-2 block flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active in Marketplace
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Keberlanjutan' : 'Sustainability Impact'}</span>
                                <span className="text-sm font-bold text-emerald-850 mt-2 block">Low Carbon Footprint</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Produk mendukung penghijauan</span>
                              </div>
                            </div>
                          )}
                          {activeTraceStep === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-in fade-in duration-300">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Material Kemasan' : 'Packaging Type'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">{product.unit || 'Karung Premium'}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Dapat didaur ulang kembali</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Keamanan Logistik' : 'Logistic Safety'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Escrow Protected</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Dana dijamin aman</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Metode Pengiriman' : 'Shipping Mode'}</span>
                                <span className="text-sm font-bold text-zinc-850 mt-2 block">Darat & Laut (Truck/LCL)</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Pengiriman kargo terpercaya</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Bantuan Pembeli' : 'Buyer Support'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Live Chatbot & Helpdesk</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Konsultasi pengiriman 24/7</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {activeTraceStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Lokasi Perkebunan' : 'Plantation Location'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Desa {product.origin_village}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Kec. {product.origin_district}, Aceh</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kepatuhan Lahan' : 'Land Compliance'}</span>
                                <span className="text-xs font-bold text-emerald-800 mt-2 block flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  EUDR Compliant
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Bebas Deforestasi 2025' : 'Deforestation-Free'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kelompok Tani' : 'Farmers Group'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">{locale === 'id' ? 'Binaan Lokal Koperasi' : 'Cooperative Fostered'}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Kemitraan bagi hasil adil' : 'Fair-trade local partners'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Metode Panen' : 'Harvesting Method'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">{locale === 'id' ? 'Pangkas Daun Pilihan' : 'Selected Leaf Cutting'}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Diangin-anginkan 3-4 hari' : 'Air-dried for 3-4 days'}</span>
                              </div>
                            </div>
                          )}

                          {activeTraceStep === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Metode Ekstraksi' : 'Extraction Method'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">{locale === 'id' ? 'Distilasi Uap Bersih' : 'Steam Distillation'}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Bertekanan stabil terkontrol' : 'Controlled low pressure'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Bahan Alat Suling' : 'Distillation Material'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Stainless Steel SUS-304/316</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Bebas karat logam berat' : 'Rust-free, no heavy metal'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Suhu Penyulingan' : 'Distillation Temp.'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">100°C - 105°C</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Menjaga kualitas fraksi PA' : 'Protects delicate PA content'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Durasi Siklus' : 'Extraction Duration'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">72 {locale === 'id' ? 'Jam' : 'Hours'}</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Penyulingan tuntas lambat' : 'Slow thorough extraction'}</span>
                              </div>
                            </div>
                          )}

                          {activeTraceStep === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Laboratorium Penguji' : 'Testing Laboratory'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">UPT Laboratorium Atsiri (LAT)</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">Aceh, Indonesia</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kadar Patchouli Alcohol' : 'Patchouli Alcohol %'}</span>
                                <span className="text-sm font-bold text-emerald-800 mt-2 block">{product.pa_percentage}% (PA Murni)</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Standar SNI Min. 30%' : 'SNI Min. 30% Standard'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kadar Air Terkandung' : 'Moisture Content %'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">{product.moisture}% ({locale === 'id' ? 'Sangat Kering' : 'Very Dry'})</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Standar SNI Max. 3.0%' : 'SNI Max. 3.0% Standard'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Tanggal Analisis' : 'Analysis Date'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">
                                  {product.tested_at ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' }).format(new Date(product.tested_at)) : '-'}
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Sertifikasi GC-MS Resmi' : 'GC-MS Certified'}</span>
                              </div>
                            </div>
                          )}

                          {activeTraceStep === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Jenis Wadah' : 'Packaging Container'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">Epoxy-lined Steel Drum</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Penyimpanan kedap udara' : 'Airtight storage seal'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Pelabelan Cerdas' : 'Smart Labeling'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block flex items-center gap-1">
                                  Unique QR Barcode
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Tersegel pada badan drum' : 'Tagged on drum surface'}</span>
                              </div>
                              <div className="border-r border-zinc-250/60 pr-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kondisi Penyimpanan' : 'Storage Conditions'}</span>
                                <span className="text-sm font-bold text-zinc-800 mt-2 block">20°C - 25°C Temp. Control</span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Menghindari oksidasi' : 'Prevents oil oxidation'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Status Keaslian' : 'Authenticity Status'}</span>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-2 block w-fit">
                                  100% Pure Guaranteed
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Bebas pencampuran asing' : 'Zero foreign adulterants'}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Checkout Sidebar */}
          <div className="lg:col-span-1">
            <div className="relative space-y-6">
              
              <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl shadow-zinc-200/50">
                <h3 className="text-sm font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  {product.is_circular 
                    ? `${locale === 'id' ? 'Harga Jual' : 'Selling Price'} / ${product.unit || 'Unit'}` 
                    : t.checkout.priceLabel}
                </h3>
                <div className="text-4xl font-bold text-emerald-950 mb-8">
                  {formatRupiah(product.price_per_kg)}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">{t.checkout.stockLabel}</span>
                    <span className="font-bold text-zinc-900">{product.available_volume_kg} {product.unit || 'Kg'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">{t.checkout.minOrderLabel}</span>
                    <span className="font-bold text-zinc-900">{product.is_circular ? `1 ${product.unit || 'Unit'}` : "5 Kg"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                    <span className="text-zinc-600 font-medium">{t.checkout.shippingLabel}</span>
                    <span className="font-bold text-zinc-900 text-right">{product.is_circular ? "EXW Basecamp" : "FOB Jakarta"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {!isClient ? (
                    <div className="h-14 bg-zinc-100 rounded-xl animate-pulse"></div>
                  ) : role === 'supplier' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium flex items-start gap-3">
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p>
                        {locale === 'id' 
                          ? 'Anda login sebagai Supplier. Fitur pembelian hanya tersedia untuk akun Buyer.' 
                          : 'You are logged in as a Supplier. Purchasing is only available for Buyer accounts.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {country === 'ID' ? (
                        <>
                          <Button 
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="w-full h-14 rounded-xl bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-lg shadow-gold-500/20 text-base mb-3"
                          >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            {isAdding ? "Loading..." : t.checkout.btnAddToCart}
                          </Button>
                          {!product.is_circular && (
                            <Button 
                              onClick={handleOfferClick}
                              variant="outline" 
                              className="w-full h-14 rounded-xl border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all flex justify-center items-center gap-2"
                            >
                              <MessageSquare className="w-5 h-5" />
                              {t.checkout.btnOffer}
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-start gap-3 mb-3">
                            <Info className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                            <p>
                              {locale === 'id' 
                                ? 'Pembelian langsung (Direct Checkout) hanya didukung untuk pengiriman domestik (Indonesia). Silakan ajukan negosiasi RFQ.' 
                                : 'Direct Checkout is only available for domestic delivery (Indonesia). Please submit an RFQ negotiation.'}
                            </p>
                          </div>
                          {!product.is_circular ? (
                            <>
                              <Button 
                                onClick={handleOfferClick}
                                className="w-full h-14 rounded-xl bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-lg shadow-gold-500/20 text-base mb-3"
                              >
                                <MessageSquare className="w-5 h-5 mr-2" />
                                {t.checkout.btnOffer} (Live RFQ)
                              </Button>
                              <Button variant="outline" className="w-full h-14 rounded-xl border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all flex justify-center items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {locale === 'id' ? 'Ajukan Pertanyaan L/C (Letter of Credit)' : 'L/C (Letter of Credit) Inquiry'}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              onClick={() => {
                                const msg = `Halo, saya tertarik dengan Circular Product: ${product.batch_code} (${product.category}) yang ditawarkan oleh ${product.supplier_name} di platform VALAM.`;
                                window.open(`https://wa.me/628123456789?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="w-full h-14 rounded-xl bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-lg shadow-gold-500/20 text-base"
                            >
                              <MessageSquare className="w-5 h-5 mr-2" />
                              {locale === 'id' ? 'Hubungi Supplier' : 'Contact Supplier'}
                            </Button>
                          )}
                        </>
                      )}
                      {!product.is_circular && (
                        <Button 
                          onClick={handleRequestSample}
                          variant="ghost" 
                          className="w-full h-14 rounded-xl text-emerald-700 font-bold hover:bg-emerald-50 transition-all flex justify-center items-center gap-2"
                        >
                          <FlaskConical className="w-5 h-5" />
                          {t.checkout.btnSample}
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {(!isClient || role !== 'supplier') && (
                  <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {t.checkout.protectionText}
                    </p>
                  </div>
                )}

                {activeTab === 'exportDocs' && (
                  <div className="animate-in fade-in duration-500 space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">{locale === 'id' ? 'Paket Dokumen Kepatuhan Ekspor' : 'Export Compliance Document Pack'}</h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        {locale === 'id' 
                          ? 'Dokumen kepatuhan global untuk pengapalan internasional.' 
                          : 'Global compliance documentation for international shipments.'}
                      </p>
                    </div>

                    {/* EUDR Compliance Section */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-emerald-900 text-lg">EUDR Deforestation-Free Compliance</h4>
                            <p className="text-xs text-emerald-700 font-semibold">{locale === 'id' ? 'Terverifikasi Kepatuhan Uni Eropa 2025' : 'EU Regulation 2025 Compliant'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                          {locale === 'id'
                            ? 'Batch minyak nilam ini bersumber dari kebun kelolaan petani mitra binaan Valam yang terdaftar secara geospasial dan dipetakan bebas deforestasi.'
                            : 'This batch of patchouli oil is sourced from Valam partner farms that are geospatially registered and mapped free from deforestation.'}
                        </p>
                        <div className="bg-white/80 backdrop-blur border border-emerald-200/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-medium text-emerald-950">
                          <div>
                            <p className="text-zinc-500 mb-0.5">{locale === 'id' ? 'Titik Koordinat Asal' : 'Origin Geolocation'}</p>
                            <p className="font-mono text-zinc-800">4.1234 N, 96.5678 E</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 mb-0.5">{locale === 'id' ? 'Status Lahan Kebun' : 'Land Cover Status'}</p>
                            <p className="text-emerald-700 font-bold">{locale === 'id' ? 'Bebas Deforestasi' : 'Deforestation-Free Verified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Other Documents */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-zinc-900 mb-1">Material Safety Data Sheet (MSDS)</h4>
                          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                            {locale === 'id'
                              ? 'Lembar data keselamatan resmi untuk pengapalan udara dan laut internasional.'
                              : 'Official safety datasheet required for international air and ocean shipping.'}
                          </p>
                        </div>
                        <Button 
                          onClick={() => toast({ title: "Mengunduh MSDS", description: "MSDS PDF Draft berhasil diunduh." })}
                          variant="outline" 
                          className="w-full h-11 border-zinc-200 hover:border-emerald-600 hover:text-emerald-700 text-xs font-bold gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {locale === 'id' ? 'Unduh MSDS' : 'Download MSDS'}
                        </Button>
                      </div>

                      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <Globe className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-zinc-900 mb-1">Certificate of Origin (COO) Draft</h4>
                          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                            {locale === 'id'
                              ? 'Draf Surat Keterangan Asal (SKA) resmi yang membuktikan komoditas asal Indonesia.'
                              : 'Draft Certificate of Origin proving the commodity is from Indonesia.'}
                          </p>
                        </div>
                        <Button 
                          onClick={() => toast({ title: "Mengunduh COO Draft", description: "COO Draft berhasil diunduh." })}
                          variant="outline" 
                          className="w-full h-11 border-zinc-200 hover:border-emerald-600 hover:text-emerald-700 text-xs font-bold gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {locale === 'id' ? 'Unduh Draft COO' : 'Download COO Draft'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SUPPLIER CARD MOVED HERE */}
              <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 flex-shrink-0">
                     <Factory className="w-8 h-8 text-zinc-400" />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t.supplier.profile}</p>
                     <h4 className="font-bold text-xl text-zinc-900">{product.supplier_name}</h4>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2 mb-6 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                   <ShieldCheck className="w-4 h-4" />
                   {t.supplier.partnerBadge}
                 </div>
                 
                 <div className="space-y-4 mb-6">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-zinc-500">{t.supplier.sales}</span>
                     <span className="font-bold text-zinc-900">2.4 Ton</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-zinc-500">{t.supplier.rating}</span>
                     <div className="flex items-center gap-1 font-bold text-zinc-900">
                       <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                       4.9/5.0
                     </div>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-zinc-500">{t.supplier.location}</span>
                     <span className="font-bold text-zinc-900">{product.origin_district}</span>
                   </div>
                 </div>

                  <Link 
                    href={`/marketplace/supplier/${
                      product.supplier_name.includes('Aceh Barat') ? 'sup_aceh_west' :
                      product.supplier_name.includes('Tani Makmur') ? 'sup_tani_makmur' :
                      product.supplier_name.includes('Atsiri Gayo') ? 'sup_atsiri_gayo' :
                      product.supplier_name.includes('Sejahtera Selatan') ? 'sup_nilam_south' :
                      product.supplier_name.includes('Tani Nusantara') ? 'sup_tani_nusantara' :
                      product.supplier_id
                    }`}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full h-12 rounded-xl text-zinc-700 hover:bg-zinc-50 font-bold border-zinc-200 transition-all flex justify-center items-center gap-2">
                      {t.supplier.btnViewStore}
                    </Button>
                  </Link>
              </div>

            </div>
          </div>
        </div>
        </div>
        <Footer />
      </div>
      </div>
    </div>
  )
}
