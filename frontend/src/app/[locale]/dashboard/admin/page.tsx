'use client'

import { Users, Beaker, FileCheck, DollarSign, ChevronRight, LayoutDashboard } from 'lucide-react'
import { mockProducts, formatRupiah } from '@/lib/mock-data'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from 'next-intl'
import { useState, useEffect } from 'react'

const contentMap = {
  id: {
    header: {
      title: "Admin Dashboard",
      desc: "Pusat kendali ekosistem Valam, pantau QC dan validasi Supplier."
    },
    stats: {
      labQueue: "Antrian Lab (QC)",
      labQueueTrend: "Prioritas tinggi",
      pendingValidation: "Menunggu Validasi",
      pendingValidationTrend: "Supplier baru",
      verifiedBatches: "Batch Terverifikasi",
      verifiedBatchesTrend: "Bulan ini",
      revenue: "Estimasi Revenue",
      revenueTrend: "Berdasarkan transaksi",
      batchesSuffix: "Batch",
      accountsSuffix: "Akun"
    },
    qcQueue: {
      title: "Antrian Uji Lab",
      desc: "Batch sampel fisik yang baru tiba di hub",
      viewAll: "Lihat Semua",
      colId: "ID Batch / Asal",
      colStatus: "Status",
      colAction: "Aksi",
      statusPending: "Menunggu QC",
      btnTest: "Uji Sampel"
    },
    validation: {
      title: "Validasi Supplier",
      desc: "Pendaftaran akun koperasi yang butuh review",
      viewAll: "Lihat Semua",
      colName: "Nama Koperasi",
      colDoc: "Dokumen",
      colAction: "Aksi",
      btnReview: "Review",
      registeredPrefix: "Didaftarkan"
    }
  },
  en: {
    header: {
      title: "Admin Dashboard",
      desc: "Valam ecosystem control center, monitor QC and Supplier validation."
    },
    stats: {
      labQueue: "Lab Queue (QC)",
      labQueueTrend: "High priority",
      pendingValidation: "Pending Validation",
      pendingValidationTrend: "New suppliers",
      verifiedBatches: "Verified Batches",
      verifiedBatchesTrend: "This month",
      revenue: "Estimated Revenue",
      revenueTrend: "Based on transactions",
      batchesSuffix: "Batches",
      accountsSuffix: "Accounts"
    },
    qcQueue: {
      title: "Lab Testing Queue",
      desc: "Physical sample batches newly arrived at the hub",
      viewAll: "View All",
      colId: "Batch ID / Origin",
      colStatus: "Status",
      colAction: "Action",
      statusPending: "Awaiting QC",
      btnTest: "Test Sample"
    },
    validation: {
      title: "Supplier Validation",
      desc: "Cooperative account registrations needing review",
      viewAll: "View All",
      colName: "Cooperative Name",
      colDoc: "Documents",
      colAction: "Action",
      btnReview: "Review",
      registeredPrefix: "Registered"
    }
  }
}

export default function AdminDashboardPage() {
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const [dashboardData, setDashboardData] = useState<{
    pendingSuppliers: number,
    pendingQc: number,
    transactionsToday: number,
    revenue: number
  } | null>(null)
  const [qcQueue, setQcQueue] = useState<any[]>([])
  const [pendingSuppliersList, setPendingSuppliersList] = useState<any[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('valam_token') : null
    const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined
    
    // Fetch KPI
    fetch(`${API_URL}/admin/dashboard`)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Error fetching dashboard data:", err))
      
    // Fetch Queue Preview
    fetch(`${API_URL}/admin/qc/queue`)
      .then(res => res.json())
      .then(data => setQcQueue(data.slice(0, 4)))
      .catch(err => console.error("Error fetching QC queue:", err))

    // Fetch Pending Suppliers
    fetch(`${API_URL}/admin/suppliers?status=DALAM_VERIFIKASI`, { headers })
      .then(res => res.json())
      .then(result => {
        setPendingSuppliersList(result.data || [])
        setLoadingSuppliers(false)
      })
      .catch(err => {
        console.error("Error fetching pending suppliers:", err)
        setLoadingSuppliers(false)
      })
  }, [])

  const pendingQC = dashboardData?.pendingQc || 0
  const verifiedBatches = dashboardData?.transactionsToday || 0 // Reusing trend stat for transactions
  const pendingSuppliers = dashboardData?.pendingSuppliers || 0
  const revenue = dashboardData?.revenue || 0
  
  const stats = [
    { title: t.stats.labQueue, value: `${pendingQC} ${t.stats.batchesSuffix}`, icon: Beaker, trend: t.stats.labQueueTrend, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: t.stats.pendingValidation, value: `${pendingSuppliers} ${t.stats.accountsSuffix}`, icon: Users, trend: t.stats.pendingValidationTrend, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: t.stats.verifiedBatches, value: `${verifiedBatches} Transaksi`, icon: FileCheck, trend: 'Hari ini', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: t.stats.revenue, value: formatRupiah(revenue), icon: DollarSign, trend: t.stats.revenueTrend, color: 'text-gold-600', bg: 'bg-gold-50' },
  ]

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col pb-10">
      <DashboardHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <h3 className="text-zinc-500 text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                <p className={`text-xs font-medium mt-2 ${stat.color}`}>{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Stream Breakdown */}
        <div className="bg-gradient-to-br from-emerald-950 to-zinc-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-900/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pendapatan Bersih Platform</p>
              <h2 className="text-3xl font-serif font-bold text-white">{formatRupiah(revenue)}</h2>
              <p className="text-zinc-400 text-[11px] mt-1.5">
                Estimasi pendapatan langsung dari komisi komersial dan biaya administrasi pengujian lab QC.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 w-full md:w-auto md:border-l md:border-white/10 md:pl-8">
              <div>
                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Gross Transaksi (GMV)</p>
                <p className="text-base font-bold text-zinc-100 mt-1">{formatRupiah(dashboardData?.gmv || 0)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Volume Transaksi Selesai</p>
              </div>
              <div>
                <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Komisi Platform (1.5%)</p>
                <p className="text-base font-bold text-emerald-300 mt-1">{formatRupiah(dashboardData?.platformFee || 0)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Bagi Hasil Transaksi B2B</p>
              </div>
              <div>
                <p className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">QC Certification Fee</p>
                <p className="text-base font-bold text-amber-300 mt-1">{formatRupiah(dashboardData?.qcRevenue || 0)}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Rp 250k Per Batch Sertifikasi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* QC Queue Preview */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{t.qcQueue.title}</h2>
                <p className="text-xs text-zinc-500 mt-1">{t.qcQueue.desc}</p>
              </div>
              <Link href="/dashboard/admin/qc" className="text-sm text-gold-600 font-medium hover:underline">
                {t.qcQueue.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase">{t.qcQueue.colId}</th>
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase">{t.qcQueue.colStatus}</th>
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase text-right">{t.qcQueue.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {qcQueue.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm font-semibold text-zinc-900">{product.batch_code}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{product.origin_district}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {t.qcQueue.statusPending}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href="/dashboard/admin/qc">
                          <Button size="sm" variant="outline" className="text-xs bg-white group-hover:bg-zinc-100">
                            {t.qcQueue.btnTest} <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Validation Preview */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{t.validation.title}</h2>
                <p className="text-xs text-zinc-500 mt-1">{t.validation.desc}</p>
              </div>
              <Link href="/dashboard/admin/suppliers" className="text-sm text-gold-600 font-medium hover:underline">
                {t.validation.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase">{t.validation.colName}</th>
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase">{t.validation.colDoc}</th>
                    <th className="py-3 px-6 text-xs font-semibold text-zinc-500 uppercase text-right">{t.validation.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pendingSuppliersList.slice(0, 4).map((sup) => (
                    <tr key={sup.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-zinc-900">{sup.nama_koperasi}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{t.validation.registeredPrefix} {new Date(sup.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-500 max-w-[120px] truncate">
                        {sup.documents && sup.documents.length > 0 
                          ? sup.documents.map((d: any) => d.tipe_document.replace(/_/g, ' ')).join(', ') 
                          : 'Belum ada dokumen'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link href="/dashboard/admin/suppliers">
                          <Button size="sm" variant="outline" className="text-xs bg-white group-hover:bg-zinc-100">
                            {t.validation.btnReview} <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loadingSuppliers && pendingSuppliersList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-sm text-zinc-500 font-medium">
                        Tidak ada pendaftaran supplier yang memerlukan validasi saat ini.
                      </td>
                    </tr>
                  )}
                  {loadingSuppliers && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-sm text-zinc-400">
                        <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
                        Memuat data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
