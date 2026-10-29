'use client'

import { whatsappNumber } from '@/lib/supplier-contact';

import { SupplierProfileSkeleton } from '@/components/skeletons'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { 
  ArrowLeft, CheckCircle2, Factory, MapPin, ShieldCheck, Star, Users, Calendar, 
  MessageSquare, Package, Info, ArrowUpRight, Award, ChevronRight, Heart, 
  Globe, Phone, Mail, FileText, Map, Image as ImageIcon, ThumbsUp, ShieldAlert,
  Clock, Check, QrCode, FileCheck, Layers, Link as LinkIcon, Leaf
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatRupiah } from '@/lib/mock-data'
import { useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { getSupplierDisplayName } from '@/lib/utils'

export default function SupplierStorePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supplierId = params.id as string
  const locale = useLocale() as 'id' | 'en'
  const fromMatching = searchParams.get('from') === 'matching'
  
  const [batches, setBatches] = useState<any[]>([])
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'produk' | 'sertifikasi' | 'proses' | 'ulasan' | 'riwayat'>('profil')
  const [activeTraceStep, setActiveTraceStep] = useState<1 | 2 | 3 | 4>(1)
  const [isSaved, setIsSaved] = useState(false)
  const [showFloating, setShowFloating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [supplierUser, setSupplierUser] = useState<any>(null)

  useEffect(() => {
    // Monitor scroll to show sticky bottom bar
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowFloating(true)
      } else {
        setShowFloating(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchSupplier = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      try {
        const res = await fetch(`${apiUrl}/products/suppliers/${supplierId}`, { cache: 'no-store' })
        if (res.ok) {
          const result = await res.json()
          setSupplierUser(result.data)
          // Map products
          const mapped = (result.data.products || []).map((p: any) => ({
            id: p.id,
            batch_code: p.batch_code,
            supplier_name: getSupplierDisplayName(result.data),
            status: p.status,
            origin_village: p.origin_village || '',
            origin_district: p.origin_district || '',
            pa_percentage: p.qc_result?.pa_percentage ?? null,
            moisture: p.qc_result?.moisture ?? null,
            price_per_kg: p.price_per_kg,
            available_volume_kg: p.available_volume_kg,
            images: p.images && p.images.length > 0 ? p.images : ["/images/premium_oil_dark.png"],
            is_circular: false
          }))
          
          const circularMapped = (result.data.circular_products || []).map((cp: any) => ({
            id: cp.id,
            batch_code: cp.name,
            supplier_name: getSupplierDisplayName(result.data),
            status: cp.status,
            origin_village: '',
            origin_district: result.data.supplier_profile?.kabupaten || 'Aceh',
            pa_percentage: 0,
            moisture: 0,
            price_per_kg: cp.price,
            available_volume_kg: cp.stock,
            images: cp.image ? [cp.image] : [],
            is_circular: true,
            category: cp.category,
            benefit: cp.benefit,
            description: cp.description,
            unit: cp.unit
          }))
          
          setBatches([...mapped, ...circularMapped])
        } else {
          throw new Error('Fallback')
        }
      } catch {
        setSupplierUser(null); setBatches([]);
      } finally {
        setLoading(false)
      }
    }

    fetchSupplier()
  }, [supplierId, locale])

  // Dynamically compute info from supplierUser
  const info = {
    name: supplierUser ? getSupplierDisplayName(supplierUser) : 'Belum tersedia',
    district: supplierUser?.supplier_profile?.kabupaten || 'Belum tersedia',
    village: supplierUser?.supplier_profile?.desa || 'Belum tersedia',
    sales: 'Belum tersedia', rating: '—', reviews: '—', respons: 'Belum tersedia',
    desc: 'Profil pemasok berdasarkan data yang tersedia. Verifikasi identitas tidak menyatakan kelulusan mutu seluruh batch.',
    founded: supplierUser?.supplier_profile?.tahun_berdiri || 'Belum tersedia',
    members: supplierUser?.supplier_profile?.jumlah_anggota == null ? 'Belum tersedia' : String(supplierUser.supplier_profile.jumlah_anggota),
    legalitas: 'Dokumen identitas tidak ditampilkan secara publik', npwp: 'Tidak ditampilkan secara publik',
    alamat: supplierUser?.supplier_profile?.alamat_lengkap || 'Belum tersedia',
    email: supplierUser?.email || '',
    telp: supplierUser?.supplier_profile?.whatsapp || '',
    web: supplierUser?.supplier_profile?.website || 'Belum tersedia',
    produksi: supplierUser?.supplier_profile?.kapasitas_produksi == null ? 'Belum tersedia' : String(supplierUser.supplier_profile.kapasitas_produksi) + ' Kg',
    minOrder: supplierUser?.supplier_profile?.minimum_order == null ? 'Belum tersedia' : String(supplierUser.supplier_profile.minimum_order) + ' Kg',
    waktuProduksi: supplierUser?.supplier_profile?.durasi_produksi || 'Belum tersedia',
    metode: supplierUser?.supplier_profile?.metode_distilasi || 'Belum tersedia',
    bahanBaku: supplierUser?.supplier_profile?.bahan_baku || 'Belum tersedia',
  }

  const oilBatches = batches.filter(b => !b.is_circular)
  const avgPA = oilBatches.length > 0 
    ? (oilBatches.reduce((sum, b) => sum + (b.pa_percentage || 0), 0) / oilBatches.length).toFixed(1) 
    : 'N/A';
  const avgMoisture = oilBatches.length > 0 
    ? (oilBatches.reduce((sum, b) => sum + (b.moisture || 0), 0) / oilBatches.length).toFixed(1) 
    : 'N/A';
  const lastTestedDate = oilBatches.length > 0 && oilBatches[0].tested_at 
    ? new Date(oilBatches[0].tested_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : 'Belum tersedia';

  const handleRequestQuote = () => {
    const role = localStorage.getItem('valam_role')
    if (role !== 'buyer') {
      alert(locale === 'id' ? 'Silakan masuk ke akun Buyer (Pembeli) untuk mengajukan RFQ.' : 'Please log in to a Buyer account to submit an RFQ.')
      router.push(`/${locale}/login?redirect=/marketplace/supplier/${supplierId}`)
      return
    }
    router.push(`/${locale}/buyer/rfq?supplier=${supplierId}`)
  }

  if (loading) return <SupplierProfileSkeleton />;
  if (!supplierUser) return <main className="p-8"><p role="alert">Profil pemasok tidak tersedia atau API gagal dihubungi. Tidak ada data contoh ditampilkan.</p><Link href="/marketplace">Kembali ke katalog</Link></main>;

  return (
    <div className="min-h-screen valam-grid-bg text-zinc-800 flex flex-col relative selection:bg-emerald-100 selection:text-emerald-950 font-sans">
      <Navbar />

      <main className="flex-1 mt-20 pb-20 z-10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {/* Back Button -> Light theme styling */}
          {fromMatching ? (
            <button 
              onClick={(e) => {
                e.preventDefault()
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back()
                } else {
                  router.push(`/matching`)
                }
              }} 
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-6 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Smart Matching</span>
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.preventDefault()
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back()
                } else {
                  router.push('/marketplace')
                }
              }}
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-6 text-sm font-medium focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === 'id' ? 'Kembali' : 'Back'}</span>
            </button>
          )}

          {/* MAIN COVER BANNER (Stretching full height of the top block - Superimposed text style) */}
          <div className="bg-emerald-950 border border-zinc-250/60 rounded-3xl overflow-hidden shadow-sm relative min-h-[300px] flex flex-col justify-between">
            {/* The Cover Image stretching full height */}
            <div className="absolute inset-0 w-full h-full">
              <Image 
                src="/images/cover_green_hill.png" 
                alt="Green Hill Cover" 
                fill 
                className="object-cover opacity-85" 
              />
              {/* Dark green overlay to guarantee high-contrast text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            </div>

            {/* Profile Info Overlayed ON TOP of the Cover Image */}
            <div className="relative z-10 px-8 pt-8 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6 mt-auto">
              <div className="flex items-end gap-5">
                {/* Logo Box KO */}
                <div className="w-28 h-28 bg-white text-emerald-950 rounded-2xl flex items-center justify-center font-serif font-bold text-4xl shadow-2xl border-4 border-white shrink-0">
                  {info.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-2 mb-2 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight drop-shadow-md">
                      {info.name}
                    </h1>
                    <Badge className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold uppercase text-[9px] tracking-wider py-0.5 px-2.5 rounded-full border-none">
                      VERIFIED PEMASOK
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gold-400" />
                    <span>{info.alamat}</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Berdiri Sejak {info.founded}</span>
                  </div>
                </div>
              </div>

              {/* CTAs Floating on the cover image */}
              <div className="flex items-center gap-3 shrink-0 mb-2 w-full md:w-auto">
                <a 
                  href={whatsappNumber(info.telp) ? "https://wa.me/" + whatsappNumber(info.telp) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold h-11 px-6 rounded-xl shadow-md gap-2 flex items-center justify-center border-none">
                    <MessageSquare className="w-4 h-4" />
                    {whatsappNumber(info.telp) ? "Hubungi WhatsApp" : "Kontak belum tersedia"}
                  </Button>
                </a>
                <Button 
                  onClick={() => setIsSaved(!isSaved)}
                  variant="outline" 
                  className={`h-11 px-5 rounded-xl text-sm gap-2 transition-colors border-white/20 bg-white/10 text-white hover:bg-white/20`}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-red-500 text-white' : ''}`} />
                  {isSaved ? 'Tersimpan' : 'Simpan Pemasok'}
                </Button>
              </div>
            </div>

            {/* Quick Pills overlaying on the cover image */}
            <div className="relative z-10 px-8 pb-6 flex flex-wrap gap-2">
              <span className="text-[10px] text-white bg-emerald-950/65 backdrop-blur-sm border border-emerald-500/30 px-3 py-1 rounded-full font-medium">Produsen Minyak Nilam</span>
              <span className="text-[10px] text-white bg-emerald-950/65 backdrop-blur-sm border border-emerald-500/30 px-3 py-1 rounded-full font-medium">Koperasi Petani</span>
              {batches.some(b => b.is_circular) && (
                <span className="text-[10px] text-white bg-emerald-800/80 backdrop-blur-sm border border-emerald-450/40 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-300 animate-pulse" /> Zero Waste Partner
                </span>
              )}
              <span className="text-[10px] text-white bg-emerald-950/65 backdrop-blur-sm border border-emerald-500/30 px-3 py-1 rounded-full font-medium">Distilasi Uap Modern</span>
            </div>

          </div>

          {/* 4 Metrics Columns Grid (Separate bar below the cover card) */}
          <div className="bg-white border border-zinc-200 rounded-3xl mt-4 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-100 shadow-sm relative z-10">
            
            {/* Metric 1 */}
            <div className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rating Pemasok</p>
                <p className="text-sm font-bold text-zinc-800">{info.rating} / 5.0</p>
                <p className="text-[9px] text-zinc-400">({info.reviews} ulasan)</p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Penjualan</p>
                <p className="text-sm font-bold text-zinc-800">{info.sales}</p>
                <p className="text-[9px] text-zinc-400">(12 bulan terakhir)</p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Petani Binaan</p>
                <p className="text-sm font-bold text-zinc-800">{info.members}</p>
                <p className="text-[9px] text-zinc-400">Fostered members</p>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Responsif</p>
                <p className="text-sm font-bold text-zinc-800">{info.respons}</p>
                <p className="text-[9px] text-zinc-400">Rata-rata respons</p>
              </div>
            </div>

          </div>

          {/* TAB BUTTONS (NAVIGATION) */}
          <div className="flex border-b border-zinc-200 mt-10 overflow-x-auto whitespace-nowrap scrollbar-none bg-white/40 backdrop-blur-sm rounded-t-xl px-2">
            {[
              { id: 'profil', label: 'Profil' },
              { id: 'produk', label: locale === 'id' ? `Produk (${batches.length})` : `Products (${batches.length})` },
              { id: 'sertifikasi', label: 'Sertifikasi & Uji Mutu' },
              { id: 'ulasan', label: `Ulasan (${info.reviews})` },
              { id: 'riwayat', label: 'Riwayat Transaksi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-4 px-6 font-serif font-semibold text-sm border-b-2 transition-all ${
                  activeSubTab === tab.id 
                    ? 'border-emerald-650 text-emerald-950 font-bold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* FULL SCREEN WIDE CONTENT (No Sidebar - Matching the exact user screenshot crop layout) */}
          <div className="mt-8">
            <h2 className="sr-only">
              {activeSubTab === 'profil' ? (locale === 'id' ? 'Profil Koperasi Pemasok' : 'Cooperative Supplier Profile') : 
               activeSubTab === 'produk' ? (locale === 'id' ? 'Katalog Batch Produk' : 'Product Batch Catalog') : 
               activeSubTab === 'sertifikasi' ? (locale === 'id' ? 'Sertifikasi & Uji Mutu' : 'Certification & Quality Testing') : 
               activeSubTab === 'ulasan' ? (locale === 'id' ? 'Ulasan Pemasok' : 'Supplier Reviews') : (locale === 'id' ? 'Riwayat Transaksi' : 'Transaction History')}
            </h2>
            
            {/* Tab: PROFIL */}
            {activeSubTab === 'profil' && (
              <div className="space-y-6">
                
                {/* FIRST ROW: 3 Columns (Tentang Koperasi, Informasi Umum, Kapasitas Produksi) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Tentang Koperasi */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-emerald-950 mb-4">Tentang Koperasi</h3>
                      <p className="text-zinc-650 text-xs leading-relaxed font-sans">{info.desc}</p>
                    </div>
                    <div className="mt-6">
                      <Button variant="outline" className="border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 text-xs rounded-lg h-9 px-4">
                        Lihat Selengkapnya
                      </Button>
                    </div>
                  </div>

                  {/* Informasi Umum */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-emerald-950 mb-4">Informasi Umum</h3>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Jenis Usaha</td>
                          <td className="py-2 text-right text-zinc-800">Koperasi Produsen</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Legalitas</td>
                          <td className="py-2 font-mono text-right text-zinc-800 text-[10px]">{info.legalitas}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">NPWP</td>
                          <td className="py-2 font-mono text-right text-zinc-800">{info.npwp}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Alamat</td>
                          <td className="py-2 text-right text-zinc-800 max-w-[150px] truncate" title={info.alamat}>{info.alamat}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Email</td>
                          <td className="py-2 font-mono text-right text-zinc-800">{info.email}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Telepon</td>
                          <td className="py-2 font-mono text-right text-zinc-800">{info.telp}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-zinc-400 font-medium">Website</td>
                          <td className="py-2 font-mono text-right text-emerald-800 font-bold">{info.web}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Kapasitas Produksi */}
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-emerald-950 mb-4">Kapasitas Produksi</h3>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Produksi Per Bulan</td>
                          <td className="py-2 text-right text-zinc-800 font-bold">{info.produksi}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Minimum Order</td>
                          <td className="py-2 text-right text-zinc-800 font-bold">{info.minOrder}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Waktu Produksi</td>
                          <td className="py-2 text-right text-zinc-800 font-bold">{info.waktuProduksi}</td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-2 text-zinc-400 font-medium">Metode Distilasi</td>
                          <td className="py-2 text-right text-zinc-800">{info.metode}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-zinc-400 font-medium">Bahan Baku</td>
                          <td className="py-2 text-right text-zinc-800 font-medium">{info.bahanBaku}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* SECOND ROW: 2 Columns (Lokasi & Area Binaan, Galeri) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Lokasi & Area Binaan */}
                  <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-emerald-950 mb-4">Lokasi & Area Binaan</h3>
                      <div className="space-y-4">
                        {/* Taller Full-Width Interactive Map Frame */}
                        <div className="border border-zinc-200 rounded-2xl h-52 relative overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300">
                          <iframe
                            title="Peta Lokasi Koperasi"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${info.village || ''}, ${info.district || ''}, Aceh`)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>

                        {/* Fostered Villages List & Geolocation Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{locale === 'id' ? 'Kawasan Utama' : 'Primary Region'}</span>
                            <span className="text-xs font-bold text-zinc-800 mt-1">Desa {info.village}</span>
                            <span className="text-[10px] text-zinc-500 mt-1">Kecamatan {info.district}</span>
                          </div>
                          
                          <div className="bg-zinc-50 border border-zinc-250/50 rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{locale === 'id' ? 'Anggota Tani' : 'Fostered Farmers'}</span>
                            <span className="text-xs font-bold text-emerald-800 mt-1">{info.members}</span>
                            <span className="text-[10px] text-zinc-500 mt-1">{locale === 'id' ? 'Petani Terbina' : 'Registered Farmers'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Galeri */}
                  <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-emerald-950 mb-4">Galeri Koperasi</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          '/images/garden_nilam.png',
                          '/images/distilasi_steel.png',
                          '/images/bottle_lab.png',
                          '/images/farmer_coop.png'
                        ].map((img, idx) => (
                          <div key={idx} className="relative h-28 w-full bg-zinc-100 rounded-xl overflow-hidden group border border-zinc-200 shadow-xs hover:border-emerald-500/50 transition-colors duration-300">
                            <Image 
                              src={img} 
                              alt={`Gallery ${idx + 1}`} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                            {/* Premium subtle zoom icon hover overlay */}
                            <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button variant="outline" className="w-full border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 text-xs rounded-xl h-11 px-4 font-bold transition-all">
                        {locale === 'id' ? 'Lihat Semua Foto Galeri' : 'View All Gallery Photos'}
                      </Button>
                    </div>
                  </div>

                </div>

                {/* Additional QA & Traceability Banner at Bottom of Profile */}
                <div className="bg-[#FAF9F5] border border-zinc-250/60 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 mb-6">
                    <Award className="w-5 h-5 text-emerald-750" />
                    <h3 className="text-lg font-serif font-bold text-emerald-950">Alur Rantai Ketertelusuran (Traceability)</h3>
                  </div>

                  {/* Interactive Horizontal Progress Stepper */}
                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 mb-8 border-b border-zinc-100 pb-6">
                    {/* Connecting line for desktop */}
                    <div className="absolute top-7 left-12 right-12 h-0.5 bg-zinc-200/80 -z-0 hidden md:block" />
                    <div 
                      className="absolute top-7 left-12 h-0.5 bg-emerald-600 transition-all duration-500 -z-0 hidden md:block"
                      style={{ width: `${((activeTraceStep - 1) / 3) * 82}%` }}
                    />

                    {[
                      { step: 1, label: locale === 'id' ? '1. Kebun Nilam' : '1. Patchouli Farm', desc: locale === 'id' ? 'Asal Bahan Baku' : 'Sourcing Origin' },
                      { step: 2, label: locale === 'id' ? '2. Distilasi' : '2. Distillation', desc: locale === 'id' ? 'Proses Penyulingan' : 'Extraction Process' },
                      { step: 3, label: locale === 'id' ? '3. Analisis Lab' : '3. Quality Testing', desc: locale === 'id' ? 'Kualifikasi GC-MS' : 'GC-MS Testing' },
                      { step: 4, label: locale === 'id' ? '4. Packaging & QR' : '4. Sealing & QR', desc: locale === 'id' ? 'Sertifikat & QR Tag' : 'Authenticity Seal' },
                    ].map((item) => (
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
                          {item.step === 1 && <Layers className="w-5 h-5" />}
                          {item.step === 2 && <Factory className="w-5 h-5" />}
                          {item.step === 3 && <CheckCircle2 className="w-5 h-5" />}
                          {item.step === 4 && <QrCode className="w-5 h-5" />}
                        </div>
                        <p className={`text-xs font-bold mt-3 transition-colors ${
                          activeTraceStep === item.step ? 'text-emerald-950' : 'text-zinc-500 group-hover:text-zinc-800'
                        }`}>{item.label}</p>
                        <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Active Step Details Panel */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs animate-fadeIn">
                    {activeTraceStep === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Lokasi Geografis' : 'Geographic Location'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block font-mono">4.1234 N, 96.5678 E</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">Umong Seuribee, Aceh</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kepatuhan Lahan' : 'Land Compliance'}</span>
                          <span className="text-xs font-bold text-emerald-800 mt-2 block flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600 border border-emerald-300 rounded-full p-0.5 bg-emerald-50" />
                            {locale === 'id' ? 'EUDR Terverifikasi' : 'EUDR Compliant'}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Bebas Deforestasi 2025' : 'Deforestation-Free'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kelompok Petani' : 'Farmers Group'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">{info.members}</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Binaan Langsung Koperasi' : 'Fostered by Cooperative'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kriteria Daun' : 'Leaf Quality'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">3 - 4 Bulan (Kering Angin)</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Kadar minyak daun optimal' : 'Optimal oil yield age'}</span>
                        </div>
                      </div>
                    )}

                    {activeTraceStep === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Metode Distilasi' : 'Extraction Method'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">{info.metode}</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Penyulingan Uap Bersih' : 'Clean Steam Extraction'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Material Alat Suling' : 'Distillation Equipment'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">Stainless Steel SUS-316</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Food Grade anti korosi' : 'Anti-corrosion food grade'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kontrol Suhu' : 'Temperature Control'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">100°C - 105°C</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Mencegah kerusakan fraksi PA' : 'Protects delicate PA fraction'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Kapasitas Drum' : 'Drum Capacity'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">{info.produksi}</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Kapasitas olah per siklus' : 'Capacity per distillation run'}</span>
                        </div>
                      </div>
                    )}

                    {activeTraceStep === 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Laboratorium Penguji' : 'Testing Laboratory'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">Lab Atsiri Terpadu (LAT-Valam)</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Akreditasi belum dikonfirmasi' : 'Accreditation unconfirmed'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Rerata Patchouli Alcohol' : 'Average PA %'}</span>
                          <span className="text-sm font-bold text-emerald-800 mt-2 block">{avgPA}% (PA Murni)</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Standar SNI > 30%' : 'SNI Standard > 30%'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Rerata Kadar Air' : 'Average Moisture %'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">{avgMoisture}% (Sangat Kering)</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Standar SNI < 5%' : 'SNI Standard < 5%'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Sertifikat Analisis' : 'Certificate of Analysis'}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-2 block w-fit">
                            {locale === 'id' ? 'Catatan hasil uji per batch' : 'Batch test records'}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Uji kromatografi gas (GC)' : 'Testing method unconfirmed'}</span>
                        </div>
                      </div>
                    )}

                    {activeTraceStep === 4 && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Segel Kemasan' : 'Airtight Packaging'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">Drum Besi Lapisan Dalam Epoxy</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Kapasitas 25 Kg & 200 Kg' : 'Capacity 25 Kg & 200 Kg'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Pelabelan Digital' : 'Digital Labeling'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-zinc-700" />
                            QR Code Unique Tag
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Ditempel pada setiap drum' : 'Attached to each drum unit'}</span>
                        </div>
                        <div className="border-r border-zinc-100 pr-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Sertifikat Keaslian' : 'Proof of Authenticity'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">{locale === 'id' ? 'Verifikasi QR Barcode' : 'Barcode QR Verified'}</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Periksa hasil uji pada batch' : 'Check batch test records'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{locale === 'id' ? 'Pelacakan Pengapalan' : 'Logistics Tracking'}</span>
                          <span className="text-sm font-bold text-zinc-800 mt-2 block">FOB Pelabuhan Belawan</span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Hub distribusi Sumatera' : 'Sumatra shipping hub'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Tab: PRODUK */}
            {activeSubTab === 'produk' && (
              <div className="space-y-6">
                <h3 className="text-lg font-serif font-bold text-emerald-950">Katalog Batch Produk</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {batches.map((p) => {
                    const isCircular = p.is_circular
                    return (
                      <div key={p.id} className="bg-white border border-zinc-200 hover:border-emerald-600 rounded-3xl p-5 shadow-sm flex flex-col justify-between group transition-all duration-300 font-sans">
                        {isCircular ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold py-0.5 uppercase tracking-wider">
                                {p.category}
                              </Badge>
                              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                                <Leaf className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Olahan Limbah
                              </span>
                            </div>
                            
                            <h4 className="font-serif font-bold text-zinc-900 text-base mb-2 group-hover:text-emerald-700 transition-colors">
                              {p.batch_code}
                            </h4>

                            <p className="text-zinc-500 text-[11px] leading-relaxed mb-4 line-clamp-3">
                              {p.description || p.benefit}
                            </p>

                            <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-100 pt-3">
                              <span>Stok Tersedia</span>
                              <span className="font-bold text-zinc-900">{p.available_volume_kg} {p.unit || 'Unit'}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono py-0.5">
                                {p.batch_code}
                              </Badge>
                              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Lab Verified</span>
                            </div>
                            
                            <h4 className="font-serif font-bold text-zinc-900 text-base mb-3 group-hover:text-emerald-700 transition-colors">
                              Minyak Nilam Desa {p.origin_village || info.village}
                            </h4>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 border border-zinc-150 rounded-2xl p-3.5 mb-4">
                              <div>
                                <p className="text-zinc-500">PA (Patchouli Alcohol)</p>
                                <p className="font-bold text-zinc-800 text-sm mt-0.5">{p.pa_percentage}%</p>
                              </div>
                              <div>
                                <p className="text-zinc-500">Kadar Air (Moisture)</p>
                                <p className="font-bold text-zinc-800 text-sm mt-0.5">{p.moisture}%</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-100 pt-3">
                              <span>Volume Tersedia</span>
                              <span className="font-bold text-zinc-900">{p.available_volume_kg || p.volume_kg || 100} Kg</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-5 border-t border-zinc-100 pt-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">
                              {isCircular ? `Harga / ${p.unit || 'Unit'}` : 'Harga B2B / Kg'}
                            </p>
                            <p className="font-extrabold text-base text-emerald-700">{formatRupiah(p.price_per_kg)}</p>
                          </div>
                          <Link href={`/marketplace/product/${p.id}`}>
                            <Button size="sm" className="bg-[#0b2f1c] hover:bg-[#12422a] text-white rounded-lg text-xs font-bold gap-1">
                              Detail <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: SERTIFIKASI & UJI MUTU */}
            {activeSubTab === 'sertifikasi' && (<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-sm text-zinc-600">Mutu diperiksa per batch, terpisah dari identitas pemasok. Buka detail batch untuk hasil uji, laboratorium, tanggal, nomor laporan dan dokumen sumber jika tersedia. Kelulusan mutu belum dievaluasi.</div>)}

            {/* Tab: ULASAN */}
            {activeSubTab === 'ulasan' && (<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-sm text-zinc-600">Ulasan buyer yang terverifikasi belum tersedia.</div>)}

            {/* Tab: RIWAYAT TRANSAKSI */}
            {activeSubTab === 'riwayat' && (<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-sm text-zinc-600">Riwayat transaksi publik terverifikasi belum tersedia.</div>)}


          </div>

        </div>
      </main>

      {/* FLOATING ACTION BAR FOR MOBILE/DESKTOP SCROLL (Prinsip UX B2B Conversions) */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 py-3.5 px-6 shadow-2xl z-50 flex items-center justify-between transition-transform duration-300 ${
        showFloating ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center font-serif font-bold text-emerald-950 border border-emerald-100">
            {info.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 truncate max-w-[180px] sm:max-w-xs">{info.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className="text-[10px] text-zinc-500 font-semibold">{info.rating} Rating Pemasok</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={whatsappNumber(info.telp) ? "https://wa.me/" + whatsappNumber(info.telp) : undefined}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-block"
          >
            <Button size="sm" variant="outline" className="border-zinc-250 text-zinc-700 h-10 px-4 rounded-xl text-xs gap-1.5 font-bold">
              <Phone className="w-3.5 h-3.5 text-zinc-550" /> {whatsappNumber(info.telp) ? "WhatsApp" : "Kontak belum tersedia"}
            </Button>
          </a>
          
          <Button 
            onClick={handleRequestQuote}
            size="sm" 
            className="bg-[#0b2f1c] hover:bg-[#12422a] text-white h-10 px-5 rounded-xl text-xs font-bold gap-1 shadow-md"
          >
            <Layers className="w-3.5 h-3.5" /> Request Quote / RFQ
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
