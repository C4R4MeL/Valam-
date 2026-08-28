'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/mock-data'
import { Search, Filter, Download, Pencil, Trash2, X, FlaskConical, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CoAViewer } from '@/components/qc/CoAViewer'

const contentMap = {
  id: {
    header: {
      title: "Inventori Batch",
      desc: "Kelola stok minyak nilam dan pantau status pengujian.",
      btnDownload: "Unduh Laporan"
    },
    toolbar: {
      searchPlaceholder: "Cari ID Batch...",
      btnFilter: "Filter Status"
    },
    table: {
      colId: "ID Batch",
      colDate: "Tanggal Dibuat",
      colStatus: "Status",
      colVol: "Volume (Kg)",
      colPrice: "Harga/Kg",
      colAction: "Aksi",
      statusVerified: "Terverifikasi",
      statusInLab: "Diuji Lab",
      statusDraft: "Draft",
      statusAwaitingPrice: "Menunggu Harga",
      empty: "Tidak ada batch yang ditemukan."
    },
    pagination: {
      showing: "Menampilkan",
      to: "hingga",
      of: "dari",
      entries: "entri",
      prev: "Sebelumnya",
      next: "Berikutnya"
    }
  },
  en: {
    header: {
      title: "Batch Inventory",
      desc: "Manage patchouli oil stock and monitor testing status.",
      btnDownload: "Download Report"
    },
    toolbar: {
      searchPlaceholder: "Search Batch ID...",
      btnFilter: "Filter Status"
    },
    table: {
      colId: "Batch ID",
      colDate: "Date Created",
      colStatus: "Status",
      colVol: "Volume (Kg)",
      colPrice: "Price/Kg",
      colAction: "Action",
      statusVerified: "Verified",
      statusInLab: "In Lab",
      statusDraft: "Draft",
      statusAwaitingPrice: "Awaiting Price",
      empty: "No batches found."
    },
    pagination: {
      showing: "Showing",
      to: "to",
      of: "of",
      entries: "entries",
      prev: "Previous",
      next: "Next"
    }
  }
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()
  
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  // Shipping Instructions Modal State
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [shippingBatchCode, setShippingBatchCode] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    origin_district: '',
    origin_village: '',
    volume: '',
  })
  const [updating, setUpdating] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCoAModal, setShowCoAModal] = useState(false)
  const [selectedProductForCoA, setSelectedProductForCoA] = useState<any | null>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchBatches = async () => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      // 1. Get profile to retrieve user_id
      const profileRes = await fetch(`${apiUrl}/suppliers/me`, {
        headers: getAuthHeaders(),
      })
      if (!profileRes.ok) {
        throw new Error('Gagal memuat profil supplier.')
      }
      const profileResult = await profileRes.json()
      const userId = profileResult.data?.user_id
      
      if (!userId) {
        setBatches([])
        return
      }

      // 2. Get batches for this supplier
      const productsRes = await fetch(`${apiUrl}/products?supplier_id=${userId}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      })
      if (!productsRes.ok) {
        throw new Error('Gagal memuat daftar batch.')
      }
      const productsResult = await productsRes.json()
      setBatches(productsResult.data || [])
    } catch (err: any) {
      toast({
        title: "Koneksi Gagal",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])
  
  const handleOpenEdit = (batch: any) => {
    setSelectedBatch(batch)
    setEditForm({
      origin_district: batch.origin_district || '',
      origin_village: batch.origin_village || '',
      volume: batch.available_volume_kg?.toString() || '',
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return

    const volumeNum = parseFloat(editForm.volume)
    if (isNaN(volumeNum) || volumeNum <= 0) {
      toast({
        title: "Input Tidak Valid",
        description: "Volume harus berupa angka positif.",
        variant: "destructive"
      })
      return
    }

    setUpdating(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/products/${selectedBatch.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          origin_district: editForm.origin_district,
          origin_village: editForm.origin_village,
          total_volume_kg: volumeNum,
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Gagal memperbarui batch.')
      }

      toast({
        title: "Batch Diperbarui",
        description: `Informasi batch ${selectedBatch.batch_code} berhasil diperbarui.`,
      })
      setIsEditModalOpen(false)
      fetchBatches()
    } catch (err: any) {
      toast({
        title: "Gagal Memperbarui",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteBatch = async (batchId: string, batchCode: string) => {
    const isConfirm = window.confirm(`Apakah Anda yakin ingin menghapus batch ${batchCode}?`)
    if (!isConfirm) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/products/${batchId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Gagal menghapus batch.')
      }

      toast({
        title: "Batch Dihapus",
        description: `Batch ${batchCode} berhasil dihapus dari sistem.`,
      })
      fetchBatches()
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const handleDownloadReport = () => {
    if (batches.length === 0) {
      toast({
        title: locale === 'id' ? 'Tidak Ada Data' : 'No Data',
        description: locale === 'id' ? 'Tidak ada data batch untuk diunduh.' : 'No batch data available to download.',
        variant: "destructive"
      })
      return
    }

    const headers = ["ID Batch", "Tanggal Dibuat", "Status", "Volume (Kg)", "Harga/Kg (Rp)"]
    const rows = batches.map(b => [
      b.batch_code,
      new Date(b.created_at || Date.now()).toLocaleDateString('id-ID'),
      b.status,
      b.available_volume_kg,
      b.price_per_kg
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Laporan_Inventori_Batch_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: locale === 'id' ? 'Laporan Diunduh' : 'Report Downloaded',
      description: locale === 'id' ? 'Laporan inventori berhasil diunduh.' : 'Inventory report downloaded successfully.',
    })
  }

  const filteredProducts = batches.filter(p => {
    const matchesSearch = p.batch_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col">
      <DashboardHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-[70vh] pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {/* Header titles are in DashboardHeader wrapper */}
          </div>
          <Button onClick={handleDownloadReport} className="bg-gold-500 hover:bg-gold-600 text-emerald-955 font-bold shadow-md shadow-gold-500/20 border-none rounded-xl">
            {t.header.btnDownload}
            <Download className="w-4 h-4 ml-2" />
          </Button>
        </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder={t.toolbar.searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-lg text-sm transition-all outline-none text-zinc-800"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-10 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 transition-all appearance-none"
            >
              <option value="ALL">{locale === 'id' ? 'Semua Status' : 'All Statuses'}</option>
              <option value="DRAFT">{locale === 'id' ? 'Draft' : 'Draft'}</option>
              <option value="IN_LAB">{locale === 'id' ? 'Diuji Lab' : 'In Lab'}</option>
              <option value="AWAITING_PRICE">{locale === 'id' ? 'Menunggu Harga' : 'Awaiting Price'}</option>
              <option value="VERIFIED">{locale === 'id' ? 'Terverifikasi' : 'Verified'}</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-450 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200">
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colId}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colDate}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colStatus}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colVol}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colPrice}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">{t.table.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="flex justify-center items-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      {locale === 'id' ? 'Memuat data...' : 'Loading data...'}
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-mono text-sm font-semibold text-emerald-900">{product.batch_code}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{product.origin_district}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-zinc-600">
                    25 Juni 2026
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      product.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      product.status === 'IN_LAB' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      product.status === 'AWAITING_PRICE' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                      'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}>
                      {product.status === 'VERIFIED' ? t.table.statusVerified : 
                       product.status === 'IN_LAB' ? t.table.statusInLab :
                       product.status === 'AWAITING_PRICE' ? t.table.statusAwaitingPrice : t.table.statusDraft}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-zinc-700 font-medium">{product.available_volume_kg}</td>
                  <td className="py-4 px-6 text-sm text-zinc-600">
                    {product.price_per_kg > 0 ? formatRupiah(product.price_per_kg) : '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {product.status === 'VERIFIED' && (
                        <button 
                          onClick={() => {
                            setSelectedProductForCoA(product)
                            setShowCoAModal(true)
                          }}
                          className="text-zinc-400 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                          title={locale === 'id' ? 'Lihat CoA' : 'View CoA'}
                        >
                          <FileText className="w-4 h-4 text-emerald-600 animate-pulse" />
                        </button>
                      )}
                      {product.status === 'DRAFT' && (
                        <button 
                          onClick={() => {
                            setShippingBatchCode(product.batch_code)
                            setShowShippingModal(true)
                          }}
                          className="text-zinc-400 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                          title={locale === 'id' ? 'Petunjuk Kirim Sampel' : 'Sample Shipping Instructions'}
                        >
                          <FlaskConical className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEdit(product)}
                        className="text-zinc-400 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                        title={locale === 'id' ? 'Ubah Batch' : 'Edit Batch'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBatch(product.id, product.batch_code)}
                        className="text-zinc-400 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title={locale === 'id' ? 'Hapus Batch' : 'Delete Batch'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    {t.table.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-sm text-zinc-500">
          <span>{t.pagination.showing} {filteredProducts.length > 0 ? 1 : 0} {t.pagination.to} {filteredProducts.length} {t.pagination.of} {filteredProducts.length} {t.pagination.entries}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>{t.pagination.prev}</Button>
            <Button variant="outline" size="sm" disabled>{t.pagination.next}</Button>
          </div>
        </div>
      </div>
      </div>

      {/* EDIT BATCH MODAL DIALOG */}
      {isEditModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Edit Informasi Batch</h3>
                <p className="text-xs text-zinc-500 mt-1">Ubah rincian untuk batch: <strong className="font-mono text-emerald-800">{selectedBatch.batch_code}</strong></p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateBatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal_district" className="text-xs font-bold text-zinc-700">Kabupaten Asal</Label>
                <Input 
                  id="modal_district"
                  placeholder="Contoh: Aceh Barat"
                  value={editForm.origin_district}
                  onChange={(e) => setEditForm({...editForm, origin_district: e.target.value})}
                  className="bg-white border-zinc-200 text-zinc-800 font-sans"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_village" className="text-xs font-bold text-zinc-700">Kecamatan / Desa</Label>
                <Input 
                  id="modal_village"
                  placeholder="Contoh: Pasi Mali"
                  value={editForm.origin_village}
                  onChange={(e) => setEditForm({...editForm, origin_village: e.target.value})}
                  className="bg-white border-zinc-200 text-zinc-800 font-sans"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_volume" className="text-xs font-bold text-zinc-700">Total Volume (Kg)</Label>
                <Input 
                  id="modal_volume"
                  type="number"
                  placeholder="Contoh: 350"
                  value={editForm.volume}
                  onChange={(e) => setEditForm({...editForm, volume: e.target.value})}
                  className="bg-white border-zinc-200 text-zinc-800 font-sans"
                  required
                />
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 border-zinc-250 text-zinc-700 rounded-xl"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={updating}
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-850 text-white font-bold rounded-xl border-none"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
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

      {/* CoA Preview Modal */}
      {showCoAModal && selectedProductForCoA && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Certificate of Analysis (CoA)</h3>
                <p className="text-xs text-zinc-500 mt-1">Nomor batch: <strong className="font-mono text-emerald-800">{selectedProductForCoA.batch_code}</strong></p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowCoAModal(false)
                  setSelectedProductForCoA(null)
                }}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CoA Viewer Component */}
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50">
              <CoAViewer batch={selectedProductForCoA} />
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => {
                  setShowCoAModal(false)
                  setSelectedProductForCoA(null)
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
