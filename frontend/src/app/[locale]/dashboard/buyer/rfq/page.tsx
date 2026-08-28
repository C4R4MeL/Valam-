'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Inbox, 
  Plus, 
  Sparkles, 
  MessageSquare, 
  Check, 
  Eye, 
  X, 
  Calendar, 
  Globe, 
  Building2, 
  ShieldAlert, 
  Award,
  ArrowRight,
  UserCheck
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from 'next-intl'

import { DashboardHeader } from '@/components/layout/DashboardHeader'

// Config for mock admin communication history
const MOCK_ADMIN_LOGS: Record<string, Array<{ sender: string; time: string; message: string }>> = {
  PENDING: [
    { sender: 'Admin VALAM', time: '10 menit yang lalu', message: 'RFQ diterima oleh sistem. Kami sedang meninjau dokumen pabean ekspor yang Anda ajukan.' }
  ],
  NEGOTIATING: [
    { sender: 'Admin VALAM', time: '2 jam yang lalu', message: 'Dokumen ekspor awal disetujui. Kami telah mengirimkan spesifikasi ini ke Koperasi Serba Usaha Gayo Atsiri.' },
    { sender: 'Sistem VALAM', time: '1 jam yang lalu', message: 'Pemasok merespons penawaran. Menunggu verifikasi sisa stok batch.' }
  ],
  DOCS_VERIFIED: [
    { sender: 'Admin VALAM', time: '1 hari yang lalu', message: 'Hasil analisis GC-MS dan sertifikat asal (CoA & CoO) telah diverifikasi oleh surveyor pihak ketiga.' },
    { sender: 'Admin VALAM', time: '12 jam yang lalu', message: 'Dokumen ekspor disetujui secara resmi. Silakan lanjut ke langkah konfirmasi kontrak.' }
  ],
  COMPLETED: [
    { sender: 'Admin VALAM', time: '2 hari yang lalu', message: 'Transaksi selesai. Seluruh dokumen logistik ekspor telah diserahkan.' }
  ]
}

export default function BuyerRfqListPage() {
  const locale = useLocale()
  const isId = locale === 'id'
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null)
  const { toast } = useToast()

  const fetchRfqs = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${API_URL}/rfq/buyer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Gagal memuat RFQ')
      const json = await res.json()
      setRfqs(json.data)
    } catch (err: any) {
      console.warn("Backend offline, fetching RFQs from local storage:", err)
      const email = localStorage.getItem('valam_email') || 'buyer@valam.id'
      const allRfqs = JSON.parse(localStorage.getItem('valam_rfqs') || '[]')
      const filtered = allRfqs.filter((r: any) => r.buyer_email === email || r.buyerEmail === email || !r.buyer_email)
      setRfqs(filtered)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptResponse = async (rfq: any) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      await fetch(`${API_URL}/rfq/${rfq.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'ACCEPTED' })
      })

      toast({
        title: isId ? "Penawaran Disepakati" : "Agreement Finalized",
        description: isId ? "Mengarahkan ke WhatsApp untuk penyelesaian kontrak pembayaran B2B..." : "Redirecting to WhatsApp for B2B contract completion...",
      })

      let phone = rfq.supplier?.supplier_profile?.whatsapp || rfq.supplier?.profile?.phone || '628123456789'
      phone = phone.replace(/[^0-9]/g, '')
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1)
      }

      const volume = rfq.response?.proposed_volume_kg || rfq.data?.volume_kg || rfq.volume_kg || '100'
      const price = rfq.response?.proposed_price_per_kg || rfq.data?.budget_max || rfq.budget_per_kg || '850000'
      const message = `Halo ${rfq.supplier?.supplier_profile?.nama_koperasi || rfq.supplier?.profile?.company_name || 'Pemasok'}, saya ingin menindaklanjuti RFQ ${rfq.rfq_number} yang telah disepakati di Valam untuk volume ${volume} Kg dengan harga ${formatRupiah(Number(price))}/Kg. Silakan kirimkan instruksi pengiriman dan pembayaran.`
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      
      setTimeout(() => {
        window.open(url, '_blank')
        fetchRfqs()
      }, 800)
    } catch (err) {
      console.error("Failed to close RFQ as accepted:", err)
    }
  }

  const handleRejectResponse = async (rfqId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      await fetch(`${API_URL}/rfq/${rfqId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'REJECTED' })
      })

      toast({
        title: isId ? "Negosiasi Dihentikan" : "Negotiation Ended",
        description: isId ? "Anda telah menolak penawaran dari pemasok ini." : "You have rejected the offer from this supplier.",
        variant: "destructive"
      })
      fetchRfqs()
    } catch (err) {
      console.error("Failed to close RFQ as rejected:", err)
    }
  }

  useEffect(() => {
    fetchRfqs()
  }, [])

  const getStatusBadge = (status: string) => {
    // Aligned with proposal: Moderasi transaksi & sengketa
    switch(status) {
      case 'PENDING':
      case 'PENDING_ADMIN':
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50/85 font-black uppercase text-[9px] tracking-wider"><Clock className="w-3 h-3 mr-1"/> {isId ? 'Menunggu Admin' : 'Pending Admin'}</Badge>
      case 'NEGOTIATING':
      case 'SENT':
      case 'COUNTER_OFFER':
        return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50/85 font-black uppercase text-[9px] tracking-wider"><MessageSquare className="w-3 h-3 mr-1"/> {isId ? 'Sedang Dinegosiasikan' : 'Negotiating'}</Badge>
      case 'DOCS_VERIFIED':
      case 'VERIFIED':
        return <Badge className="bg-emerald-50 text-[#1A4D2E] border border-emerald-200 hover:bg-emerald-50/85 font-black uppercase text-[9px] tracking-wider"><UserCheck className="w-3 h-3 mr-1"/> {isId ? 'Dokumen Diverifikasi' : 'Docs Verified'}</Badge>
      case 'COMPLETED':
      case 'ACCEPTED':
        return <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-150 font-black uppercase text-[9px] tracking-wider"><CheckCircle2 className="w-3 h-3 mr-1"/> {isId ? 'Selesai' : 'Completed'}</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50/85 font-black uppercase text-[9px] tracking-wider"><XCircle className="w-3 h-3 mr-1"/> {isId ? 'Ditolak' : 'Rejected'}</Badge>
      default:
        return <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider">{status}</Badge>
    }
  }

  if (loading) return <div className="p-12 text-center text-xs font-bold text-zinc-550">{isId ? 'Memuat riwayat RFQ...' : 'Loading RFQs history...'}</div>

  return (
    <div className="w-full flex flex-col bg-zinc-50 min-h-screen">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 w-full min-h-[70vh]">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5 mb-8 gap-4 sm:gap-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
              {isId ? 'Riwayat RFQ Saya' : 'My Request for Quotations'}
            </h1>
            <p className="text-zinc-550 text-xs">
              {isId 
                ? 'Pantau kemajuan penawaran pabean, dokumen pabean ekspor, dan status negosiasi.' 
                : 'Monitor cargo specifications, compliance exports clearance audits, and negotiations.'}
            </p>
          </div>
          <Button asChild className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold rounded-xl shadow-md border-none flex items-center gap-1.5 h-11 px-5 text-xs">
            <Link href="/dashboard/buyer/rfq/new">
              <Plus className="w-4 h-4" />
              <span>{isId ? 'Ajukan RFQ Baru' : 'Submit New RFQ'}</span>
            </Link>
          </Button>
        </div>

        {rfqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-250 p-12 text-center flex flex-col items-center justify-center shadow-sm max-w-xl mx-auto my-8 animate-scale-in">
            <div className="bg-zinc-50 p-4.5 rounded-full mb-4.5 border border-zinc-200">
              <Inbox className="w-9 h-9 text-zinc-400" />
            </div>
            <h3 className="text-lg font-serif font-black text-[#1A4D2E] mb-2 uppercase tracking-wide">
              {isId ? 'Belum Ada RFQ yang Diajukan' : 'No Submitted RFQs'}
            </h3>
            <p className="text-zinc-500 text-xs max-w-md mb-6 leading-relaxed">
              {isId
                ? 'Anda belum pernah mengirimkan spesifikasi ekspor B2B. Ajukan RFQ untuk mencocokkan dengan kargo koperasi Aceh terverifikasi.'
                : 'No export requests submitted. Launch a Global RFQ to start automated matching workflows.'}
            </p>
            <Button asChild className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold rounded-xl shadow-md border-none px-6 py-3 text-xs">
              <Link href="/dashboard/buyer/rfq/new">
                <Plus className="w-4 h-4 mr-1.5" />
                {isId ? 'Ajukan RFQ Baru' : 'Submit New RFQ'}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {rfqs.map(rfq => {
              const rfqData = rfq.data || rfq
              const companyName = rfqData.nama_perusahaan || rfqData.company_name || 'Pemasok / Supplier'
              const volume = rfqData.volume_kg || rfq.volume_kg || 100
              const paPercent = rfqData.pa_minimum || rfq.min_pa_percentage || 30
              const destination = rfqData.negara_asal_buyer || rfq.destination || '-'
              const formattedDate = new Date(rfq.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
              const referencedBatch = rfq.referenced_batch || null

              return (
                <div 
                  key={rfq.id} 
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div className="space-y-4.5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between border-b border-zinc-150 pb-3 gap-2">
                      <div>
                        <span className="font-mono font-black text-xs text-[#1A4D2E] block">{rfq.rfq_number}</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{formattedDate}</span>
                      </div>
                      {getStatusBadge(rfq.status)}
                    </div>

                    {/* Specifications Summary */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Perusahaan' : 'Company'}</span>
                        <span className="font-bold text-zinc-800 text-xs block mt-0.5">{companyName}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-zinc-50/80 rounded-2xl border border-zinc-200 p-3.5 text-xs">
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">PA% Min</span>
                          <span className="font-black text-[#1A4D2E] block mt-0.5">{paPercent}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Volume' : 'Volume'}</span>
                          <span className="font-black text-zinc-800 block mt-0.5">{volume.toLocaleString()} Kg</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Tujuan' : 'Dest.'}</span>
                          <span className="font-black text-zinc-800 block mt-0.5 truncate">{destination}</span>
                        </div>
                      </div>
                    </div>

                    {referencedBatch && (
                      <div className="bg-[#FAF6F0] border border-[#F5E6C4] px-3.5 py-2 rounded-xl flex items-center justify-between text-[10px]">
                        <span className="text-[#1A4D2E] font-medium">{isId ? 'Referensi Batch:' : 'Referenced Batch:'}</span>
                        <span className="font-mono font-bold text-zinc-800">{referencedBatch}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-zinc-150 mt-5 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRfq(rfq)}
                      className="text-xs font-bold text-[#1A4D2E] hover:text-[#123320] flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                    >
                      <Eye className="w-4 h-4 text-[#B69A1D]" />
                      <span>{isId ? 'Lihat Detail RFQ' : 'View RFQ Details'}</span>
                    </button>
                    
                    <span className="text-zinc-350 text-[10px]">
                      {rfqData.dokumen_diminta?.length || 0} {isId ? 'Sertifikat' : 'Docs'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── READ-ONLY DETAILS MODAL ────────────────────────────────────── */}
      {selectedRfq && (() => {
        const rfqData = selectedRfq.data || selectedRfq
        const companyName = rfqData.nama_perusahaan || rfqData.company_name || '-'
        const destination = rfqData.negara_asal_buyer || selectedRfq.destination || '-'
        const volume = rfqData.volume_kg || selectedRfq.volume_kg || 100
        const paPercent = rfqData.pa_minimum || selectedRfq.min_pa_percentage || 30
        const moisture = rfqData.moisture_maksimum || selectedRfq.max_moisture || 3
        const timeline = rfqData.timeline_pengiriman || '-'
        const notes = rfqData.catatan_khusus || selectedRfq.notes || ''
        const documents = rfqData.dokumen_diminta || selectedRfq.dokumen_diminta || []
        const formattedDate = new Date(selectedRfq.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        
        // Fetch mock admin notes depending on the status of this RFQ
        const adminLogs = MOCK_ADMIN_LOGS[selectedRfq.status] || []

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-zinc-200 shadow-xl max-h-[85vh] overflow-y-auto relative space-y-6 animate-scale-in">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedRfq(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="border-b border-zinc-150 pb-4 pr-6 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-[#1A4D2E] text-base">{selectedRfq.rfq_number}</span>
                  {getStatusBadge(selectedRfq.status)}
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1">{isId ? 'Diajukan pada' : 'Submitted on'} {formattedDate}</span>
              </div>

              {/* Tech Specs Review Card */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4 text-left">
                <h4 className="text-[10px] font-black text-[#1A4D2E] uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-200/60 pb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {isId ? 'Spesifikasi Teknis Kargo' : 'Cargo Technical Specifications'}
                </h4>
                
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Nama Perusahaan' : 'Company Name'}</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Tujuan Ekspor' : 'Destination'}</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">{destination}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Volume Target' : 'Volume'}</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">{volume.toLocaleString()} Kg</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Timeline Pengiriman' : 'Timeline'}</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">{timeline}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase">PA% Minimum</span>
                    <span className="font-black text-[#1A4D2E] block mt-0.5">{paPercent}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Moisture Maksimum' : 'Max Moisture'}</span>
                    <span className="font-black text-[#1A4D2E] block mt-0.5">{moisture}%</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Batas Anggaran' : 'Budget Limit'}</span>
                    <span className="font-bold text-zinc-800 block mt-0.5">
                      {rfqData.budget_currency === 'USD' 
                        ? `$${rfqData.budget_min} – $${rfqData.budget_max}` 
                        : `${formatRupiah(rfqData.budget_min)} – ${formatRupiah(rfqData.budget_max)}`
                      } / kg
                    </span>
                  </div>
                  {notes && (
                    <div className="col-span-2">
                      <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Catatan Khusus' : 'Notes'}</span>
                      <p className="text-zinc-650 italic mt-1 bg-white border border-zinc-150 p-3 rounded-xl leading-relaxed">
                        "{notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Card */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3.5 text-left">
                <h4 className="text-[10px] font-black text-[#1A4D2E] uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-200/60 pb-2">
                  <FileText className="w-3.5 h-3.5" />
                  {isId ? 'Dokumen & Sertifikasi Ekspor' : 'Required Documents'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc: string) => (
                    <span key={doc} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-250 text-[#1A4D2E] font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Check className="w-3 h-3 stroke-[3px]" />
                      {doc}
                    </span>
                  ))}
                  {documents.length === 0 && (
                    <span className="text-xs text-zinc-400 italic">{isId ? 'Belum ada sertifikasi dipilih' : 'No documents requested'}</span>
                  )}
                </div>
              </div>

              {/* Admin Communication History Logs */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4 text-left">
                <h4 className="text-[10px] font-black text-[#1A4D2E] uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-200/60 pb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#B69A1D]" />
                  {isId ? 'Histori Tinjauan & Komunikasi Admin' : 'Admin Review Log & Feeback'}
                </h4>
                
                <div className="space-y-3">
                  {adminLogs.length > 0 ? (
                    adminLogs.map((log, index) => (
                      <div key={index} className="bg-white border border-zinc-150 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-[#1A4D2E] uppercase tracking-wider">{log.sender}</span>
                          <span className="text-zinc-400">{log.time}</span>
                        </div>
                        <p className="text-xs text-zinc-650 leading-relaxed font-semibold mt-0.5">
                          {log.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-3 text-xs text-zinc-400 italic">
                      {isId ? 'Menunggu verifikasi administrasi pertama.' : 'Awaiting initial moderation feedback.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button Footer */}
              <Button 
                onClick={() => setSelectedRfq(null)}
                className="w-full bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold py-3.5 rounded-xl border-none text-xs"
              >
                {isId ? 'Tutup Rincian' : 'Close Details'}
              </Button>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
