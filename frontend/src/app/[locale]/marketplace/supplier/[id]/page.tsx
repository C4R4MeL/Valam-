'use client'

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
import { mockProducts, mockCircularProducts, formatRupiah } from '@/lib/mock-data'
import { useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'

const getSupplierInfo = (id: string, locale: 'id' | 'en') => {
  const suppliers: Record<string, any> = {
    'sup_aceh_west': {
      name: 'Koperasi Nilam Aceh Barat',
      district: 'Woyla Barat',
      village: 'Pasi Mali',
      sales: '2.4 Ton',
      rating: '4.9',
      reviews: '128',
      respons: '± 1 Jam',
      desc: locale === 'id' 
        ? 'Koperasi Nilam Aceh Barat adalah produsen minyak nilam terkemuka di Aceh Barat yang membina puluhan petani nilam lokal. Kami menggunakan standar distilasi uap modern untuk menghasilkan minyak nilam berkualitas tinggi dengan kadar Patchouli Alcohol (PA) yang stabil.'
        : 'Koperasi Nilam Aceh Barat is a leading patchouli oil producer in West Aceh, fostering dozens of local patchouli farmers. We use modern steam distillation standards to produce high quality patchouli oil with stable Patchouli Alcohol (PA) content.',
      founded: '2020',
      members: '45 Petani',
      legalitas: 'AHU-000123.AH.01.07.Tahun 2020',
      npwp: '12.345.678.9-101.000',
      alamat: 'Desa Pasi Mali, Kec. Woyla Barat, Aceh Barat, Aceh, 23654',
      email: 'koperasinilam@acehbarat.co.id',
      telp: '+62 812-3456-7890',
      web: 'www.koperasinilamacehbarat.id',
      produksi: '500 - 800 Kg',
      minOrder: '50 Kg',
      waktuProduksi: '7 - 14 Hari',
      metode: 'Uap (Steam Distillation)',
      bahanBaku: '100% Daun Nilam Segar (Pogostemon cablin)'
    },
    'sup_tani_makmur': {
      name: 'Tani Makmur Jaya',
      district: 'Pante Ceureumen',
      village: 'Pante Ceureumen',
      sales: '1.2 Ton',
      rating: '4.8',
      reviews: '56',
      respons: '± 2 Jam',
      desc: locale === 'id'
        ? 'Tani Makmur Jaya adalah kelompok usaha tani penyuling minyak nilam murni berkualitas ekspor, menjaga keaslian 100% tanpa bahan campuran kimiawi.'
        : 'Tani Makmur Jaya is an export-quality pure patchouli oil distillers joint business group, maintaining 100% purity without chemical additives.',
      founded: '2021',
      members: '20 Petani',
      legalitas: 'AHU-000456.AH.02.04.Tahun 2021',
      npwp: '34.567.890.1-202.000',
      alamat: 'Desa Pante Ceureumen, Kec. Pante Ceureumen, Aceh Barat, Aceh',
      email: 'tanimakmur@gmail.com',
      telp: '+62 812-9876-5432',
      web: 'www.tanimakmurjaya.co.id',
      produksi: '300 - 500 Kg',
      minOrder: '25 Kg',
      waktuProduksi: '10 - 15 Hari',
      metode: 'Uap (Steam Distillation)',
      bahanBaku: '100% Daun Nilam Segar'
    },
    'sup_atsiri_gayo': {
      name: 'Koperasi Atsiri Gayo',
      district: 'Gayo Lues',
      village: 'Terangun',
      sales: '3.8 Ton',
      rating: '4.7',
      reviews: '194',
      respons: '± 1 Jam',
      desc: locale === 'id'
        ? 'Koperasi Atsiri Gayo memproduksi minyak nilam dataran tinggi Gayo. Karakteristik aroma rempah yang kuat dan kadar PA tinggi khas pegunungan aceh.'
        : 'Koperasi Atsiri Gayo produces highland Gayo patchouli oil. Characteristic strong herbal aroma and high PA content typical of the mountains of Aceh.',
      founded: '2019',
      members: '60 Petani',
      legalitas: 'AHU-000789.AH.01.12.Tahun 2019',
      npwp: '56.789.012.3-303.000',
      alamat: 'Desa Terangun, Kec. Terangun, Gayo Lues, Aceh',
      email: 'atsirigayo@gayo.co.id',
      telp: '+62 852-1122-3344',
      web: 'www.atsirigayocoop.id',
      produksi: '800 - 1200 Kg',
      minOrder: '100 Kg',
      waktuProduksi: '7 - 10 Hari',
      metode: 'Uap (Steam Distillation)',
      bahanBaku: '100% Daun Nilam Dataran Tinggi'
    },
    'sup_nilam_south': {
      name: 'Nilam Sejahtera Selatan',
      district: 'Aceh Selatan',
      village: 'Kluet Utara',
      sales: '950 Kg',
      rating: '4.9',
      reviews: '42',
      respons: '± 30 Menit',
      desc: locale === 'id'
        ? 'Spesialis penyulingan nilam kadar PA ultra-premium (>34%) bersertifikat lab independen untuk industri parfum mewah internasional.'
        : 'Ultra-premium PA level (>34%) patchouli distillation specialist with independent laboratory certificate for international luxury perfume industry.',
      founded: '2022',
      members: '15 Petani',
      legalitas: 'AHU-000321.AH.03.01.Tahun 2022',
      npwp: '78.901.234.5-404.000',
      alamat: 'Desa Kluet Utara, Kec. Kluet Utara, Aceh Selatan, Aceh',
      email: 'nilamsejahtera@atsiri.id',
      telp: '+62 813-4455-6677',
      web: 'www.nilamsejahteraselatan.com',
      produksi: '200 - 400 Kg',
      minOrder: '20 Kg',
      waktuProduksi: '7 - 10 Hari',
      metode: 'Uap Tradisional Termodifikasi',
      bahanBaku: '100% Daun Nilam Pilihan'
    },
    'sup_tani_nusantara': {
      name: 'Koperasi Tani Nusantara',
      district: 'Bireuen',
      village: 'Peudada',
      sales: '1.7 Ton',
      rating: '4.6',
      reviews: '87',
      respons: '± 2 Jam',
      desc: locale === 'id'
        ? 'Koperasi tani terintegrasi penyedia komoditas rempah dan atsiri berkelanjutan bersertifikasi ketertelusuran penuh (traceability).'
        : 'Integrated farmer cooperative providing sustainable spices and essential oils with complete traceability certification.',
      founded: '2020',
      members: '35 Petani',
      legalitas: 'AHU-000213.AH.01.05.Tahun 2020',
      npwp: '90.123.456.7-505.000',
      alamat: 'Desa Peudada, Kec. Peudada, Bireuen, Aceh',
      email: 'taninusantara@koperasi.id',
      telp: '+62 821-6677-8899',
      web: 'www.taninusantara.id',
      produksi: '400 - 700 Kg',
      minOrder: '50 Kg',
      waktuProduksi: '10 - 12 Hari',
      metode: 'Uap (Steam Distillation)',
      bahanBaku: '100% Daun Nilam Unggul Nusantara'
    }
  }
  
  return suppliers[id] || {
    name: decodeURIComponent(id).replace(/-/g, ' '),
    district: 'Aceh',
    village: 'Aceh',
    sales: '350 Kg',
    rating: '4.8',
    reviews: '12',
    respons: '± 1 Jam',
    desc: locale === 'id'
      ? 'Mitra pemasok minyak nilam murni terdaftar di platform B2B Valam.'
      : 'Pure patchouli oil supply partner registered on the Valam B2B platform.',
    founded: '2023',
    members: '12 Petani',
    legalitas: 'AHU-000999.AH.01.01.Tahun 2023',
    npwp: '00.999.888.7-000.000',
    alamat: 'Aceh, Indonesia',
    email: 'supplier@valam.id',
    telp: '+62 812-0000-0000',
    web: 'www.valam.id',
    produksi: '200 Kg',
    minOrder: '10 Kg',
    waktuProduksi: '7 Hari',
    metode: 'Uap (Steam Distillation)',
    bahanBaku: '100% Daun Nilam Pilihan'
  }
}

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
            supplier_name: result.data.supplier_profile?.nama_koperasi || 'Koperasi Atsiri',
            status: p.status,
            origin_village: p.origin_village || '',
            origin_district: p.origin_district || '',
            pa_percentage: p.qc_result?.pa_percentage || 0,
            moisture: p.qc_result?.moisture || 0,
            price_per_kg: p.price_per_kg,
            available_volume_kg: p.available_volume_kg,
            images: p.images && p.images.length > 0 ? p.images : ["/images/premium_oil_dark.png"],
            is_circular: false
          }))
          
          const circularMapped = (result.data.circular_products || []).map((cp: any) => ({
            id: cp.id,
            batch_code: cp.name,
            supplier_name: result.data.supplier_profile?.nama_koperasi || 'Koperasi Atsiri',
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
      } catch (err) {
        // Fallback to mock info
        const mockInfo = getSupplierInfo(supplierId, locale)
        setSupplierUser({
          id: supplierId,
          supplier_profile: {
            nama_koperasi: mockInfo.name,
            alamat_lengkap: mockInfo.alamat,
            kabupaten: mockInfo.district,
            kecamatan: mockInfo.district,
            desa: mockInfo.village,
            whatsapp: mockInfo.telp,
            nib: mockInfo.legalitas,
            npwp: mockInfo.npwp,
            kapasitas_produksi: parseFloat(mockInfo.produksi) || 500,
            grade_nilam: ['GRADE_A', 'GRADE_B'],
            nomor_rekening: '7123456789',
            nama_bank: 'BSI',
            nama_rekening: mockInfo.name
          },
          profile: {
            email: mockInfo.email,
            phone: mockInfo.telp,
            address: mockInfo.alamat
          }
        })
        
        // Scan mockProducts
        const list = mockProducts.filter(p => 
          p.status === 'VERIFIED' && 
          p.supplier_name.toLowerCase().replace(/\s+/g, '').includes(mockInfo.name.toLowerCase().replace(/\s+/g, ''))
        )
        const circularList = mockCircularProducts.filter(cp =>
          cp.supplier_name.toLowerCase().replace(/\s+/g, '').includes(mockInfo.name.toLowerCase().replace(/\s+/g, ''))
        )
        setBatches([...list, ...circularList])
      } finally {
        setLoading(false)
      }
    }

    fetchSupplier()
  }, [supplierId, locale])

  // Dynamically compute info from supplierUser
  const info = {
    name: supplierUser?.supplier_profile?.nama_koperasi || decodeURIComponent(supplierId).replace(/-/g, ' '),
    district: supplierUser?.supplier_profile?.kabupaten || 'Aceh',
    village: supplierUser?.supplier_profile?.desa || 'Aceh',
    sales: supplierUser?.products ? `${supplierUser.products.length} Batch` : '2.4 Ton',
    rating: '4.8',
    reviews: '12',
    respons: '± 1 Jam',
    desc: locale === 'id'
      ? `${supplierUser?.supplier_profile?.nama_koperasi || 'Koperasi Pemasok'} adalah penyedia minyak nilam terpercaya yang memproduksi nilam berkualitas tinggi di wilayah ${supplierUser?.supplier_profile?.kabupaten || 'Aceh'}.`
      : `${supplierUser?.supplier_profile?.nama_koperasi || 'Supplier'} is a trusted patchouli oil provider producing high quality patchouli at ${supplierUser?.supplier_profile?.kabupaten || 'Aceh'} region.`,
    founded: supplierUser?.supplier_profile?.tahun_berdiri || '2020',
    members: supplierUser?.supplier_profile?.jumlah_anggota ? `${supplierUser.supplier_profile.jumlah_anggota} Petani` : '15 Petani',
    legalitas: supplierUser?.supplier_profile?.nib || 'AHU-000123.AH.01.07.Tahun 2020',
    npwp: supplierUser?.supplier_profile?.npwp || '12.345.678.9-101.000',
    alamat: supplierUser?.supplier_profile?.alamat_lengkap || 'Aceh, Indonesia',
    email: supplierUser?.email || 'koperasi@valam.id',
    telp: supplierUser?.supplier_profile?.whatsapp || '+62 812-3456-7890',
    web: supplierUser?.supplier_profile?.website || '-',
    produksi: supplierUser?.supplier_profile?.kapasitas_produksi ? `${supplierUser.supplier_profile.kapasitas_produksi} Kg` : '500 - 800 Kg',
    minOrder: supplierUser?.supplier_profile?.minimum_order ? `${supplierUser.supplier_profile.minimum_order} Kg` : '10 Kg',
    waktuProduksi: supplierUser?.supplier_profile?.durasi_produksi || '7 - 14 Hari',
    metode: supplierUser?.supplier_profile?.metode_distilasi || 'Uap (Steam Distillation)',
    bahanBaku: supplierUser?.supplier_profile?.bahan_baku || '100% Daun Nilam Segar'
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
    : (locale === 'id' ? '12 Juni 2024' : 'June 12, 2024');

  const handleRequestQuote = () => {
    const role = localStorage.getItem('valam_role')
    if (role !== 'buyer') {
      alert(locale === 'id' ? 'Silakan masuk ke akun Buyer (Pembeli) untuk mengajukan RFQ.' : 'Please log in to a Buyer account to submit an RFQ.')
      router.push(`/${locale}/login?redirect=/marketplace/supplier/${supplierId}`)
      return
    }
    router.push(`/${locale}/dashboard/buyer/rfq/new?supplier=${supplierId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col selection:bg-emerald-100 selection:text-emerald-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32 pb-20">
          <span className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-800 flex flex-col relative selection:bg-emerald-100 selection:text-emerald-950 font-sans">
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
                  router.push(`/dashboard/buyer/matching`)
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
                  href={`https://wa.me/${
                    info.telp.replace(/[^0-9]/g, '').startsWith('0') 
                      ? '62' + info.telp.replace(/[^0-9]/g, '').slice(1) 
                      : info.telp.replace(/[^0-9]/g, '')
                  }?text=Halo%20${encodeURIComponent(info.name)},%20saya%20tertarik%2520dengan%2520katalog%2520minyak%2520nilam%2520di%2520Valam.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold h-11 px-6 rounded-xl shadow-md gap-2 flex items-center justify-center border-none">
                    <MessageSquare className="w-4 h-4" />
                    Hubungi WhatsApp
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
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Akreditasi ISO/IEC 17025' : 'ISO/IEC 17025 Accredited'}</span>
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
                            {locale === 'id' ? 'CoA Terbit Otomatis' : 'CoA Auto-Generated'}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Uji kromatografi gas (GC)' : 'Gas Chromatography verified'}</span>
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
                          <span className="text-[10px] text-zinc-500 mt-1 block">{locale === 'id' ? 'Jaminan minyak murni 100%' : '100% pure oil guaranteed'}</span>
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
            {activeSubTab === 'sertifikasi' && (
              <div className="space-y-6">
                <div className="bg-[#FAF9F5] border border-zinc-250/60 rounded-3xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 pb-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-zinc-900 text-lg">Digital Certificate of Analysis (CoA)</h4>
                        <p className="text-xs text-zinc-455">Tervalidasi Resmi GC-MS Spektrometri</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-700 text-white font-mono text-[9px] border-none py-1 px-3 w-fit">
                      Status: Active & Verified
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8 space-y-4 text-xs font-sans">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-zinc-200/80 rounded-xl p-3">
                          <span className="text-zinc-400 text-[10px]">Patchouli Alcohol (PA)</span>
                          <p className="font-bold text-zinc-900 text-base mt-1">{avgPA}% (Min. Standard: 30%)</p>
                        </div>
                        <div className="bg-white border border-zinc-200/80 rounded-xl p-3">
                          <span className="text-zinc-400 text-[10px]">Kadar Air (Moisture)</span>
                          <p className="font-bold text-zinc-900 text-base mt-1">{avgMoisture}% (Max. Standard: 3%)</p>
                        </div>
                      </div>

                      <div className="bg-white border border-zinc-200/80 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between border-b border-zinc-100 pb-1">
                          <span className="text-zinc-550">Tanggal Pengujian</span>
                          <span className="font-bold text-zinc-800">{lastTestedDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-100 pb-1">
                          <span className="text-zinc-550">Laboratorium Penguji</span>
                          <span className="font-bold text-zinc-800">UPT Laboratorium Atsiri</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Metode Analisis</span>
                          <span className="font-bold text-zinc-800">GC-MS Spektroskopi</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-white border border-zinc-200/80 rounded-2xl p-6 text-center shadow-xs">
                      <QrCode className="w-16 h-16 text-zinc-800 mb-2" />
                      <span className="text-[10px] font-mono text-zinc-500">Scan QR Code untuk verifikasi CoA asli</span>
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full py-0.5 px-3 mt-3 text-[10px] font-bold">
                        <Check className="w-3.5 h-3.5" /> Quality Verified
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                  <h3 className="text-xl font-serif font-bold text-zinc-900 border-b border-zinc-100 pb-3">Sertifikasi Legal</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-55 border border-zinc-200 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-750 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 text-sm">Certificate of Analysis (CoA)</h4>
                        <p className="text-xs text-zinc-500 mt-1">Seluruh batch kami dilengkapi dengan lembar hasil uji laboratorium resmi pihak ketiga.</p>
                      </div>
                    </div>

                    <div className="bg-zinc-55 border border-zinc-200 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-750 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 text-sm">Uji GC-MS Terakreditasi</h4>
                        <p className="text-xs text-zinc-500 mt-1">Uji kromatografi gas spektrometri massa menjamin tingkat kemurnian minyak nilam dari bahan pencampur.</p>
                      </div>
                    </div>

                    <div className="bg-zinc-55 border border-zinc-200 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-750 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 text-sm">Sertifikat Halal Kemenag</h4>
                        <p className="text-xs text-zinc-500 mt-1">Proses pengolahan bersih dan higienis bersertifikasi Halal MUI / BPJPH Kementerian Agama.</p>
                      </div>
                    </div>

                    <div className="bg-zinc-55 border border-zinc-200 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-750 flex items-center justify-center shrink-0">
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 text-sm">Sertifikat Badan Koperasi</h4>
                        <p className="text-xs text-zinc-500 mt-1">Koperasi legal berizin resmi dengan asas gotong royong dan kemitraan berkelanjutan.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Tab: ULASAN */}
            {activeSubTab === 'ulasan' && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xl font-serif font-bold text-zinc-900 border-b border-zinc-100 pb-3">Ulasan Buyer</h3>
                
                <div className="space-y-4">
                  {[
                    { nama: 'PT Aroma Nusantara', rating: 5, date: '12 Juni 2024', comment: 'Kualitas minyak nilam sangat baik, PA stabil dan pengiriman tepat waktu. Pemasok responsif dan profesional.' },
                    { nama: 'CV Atsiri Utama Mandiri', rating: 5, date: '28 Mei 2024', comment: 'Pelayanan prima. CoA disertakan lengkap and kemurnian minyak teruji.' },
                    { nama: 'IndoFragrance Co.', rating: 4, date: '10 Mei 2024', comment: 'Kadar PA sesuai pesanan (32.8%). Pengemasan drum kokoh dan aman.' }
                  ].map((u, idx) => (
                    <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-zinc-200 text-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">{u.nama[0]}</div>
                          <div>
                            <p className="font-bold text-zinc-800 text-xs">{u.nama}</p>
                            <p className="text-[10px] text-zinc-500">Buyer Industri Parfum</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-450">{u.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: u.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-650 leading-relaxed font-sans">{u.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: RIWAYAT TRANSAKSI */}
            {activeSubTab === 'riwayat' && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xl font-serif font-bold text-zinc-900 border-b border-zinc-100 pb-3">Riwayat Transaksi B2B</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-2xl text-xs">
                    <div>
                      <p className="font-bold text-zinc-800">Minyak Nilam Batch VAL-ACEH-001</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{locale === 'id' ? 'Dikirim ke Industri Kosmetik (Jakarta) • 500 Kg' : 'Shipped to Cosmetics Manufacturer (Jakarta) • 500 Kg'}</p>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">{locale === 'id' ? 'Telah Terkirim' : 'Delivered'}</span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-2xl text-xs">
                    <div>
                      <p className="font-bold text-zinc-800">Minyak Nilam Batch VAL-ACEH-002</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{locale === 'id' ? 'Dikirim ke Produsen Parfum & Wewangian (Surabaya) • 300 Kg' : 'Shipped to Fragrance Producer (Surabaya) • 300 Kg'}</p>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">{locale === 'id' ? 'Telah Terkirim' : 'Delivered'}</span>
                  </div>
                </div>
              </div>
            )}

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
            href={`https://wa.me/628123456789?text=Halo%20${encodeURIComponent(info.name)},%20saya%20tertarik%20dengan%2520katalog%20minyak%20nilam%20di%20Valam.`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-block"
          >
            <Button size="sm" variant="outline" className="border-zinc-250 text-zinc-700 h-10 px-4 rounded-xl text-xs gap-1.5 font-bold">
              <Phone className="w-3.5 h-3.5 text-zinc-550" /> WhatsApp
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
