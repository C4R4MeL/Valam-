'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Search, CheckCircle, XCircle, ChevronRight, 
  FileText, CheckCircle2, AlertTriangle, RefreshCcw, ExternalLink 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'

const contentMap = {
  id: {
    header: {
      title: "Validasi Pendaftaran Supplier",
      desc: "Tinjau kelengkapan dokumen legalitas dan berikan persetujuan akun koperasi baru."
    },
    toolbar: {
      searchPlaceholder: "Cari nama koperasi..."
    },
    table: {
      colName: "Nama Koperasi",
      colEmail: "Email Kontak",
      colDoc: "Status Dokumen",
      colDate: "Tanggal Daftar",
      colAction: "Aksi",
      statusPending: "Menunggu Review",
      btnReview: "Review Berkas",
      empty: "Tidak ada antrian validasi supplier saat ini."
    },
    modal: {
      title: "Review Profil Supplier",
      desc: "Pastikan legalitas terverifikasi sebelum menyetujui akses.",
      docTitle: "Dokumen Legalitas & Mutu",
      btnViewDoc: "Lihat Berkas",
      alertDesc: "Dengan menyetujui, Anda memberikan akses penuh kepada koperasi ini untuk menambahkan batch minyak nilam ke dalam sistem Valam.",
      btnReject: "Tolak Akun",
      btnApprove: "Finalisasi & Setujui Akun",
      successApprove: "Akun supplier {name} telah disetujui! Status berubah menjadi TERVERIFIKASI.",
      successReject: "Pendaftaran {name} ditolak."
    }
  },
  en: {
    header: {
      title: "Supplier Registration Validation",
      desc: "Review legal document completeness and approve new cooperative accounts."
    },
    toolbar: {
      searchPlaceholder: "Search cooperative name..."
    },
    table: {
      colName: "Cooperative Name",
      colEmail: "Contact Email",
      colDoc: "Document Status",
      colDate: "Registration Date",
      colAction: "Action",
      statusPending: "Awaiting Review",
      btnReview: "Review Files",
      empty: "No supplier validation queue at the moment."
    },
    modal: {
      title: "Review Supplier Profile",
      desc: "Ensure verified legality before granting access.",
      docTitle: "Legality & Quality Documents",
      btnViewDoc: "View File",
      alertDesc: "By approving, you grant full access to this cooperative to add patchouli oil batches into the Valam system.",
      btnReject: "Reject Account",
      btnApprove: "Finalize & Approve Account",
      successApprove: "Supplier account {name} has been approved! Status updated to TERVERIFIKASI.",
      successReject: "Registration for {name} has been rejected."
    }
  }
}

export default function AdminSuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  
  // Specific Review form state
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({})
  
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Fetch pending list from NestJS API
  const fetchSuppliers = async () => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const statusParam = activeTab === 'pending' ? 'DALAM_VERIFIKASI' : 'TERVERIFIKASI'
      const res = await fetch(`${apiUrl}/admin/suppliers?status=${statusParam}`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const result = await res.json()
        setSuppliers(result.data || [])
      } else {
        throw new Error('Gagal memuat list supplier.')
      }
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
    fetchSuppliers()
  }, [activeTab])

  // Open detail modal and fetch full info
  const handleOpenReviewModal = async (supplier: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/admin/suppliers/${supplier.id}`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const result = await res.json()
        setSelectedSupplier(result.data)
      } else {
        throw new Error('Gagal mengambil data detail supplier.')
      }
    } catch (err: any) {
      toast({
        title: "Gagal memuat detail",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Get Signed URL & preview document in a new tab
  const handlePreviewDoc = (doc: any) => {
    if (doc.preview_url) {
      const token = localStorage.getItem('valam_token')
      const separator = doc.preview_url.includes('?') ? '&' : '?'
      const urlWithToken = token ? `${doc.preview_url}${separator}token=${encodeURIComponent(token)}` : doc.preview_url
      window.open(urlWithToken, '_blank')
    } else {
      toast({
        title: "Gagal membuka berkas",
        description: "Dokumen tidak memiliki URL preview.",
        variant: "destructive"
      })
    }
  }

  // Review a specific document (APPROVE, REJECT, REQUEST_REVISION)
  const handleReviewDocAction = async (docId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    const notes = reviewNotes[docId] || ''
    if ((action === 'REJECT' || action === 'REQUEST_REVISION') && !notes.trim()) {
      toast({
        title: "Catatan Wajib",
        description: "Catatan ulasan wajib diisi jika menolak atau meminta revisi.",
        variant: "destructive"
      })
      return
    }

    setSubmittingReview(prev => ({ ...prev, [docId]: true }))
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/admin/suppliers/${selectedSupplier.id}/documents/${docId}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          aksi: action,
          catatan: notes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan ulasan dokumen.')
      }

      toast({
        title: "Ulasan Disimpan",
        description: `Status dokumen berhasil diperbarui menjadi ${action}.`,
      })

      // Refresh selected supplier detail
      handleOpenReviewModal(selectedSupplier)
    } catch (err: any) {
      toast({
        title: "Gagal Review",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSubmittingReview(prev => ({ ...prev, [docId]: false }))
    }
  }

  // Finalize verification (All documents must be APPROVED)
  const handleFinalizeVerify = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/admin/suppliers/${selectedSupplier.id}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      })

      const data = await res.json()
      if (!res.ok) {
        let errDesc = data.message
        if (data.unapprovedDocuments) {
          errDesc = `Masih ada berkas yang belum disetujui: ${data.unapprovedDocuments.join(', ')}`
        }
        throw new Error(errDesc || 'Gagal memverifikasi akun.')
      }

      toast({
        title: "Koperasi Terverifikasi",
        description: t.modal.successApprove.replace('{name}', selectedSupplier.nama_koperasi),
      })

      setSelectedSupplier(null)
      fetchSuppliers()
    } catch (err: any) {
      toast({
        title: "Finalisasi Gagal",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Reject overall profile
  const handleRejectSupplierProfile = async () => {
    if (!confirm('Apakah Anda yakin ingin menolak pendaftaran koperasi ini secara penuh?')) return
    
    // In our backend, rejecting one document resets supplier to TERDAFTAR. 
    // If admin wants to reject full account, they can reject the main documents.
    toast({
      title: "Pendaftaran Ditangguhkan",
      description: "Berikan status REJECT pada salah satu berkas wajib untuk menolak.",
      variant: "destructive"
    })
  }

  const pendingSuppliers = suppliers.filter(s => s.nama_koperasi.toLowerCase().includes(searchTerm.toLowerCase()))

  const formatDocType = (type: string) => {
    const map: Record<string, string> = {
      AKTA_KOPERASI: 'Akta Pendirian Koperasi',
      COA: 'COA (Certificate of Analysis)',
      FOTO_FASILITAS: 'Foto Fasilitas Penyulingan',
      SURAT_PERNYATAAN: 'Surat Pernyataan Standar & SLA',
    }
    return map[type] || type
  }

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col pb-20 relative bg-zinc-55 min-h-screen">
      <DashboardHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* premium tab switcher */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-6 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'pending'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            Antrean Validasi
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            Riwayat Validasi (Terverifikasi)
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
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
          <Button variant="outline" className="border-zinc-300 w-full sm:w-auto" onClick={fetchSuppliers}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Segarkan
          </Button>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200">
            <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 mt-3 font-semibold">Mengambil data antrian...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.table.colName}</th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.table.colEmail}</th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.table.colDoc}</th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.table.colDate}</th>
                    <th className="py-4 px-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">{t.table.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  {pendingSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-emerald-950">{sup.nama_koperasi}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">NIB: {sup.nib}</div>
                      </td>
                      <td className="py-4 px-6 text-zinc-650">{sup.user?.email}</td>
                      <td className="py-4 px-6">
                        {activeTab === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
                            {t.table.statusPending}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
                            Terverifikasi
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-zinc-500">{new Date(sup.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          size="sm" 
                          className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg border-none shadow-sm"
                          onClick={() => handleOpenReviewModal(sup)}
                        >
                          {activeTab === 'pending' ? t.table.btnReview : 'Lihat Profil'} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pendingSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-zinc-400 font-medium bg-white">
                        {activeTab === 'pending' ? t.table.empty : 'Tidak ada riwayat supplier terverifikasi saat ini.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL REVIEW DOKUMEN ────────────────────────────────────────── */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => setSelectedSupplier(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-emerald-950">{t.modal.title}</h2>
                <p className="text-zinc-500 text-xs mt-1">{t.modal.desc}</p>
              </div>
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Scroll Content */}
            <div className="overflow-y-auto p-6 space-y-8 flex-1">
              
              {/* Supplier Info Profile */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 border-l-4 border-gold-500 pl-2">Profil Koperasi</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Nama Koperasi</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.nama_koperasi}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">NIB OSS</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.nib}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">NPWP</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.npwp}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">WhatsApp PIC</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.whatsapp} ({selectedSupplier.nama_pic})</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Kapasitas Produksi</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.kapasitas_produksi} kg/bulan</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Domisili</span>
                    <strong className="text-zinc-800 text-sm">{selectedSupplier.desa}, {selectedSupplier.kecamatan}, {selectedSupplier.kabupaten}</strong>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-4">
                <h4 className="font-bold text-zinc-800">{t.modal.docTitle}</h4>
                <div className="space-y-4">
                  {selectedSupplier.documents?.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-2xl border border-zinc-200 space-y-3 bg-zinc-50/20">
                      
                      {/* Document Meta Row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-800 shrink-0" />
                          <div>
                            <span className="text-sm font-bold text-zinc-800">{formatDocType(doc.tipe_document)}</span>
                            <span className="text-[10px] text-zinc-400 ml-2">({(doc.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                            doc.status_dokumen === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            doc.status_dokumen === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            doc.status_dokumen === 'REVISION_REQUESTED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-zinc-150 text-zinc-650 border-zinc-200'
                          }`}>
                            {doc.status_dokumen}
                          </span>
                          
                          <Button 
                            size="xs" 
                            variant="link" 
                            className="text-emerald-700 font-semibold flex items-center gap-1"
                            onClick={() => handlePreviewDoc(doc)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                          </Button>
                        </div>
                      </div>

                      {/* Review Actions Form */}
                      {activeTab === 'pending' ? (
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Catatan / Ulasan Reviewer</Label>
                            <Input 
                              placeholder="Tulis alasan jika ditolak atau revisi..."
                              value={reviewNotes[doc.id] || ''}
                              onChange={e => setReviewNotes({ ...reviewNotes, [doc.id]: e.target.value })}
                              className="bg-white border-zinc-200 text-xs"
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg text-xs"
                              onClick={() => handleReviewDocAction(doc.id, 'REJECT')}
                              disabled={submittingReview[doc.id]}
                            >
                              Tolak
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg text-xs"
                              onClick={() => handleReviewDocAction(doc.id, 'REQUEST_REVISION')}
                              disabled={submittingReview[doc.id]}
                            >
                              Minta Revisi
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs border-none"
                              onClick={() => handleReviewDocAction(doc.id, 'APPROVE')}
                              disabled={submittingReview[doc.id]}
                            >
                              Setujui Berkas
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 text-xs">
                          <span className="text-zinc-400">Catatan Reviewer: </span>
                          <span className="text-zinc-700 font-medium italic">{doc.catatan_reviewer || 'Disetujui tanpa catatan.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {activeTab === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    {t.modal.alertDesc} Pastikan semua dokumen utama (Akta, COA valid, Foto Fasilitas, dan Surat Pernyataan) disetujui sebelum mengaktifkan akun.
                  </p>
                </div>
              )}

            </div>
            
            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-55 flex justify-end gap-3 rounded-b-3xl">
              {activeTab === 'pending' ? (
                <>
                  <Button variant="outline" className="text-zinc-655 border-zinc-300 rounded-xl" onClick={() => setSelectedSupplier(null)}>
                    Batal
                  </Button>
                  <Button className="bg-emerald-800 hover:bg-emerald-900 text-white shadow-md rounded-xl border-none font-bold" onClick={handleFinalizeVerify}>
                    {t.modal.btnApprove}
                  </Button>
                </>
              ) : (
                <Button className="bg-emerald-800 hover:bg-emerald-900 text-white shadow-md rounded-xl border-none font-bold" onClick={() => setSelectedSupplier(null)}>
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
