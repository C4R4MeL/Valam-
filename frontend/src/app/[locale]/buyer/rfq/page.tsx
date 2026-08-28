'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Link } from '@/i18n/routing'
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Inbox, 
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
  ArrowLeft,
  UserCheck,
  FileText,
  FileCheck,
  Handshake,
  FileSearch,
  Pen,
  PartyPopper,
  ClipboardCheck,
  HelpCircle,
  Lock,
  AlertTriangle,
  Send,
  ListOrdered
} from 'lucide-react'
import { mockProducts, formatRupiah } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const COUNTRIES = [
  { code: 'FR', name: 'France (Perancis)' },
  { code: 'US', name: 'United States (Amerika Serikat)' },
  { code: 'DE', name: 'Germany (Jerman)' },
  { code: 'CH', name: 'Switzerland (Swiss)' },
  { code: 'SG', name: 'Singapore (Singapura)' },
  { code: 'NL', name: 'Netherlands (Belanda)' },
  { code: 'JP', name: 'Japan (Jepang)' },
  { code: 'IN', name: 'India (India)' },
  { code: 'GB', name: 'United Kingdom (Inggris)' },
]

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

function BuyerRfqContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const isId = locale === 'id'
  const { toast } = useToast()

  // ─── QUERY PARAMS ───────────────────────────────────────────────────
  const batchIdParam = searchParams.get('batch_id') || searchParams.get('product_id') || searchParams.get('product')
  const supplierIdParam = searchParams.get('supplier')
  const supplierNameParam = searchParams.get('supplier_name')
  const volumeParam = searchParams.get('volume') || searchParams.get('qty')
  const minPaParam = searchParams.get('minPa')
  const budgetParam = searchParams.get('budget')
  const moistureParam = searchParams.get('moisture')
  const tabParam = searchParams.get('tab')

  // Unified Tab: 'create' or 'history'
  const shouldDefaultToCreate = Boolean(batchIdParam || supplierIdParam || tabParam === 'create' || searchParams.get('new') === 'true')
  const [activeTab, setActiveTab] = useState<'create' | 'history'>(shouldDefaultToCreate ? 'create' : 'history')

  // ─── RFQ HISTORY STATE ──────────────────────────────────────────────
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null)

  const fetchRfqs = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${API_URL}/rfq/buyer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const json = await res.json()
        setRfqs(json.data || [])
      }
    } catch (err) {
      console.error("Failed to load RFQs:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchRfqs()
  }, [])

  // ─── CREATE FORM STATE ──────────────────────────────────────────────
  const [referencedBatch, setReferencedBatch] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [submittedRfq, setSubmittedRfq] = useState<{ rfq_number: string; created_at: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCoaGcmsDisabled = referencedBatch && (referencedBatch.status === 'VERIFIED' || referencedBatch.status === 'APPROVED')

  const [formData, setFormData] = useState({
    nama_perusahaan: '',
    negara_asal_buyer: '',
    pa_minimum: 30,
    moisture_maksimum: 3,
    volume_kg: 100,
    budget_min: 750000,
    budget_max: 950000,
    budget_currency: 'IDR' as 'IDR' | 'USD',
    timeline_pengiriman: '',
    catatan_khusus: '',
    dokumen_diminta: [] as string[]
  })

  // Pre-fill fields from query params
  useEffect(() => {
    if (batchIdParam) {
      const b = mockProducts.find(p => p.id === batchIdParam)
      if (b) {
        setReferencedBatch(b)
        const isVerified = b.status === 'VERIFIED' || b.status === 'APPROVED'
        setFormData(prev => ({
          ...prev,
          pa_minimum: b.pa_percentage || 30,
          moisture_maksimum: b.moisture || 3,
          budget_max: b.price_per_kg || 850000,
          catatan_khusus: isId 
            ? `Diajukan berdasarkan referensi Batch ${b.batch_code} dari ${b.supplier_name}.` 
            : `Submitted based on reference Batch ${b.batch_code} from ${b.supplier_name}.`,
          dokumen_diminta: isVerified ? ['CoA GC-MS'] : []
        }))
      }
    }
    if (supplierNameParam) {
      setFormData(prev => ({
        ...prev,
        catatan_khusus: prev.catatan_khusus || (isId ? `Ditujukan khusus untuk mitra: ${supplierNameParam}` : `Specifically targeted to supplier: ${supplierNameParam}`)
      }))
    }
    if (volumeParam) {
      setFormData(prev => ({ ...prev, volume_kg: Number(volumeParam) || 100 }))
    }
    if (minPaParam) {
      setFormData(prev => ({ ...prev, pa_minimum: Number(minPaParam) || 30 }))
    }
    if (budgetParam) {
      setFormData(prev => ({ ...prev, budget_max: Number(budgetParam) || 950000 }))
    }
    if (moistureParam) {
      setFormData(prev => ({ ...prev, moisture_maksimum: Number(moistureParam) || 3 }))
    }
  }, [batchIdParam, supplierNameParam, volumeParam, minPaParam, budgetParam, moistureParam, isId])

  const toggleDocument = (docName: string) => {
    if (docName === 'CoA GC-MS' && isCoaGcmsDisabled) return

    setFormData(prev => {
      const docs = prev.dokumen_diminta.includes(docName)
        ? prev.dokumen_diminta.filter(d => d !== docName)
        : [...prev.dokumen_diminta, docName]
      return { ...prev, dokumen_diminta: docs }
    })
  }

  const validateStep1 = () => {
    if (!formData.nama_perusahaan.trim()) {
      toast({
        title: isId ? 'Informasi Kurang' : 'Missing Info',
        description: isId ? 'Mohon masukkan nama perusahaan/institusi Anda.' : 'Please enter your company/institution name.',
        variant: 'destructive'
      })
      return false
    }
    if (!formData.negara_asal_buyer.trim()) {
      toast({
        title: isId ? 'Informasi Kurang' : 'Missing Info',
        description: isId ? 'Mohon pilih negara asal buyer.' : 'Please select buyer origin country.',
        variant: 'destructive'
      })
      return false
    }
    if (Number(formData.volume_kg) < 100) {
      toast({
        title: isId ? 'Volume Terlalu Kecil' : 'Volume Too Low',
        description: isId ? 'Volume ekspor minimum adalah 100 kg.' : 'Minimum export volume is 100 kg.',
        variant: 'destructive'
      })
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (Number(formData.budget_max) < Number(formData.budget_min)) {
      toast({
        title: isId ? 'Rentang Anggaran Tidak Valid' : 'Invalid Budget Range',
        description: isId ? 'Anggaran maksimum tidak boleh lebih kecil dari anggaran minimum.' : 'Maximum budget cannot be less than minimum budget.',
        variant: 'destructive'
      })
      return false
    }
    if (!formData.timeline_pengiriman) {
      toast({
        title: isId ? 'Target Timeline Diperlukan' : 'Target Timeline Required',
        description: isId ? 'Pilih target waktu pengiriman kargo Anda.' : 'Select your desired cargo delivery timeline.',
        variant: 'destructive'
      })
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmitRfq = async () => {
    if (!confirmChecked) {
      toast({
        title: isId ? 'Konfirmasi Diperlukan' : 'Confirmation Required',
        description: isId ? 'Harap centang kotak persetujuan integritas data sebelum mengirim.' : 'Please check the agreement box before submitting.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const payload = {
        nama_perusahaan: formData.nama_perusahaan,
        negara_asal_buyer: formData.negara_asal_buyer,
        pa_minimum: Number(formData.pa_minimum),
        moisture_maksimum: Number(formData.moisture_maksimum),
        volume_kg: Number(formData.volume_kg),
        budget_min: Number(formData.budget_min),
        budget_max: Number(formData.budget_max),
        budget_currency: formData.budget_currency,
        timeline_pengiriman: formData.timeline_pengiriman,
        catatan_khusus: formData.catatan_khusus,
        dokumen_diminta: formData.dokumen_diminta,
        referenced_batch_id: referencedBatch ? referencedBatch.id : null,
        target_supplier_id: supplierIdParam || null
      }

      const res = await fetch(`${API_URL}/rfq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mengirimkan RFQ')
      }

      const resData = await res.json()
      setSubmittedRfq({
        rfq_number: resData.data?.rfq_number || `RFQ-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString()
      })

      toast({
        title: isId ? 'RFQ Berhasil Diterbitkan!' : 'RFQ Successfully Published!',
        description: isId 
          ? 'Tim logistik dan perdagangan Valam akan segera memproses permintaan Anda.' 
          : 'Valam logistics and compliance specialists will review your request shortly.'
      })

      // Refresh RFQ list in background
      fetchRfqs()

    } catch (err: any) {
      toast({
        title: isId ? 'Gagal Mengirim RFQ' : 'RFQ Submission Failed',
        description: err.message || (isId ? 'Terjadi kesalahan sistem.' : 'A system error occurred.'),
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setStep(1)
    setSubmittedRfq(null)
    setConfirmChecked(false)
    setFormData({
      nama_perusahaan: '',
      negara_asal_buyer: '',
      pa_minimum: 30,
      moisture_maksimum: 3,
      volume_kg: 100,
      budget_min: 750000,
      budget_max: 950000,
      budget_currency: 'IDR',
      timeline_pengiriman: '',
      catatan_khusus: '',
      dokumen_diminta: []
    })
  }

  // ─── STATUS BADGE HELPER ────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
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
        title: isId ? "Penawaran Diterima!" : "Offer Accepted!",
        description: isId ? "Menghubungkan ke kontak resmi koperasi..." : "Connecting to official cooperative contact..."
      })

      let phone = rfq.supplier?.profile?.phone || rfq.supplier?.supplier_profile?.whatsapp || '6281234567890'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ─── PAGE HEADER & UNIFIED TABS ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            {isId ? 'Request for Quotation (RFQ)' : 'Request for Quotation (RFQ)'}
          </h1>
          <p className="text-zinc-550 text-sm mt-1">
            {isId 
              ? 'Ajukan spesifikasi pesanan khusus ke jaringan produsen nilam dan pantau status negosiasi secara terpusat.' 
              : 'Submit custom order specifications to producer networks and track negotiations in one place.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-white text-[#1A4D2E] shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isId ? 'Ajukan RFQ Baru' : 'Create New RFQ'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'history'
                ? 'bg-white text-[#1A4D2E] shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{isId ? 'Riwayat RFQ Saya' : 'My RFQs'}</span>
            {rfqs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {rfqs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: CREATE RFQ FORM ───────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {submittedRfq ? (
            /* SUCCESS SUBMISSION CARD */
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-emerald-200 p-8 shadow-sm text-center space-y-6 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-800 shadow-sm border border-emerald-100">
                <PartyPopper className="w-8 h-8 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-black text-[#1A4D2E]">
                  {isId ? 'RFQ Berhasil Diterbitkan!' : 'RFQ Successfully Submitted!'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {isId 
                    ? 'Spesifikasi kargo Anda telah tercatat dan sedang dalam tinjauan tim audit Valam.'
                    : 'Your cargo specifications have been recorded and are under review by the Valam team.'}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4.5 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">No. Referensi</span>
                  <span className="font-mono font-black text-sm text-[#1A4D2E]">{submittedRfq.rfq_number}</span>
                </div>
                <div className="border-t border-zinc-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Perusahaan</span>
                  <span className="font-bold text-zinc-800">{formData.nama_perusahaan}</span>
                </div>
                <div className="border-t border-zinc-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Volume Target</span>
                  <span className="font-bold text-zinc-800">{formData.volume_kg.toLocaleString()} kg</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setActiveTab('history')}
                  className="flex-1 bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{isId ? 'Lihat di Riwayat RFQ' : 'View in RFQ History'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetForm}
                  className="flex-1 border-zinc-200 text-zinc-650 h-11 rounded-xl text-xs font-semibold"
                >
                  {isId ? 'Ajukan RFQ Lain' : 'Create Another RFQ'}
                </Button>
              </div>
            </div>
          ) : (
            /* WIZARD FORM */
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 shadow-sm">
              
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto border-b border-zinc-150 pb-5">
                {[
                  { num: 1, label: isId ? 'Spesifikasi Mutu' : 'Quality Specs' },
                  { num: 2, label: isId ? 'Volume & Anggaran' : 'Volume & Budget' },
                  { num: 3, label: isId ? 'Logistik & Legalitas' : 'Docs & Shipping' },
                  { num: 4, label: isId ? 'Konfirmasi' : 'Review' }
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.num 
                        ? 'bg-[#1A4D2E] text-white shadow-md' 
                        : step > s.num 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className={`text-xs hidden sm:inline font-semibold ${step === s.num ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Nama Perusahaan / Institusi' : 'Company / Institution Name'} *
                      </label>
                      <input
                        type="text"
                        value={formData.nama_perusahaan}
                        onChange={(e) => setFormData({ ...formData, nama_perusahaan: e.target.value })}
                        placeholder="e.g. L'Aromatique Essences Ltd"
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Negara Asal Buyer' : 'Destination Country'} *
                      </label>
                      <select
                        value={formData.negara_asal_buyer}
                        onChange={(e) => setFormData({ ...formData, negara_asal_buyer: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20 bg-white"
                      >
                        <option value="">{isId ? '-- Pilih Negara --' : '-- Select Country --'}</option>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Minimal Patchouli Alcohol (PA%)' : 'Min. Patchouli Alcohol (PA%)'}
                      </label>
                      <input
                        type="number"
                        min="28"
                        max="40"
                        value={formData.pa_minimum}
                        onChange={(e) => setFormData({ ...formData, pa_minimum: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <span className="text-[11px] text-zinc-400 block">Standard Ekspor: 30% - 34%</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Maksimal Kadar Air (%)' : 'Max. Moisture Content (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="5"
                        value={formData.moisture_maksimum}
                        onChange={(e) => setFormData({ ...formData, moisture_maksimum: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <span className="text-[11px] text-zinc-400 block">SNI & ISO Target: &lt; 3.0%</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 px-6 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span>{isId ? 'Lanjut: Volume & Anggaran' : 'Next: Volume & Budget'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Target Volume Permintaan (Kg)' : 'Target Volume (Kg)'} *
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={formData.volume_kg}
                        onChange={(e) => setFormData({ ...formData, volume_kg: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <span className="text-[11px] text-zinc-400 block">Min. order ekspor B2B: 100 Kg</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Timeline Kebutuhan' : 'Delivery Timeline'} *
                      </label>
                      <select
                        value={formData.timeline_pengiriman}
                        onChange={(e) => setFormData({ ...formData, timeline_pengiriman: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20 bg-white"
                      >
                        <option value="">{isId ? '-- Pilih Timeline --' : '-- Select Timeline --'}</option>
                        <option value="1_MONTH">{isId ? 'Dalam 1 Bulan' : 'Within 1 Month'}</option>
                        <option value="3_MONTHS">{isId ? 'Dalam 1 - 3 Bulan' : 'Within 1 - 3 Months'}</option>
                        <option value="CONTRACT_ANNUAL">{isId ? 'Kontrak Berkala (Tahunan)' : 'Annual Supply Contract'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Anggaran Maksimal / Kg (Rp)' : 'Max Budget / Kg (IDR)'}
                      </label>
                      <input
                        type="number"
                        step="10000"
                        value={formData.budget_max}
                        onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <span className="text-[11px] text-zinc-400 block">Estimasi: {formatRupiah(formData.budget_max)}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {isId ? 'Catatan / Preferensi Khusus' : 'Special Notes'}
                      </label>
                      <input
                        type="text"
                        value={formData.catatan_khusus}
                        onChange={(e) => setFormData({ ...formData, catatan_khusus: e.target.value })}
                        placeholder="e.g. Sertifikasi Rainforest Alliance"
                        className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      className="border-zinc-200 text-zinc-650 h-11 px-5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{isId ? 'Kembali' : 'Back'}</span>
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 px-6 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span>{isId ? 'Lanjut: Dokumen Ekspor' : 'Next: Documentation'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                      {isId ? 'Dokumen Kepatuhan & Ekspor yang Diperlukan' : 'Required Compliance Documents'}
                    </label>
                    <p className="text-xs text-zinc-500">
                      {isId 
                        ? 'Centang sertifikat resmi yang harus diverifikasi sebelum pengiriman kargo dilakukan:' 
                        : 'Select required official certifications prior to cargo shipment:'}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { name: 'CoA GC-MS', desc: 'Certificate of Analysis gas chromatography' },
                      { name: 'Sertifikat Halal', desc: 'BPJPH / MUI Halal Certification' },
                      { name: 'Phytosanitary', desc: 'Badan Karantina Pertanian Indonesia' },
                      { name: 'COO (Certificate of Origin)', desc: 'Surat Keterangan Asal (Form D/E/AK)' }
                    ].map((doc) => (
                      <button
                        key={doc.name}
                        type="button"
                        onClick={() => toggleDocument(doc.name)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          formData.dokumen_diminta.includes(doc.name)
                            ? 'bg-emerald-50 border-emerald-300 text-[#1A4D2E]'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                          formData.dokumen_diminta.includes(doc.name)
                            ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                            : 'border-zinc-300 bg-white'
                        }`}>
                          {formData.dokumen_diminta.includes(doc.name) && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-bold text-xs block">{doc.name}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5 block">{doc.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      className="border-zinc-200 text-zinc-650 h-11 px-5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{isId ? 'Kembali' : 'Back'}</span>
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 px-6 rounded-xl text-xs flex items-center gap-2"
                    >
                      <span>{isId ? 'Lanjut: Konfirmasi & Kirim' : 'Next: Review & Submit'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Perusahaan</span>
                      <span className="font-bold text-zinc-800">{formData.nama_perusahaan} ({formData.negara_asal_buyer})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Volume Permintaan</span>
                      <span className="font-bold text-zinc-800">{formData.volume_kg.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Kriteria Minyak</span>
                      <span className="font-bold text-zinc-800">Min. PA: {formData.pa_minimum}% | Maks. Air: {formData.moisture_maksimum}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-200">
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Anggaran Maksimal</span>
                      <span className="font-bold text-emerald-800">{formatRupiah(formData.budget_max)} / Kg</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Dokumen Diminta</span>
                      <span className="font-bold text-zinc-800">{formData.dokumen_diminta.join(', ') || '-'}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-300 text-emerald-800 focus:ring-emerald-700/20"
                    />
                    <span className="text-xs text-zinc-600 leading-relaxed">
                      {isId 
                        ? 'Saya menyatakan bahwa data spesifikasi dan kontak perusahaan yang diajukan adalah valid dan siap diproses dalam negosiasi kargo ekspor resmi.' 
                        : 'I confirm that the submitted specifications are valid and intended for formal B2B cargo negotiations.'}
                    </span>
                  </label>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="border-zinc-200 text-zinc-650 h-11 px-5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{isId ? 'Kembali' : 'Back'}</span>
                    </Button>
                    <Button
                      onClick={handleSubmitRfq}
                      disabled={isSubmitting || !confirmChecked}
                      className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 px-8 rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? (isId ? 'Mengirimkan...' : 'Submitting...') : (isId ? 'Kirimkan RFQ Resmi' : 'Submit Official RFQ')}</span>
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: MY RFQS HISTORY LIST ──────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="py-16 text-center text-xs font-semibold text-zinc-400">
              {isId ? 'Memuat daftar RFQ Anda...' : 'Loading your RFQs...'}
            </div>
          ) : rfqs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center shadow-sm max-w-xl mx-auto my-8">
              <div className="bg-zinc-50 p-4.5 rounded-full mb-4 border border-zinc-200">
                <Inbox className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-serif font-black text-[#1A4D2E] mb-2 uppercase tracking-wide">
                {isId ? 'Belum Ada RFQ yang Diajukan' : 'No Submitted RFQs'}
              </h3>
              <p className="text-zinc-500 text-xs max-w-md mb-6 leading-relaxed">
                {isId
                  ? 'Anda belum pernah mengirimkan spesifikasi ekspor B2B. Ajukan RFQ untuk mencocokkan dengan kargo koperasi Aceh terverifikasi.'
                  : 'No export requests submitted. Launch a Global RFQ to start automated matching workflows.'}
              </p>
              <Button 
                onClick={() => setActiveTab('create')}
                className="bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold rounded-xl shadow-md border-none px-6 py-2.5 text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isId ? 'Ajukan RFQ Sekarang' : 'Submit RFQ Now'}</span>
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

                return (
                  <div 
                    key={rfq.id} 
                    className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b border-zinc-150 pb-3 gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-[#1A4D2E] block">{rfq.rfq_number}</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">{formattedDate}</span>
                        </div>
                        {getStatusBadge(rfq.status)}
                      </div>

                      {/* Specs Summary */}
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">{isId ? 'Perusahaan' : 'Company'}</span>
                          <span className="font-bold text-zinc-800 text-xs block mt-0.5">{companyName}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 bg-zinc-50 rounded-xl border border-zinc-200 p-3 text-xs">
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold block uppercase">Volume</span>
                            <span className="font-bold text-zinc-800 block mt-0.5">{volume.toLocaleString()} Kg</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold block uppercase">Target PA</span>
                            <span className="font-bold text-emerald-800 block mt-0.5">≥ {paPercent}%</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold block uppercase">Destinasi</span>
                            <span className="font-bold text-zinc-800 block mt-0.5 truncate">{destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-2 border-t border-zinc-100 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRfq(rfq)}
                        className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold h-9 rounded-xl flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{isId ? 'Detail Negosiasi' : 'Negotiation Details'}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL DETAIL NEGOSIASI RFQ ────────────────────────────────── */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-zinc-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Detail Dokumen & Negosiasi</span>
                <h3 className="font-serif font-black text-lg text-[#1A4D2E]">{selectedRfq.rfq_number}</h3>
              </div>
              <button 
                onClick={() => setSelectedRfq(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Counter Offer details */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <span className="font-semibold text-zinc-600">Status Permohonan:</span>
                {getStatusBadge(selectedRfq.status)}
              </div>

              {/* Admin / Communication log */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-700 uppercase tracking-wider text-[10px] block">
                  {isId ? 'Catatan Tim Audit Ekspor' : 'Audit Logs'}
                </span>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  {(MOCK_ADMIN_LOGS[selectedRfq.status] || MOCK_ADMIN_LOGS.PENDING).map((log, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 text-[11px]">{log.sender}</span>
                        <span className="text-[10px] text-zinc-400">{log.time}</span>
                      </div>
                      <p className="text-zinc-650 leading-relaxed">{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons based on status */}
              {(selectedRfq.status === 'COUNTER_OFFER' || selectedRfq.status === 'DOCS_VERIFIED') && (
                <div className="flex gap-2.5 pt-2">
                  <Button
                    onClick={() => handleAcceptResponse(selectedRfq)}
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isId ? 'Terima & Lanjut ke WhatsApp' : 'Accept & Proceed via WhatsApp'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectResponse(selectedRfq.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold h-10 rounded-xl text-xs"
                  >
                    {isId ? 'Tolak' : 'Decline'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function UnifiedBuyerRfqPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
      </div>
    }>
      <BuyerRfqContent />
    </Suspense>
  )
}
