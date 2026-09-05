'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, Factory, MapPin, FileText, ShoppingCart, Info, FlaskConical, ShieldCheck, Star, Download, Beaker, Leaf, Share2, Compass, Home, BarChart2, RefreshCw, User, Check, AlertTriangle, X, Crown, Flame, Lock, Calendar, Plus, Minus, Zap } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatRupiah, getPatchouliTier, isGcmsVerified, validateOrderQuantity } from '@/lib/utils'
import { RadarChart } from '@/components/marketplace/RadarChart'
import { Navbar } from '@/components/layout/Navbar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Footer } from '@/components/layout/Footer'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { useCart } from '@/components/providers/CartProvider'
import { useToast } from '@/hooks/use-toast'

const TRUST_INFO_ITEMS = {
  id: [
    {
      icon: 'lock',
      text: 'Pembayaran ditahan escrow hingga batch terkonfirmasi buyer.'
    },
    {
      icon: 'admin',
      text: 'Admin VALAM memfasilitasi negosiasi dan moderasi sengketa.'
    },
    {
      icon: 'doc',
      text: 'Dokumen EUDR, MSDS, CoA, Phytosanitary tersedia untuk ekspor.'
    }
  ],
  en: [
    {
      icon: 'lock',
      text: 'Payments held in escrow until batch confirmed by buyer.'
    },
    {
      icon: 'admin',
      text: 'VALAM admin facilitates negotiations and dispute moderation.'
    },
    {
      icon: 'doc',
      text: 'EUDR, MSDS, CoA, and Phytosanitary documents available for export.'
    }
  ]
} as any

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const isId = locale === 'id'
  const batchId = params.id as string
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(0)
  const [cartError, setCartError] = useState('')

  const fromMatching = searchParams ? searchParams.get('from') === 'matching' : false
  const matchScoreParam = searchParams ? searchParams.get('match_score') : null

  const [apiProduct, setApiProduct] = useState<any | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadBatch = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      try {
        let res = await fetch(`${apiUrl}/products/${batchId}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (isMounted) {
            setApiProduct(json)
            setLoadingProduct(false)
          }
          return
        }

        res = await fetch(`${apiUrl}/circular-products/${batchId}`)
        if (res.ok) {
          const json = await res.json()
          if (isMounted) {
            setApiProduct({
              ...json,
              is_circular: true,
              batch_code: json.name,
              available_volume_kg: json.stock,
              price_per_kg: json.price,
              supplier_name: json.supplier?.profile?.company_name || 'Mitra Sirkular',
              origin_district: json.supplier?.supplier_profile?.kabupaten || 'Aceh',
              images: json.image ? [json.image] : []
            })
            setLoadingProduct(false)
          }
          return
        }
      } catch (err) {
        // backend offline
      }

      // Check local storage batches
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('valam_supplier_batches_')) {
            const batches = JSON.parse(localStorage.getItem(key) || '[]')
            const b = batches.find((x: any) => x.id === batchId || x.batch_code === batchId)
            if (b && isMounted) {
              setApiProduct(b)
              setLoadingProduct(false)
              return
            }
          }
        }
      }

      if (isMounted) {
        setLoadingProduct(false)
      }
    }

    loadBatch()
    return () => { isMounted = false }
  }, [batchId])

  // ─── 1. FETCH & PROCESS DATA ───────────────────────────────────────
  const batch = useMemo(() => {
    let base: any = apiProduct
    let isCircular = apiProduct?.is_circular || false

    if (!base) {
      return null
    }

    // Map/extend to full B2B detailed batch schema
    const code = base.batch_code || base.nama || base.name || 'PROD-001'
    const availableVol = base.available_volume_kg ?? base.stok_tersedia ?? 100
    const pricePerUnit = base.price_per_kg ?? base.harga_per_unit ?? 850000
    const minOrder = base.moq_kg ?? base.min_order ?? 1

    return {
      id: base.id,
      batch_code: code,
      badge_tipe: code.includes('001') ? "Batch KC" : code.includes('002') ? "Batch EX" : null,
      koperasi_nama: base.supplier_name || base.mitra_pengolah_nama || "Koperasi Atsiri Aceh",
      lokasi: `${base.origin_district || 'Aceh Jaya'}, Aceh`,
      rating: 4.8,
      jumlah_batch_terjual: 14,
      lama_di_platform: isId ? "2 Tahun" : "2 Years",
      status_verifikasi_persen: 98,
      badge_tier: getPatchouliTier(base.pa_percentage || 0),
      badge_verifikasi_gcms: isGcmsVerified(base.status),
      badge_eudr: base.is_eudr || false,
      match_score: fromMatching ? (matchScoreParam ? Number(matchScoreParam) : 92) : null,
      pa_persen: base.pa_percentage || 0,
      pa_min: 30,
      pa_max: 40,
      is_circular: isCircular,
      images: base.images && base.images.length > 0 ? base.images : ['/images/premium_oil_dark.png'],
      refractive_index: base.refractive_index || 1.508,
      optical_rotation: base.optical_rotation || -17,
      moisture: base.moisture || 0,
      tested_at: base.tested_at || base.created_at,
      benefit: base.benefit || '',
      description: base.description || '',
      category: base.category || '',
      unit: base.unit || 'Kg',
      
      radar_scores: [
        { label: 'PA%', skor_0_100: base.pa_percentage ? (base.pa_percentage / 40) * 100 : 0 },
        { label: isId ? 'Kadar Air' : 'Moisture', skor_0_100: base.moisture ? Math.max(100 - (base.moisture / 5) * 100, 10) : 0 },
        { label: isId ? 'Logam (Fe)' : 'Iron (Fe)', skor_0_100: 94 },
        { label: isId ? 'Warna' : 'Color', skor_0_100: 88 },
        { label: isId ? 'Bobot Jenis' : 'Gravity', skor_0_100: 92 }
      ],
      parameter_kimia: [
        { nama: 'Patchouli Alcohol (PA)', deskripsi: isId ? 'Bahan aktif utama minyak nilam' : 'Primary active compound', nilai: base.pa_percentage ? `${base.pa_percentage}%` : 'N/A', standar_industri: 'Min. 30%', status: 'lulus' },
        { nama: isId ? 'Kadar Air (Moisture)' : 'Moisture Content', deskripsi: isId ? 'Kadar air sisa penyulingan' : 'Water residues content', nilai: `${base.moisture || 0}%`, standar_industri: 'Max. 3.0%', status: (base.moisture || 0) <= 3.0 ? 'lulus' : 'perhatian' },
        { nama: isId ? 'Kandungan Logam (Fe)' : 'Iron (Fe) Content', deskripsi: isId ? 'Kandungan cemaran zat besi' : 'Iron metal impurities', nilai: (base.pa_percentage || 0) >= 30 ? '1.8 ppm' : '4.2 ppm', standar_industri: 'Max. 5.0 ppm', status: 'lulus' },
        { nama: isId ? 'Bobot Jenis (20°C)' : 'Specific Gravity (20°C)', deskripsi: isId ? 'Kerapatan massa minyak' : 'Mass density of oil', nilai: '0.962', standar_industri: '0.950 - 0.990', status: 'lulus' },
        { nama: isId ? 'Indeks Bias (20°C)' : 'Refractive Index (20°C)', deskripsi: isId ? 'Indeks pembiasan cahaya' : 'Light refractive Index', nilai: '1.508', standar_industri: '1.505 - 1.515', status: 'lulus' },
        { nama: isId ? 'Rotasi Optik' : 'Optical Rotation', deskripsi: isId ? 'Sudut pemutaran cahaya' : 'Optical rotation angle', nilai: '-54°', standar_industri: '-48° s.d -65°', status: 'lulus' }
      ],
      harga_per_kg: pricePerUnit,
      volume_tersedia_kg: availableVol,
      volume_min_order_kg: minOrder,
      stok_persen: Math.round(((availableVol || 100) / 5000) * 100) || 85,
      tanggal_uji_lab: base.tested_at || base.created_at,
      ampas_tersedia_kg: (availableVol || 100) * 4,
      estimasi_co2_ton: parseFloat(((availableVol || 100) * 0.002).toFixed(2)),
      produk_turunan: [] as any[]
    }
  }, [batchId, isId, fromMatching, matchScoreParam, apiProduct])

  // Chart Data Mapping for Recharts Radar
  const chartData = useMemo(() => {
    if (!batch?.radar_scores) return []
    return batch.radar_scores.map((item: any) => ({
      subject: item.label,
      A: item.skor_0_100,
      B: 80, // Standard minimum comparison threshold
      fullMark: 100
    }))
  }, [batch])

  const handleShare = () => {
    if (!batch) return
    if (navigator.share) {
      navigator.share({
        title: `Batch ${batch.batch_code} - VALAM`,
        url: window.location.href
      }).catch(err => console.log(err))
    } else {
      alert(isId ? "Tautan berhasil disalin!" : "Link copied to clipboard!")
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleOpenCartModal = () => {
    if (!batch) return
    setCartQuantity(batch.volume_min_order_kg)
    setCartError('')
    setIsCartModalOpen(true)
  }

  const handleCartQuantityChange = (val: number) => {
    if (!batch) return
    const validation = validateOrderQuantity(val, batch.volume_min_order_kg, batch.volume_tersedia_kg)
    if (!validation.valid) {
      setCartError(validation.errorMsg)
    } else {
      setCartError('')
    }
    setCartQuantity(val)
  }

  const handleConfirmAddToCart = async () => {
    if (!batch) return
    const validation = validateOrderQuantity(cartQuantity, batch.volume_min_order_kg, batch.volume_tersedia_kg)
    if (!validation.valid) {
      setCartError(validation.errorMsg)
      return
    }
    setIsAdding(true)
    const ok = await addToCart(batch.id, cartQuantity, batch.is_circular ? 'circular' : 'patchouli')
    setIsAdding(false)
    if (ok) {
      setIsCartModalOpen(false)
      toast({
        title: isId ? "Ditambahkan ke keranjang" : "Added to cart",
        description: isId ? `${cartQuantity} kg dari ${batch.batch_code} telah masuk ke keranjang Anda.` : `${cartQuantity} kg of ${batch.batch_code} added to your cart.`,
        action: (
          <div className="flex gap-2 items-center mt-2">
            <button 
              onClick={() => router.push('/cart')}
              className="bg-[#1A4D2E] text-white px-3 py-2 rounded-md text-xs font-bold hover:bg-[#123320]"
            >
              {isId ? "Lihat Keranjang" : "View Cart"}
            </button>
          </div>
        )
      })
    }
  }

  const handleDirectCheckout = async () => {
    if (!batch) return
    const validation = validateOrderQuantity(cartQuantity, batch.volume_min_order_kg, batch.volume_tersedia_kg)
    if (!validation.valid) {
      setCartError(validation.errorMsg)
      return
    }
    setIsAdding(true)
    const ok = await addToCart(batch.id, cartQuantity, batch.is_circular ? 'circular' : 'patchouli')
    setIsAdding(false)
    if (ok) {
      setIsCartModalOpen(false)
      router.push('/checkout')
    }
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-2">
            {isId ? 'Produk Tidak Ditemukan' : 'Product Not Found'}
          </h2>
          <p className="text-sm text-zinc-500 max-w-md mb-6 leading-relaxed">
            {isId 
              ? 'Batch produk ini tidak terdaftar di database atau belum diverifikasi oleh tim QC Laboratorium Admin.' 
              : 'This product batch is not registered in the database or has not been verified by Admin QC.'}
          </p>
          <Button asChild className="bg-[#1A4D2E] hover:bg-[#123320] text-white rounded-xl">
            <Link href="/marketplace">
              {isId ? 'Kembali ke Katalog' : 'Back to Catalog'}
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E]">
      
      {/* ─── DESKTOP HEADER NAVBAR ──────────────────────────────────────── */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* ─── MOBILE FIXED HEADER ────────────────────────────────────────── */}
      <MobileHeader 
        title={isId ? 'Detail Batch' : 'Batch Details'} 
        showFilter={false}
        rightAction={
          <button 
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors text-white shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </button>
        }
      />

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-2 pb-28 md:pt-4 md:pb-12 mt-14">
        
        {/* Breadcrumb - Desktop & Mobile */}
        <div className="mb-6 text-xs text-zinc-500 font-medium flex items-center gap-2">
          <Link href="/" className="hover:text-[#1A4D2E] transition-colors">{isId ? 'Beranda' : 'Home'}</Link>
          <span>&gt;</span>
          <button 
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }} 
            className="hover:text-[#1A4D2E] hover:underline transition-colors text-zinc-500 font-medium"
          >
            {isId ? 'Katalog Batch' : 'Batch Catalog'}
          </button>
          <span>&gt;</span>
          <span className="text-zinc-800 font-mono font-bold">{batch.batch_code}</span>
        </div>

        {/* ─── 2. VERSI WEB (DESKTOP LAYOUT) ────────────────────────────── */}
        <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
          
          {/* Web Left Panel (~65%) with Vertical Scroll */}
          <div className="col-span-8 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Card Hijau Tua Hero */}
            <div className="bg-[#1A4D2E] text-white rounded-3xl p-8 shadow-lg relative overflow-hidden space-y-6">
              <div className="absolute inset-0 bg-[radial-gradient(#15803d_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
              
              {/* Share Icon in Top-Right */}
              <button 
                onClick={handleShare}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 z-20"
                aria-label="Share batch"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Top part of green card */}
              <div className="space-y-3 z-10 relative">
                {/* 1. Kode Batch Besar Bold */}
                <h1 className="text-3xl font-mono font-black tracking-wide text-valam-gold-300">
                  {batch.batch_code}
                </h1>

                {/* 3. Baris kedua: Icon lokasi + Nama Koperasi · Kabupaten, Aceh */}
                <div className="flex items-center gap-2 text-zinc-200 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-valam-gold-400 shrink-0" />
                  <span>{batch.koperasi_nama} · {batch.lokasi}</span>
                </div>

                {/* 4. Baris badge horizontal (wrap if needed) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Premium/Standard/Basic badge */}
                  <span className="inline-flex items-center gap-1 bg-white/10 text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-lg">
                    <Crown className="w-3.5 h-3.5 text-valam-gold-400 fill-valam-gold-400" />
                    <span>{batch.badge_tier}</span>
                  </span>

                  {/* Terverifikasi GC-MS badge */}
                  {batch.badge_verifikasi_gcms && (
                    <span className="inline-flex items-center gap-1 bg-[#15803d] text-white border border-[#16a34a]/30 text-xs font-bold px-3 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-valam-gold-300" />
                      <span>{isId ? 'Terverifikasi GC-MS' : 'GC-MS Verified'}</span>
                    </span>
                  )}

                  {/* EUDR Ready badge */}
                  {batch.badge_eudr && (
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>EUDR Ready</span>
                    </span>
                  )}

                  {/* Match Score badge */}
                  {batch.match_score !== null && (
                    <span className="inline-flex items-center gap-1 bg-[#5C3D1E]/30 text-orange-300 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-lg">
                      <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      <span>Match Score: {batch.match_score}%</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom part: Sub-card Hijau Terang / Semi-Transparan (PA % + Radar Chart) */}
              {!batch.is_circular && (
                <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-6 grid grid-cols-2 gap-6 items-center z-10 relative">
                  {/* Kiri: PA% Parameter Kunci */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider block">
                      PATCHOULI ALCOHOL — PARAMETER KUNCI
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">
                        {batch.pa_persen}%
                      </span>
                      <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider">PA</span>
                    </div>
                    <span className="text-xs text-zinc-200 block -mt-2">
                      Patchouli Alcohol (PA)
                    </span>
                    
                    {/* Progress Bar Gradasi Hijau -> Gold */}
                    <div className="space-y-1 pt-1">
                      <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-valam-gold"
                          style={{ width: `${Math.min((batch.pa_persen / 40) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-300 font-bold">
                        <span>min 30%</span>
                        <span>max 40%</span>
                      </div>
                    </div>

                    {/* Badge Kecil Status Dinamis */}
                    <div className="pt-1">
                      <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                        batch.badge_tier === 'Premium' 
                          ? 'bg-[#FDF6E2] text-[#855F0D] border-[#F5E6C4]'
                          : batch.badge_tier === 'Standard'
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          : 'bg-[#FAF6F0] text-[#5C3D1E] border-[#F0E5D8]'
                      }`}>
                        {batch.badge_tier === 'Premium' ? 'PREMIUM — DI ATAS STANDAR INDUSTRI' :
                         batch.badge_tier === 'Standard' ? 'STANDARD — SESUAI STANDAR INDUSTRI' :
                         'COMMERCIAL — BATAS MINIMUM STANDAR'}
                      </span>
                    </div>
                  </div>

                  {/* Kanan: Radar Chart & Skor Breakdown */}
                  <div className="space-y-4">
                    <div className="w-full h-44 p-1 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                      <RadarChart data={chartData} variant="dark" />
                    </div>
                    {/* Skor breakdown di bawah radar chart */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider block">
                        {isId ? 'Breakdown Nilai Parameter (0-100)' : 'Parameter Score Breakdown (0-105)'}
                      </span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {batch.radar_scores.map((score, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[10px] text-zinc-200 font-medium">
                              <span>{score.label}</span>
                              <span className="text-valam-gold-300 font-bold">{Math.round(score.skor_0_100)}/100</span>
                            </div>
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-valam-gold"
                                style={{ width: `${score.skor_0_100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Radar Quality Profile (Section tambahan dari Sprint 5) */}
            {!batch.is_circular && (
              <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                <div className="border-b border-zinc-150 pb-3">
                  <h3 className="text-base font-serif font-bold text-[#1A4D2E] uppercase tracking-wide">
                    {isId ? 'Profil Kualitas & Skor Parameter' : 'Quality Profile & Parameter Scores'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="bg-zinc-50 rounded-2xl p-2 border border-zinc-100">
                    <RadarChart data={chartData} variant="light" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Skor Uji Per Parameter</h4>
                    {batch.radar_scores.map((score, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-zinc-700">
                          <span>{score.label}</span>
                          <span className="text-[#1A4D2E]">{Math.round(score.skor_0_100)}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-valam-gold-500 to-[#1A4D2E]"
                            style={{ width: `${score.skor_0_100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tabel Parameter Kimia Lengkap */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                <h3 className="text-base font-serif font-bold text-[#1A4D2E] uppercase tracking-wide">
                  {isId ? 'Parameter Kimia Lengkap (SNI)' : 'Full Chemical Parameters (SNI Reference)'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-1.5 border border-[#1A4D2E] text-[#1A4D2E] text-xs font-bold rounded-xl hover:bg-[#1A4D2E]/5 transition-colors"
                >
                  {isId ? 'Lihat Metode Uji' : 'View Test Methods'}
                </button>
              </div>

              <div className="overflow-hidden border border-zinc-150 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">{isId ? 'Parameter Uji' : 'Parameter'}</th>
                      <th className="py-3 px-4">{isId ? 'Hasil Uji' : 'Test Value'}</th>
                      <th className="py-3 px-4">{isId ? 'Standar Industri' : 'Industry Standard'}</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {batch.parameter_kimia.map((param, index) => (
                      <tr key={index}>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-zinc-900 block">{param.nama}</span>
                          <span className="text-[10px] text-zinc-400 font-normal leading-tight block mt-0.5">{param.deskripsi}</span>
                        </td>
                        <td className={`py-3.5 px-4 font-mono font-bold text-sm ${
                          param.status === 'lulus' ? 'text-emerald-700' :
                          param.status === 'perhatian' ? 'text-amber-700' :
                          'text-red-700'
                        }`}>{param.nilai}</td>
                        <td className="py-3.5 px-4 font-mono text-zinc-550">{param.standar_industri}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded border uppercase tracking-wider shadow-3xs ${
                            param.status === 'lulus' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                              : param.status === 'perhatian'
                              ? 'bg-amber-50 text-amber-800 border-amber-250'
                              : 'bg-red-50 text-red-800 border-red-250'
                          }`}>
                            {param.status === 'lulus' ? '✓ Lulus' :
                             param.status === 'perhatian' ? '⚠ Perhatian' :
                             '✗ Gagal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Web Right Panel (~35% - Sticky with Vertical Scroll) */}
          <div className="col-span-4 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1.5 custom-scrollbar sticky top-24">
            
            {/* Card Supplier */}
            <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] border border-[#1A4D2E]/20">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">{batch.koperasi_nama}</h4>
                  <p className="text-[10px] text-zinc-450 uppercase font-black tracking-wider mt-0.5">{isId ? 'Produsen Terverifikasi' : 'Verified Cooperative'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-zinc-100 pt-3">
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-0.5">{isId ? 'Rating Mitra' : 'Partner Rating'}</span>
                  <span className="font-bold text-zinc-800 flex items-center gap-1">⭐ {batch.rating}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-0.5">{isId ? 'Lama Bergabung' : 'On Platform'}</span>
                  <span className="font-bold text-zinc-800">{batch.lama_di_platform}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 col-span-2">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-0.5">{isId ? 'Total Batch Terjual' : 'Batches Sold'}</span>
                  <span className="font-bold text-zinc-800">{batch.jumlah_batch_terjual} Batch</span>
                </div>
              </div>
            </div>

            {/* Card Harga & Tombol Aksi */}
            <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-0.5">
                  {batch.is_circular ? `${isId ? "Harga" : "Price"} / ${batch.unit}` : `${isId ? "Harga B2B / Kg" : "B2B Price / Kg"}`}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-black text-2xl text-[#1A4D2E]">
                    {formatRupiah(batch.harga_per_kg)}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    (MOQ: {batch.volume_min_order_kg} {batch.unit})
                  </span>
                </div>
              </div>

              {/* Progress bar stok */}
              <div className="space-y-1 border-t border-zinc-100 pt-3">
                <div className="flex justify-between text-xs font-bold text-zinc-500">
                  <span>{isId ? 'Stok Tersedia' : 'Available Stock'}</span>
                  <span>{batch.volume_tersedia_kg} {batch.unit} ({batch.stok_persen}%)</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-valam-gold to-[#1A4D2E]"
                    style={{ width: `${batch.stok_persen}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {/* 2. Pesan Sekarang - Domestik (Desktop) */}
                <button 
                  onClick={handleOpenCartModal}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#1A4D2E] disabled:opacity-75 text-white text-xs font-bold py-3 rounded-xl hover:bg-[#123320] transition-colors shadow-md shadow-[#1A4D2E]/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isAdding 
                    ? (isId ? "Menambahkan..." : "Adding...") 
                    : (isId ? "Pesan Sekarang · Domestik" : "Order Now · Domestic")}
                </button>
                
                {/* 3. Ajukan RFQ Global (Desktop) */}
                <Link 
                  href={`/buyer/rfq?product_id=${batch.id}&qty=${batch.volume_min_order_kg}&type=global`}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#B69A1D] text-[#1A4D2E] text-xs font-black py-3 rounded-xl hover:bg-[#A38618] transition-colors shadow-md shadow-[#B69A1D]/10 text-center"
                >
                  <Compass className="w-4 h-4" />
                  {isId ? "Ajukan RFQ Global" : "Request Global RFQ"}
                </Link>
                <button 
                  onClick={() => alert('Mengunduh sertifikat analisis...')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white border border-[#1A4D2E] text-[#1A4D2E] text-xs font-bold py-3 rounded-xl hover:bg-[#1A4D2E]/5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isId ? "Unduh Sertifikat CoA" : "Download CoA Document"}
                </button>
                <button 
                  onClick={() => alert('Sampel dimasukkan ke keranjang permintaan')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white border border-valam-gold text-valam-gold-700 text-xs font-bold py-3 rounded-xl hover:bg-valam-gold-50 transition-colors"
                >
                  <Beaker className="w-4 h-4" />
                  {isId ? "Minta Sampel Pengujian (10ml)" : "Request Lab Sample (10ml)"}
                </button>
              </div>
            </div>

            {/* Card Circular Economy */}
            <div className="bg-[#5C3D1E]/5 rounded-3xl p-5 border border-[#5C3D1E]/10 space-y-4">
              <div className="flex items-center gap-2 text-[#5C3D1E]">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <h4 className="font-serif font-bold text-sm uppercase tracking-wider">{isId ? 'Eco Products (Nol Limbah)' : 'Eco Products (Zero Waste)'}</h4>
              </div>
              <p className="text-zinc-650 text-xs leading-relaxed">
                {isId ? 'Setiap batch sulingan minyak nilam menghasilkan limbah ampas daun & air hidrosol yang diolah kembali secara produktif:' : 'Every batch of distilled patchouli oil yields organic residues that are productively repurposed:'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-[#5C3D1E]/10">
                  <span className="text-[9px] text-[#5C3D1E] font-bold block mb-0.5">{isId ? 'Ampas Tersedia' : 'Leaves Residue'}</span>
                  <span className="font-bold text-[#5C3D1E]">{batch.ampas_tersedia_kg} Kg</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#5C3D1E]/10">
                  <span className="text-[9px] text-[#5C3D1E] font-bold block mb-0.5">{isId ? 'Terhindar CO2' : 'Avoided CO2'}</span>
                  <span className="font-bold text-[#5C3D1E]">~{batch.estimasi_co2_ton} Ton</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">{isId ? 'Produk Turunan Sekunder' : 'Secondary Circular Products'}</span>
                <div className="flex flex-wrap gap-1.5">
                  {batch.produk_turunan.map((item, idx) => (
                    <span key={idx} className="bg-white border border-[#5C3D1E]/15 text-[#5C3D1E] px-2 py-0.5 rounded-md text-[9px] font-bold shadow-3xs">
                      {item.nama}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* List Trust Info */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 text-xs text-zinc-500 space-y-2">
              <div className="flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-[#1A4D2E] shrink-0 mt-0.5" />
                <p>{isId ? 'Pembayaran dilindungi escrow aman pihak ketiga.' : 'Payments are secured using trusted escrow accounts.'}</p>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-[#1A4D2E] shrink-0 mt-0.5" />
                <p>{isId ? 'Batch divalidasi keasliannya lewat pengujian GC-MS.' : 'Batch authenticity verified via GC-MS laboratory tests.'}</p>
              </div>
            </div>

          </div>

        </div>

        {/* ─── 3. VERSI MOBILE (MOBILE LAYOUT) ───────────────────────────── */}
        <div className="lg:hidden space-y-5 mt-4">
          
          {/* Card Hijau Tua (Hero Card) */}
          <div className="bg-[#1A4D2E] text-white rounded-2xl p-5 shadow-md relative overflow-hidden space-y-4">
            <div className="absolute inset-0 bg-[radial-gradient(#15803d_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-10 pointer-events-none" />
            
            {/* Baris atas: kode batch besar bold "#ID-BATCH" (kiri), badge tipe (kanan) */}
            <div className="flex justify-between items-center gap-2 relative z-10">
              <h1 className="text-2xl font-mono font-black tracking-wide text-valam-gold-300">
                {batch.batch_code}
              </h1>
              {batch.badge_tipe && (
                <span className="bg-valam-gold text-[#1A4D2E] font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                  {batch.badge_tipe}
                </span>
              )}
            </div>

            {/* Baris kedua: icon lokasi + Nama Koperasi - Kabupaten */}
            <div className="relative z-10 flex items-center gap-1.5 text-zinc-200 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-valam-gold-400 shrink-0" />
              <span>{batch.koperasi_nama} - {batch.lokasi.replace(', Aceh', '')}</span>
            </div>

            {/* Baris badge: Premium/Standard/Basic, Terverifikasi GC-MS, EUDR Ready, Match Score */}
            <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/10 relative z-10">
              {/* Quality Tier badge */}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border shadow-3xs ${
                batch.badge_tier === 'Premium' ? 'bg-[#FDF6E2] text-[#855F0D] border-[#F5E6C4]' :
                batch.badge_tier === 'Standard' ? 'bg-[#F4F4F5] text-[#27272A] border-[#E4E4E7]' :
                'bg-[#FAF6F0] text-[#5C3D1E] border-[#F0E5D8]'
              }`}>
                {batch.badge_tier}
              </span>

              {/* Terverifikasi GC-MS badge */}
              {batch.badge_verifikasi_gcms && (
                <span className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-3xs">
                  <Check className="w-2.5 h-2.5" /> GC-MS Verified
                </span>
              )}

              {/* EUDR Ready badge */}
              {batch.badge_eudr && (
                <span className="bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-3xs">
                  <Leaf className="w-2.5 h-2.5 text-emerald-500" /> EUDR Ready
                </span>
              )}

              {/* Match Score badge */}
              {batch.match_score !== null && (
                <span className="bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5] text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-3xs">
                  Match {batch.match_score}%
                </span>
              )}
            </div>
          </div>

          {/* Card Putih "Patchouli Alcohol - Parameter Kunci" */}
          {!batch.is_circular && (
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4 flex flex-col items-center text-center">
              <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                PATCHOULI ALCOHOL — PARAMETER KUNCI
              </h4>

              <div className="space-y-0.5">
                <span className="text-4xl font-black text-[#1A4D2E] block">
                  {batch.pa_persen}%
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  Patchouli Alcohol (PA)
                </span>
              </div>

              {/* Progress bar gradasi */}
              <div className="w-full space-y-1">
                <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-valam-gold"
                    style={{ width: `${Math.min((batch.pa_persen / 40) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold px-0.5">
                  <span>min {batch.pa_min}%</span>
                  <span>max {batch.pa_max}%</span>
                </div>
              </div>

              {/* Badge status di bawah, center-aligned, bg krem-gold pucat */}
              <div className="pt-1">
                <span className={`inline-flex items-center text-[9px] font-black px-3 py-1 rounded border uppercase tracking-wider shadow-3xs ${
                  batch.badge_tier === 'Premium' 
                    ? 'bg-[#FDF6E2] text-[#855F0D] border-[#F5E6C4]'
                    : batch.badge_tier === 'Standard'
                    ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    : 'bg-[#FAF6F0] text-[#5C3D1E] border-[#F0E5D8]'
                }`}>
                  {batch.badge_tier === 'Premium' ? 'PREMIUM — DI ATAS STANDAR INDUSTRI' :
                   batch.badge_tier === 'Standard' ? 'STANDARD — SESUAI STANDAR INDUSTRI' :
                   'COMMERCIAL — BATAS MINIMUM STANDAR'}
                </span>
              </div>
            </div>
          )}

          {/* Card Putih "Profil Kualitas (Radar)" */}
          {!batch.is_circular && (
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
              <div className="border-b border-zinc-150 pb-2">
                <h3 className="text-xs font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
                  {isId ? 'Profil Kualitas (Radar)' : 'Quality Profile (Radar)'}
                </h3>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Kiri: Radar Chart */}
                <div className="col-span-5 h-36 bg-zinc-50 rounded-xl p-0.5 border border-zinc-100 flex items-center justify-center">
                  <RadarChart data={chartData} variant="light" />
                </div>
                {/* Kanan: Skor Per Parameter */}
                <div className="col-span-7 space-y-2.5">
                  {batch.radar_scores.map((score, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-700">
                        <span className="truncate mr-1">{score.label}</span>
                        <span className="text-[#1A4D2E] shrink-0">{Math.round(score.skor_0_100)}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-valam-gold to-[#1A4D2E]"
                          style={{ width: `${score.skor_0_100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Card Putih "Parameter Kimia Lengkap" (Mobile: List format) */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-150 pb-3">
              <div className="flex items-center gap-2 text-[#1A4D2E]">
                <FlaskConical className="w-5 h-5" />
                <h3 className="text-xs font-serif font-black uppercase tracking-wide">
                  {isId ? 'Parameter Kimia Lengkap (SNI)' : 'Full Chemical Parameters (SNI Reference)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] text-[#1A4D2E] font-bold underline hover:text-[#123320] text-left block mt-1"
              >
                {isId ? 'Lihat Metode Uji Lab >' : 'View Lab Test Methods >'}
              </button>
            </div>

            <div className="space-y-3 divide-y divide-zinc-100">
              {batch.parameter_kimia.map((param, index) => (
                <div key={index} className={`flex justify-between items-center ${index > 0 ? 'pt-3' : ''}`}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-800 block">{param.nama}</span>
                    <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                      {param.deskripsi} • Standar: {param.standar_industri}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`font-mono text-xs font-black ${
                      param.status === 'lulus' ? 'text-emerald-700' :
                      param.status === 'perhatian' ? 'text-amber-700' :
                      'text-red-700'
                    }`}>{param.nilai}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      param.status === 'lulus' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                        : param.status === 'perhatian'
                        ? 'bg-amber-50 text-amber-800 border-amber-150'
                        : 'bg-red-50 text-red-800 border-red-150'
                    }`}>
                      {param.status === 'lulus' ? '✓ Lulus' :
                       param.status === 'perhatian' ? '⚠ Perhatian' :
                       '✗ Gagal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Info Stack */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              {/* Initial Avatar (bg gold) */}
              <div className="w-12 h-12 rounded-full bg-[#B69A1D] flex items-center justify-center text-white text-base font-black border border-[#B69A1D]/25 shadow-sm shrink-0">
                {batch.koperasi_nama.substring(0, 2).toUpperCase()}
              </div>
              
              <div className="space-y-0.5">
                <h4 className="font-bold text-zinc-900 text-sm leading-snug">{batch.koperasi_nama}</h4>
                <div className="flex items-center gap-1 text-zinc-455 text-[10px]">
                  <MapPin className="w-3 h-3 text-[#1A4D2E]" />
                  <span>{batch.lokasi}</span>
                </div>
              </div>
            </div>

            {/* Badge Rating */}
            <div className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#F0E5D8] px-3 py-1.5 rounded-xl w-max">
              <Star className="w-4 h-4 text-valam-gold fill-valam-gold shrink-0" />
              <span className="text-xs font-black text-[#5C3D1E]">{batch.rating}</span>
              <span className="text-[8px] font-black text-[#5C3D1E]/60 tracking-wider">RATING</span>
            </div>

            {/* 3 stat kecil berjajar */}
            <div className="grid grid-cols-3 gap-2 text-[10px] border-t border-zinc-100 pt-3">
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex flex-col items-center justify-center text-center space-y-1">
                <ShoppingCart className="w-4 h-4 text-[#1A4D2E]" />
                <div className="leading-tight">
                  <span className="font-bold text-zinc-800 block">{batch.jumlah_batch_terjual} Batch</span>
                  <span className="text-zinc-450 text-[8px] uppercase font-bold block">{isId ? 'Terjual' : 'Sold'}</span>
                </div>
              </div>
              
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex flex-col items-center justify-center text-center space-y-1">
                <Compass className="w-4 h-4 text-[#1A4D2E]" />
                <div className="leading-tight">
                  <span className="font-bold text-zinc-800 block">{batch.lama_di_platform}</span>
                  <span className="text-zinc-450 text-[8px] uppercase font-bold block">{isId ? 'Platform' : 'Joined'}</span>
                </div>
              </div>
              
              <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-100 flex flex-col items-center justify-center text-center space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div className="leading-tight">
                  <span className="font-bold text-zinc-800 block">{batch.status_verifikasi_persen}%</span>
                  <span className="text-zinc-450 text-[8px] uppercase font-bold block">{isId ? 'Verifikasi' : 'Verified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Harga & Tombol Aksi Stack */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-450 block mb-0.5">
                {isId ? "HARGA" : "PRICE"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-2xl text-[#1A4D2E]">
                  {formatRupiah(batch.harga_per_kg)}
                </span>
                <span className="text-xs text-zinc-550 font-medium">
                  /kg
                </span>
              </div>
              <div className="flex gap-2 text-[10px] text-zinc-500 font-bold mt-1">
                <span>{isId ? 'Volume tersedia:' : 'Available volume:'} {batch.volume_tersedia_kg} kg</span>
                <span>•</span>
                <span>{isId ? 'Min. order:' : 'Min. order:'} {batch.volume_min_order_kg} kg</span>
              </div>
            </div>

            {/* Progress bar stok */}
            <div className="space-y-1 border-t border-zinc-100 pt-3">
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-valam-gold to-[#1A4D2E]"
                  style={{ width: `${batch.stok_persen}%` }}
                />
              </div>
              <div className="text-[9px] text-zinc-455 font-bold flex justify-between">
                <span>{isId ? `Stok tersisa ${batch.stok_persen}%` : `Stock left ${batch.stok_persen}%`}</span>
                <span>{isId ? 'Uji Lab:' : 'Lab Tested:'} {batch.tanggal_uji_lab || '04 Juli 2026'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {/* 1. Unduh CoA PDF */}
              <button 
                onClick={() => {
                  alert(isId ? 'Mengunduh berkas CoA PDF untuk batch ini...' : 'Downloading CoA PDF file for this batch...');
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-white border border-[#1A4D2E] text-[#1A4D2E] text-xs font-bold py-3 rounded-xl hover:bg-[#1A4D2E]/5 transition-colors shadow-2xs"
              >
                <FileText className="w-4 h-4" />
                {isId ? "Unduh CoA PDF" : "Download CoA PDF"}
              </button>
              
              {/* 2. Pesan Sekarang - Domestik */}
              <button 
                onClick={handleOpenCartModal}
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-1.5 bg-[#1A4D2E] disabled:opacity-75 text-white text-xs font-bold py-3 rounded-xl hover:bg-[#123320] transition-colors shadow-md shadow-[#1A4D2E]/10 text-center cursor-pointer border-none"
              >
                <ShoppingCart className="w-4 h-4" />
                {isAdding 
                  ? (isId ? "Menambahkan..." : "Adding...") 
                  : (isId ? "Pesan Sekarang · Domestik" : "Order Now · Domestic")}
              </button>

              {/* 3. Ajukan RFQ Global */}
              <Link 
                href={`/buyer/rfq?product_id=${batch.id}&qty=${batch.volume_min_order_kg}&type=global`}
                className="w-full flex items-center justify-center gap-1.5 bg-[#B69A1D] text-[#1A4D2E] text-xs font-black py-3 rounded-xl hover:bg-[#A38618] transition-colors shadow-md shadow-[#B69A1D]/10 text-center"
              >
                <Compass className="w-4 h-4" />
                {isId ? "Ajukan RFQ Global · Ekspor Internasional" : "Request Global RFQ · International Export"}
              </Link>
            </div>
          </div>

          {/* Card Circular Economy */}
          {batch.ampas_tersedia_kg > 0 && batch.produk_turunan && batch.produk_turunan.length > 0 && (
            <div className="bg-[#FAF5EC] border border-[#E9DFD0] rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-[#5C3D1E]">
                <Leaf className="w-5 h-5 text-[#1A4D2E] fill-emerald-50" />
                <h4 className="font-serif font-black text-sm uppercase tracking-wide">
                  {isId ? 'Eco Products — Ampas Batch Ini' : 'Eco Products — Residue of this Batch'}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#E9DFD0] space-y-0.5">
                  <span className="text-[9px] text-[#5C3D1E]/70 font-bold block uppercase">{isId ? 'Ampas Tersedia' : 'Residue Available'}</span>
                  <span className="font-bold text-[#5C3D1E] text-sm">{batch.ampas_tersedia_kg.toLocaleString()} kg</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E9DFD0] space-y-0.5">
                  <span className="text-[9px] text-[#5C3D1E]/70 font-bold block uppercase">{isId ? 'CO2 Terhindar' : 'CO2 Avoided'}</span>
                  <span className="font-bold text-[#5C3D1E] text-sm">~{batch.estimasi_co2_ton} ton</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-[#5C3D1E]/70 font-bold uppercase tracking-wider block">
                  {isId ? 'Pilihan Produk Turunan Sekunder' : 'Secondary Derivative Products'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {batch.produk_turunan.map((item, idx) => (
                    <span key={idx} className="bg-white border border-[#E9DFD0] text-[#5C3D1E] px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-3xs">
                      {item.nama}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if ((window as any).openCircularOrderModal && batch.produk_turunan.length > 0) {
                    (window as any).openCircularOrderModal(batch.produk_turunan[0], batch.id);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-[#B69A1D] text-[#1A4D2E] text-xs font-black py-3 rounded-xl hover:bg-[#A38618] transition-colors shadow-sm"
              >
                {isId ? "Pesan Produk Turunan →" : "Order Derivative Products →"}
              </button>
            </div>
          )}

          {/* List Trust Info */}
          <div className="text-xs text-zinc-500 space-y-3.5 pt-2 pb-16">
            {(TRUST_INFO_ITEMS[locale] || TRUST_INFO_ITEMS.id).map((item: any, idx: number) => {
              let IconComponent = ShieldCheck
              if (item.icon === 'lock') IconComponent = Lock
              if (item.icon === 'admin') IconComponent = User
              if (item.icon === 'doc') IconComponent = FileText
              
              return (
                <div key={idx} className="flex gap-2.5 items-start">
                  <IconComponent className="w-4.5 h-4.5 text-[#1A4D2E] shrink-0 mt-0.5" />
                  <p className="leading-snug">{item.text}</p>
                </div>
              )
            })}
          </div>

        </div>

      </main>

      {/* ─── DESKTOP FOOTER ─────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ────────────────────────────────── */}
      <BottomNavigation />

      {/* Testing Methods Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-zinc-200 shadow-xl space-y-6 relative animate-scale-in">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1A4D2E]">
                <FlaskConical className="w-6 h-6" />
                <h3 className="text-lg font-serif font-black uppercase tracking-wide">
                  {isId ? 'Metode Uji Laboratorium' : 'Laboratory Testing Methods'}
                </h3>
              </div>
              <p className="text-zinc-550 text-xs">
                {isId ? 'Semua pengujian dilakukan di laboratorium atsiri bersertifikasi KAN sesuai standar nasional & internasional.' : 'All tests performed at accredited essential oil laboratories complying with SNI & international B2B regulations.'}
              </p>
            </div>

            <div className="divide-y divide-zinc-100 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">Patchouli Alcohol (PA%)</span>
                <span className="text-zinc-500 block">Gas Chromatography - Mass Spectrometry (GC-MS)</span>
              </div>
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">{isId ? 'Kadar Air (Moisture)' : 'Moisture Content'}</span>
                <span className="text-zinc-500 block">Gravimetry / Oven drying method (SNI 06-2388-2006)</span>
              </div>
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">{isId ? 'Kandungan Logam (Fe)' : 'Iron (Fe) Content'}</span>
                <span className="text-zinc-500 block">Atomic Absorption Spectroscopy (AAS)</span>
              </div>
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">{isId ? 'Bobot Jenis' : 'Specific Gravity'}</span>
                <span className="text-zinc-500 block">Pycnometry at 20°C / Digital Density Meter</span>
              </div>
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">{isId ? 'Indeks Bias' : 'Refractive Index'}</span>
                <span className="text-zinc-500 block">Refractometry at 20°C</span>
              </div>
              <div className="py-3 space-y-1">
                <span className="font-bold text-zinc-800 block">{isId ? 'Rotasi Optik' : 'Optical Rotation'}</span>
                <span className="text-zinc-500 block">Polarimetry at 20°C</span>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-[#1A4D2E] text-white font-bold py-3 rounded-xl hover:bg-[#123320] transition-colors"
            >
              {isId ? 'Tutup Deskripsi' : 'Close Details'}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL ADD TO CART ──────────────────────────────────────────── */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:fade-in md:zoom-in duration-200">
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-bold text-[#1A4D2E] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {isId ? 'Pilih Metode Pemesanan' : 'Choose Order Method'}
              </h3>
              <button onClick={() => setIsCartModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 bg-white shadow-sm p-1.5 rounded-full border border-zinc-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Ringkasan Batch */}
              <div className="flex gap-3 bg-zinc-50 border border-zinc-100 p-3 rounded-2xl items-center">
                <div className="w-12 h-12 rounded-xl bg-valam-gold/20 flex items-center justify-center text-valam-gold-700 font-bold text-xs shadow-inner">
                  {batch.batch_code.split('-').pop()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-800">{batch.batch_code}</h4>
                  <p className="text-xs text-zinc-500">{batch.koperasi_nama}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="block text-xs font-bold text-[#1A4D2E]">{formatRupiah(batch.harga_per_kg)}</span>
                  <span className="text-[10px] text-zinc-400">/ {batch.unit}</span>
                </div>
              </div>

              {/* Input Kuantitas */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">{isId ? 'Jumlah Pesanan (Kg)' : 'Order Quantity (Kg)'}</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleCartQuantityChange(cartQuantity - 1)}
                    className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input 
                    type="number" 
                    value={cartQuantity}
                    onChange={(e) => handleCartQuantityChange(parseInt(e.target.value) || 0)}
                    className="flex-1 h-10 bg-white border-2 border-zinc-200 rounded-xl text-center font-bold text-zinc-800 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                  />
                  <button 
                    onClick={() => handleCartQuantityChange(cartQuantity + 1)}
                    className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {cartError && (
                  <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> {cartError}
                  </p>
                )}
                {!cartError && (
                  <p className="text-[10px] text-zinc-400 mt-1">
                    MOQ: {batch.volume_min_order_kg} {batch.unit} | {isId ? 'Stok' : 'Stock'}: {batch.volume_tersedia_kg} {batch.unit}
                  </p>
                )}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center bg-[#1A4D2E]/5 p-4 rounded-2xl border border-[#1A4D2E]/10">
                <span className="text-xs font-bold text-zinc-600">Subtotal</span>
                <span className="font-black text-lg text-[#1A4D2E]">{formatRupiah(batch.harga_per_kg * cartQuantity)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-2 bg-white">
              <button 
                onClick={handleConfirmAddToCart}
                disabled={isAdding || cartError !== ''}
                className="flex-1 py-3 px-4 text-xs font-bold rounded-xl border-2 border-[#1A4D2E] text-[#1A4D2E] hover:bg-[#1A4D2E]/5 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                {isAdding ? (isId ? 'Memproses...' : 'Processing...') : (isId ? '+ Keranjang' : '+ Cart')}
              </button>
              <button 
                onClick={handleDirectCheckout}
                disabled={isAdding || cartError !== ''}
                className="flex-1 py-3 px-4 text-xs font-bold rounded-xl bg-[#1A4D2E] text-white hover:bg-[#123320] disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md shadow-[#1A4D2E]/20 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                {isAdding ? (isId ? 'Memproses...' : 'Processing...') : (isId ? 'Langsung Transaksi' : 'Direct Order')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
