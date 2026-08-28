'use client'

import { useState, useEffect } from 'react'
import { Beaker, Search, Filter, ClipboardCheck, X, CheckCircle2, ChevronRight, Download } from 'lucide-react'
import { CoAViewer } from '@/components/qc/CoAViewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'

const contentMap = {
  id: {
    header: {
      title: "Manajemen Quality Control",
      desc: "Kelola antrian uji lab dan terbitkan Digital CoA untuk supplier."
    },
    toolbar: {
      searchPlaceholder: "Cari ID Batch...",
      btnFilter: "Filter Asal"
    },
    table: {
      colId: "ID Batch",
      colSupplier: "Supplier & Asal",
      colVol: "Volume Sampel",
      colDate: "Tanggal Diterima",
      colAction: "Aksi",
      statusTesting: "Sedang diuji lab",
      btnInput: "Input Hasil Lab",
      empty: "Tidak ada antrian uji lab saat ini."
    },
    modal: {
      title: "Input Hasil Uji Lab",
      infoTitle: "Informasi Sampel",
      infoSupplier: "Supplier",
      infoOrigin: "Asal Lahan",
      paramsTitle: "Parameter Fisikokimia",
      paramPA: "Patchouli Alcohol (PA)",
      paramMoisture: "Moisture Content",
      paramSpecificGravity: "Specific Gravity",
      paramRefractiveIndex: "Refractive Index",
      paramOpticalRotation: "Optical Rotation",
      alertDesc: "Data yang dimasukkan akan digunakan untuk menerbitkan Digital CoA (Certificate of Analysis) secara otomatis.",
      btnCancel: "Batal",
      btnSubmit: "Terbitkan CoA",
      successMsg: "Digital CoA berhasil digenerate dan produk sekarang berstatus AWAITING_PRICE (Menunggu Harga)!"
    }
  },
  en: {
    header: {
      title: "Quality Control Management",
      desc: "Manage the lab queue and issue Digital CoA for suppliers."
    },
    toolbar: {
      searchPlaceholder: "Search Batch ID...",
      btnFilter: "Filter Origin"
    },
    table: {
      colId: "Batch ID",
      colSupplier: "Supplier & Origin",
      colVol: "Sample Volume",
      colDate: "Date Received",
      colAction: "Action",
      statusTesting: "Currently in lab",
      btnInput: "Input Lab Results",
      empty: "No lab queue at the moment."
    },
    modal: {
      title: "Input Lab Results",
      infoTitle: "Sample Information",
      infoSupplier: "Supplier",
      infoOrigin: "Origin",
      paramsTitle: "Physicochemical Parameters",
      paramPA: "Patchouli Alcohol (PA)",
      paramMoisture: "Moisture Content",
      paramSpecificGravity: "Specific Gravity",
      paramRefractiveIndex: "Refractive Index",
      paramOpticalRotation: "Optical Rotation",
      alertDesc: "The entered data will be used to automatically issue a Digital CoA (Certificate of Analysis).",
      btnCancel: "Cancel",
      btnSubmit: "Issue CoA",
      successMsg: "Digital CoA generated successfully. Product status is now AWAITING_PRICE!"
    }
  }
}

export default function AdminQCPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  
  // Separation of Queue and History
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')
  const [qcQueue, setQcQueue] = useState<any[]>([])
  const [qcHistory, setQcHistory] = useState<any[]>([])
  // Preview CoA Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)
  
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()
  
  const fetchQueue = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      const res = await fetch(`${API_URL}/products`)
      if (res.ok) {
        const result = await res.json()
        const allProducts = result.data || []
        
        // Filter into queue (DRAFT / IN_LAB) and history (AWAITING_PRICE / VERIFIED)
        setQcQueue(allProducts.filter((p: any) => p.status === 'DRAFT' || p.status === 'IN_LAB'))
        setQcHistory(allProducts.filter((p: any) => p.status === 'AWAITING_PRICE' || p.status === 'VERIFIED'))
        return
      }
      throw new Error('Offline fallback')
    } catch (err) {
      console.warn("Backend offline, loading custom batches from localStorage:", err)
      const queueList: any[] = []
      const historyList: any[] = []
      
      const defaultQueue = [
        { id: 'bat_demo_1', batch_code: 'B-ACBA-102', available_volume_kg: 250, origin_district: 'Aceh Barat', created_at: new Date().toISOString(), status: 'IN_LAB', supplierEmail: 'supplier@valam.id' }
      ]
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('valam_supplier_batches_')) {
          const email = key.replace('valam_supplier_batches_', '')
          const batches = JSON.parse(localStorage.getItem(key) || '[]')
          batches.forEach((b: any) => {
            if (b.status === 'DRAFT' || b.status === 'IN_LAB') {
              queueList.push({ ...b, supplierEmail: email })
            } else if (b.status === 'AWAITING_PRICE' || b.status === 'VERIFIED') {
              historyList.push({ ...b, supplierEmail: email })
            }
          })
        }
      }
      setQcQueue(queueList.length > 0 ? queueList : defaultQueue)
      setQcHistory(historyList)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const pendingBatches = qcQueue.filter(p => 
    p.batch_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const historyBatches = qcHistory.filter(p => 
    p.batch_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const formData = new FormData(e.target as HTMLFormElement)
    const data = {
      pa_percentage: parseFloat(formData.get('pa_percentage') as string) || 0,
      moisture: parseFloat(formData.get('moisture') as string) || 0,
      specific_gravity: parseFloat(formData.get('specific_gravity') as string) || 0,
      refractive_index: parseFloat(formData.get('refractive_index') as string) || 0,
      optical_rotation: parseFloat(formData.get('optical_rotation') as string) || 0,
    }

    try {
      const res = await fetch(`${API_URL}/admin/qc/${selectedBatch.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (res.ok) {
        toast({ title: "Berhasil", description: t.modal.successMsg })
        setSelectedBatch(null)
        fetchQueue()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn("Backend offline, updating local storage for batch:", err)
      const supplierEmail = selectedBatch.supplierEmail || 'supplier@valam.id'
      const mockBatchesKey = 'valam_supplier_batches_' + supplierEmail
      const stored = localStorage.getItem(mockBatchesKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        const updated = parsed.map((b: any) => b.id === selectedBatch.id ? { 
          ...b, 
          status: 'AWAITING_PRICE',
          pa_percentage: data.pa_percentage,
          moisture: data.moisture,
          specific_gravity: data.specific_gravity,
          refractive_index: data.refractive_index,
          optical_rotation: data.optical_rotation
        } : b)
        localStorage.setItem(mockBatchesKey, JSON.stringify(updated))
        
        toast({ title: "Berhasil (Mock)", description: t.modal.successMsg })
        setSelectedBatch(null)
        fetchQueue()
      } else {
        toast({ title: "Gagal", description: "Failed to submit QC", variant: "destructive" })
      }
    }
  }

  const handleReceiveSample = async (product: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/admin/qc/${product.id}/receive`, {
        method: 'PATCH',
      })
      if (res.ok) {
        toast({
          title: "Sampel Diterima",
          description: `Sampel untuk batch ${product.batch_code} berhasil diterima dan siap diuji.`
        })
        fetchQueue()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn("Backend offline, updating local storage for receive sample:", err)
      const supplierEmail = product.supplierEmail || 'supplier@valam.id'
      const mockBatchesKey = 'valam_supplier_batches_' + supplierEmail
      const stored = localStorage.getItem(mockBatchesKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        const updated = parsed.map((b: any) => b.id === product.id ? { ...b, status: 'IN_LAB' } : b)
        localStorage.setItem(mockBatchesKey, JSON.stringify(updated))
        toast({
          title: "Sampel Diterima (Mock)",
          description: `Sampel untuk batch ${product.batch_code} diterima di local storage.`
        })
        fetchQueue()
      }
    }
  }

  const handleDownloadCoA = async (productId: string, batchCode: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/products/${productId}/coa/download`)
      if (!res.ok) throw new Error('Gagal mengunduh CoA.')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CoA-${batchCode}.pdf`
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

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col pb-20 relative">
      <DashboardHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 bg-white px-4 pt-2 rounded-xl shadow-xs border">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 border-none ${
              activeTab === 'queue'
                ? 'text-emerald-800 border-b-2 border-emerald-800 font-bold'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {locale === 'id' ? 'Antrian Pengujian' : 'QC Queue'}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'queue' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-105 text-zinc-600'
            }`}>
              {pendingBatches.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 border-none ${
              activeTab === 'history'
                ? 'text-emerald-800 border-b-2 border-emerald-800 font-bold'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {locale === 'id' ? 'Riwayat QC & CoA' : 'QC History & CoA'}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'history' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-105 text-zinc-600'
            }`}>
              {historyBatches.length}
            </span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input 
              type="text" 
              placeholder={t.toolbar.searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-50 border-zinc-200 focus-visible:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50 hover:bg-zinc-100">
              <Filter className="w-4 h-4 mr-2" />
              {t.toolbar.btnFilter}
            </Button>
          </div>
        </div>

        {/* Tab 1: Queue Table */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200">
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colId}</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colSupplier}</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colVol}</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.table.colDate}</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">{t.table.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pendingBatches.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm font-semibold text-zinc-900">{product.batch_code}</div>
                        <div className={`text-xs font-medium mt-0.5 flex items-center ${
                          product.status === 'DRAFT' ? 'text-zinc-500' : 'text-amber-600'
                        }`}>
                          <Beaker className="w-3 h-3 mr-1" />
                          {product.status === 'DRAFT' 
                            ? (locale === 'id' ? 'Menunggu Sampel' : 'Awaiting Sample')
                            : t.table.statusTesting}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-zinc-700">{product.supplier?.profile?.company_name || product.supplier_name || 'N/A'}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{product.origin_village || ''} {product.origin_district || ''}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-zinc-700">50 ml</td>
                      <td className="py-4 px-6 text-sm text-zinc-600">24 Juni 2026</td>
                      <td className="py-4 px-6 text-right">
                        {product.status === 'DRAFT' ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleReceiveSample(product)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-xl font-semibold"
                          >
                            {locale === 'id' ? 'Terima Sampel' : 'Receive Sample'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-zinc-900 hover:bg-zinc-800 text-white border-none rounded-xl"
                            onClick={() => setSelectedBatch(product)}
                          >
                            {t.table.btnInput} <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingBatches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        {t.table.empty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: History Table */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200">
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID Batch</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Supplier & Asal</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hasil Pengujian</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Dokumen CoA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {historyBatches.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-sm font-semibold text-zinc-900">{product.batch_code}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Tested via GC-MS</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-zinc-700">{product.supplier?.profile?.company_name || product.supplier_name || 'N/A'}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{product.origin_village || ''} {product.origin_district || ''}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5 text-xs text-zinc-700 font-medium">
                          <span>PA: <strong className="text-emerald-700 font-semibold">{product.pa_percentage}%</strong></span>
                          <span>Air: <strong className="text-zinc-800">{product.moisture}%</strong></span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          product.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}>
                          {product.status === 'VERIFIED' ? 'Verified' : 'Menunggu Harga'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-700 hover:bg-emerald-850 text-white font-semibold rounded-xl border-none"
                            onClick={() => {
                              setPreviewProduct(product)
                              setShowPreviewModal(true)
                            }}
                          >
                            {locale === 'id' ? 'Lihat CoA' : 'View CoA'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold gap-1 rounded-xl"
                            onClick={() => handleDownloadCoA(product.id, product.batch_code)}
                          >
                            <Download className="w-4 h-4" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historyBatches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        {locale === 'id' ? 'Belum ada riwayat pengujian lab.' : 'No QC testing history found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Form for QC Input */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBatch(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-950 text-white">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-gold-400" />
                  {t.modal.title}
                </h2>
                <p className="text-zinc-400 text-sm mt-1 font-mono">{selectedBatch.batch_code}</p>
              </div>
              <button 
                onClick={() => setSelectedBatch(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">{t.modal.infoTitle}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-zinc-500">{t.modal.infoSupplier}</span>
                    <span className="font-medium text-zinc-900">{selectedBatch.supplier?.profile?.company_name || selectedBatch.supplier_name}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">{t.modal.infoOrigin}</span>
                    <span className="font-medium text-zinc-900">{selectedBatch.origin_district}</span>
                  </div>
                </div>
              </div>

              <form id="qc-form" onSubmit={handleTestSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-zinc-900 border-b border-zinc-100 pb-2">{t.modal.paramsTitle}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-zinc-700">{t.modal.paramPA}</Label>
                      <span className="text-xs text-zinc-400">Min 30%</span>
                    </div>
                    <div className="relative">
                      <Input name="pa_percentage" type="number" step="0.1" required placeholder="Contoh: 32.5" className="pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-zinc-700">{t.modal.paramMoisture}</Label>
                      <span className="text-xs text-zinc-400">Max 2%</span>
                    </div>
                    <div className="relative">
                      <Input name="moisture" type="number" step="0.1" required placeholder="Contoh: 0.5" className="pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-700">{t.modal.paramSpecificGravity}</Label>
                      <Input name="specific_gravity" type="number" step="0.001" required placeholder="0.950 - 0.975" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-700">{t.modal.paramRefractiveIndex}</Label>
                      <Input name="refractive_index" type="number" step="0.001" required placeholder="1.507 - 1.515" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-zinc-700">{t.modal.paramOpticalRotation}</Label>
                    <Input name="optical_rotation" type="number" step="1" required placeholder="-48 sd -65" />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <p>
                    {t.modal.alertDesc}
                  </p>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedBatch(null)}>
                {t.modal.btnCancel}
              </Button>
              <Button type="submit" form="qc-form" className="w-full bg-gold-500 hover:bg-gold-600 text-zinc-950 font-semibold shadow-md border-none rounded-xl">
                {t.modal.btnSubmit}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CoA Preview Modal */}
      {showPreviewModal && previewProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-zinc-200 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-950 text-white shrink-0">
              <span className="font-bold text-lg font-serif">Pratinjau Sertifikat Digital CoA</span>
              <button 
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewProduct(null)
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 overflow-y-auto bg-zinc-50 flex justify-center items-start flex-1">
              <div className="w-full max-w-3xl">
                <CoAViewer batch={previewProduct} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
