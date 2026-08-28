'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, Clock, FileCheck, Wallet, AlertCircle, 
  ClipboardList, Send, ShoppingBag, ArrowRight, ShieldAlert, 
  X, CheckCircle2, Factory, ChevronRight, FlaskConical
} from 'lucide-react'
import { mockProducts, formatRupiah } from '@/lib/mock-data'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const contentMap = {
  id: {
    title: "Dashboard Supplier",
    subtitle: "Ringkasan performa Koperasi Anda hari ini.",
    addBatch: "+ Tambah Batch Baru",
    stats: {
      verified: { title: "Stok Terverifikasi" },
      qc: { title: "Menunggu QC" },
      volume: { title: "Total Volume Aktif" },
      wallet: { title: "Saldo Tersedia" }
    },
    table: {
      title: "Batch Terbaru",
      viewAll: "Lihat Semua",
      colId: "ID Batch",
      colStatus: "Status",
      colVol: "Volume",
      colPa: "PA% (Lab)",
      colPrice: "Harga/Kg",
      status: {
        VERIFIED: "Terverifikasi",
        IN_LAB: "Diuji Lab",
        DRAFT: "Draft",
        AWAITING_PRICE: "Menunggu Harga"
      }
    }
  },
  en: {
    title: "Supplier Dashboard",
    subtitle: "Overview of your Cooperative's performance today.",
    addBatch: "+ Add New Batch",
    stats: {
      verified: { title: "Verified Stock" },
      qc: { title: "Waiting for QC" },
      volume: { title: "Total Active Volume" },
      wallet: { title: "Available Balance" }
    },
    table: {
      title: "Recent Batches",
      viewAll: "View All",
      colId: "Batch ID",
      colStatus: "Status",
      colVol: "Volume",
      colPa: "PA% (Lab)",
      colPrice: "Price/Kg",
      status: {
        VERIFIED: "Verified",
        IN_LAB: "In Lab",
        DRAFT: "Draft",
        AWAITING_PRICE: "Awaiting Price"
      }
    }
  }
}

export default function SupplierDashboardPage() {
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const router = useRouter()
  const { toast } = useToast()

  // Main State
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [batches, setBatches] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [circularMetrics, setCircularMetrics] = useState<any>({ totalProducts: 0, circularProductsSold: 0, circularProductRevenue: 0 })

  // Price Modal State for Opsi B
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [sellingPrice, setSellingPrice] = useState('')
  const [submittingPrice, setSubmittingPrice] = useState(false)

  // Onboarding Form Modal State (Poin 1)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingForm, setOnboardingForm] = useState({
    namaKoperasi: '',
    nib: '',
    npwp: '',
    namaPic: '',
    ktpPic: '',
    whatsapp: '',
    alamatLengkap: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    kapasitasProduksi: '',
    gradeNilam: [] as string[],
    nomorRekening: '',
    namaBank: '',
    namaRekening: '',
  })
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false)

  // Shipping Instructions Modal State
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [shippingBatchCode, setShippingBatchCode] = useState('')

  const handleMarketInfoQCAction = () => {
    const latestDraft = batches.find(b => b.status === 'DRAFT')
    if (latestDraft) {
      setShippingBatchCode(latestDraft.batch_code)
      setShowShippingModal(true)
    } else {
      router.push(`/${locale}/dashboard/supplier/add-batch`)
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
    }
  }

  // Fetch Profile & Documents from backend
  const fetchSupplierProfile = async () => {
    setLoadingProfile(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me`, {
        headers: getAuthHeaders(),
      })

      if (res.status === 404) {
        setIsRegistered(false)
        setProfile(null)
      } else if (res.ok) {
        const result = await res.json()
        setProfile(result.data)
        setIsRegistered(true)
        // Load batches immediately after profile is loaded using the profile user_id
        if (result.data?.user_id) {
          fetchBatches(result.data.user_id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch supplier profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchBatches = async (supplierId?: string) => {
    const targetId = supplierId || (profile ? profile.user_id : null)
    if (!targetId) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/products?supplier_id=${targetId}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      })
      if (res.ok) {
        const result = await res.json()
        setBatches(result.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err)
      setBatches([])
    }
  }

  const fetchWallet = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/wallet`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setWalletBalance(Number(data.balance) || 0)
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err)
    }
  }

  const fetchCircularMetrics = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/supplier/metrics`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setCircularMetrics(data)
      }
    } catch (err) {
      console.error('Failed to fetch circular metrics:', err)
    }
  }


  const handleSetPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch || !sellingPrice.trim()) return

    const priceNum = parseFloat(sellingPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Input Tidak Valid",
        description: "Harga harus berupa angka positif.",
        variant: "destructive"
      })
      return
    }

    setSubmittingPrice(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/products/${selectedBatch.id}/price`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ price: priceNum })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal menyimpan harga.')
      }

      toast({
        title: "Harga Berhasil Diatur",
        description: `Harga batch ${selectedBatch.batch_code} telah diatur sebesar Rp ${priceNum.toLocaleString('id-ID')}/Kg. Produk Anda sekarang aktif di etalase Marketplace!`,
      })

      setShowPriceModal(false)
      setSelectedBatch(null)
      setSellingPrice('')
      fetchSupplierProfile()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Gagal Mengatur Harga",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSubmittingPrice(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('valam_token')
    if (!token) {
      router.push(`/${locale}/login`)
      return
    }

    fetchSupplierProfile()
    fetchWallet()
    fetchCircularMetrics()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'valam_token' && !e.newValue) {
        router.push(`/${locale}/login`)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [locale, router])

  // Setup dashboard stats card
  useEffect(() => {
    if (!profile) return
    const verifiedBatches = batches.filter((p: any) => p.status === 'VERIFIED')
    const pendingCount = batches.filter((p: any) => p.status === 'IN_LAB' || p.status === 'DRAFT').length
    const totalVolume = verifiedBatches.reduce((sum: number, p: any) => sum + (Number(p.available_volume_kg) || 0), 0)

    setStats([
      { title: t.stats.verified.title, value: `${verifiedBatches.length}`, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
      { title: t.stats.qc.title, value: `${pendingCount}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
      { title: t.stats.volume.title, value: `${totalVolume} Kg`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
      { title: t.stats.wallet.title, value: formatRupiah(walletBalance), icon: Wallet, color: 'text-zinc-900', bg: 'bg-zinc-200' },
    ])
  }, [batches, profile, walletBalance])

  // Submit Poin 1 Onboarding Form
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onboardingForm.gradeNilam.length === 0) {
      toast({
        title: "Validasi Gagal",
        description: "Pilih minimal satu grade minyak nilam yang bisa Anda pasok.",
        variant: "destructive"
      })
      return
    }

    setSubmittingOnboarding(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/register`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namaKoperasi: onboardingForm.namaKoperasi,
          nib: onboardingForm.nib,
          npwp: onboardingForm.npwp,
          namaPic: onboardingForm.namaPic,
          ktpPic: onboardingForm.ktpPic,
          whatsapp: onboardingForm.whatsapp,
          alamatLengkap: onboardingForm.alamatLengkap,
          kabupaten: onboardingForm.kabupaten,
          kecamatan: onboardingForm.kecamatan,
          desa: onboardingForm.desa,
          kapasitasProduksi: parseFloat(onboardingForm.kapasitasProduksi) || 0,
          gradeNilam: onboardingForm.gradeNilam,
          nomorRekening: onboardingForm.nomorRekening || undefined,
          namaBank: onboardingForm.namaBank || undefined,
          namaRekening: onboardingForm.namaRekening || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan profil supplier.')
      }

      toast({
        title: "Profil Disimpan",
        description: "Langkah 1 selesai! Silakan lengkapi dokumen legalitas wajib.",
      })
      setShowOnboardingModal(false)
      fetchSupplierProfile()
    } catch (err: any) {
      toast({
        title: "Registrasi Gagal",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSubmittingOnboarding(false)
    }
  }

  const handleGradeToggle = (grade: string) => {
    setOnboardingForm(prev => {
      const exists = prev.gradeNilam.includes(grade)
      const newGrades = exists 
        ? prev.gradeNilam.filter(g => g !== grade)
        : [...prev.gradeNilam, grade]
      return { ...prev, gradeNilam: newGrades }
    })
  }

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-zinc-500">Memuat dashboard...</p>
      </div>
    )
  }

  const isVerified = profile?.status === 'TERVERIFIKASI' || profile?.status === 'LEGACY_VERIFIED'

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col min-h-[70vh] relative">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-serif">
              {isRegistered ? profile.nama_koperasi : t.title}
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              {isRegistered ? `Status Akun: ${profile.status}` : t.subtitle}
            </p>
          </div>
          <div className="flex gap-3">
            {isVerified ? (
              <Button asChild className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-semibold shadow-md shadow-gold-500/20 border-none rounded-xl">
                <Link href="/dashboard/supplier/add-batch">
                  <FileCheck className="w-4 h-4 mr-2" />
                  {t.addBatch}
                </Link>
              </Button>
            ) : (
              <Button disabled className="bg-zinc-200 text-zinc-400 font-semibold rounded-xl cursor-not-allowed">
                <FileCheck className="w-4 h-4 mr-2" />
                {t.addBatch}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        
        {/* Banner 1: Profile Not Complete (No Supplier Account) */}
        {!isRegistered && (
          <div className="bg-rose-50 border border-rose-250 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">Profil Koperasi Belum Lengkap</h4>
                <p className="text-rose-700 text-xs">
                  Anda telah mendaftar di portal, namun belum melengkapi data profil wajib Poin 1 (Nama, NIB, NPWP Koperasi, dsb).
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowOnboardingModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold border-none rounded-xl shrink-0"
            >
              Lengkapi Profil Sekarang
            </Button>
          </div>
        )}

        {/* Banner 2: Profile complete but not verified (TERDAFTAR) */}
        {isRegistered && profile.status === 'TERDAFTAR' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">Akun Belum Siap Listing Produk</h4>
                <p className="text-rose-700 text-xs leading-relaxed">
                  Profil dasar telah didaftarkan. Harap lengkapi & upload berkas Poin 2 (Akta, COA valid, Foto Fasilitas, Surat Pernyataan) untuk diverifikasi oleh tim QA Valam.
                </p>
              </div>
            </div>
            <Button asChild className="bg-rose-600 hover:bg-rose-700 text-white font-semibold border-none rounded-xl shrink-0">
              <Link href="/dashboard/supplier/verification">
                Lengkapi Dokumen Verifikasi
              </Link>
            </Button>
          </div>
        )}

        {/* Banner 3: Legacy status countdown warning */}
        {isRegistered && profile.status === 'LEGACY_VERIFIED' && profile.legacy_deadline && (
          <div className="bg-amber-50 border border-amber-350 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 text-sm">Akun Migrasi — Harap Lengkapi Berkas Koperasi Anda</h4>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Akun Koperasi lama Anda tetap dapat digunakan sementara. Mohon unggah 4 berkas verifikasi Poin 2 sebelum deadline selesai agar status akun tidak diblokir otomatis.
                </p>
                <div className="inline-block bg-amber-150 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-950 mt-1 border border-amber-200">
                  ⏳ Batas Waktu: {new Date(profile.legacy_deadline).toLocaleDateString()}
                </div>
              </div>
            </div>
            <Button asChild className="bg-amber-650 hover:bg-amber-700 text-white font-semibold border-none rounded-xl shrink-0">
              <Link href="/dashboard/supplier/verification">
                Unggah Dokumen Verifikasi
              </Link>
            </Button>
          </div>
        )}

        {/* Banner 4: Under review (DALAM_VERIFIKASI) */}
        {isRegistered && profile.status === 'DALAM_VERIFIKASI' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-blue-900 text-sm">Dokumen Sedang Ditinjau Admin</h4>
                <p className="text-blue-700 text-xs mt-0.5">
                  Ulasan berkas sedang berlangsung. Anda akan menerima email notifikasi segera setelah tim kepatuhan Valam selesai memeriksa dokumen Anda.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-blue-300 text-blue-800 bg-white hover:bg-blue-100/50 rounded-xl font-semibold shrink-0">
              <Link href="/dashboard/supplier/verification">
                Lihat Berkas Terkirim
              </Link>
            </Button>
          </div>
        )}

        {/* Summary Stats Cards */}
        {isRegistered && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.title}</p>
                  <p className="text-lg sm:text-xl xl:text-2xl font-bold text-emerald-950 truncate max-w-[160px] md:max-w-none" title={stat.value}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Circular Economy Stats */}
        {isRegistered && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                Circular Economy Performance
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-950/[0.02] border border-emerald-800/10 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-100/70 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Total Circular Products</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5">{circularMetrics.totalProducts} Produk</p>
                </div>
              </div>
              
              <div className="bg-emerald-950/[0.02] border border-emerald-800/10 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-100/70 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Circular Products Sold</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5">{circularMetrics.circularProductsSold} Unit</p>
                </div>
              </div>

              <div className="bg-emerald-950/[0.02] border border-emerald-800/10 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-emerald-100/70 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-800/60 uppercase tracking-wider">Circular Product Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5">{formatRupiah(circularMetrics.circularProductRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Batches List & Info Pasar */}
        {isRegistered && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-emerald-955 font-serif">{t.table.title}</h2>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50/50 text-zinc-500 font-medium border-b border-zinc-100">
                    <tr>
                      <th className="py-3 px-6">{t.table.colId}</th>
                      <th className="py-3 px-6">{t.table.colStatus}</th>
                      <th className="py-3 px-6">{t.table.colVol}</th>
                      <th className="py-3 px-6">{t.table.colPa}</th>
                      <th className="py-3 px-6">{t.table.colPrice}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {batches.slice(0, 4).map((product) => (
                      <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-6 font-medium text-emerald-900">{product.batch_code}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            product.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            product.status === 'AWAITING_PRICE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            product.status === 'IN_LAB' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            {product.status === 'VERIFIED' ? t.table.status.VERIFIED : 
                             product.status === 'AWAITING_PRICE' ? t.table.status.AWAITING_PRICE :
                             product.status === 'IN_LAB' ? t.table.status.IN_LAB : t.table.status.DRAFT}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-zinc-600">{product.available_volume_kg} Kg</td>
                        <td className="py-3 px-6 text-zinc-600">{product.pa_percentage > 0 ? `${product.pa_percentage}%` : '-'}</td>
                        <td className="py-3 px-6">
                          {product.status === 'VERIFIED' ? (
                            <span className="font-semibold text-emerald-950">{formatRupiah(product.price_per_kg)}</span>
                          ) : product.status === 'AWAITING_PRICE' ? (
                            <Button 
                              onClick={() => {
                                setSelectedBatch(product)
                                setSellingPrice('')
                                setShowPriceModal(true)
                              }}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1 px-3.5 h-auto rounded-lg border-none"
                            >
                              Atur Harga
                            </Button>
                          ) : product.status === 'DRAFT' ? (
                            <Button 
                              onClick={() => {
                                setShippingBatchCode(product.batch_code)
                                setShowShippingModal(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold text-xs py-1 px-3 h-auto rounded-lg"
                            >
                              Kirim Sampel
                            </Button>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-400">
                          Belum ada batch produk terdaftar. Silakan tambah batch baru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-zinc-100 text-center">
                <Link href="/dashboard/supplier/inventory" className="text-sm font-medium text-emerald-600 hover:text-emerald-800">
                  {t.table.viewAll} &rarr;
                </Link>
              </div>
            </div>

            {/* Info Pasar Column */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl p-6 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-widest border border-gold-500/30">
                  <Activity className="w-3 h-3" /> Info Pasar
                </div>
                <h2 className="text-2xl font-serif font-bold leading-tight">Harga Premium Menanti!</h2>
                <p className="text-emerald-100/80 text-sm leading-relaxed">
                  Permintaan global untuk nilam dengan <strong className="text-gold-300">PA &gt; 30%</strong> sedang tinggi. Tingkatkan kualitas penyulingan Anda untuk mendapatkan akses ke pembeli internasional.
                </p>
              </div>
              <Button 
                onClick={handleMarketInfoQCAction}
                className="mt-6 w-full bg-gold-500 hover:bg-gold-600 text-emerald-955 font-bold relative z-10 shadow-lg shadow-gold-500/20 rounded-xl border-none"
              >
                Kirim Sampel QC Sekarang
              </Button>
            </div>

          </div>
        )}

      </div>

      {/* ── ONBOARDING PROFILE FORM MODAL DIALOG (Langkah 1) ───────────────── */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Lengkapi Profil Koperasi</h3>
                <p className="text-xs text-zinc-500 mt-1">Langkah 1: Isi data koperasi penanggung jawab</p>
              </div>
              <button 
                onClick={() => setShowOnboardingModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Form (Standard Styles) */}
            <form onSubmit={handleOnboardingSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              <div className="space-y-2">
                <Label htmlFor="namaKoperasi" className="text-emerald-900 font-semibold">Nama Koperasi (Sesuai Akta Resmi)</Label>
                <Input 
                  id="namaKoperasi"
                  placeholder="Koperasi Tani Nilam Jaya"
                  value={onboardingForm.namaKoperasi}
                  onChange={e => setOnboardingForm({...onboardingForm, namaKoperasi: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nib" className="text-emerald-900 font-semibold">NIB Koperasi (OSS)</Label>
                  <Input 
                    id="nib"
                    placeholder="Contoh: 1234567890123"
                    value={onboardingForm.nib}
                    onChange={e => setOnboardingForm({...onboardingForm, nib: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npwp" className="text-emerald-900 font-semibold">NPWP Koperasi</Label>
                  <Input 
                    id="npwp"
                    placeholder="00.000.000.0-000.000"
                    value={onboardingForm.npwp}
                    onChange={e => setOnboardingForm({...onboardingForm, npwp: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaPic" className="text-emerald-900 font-semibold">Nama PIC</Label>
                  <Input 
                    id="namaPic"
                    placeholder="Nama Ketua"
                    value={onboardingForm.namaPic}
                    onChange={e => setOnboardingForm({...onboardingForm, namaPic: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ktpPic" className="text-emerald-900 font-semibold">NIK KTP PIC</Label>
                  <Input 
                    id="ktpPic"
                    placeholder="NIK 16 digit"
                    value={onboardingForm.ktpPic}
                    onChange={e => setOnboardingForm({...onboardingForm, ktpPic: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-emerald-900 font-semibold">WhatsApp PIC</Label>
                  <Input 
                    id="whatsapp"
                    placeholder="0812345..."
                    value={onboardingForm.whatsapp}
                    onChange={e => setOnboardingForm({...onboardingForm, whatsapp: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desa" className="text-emerald-900 font-semibold">Desa/Gampong</Label>
                  <Input 
                    id="desa"
                    placeholder="Desa"
                    value={onboardingForm.desa}
                    onChange={e => setOnboardingForm({...onboardingForm, desa: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kecamatan" className="text-emerald-900 font-semibold">Kecamatan</Label>
                  <Input 
                    id="kecamatan"
                    placeholder="Kecamatan"
                    value={onboardingForm.kecamatan}
                    onChange={e => setOnboardingForm({...onboardingForm, kecamatan: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kabupaten" className="text-emerald-900 font-semibold">Kabupaten</Label>
                  <Input 
                    id="kabupaten"
                    placeholder="Aceh Barat"
                    value={onboardingForm.kabupaten}
                    onChange={e => setOnboardingForm({...onboardingForm, kabupaten: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatLengkap" className="text-emerald-900 font-semibold">Alamat Lengkap</Label>
                <Input 
                  id="alamatLengkap"
                  placeholder="Nama Jalan, RT/RW, Dusun"
                  value={onboardingForm.alamatLengkap}
                  onChange={e => setOnboardingForm({...onboardingForm, alamatLengkap: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kapasitasProduksi" className="text-emerald-900 font-semibold">Kapasitas (Kg/Bulan)</Label>
                  <Input 
                    id="kapasitasProduksi"
                    type="number"
                    placeholder="Contoh: 500"
                    value={onboardingForm.kapasitasProduksi}
                    onChange={e => setOnboardingForm({...onboardingForm, kapasitasProduksi: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-emerald-900 font-semibold block">Grade Nilam yang Dipasok:</Label>
                <div className="flex gap-4">
                  {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={onboardingForm.gradeNilam.includes(g)}
                        onChange={() => handleGradeToggle(g)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{g === 'GRADE_A' ? 'A (PA≥32%)' : g === 'GRADE_B' ? 'B (PA28-31%)' : 'C (PA<28%)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowOnboardingModal(false)}
                  className="w-1/2 rounded-xl"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="w-1/2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl border-none shadow-md"
                  disabled={submittingOnboarding}
                >
                  {submittingOnboarding ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PRICE INPUT MODAL (OPSI B) */}
      {showPriceModal && selectedBatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-955">Atur Harga Jual</h3>
                <p className="text-xs text-zinc-500 mt-1">Batch: {selectedBatch.batch_code}</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowPriceModal(false)
                  setSelectedBatch(null)
                }}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSetPriceSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-950 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-emerald-800">Volume:</span>
                  <span className="font-semibold">{selectedBatch.available_volume_kg} Kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-800">Kandungan PA (Hasil Lab):</span>
                  <span className="font-semibold text-emerald-900">{selectedBatch.pa_percentage}%</span>
                </div>
                <div className="text-[10px] text-emerald-700/80 pt-1 border-t border-emerald-150 mt-1.5">
                  * Berdasarkan data historis pasar, minyak nilam dengan kadar PA {selectedBatch.pa_percentage}% bernilai sekitar Rp 900.000 - Rp 1.150.000 / Kg.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPriceInput" className="text-xs font-bold text-zinc-700">Harga Jual per Kg (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">Rp</span>
                  <Input 
                    id="sellingPriceInput"
                    type="number"
                    placeholder="Contoh: 950000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="bg-white border-zinc-200 text-zinc-800 pl-10"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPriceModal(false)
                    setSelectedBatch(null)
                  }}
                  className="w-1/2 rounded-xl"
                  disabled={submittingPrice}
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="w-1/2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl border-none shadow-md"
                  disabled={submittingPrice}
                >
                  {submittingPrice ? 'Menyimpan...' : 'Aktifkan Produk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIPPING INSTRUCTIONS MODAL */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <FlaskConical className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-emerald-950">Petunjuk Pengiriman Sampel</h3>
              <p className="text-sm text-zinc-500">Silakan ikuti instruksi berikut untuk mengirimkan sampel fisik Anda agar dapat diuji di lab.</p>
            </div>

            {/* Batch Code Banner */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center">
              <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Kode Batch Anda</span>
              <span className="text-2xl font-mono font-bold text-emerald-900 tracking-wide select-all">{shippingBatchCode}</span>
              <p className="text-[11px] text-zinc-400 mt-1">Salin/catat kode di atas untuk label botol sampel Anda</p>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-4 text-sm text-zinc-700">
              <h4 className="font-bold text-zinc-900">4 Langkah Pengiriman Sampel:</h4>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-zinc-900">Siapkan 50ml Sampel</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Masukkan minyak nilam hasil sulingan Anda ke dalam botol kaca gelap (vial amber) berkapasitas 50ml agar terlindung dari cahaya.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-zinc-900">Labeli Botol Sampel</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Tulis atau tempelkan label kode batch <strong className="font-mono text-emerald-950 font-bold">{shippingBatchCode}</strong> secara jelas pada botol menggunakan spidol permanen.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-zinc-900">Kirim Fisik ke Hub Atsiri ARC USK</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Kirimkan botol sampel tersebut ke alamat berikut:</p>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mt-1.5 text-xs text-emerald-950 font-serif leading-relaxed">
                    <strong>Pusat Lab QC Atsiri ARC USK</strong><br />
                    Gedung Atsiri Research Center (ARC) Lantai 1,<br />
                    Universitas Syiah Kuala, Kopelma Darussalam,<br />
                    Kec. Syiah Kuala, Kota Banda Aceh, Aceh 23111
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-semibold text-zinc-900">Pantau Hasil Uji GC-MS</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Setelah sampel diterima oleh tim Lab, status pengujian dapat Anda pantau langsung melalui Dashboard Supplier.</p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2">
              <Button 
                onClick={() => setShowShippingModal(false)}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-2xl border-none shadow-md shadow-emerald-100"
              >
                Tutup Petunjuk
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
