'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Link } from '@/i18n/routing'
import { 
  ArrowLeft, 
  HelpCircle, 
  Lock, 
  Check, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Globe, 
  Building2, 
  ChevronRight, 
  ChevronLeft,
  X,
  FileCheck,
  CheckCircle2,
  Handshake,
  FileSearch,
  Pen,
  PartyPopper,
  ClipboardCheck
} from 'lucide-react'
import { mockProducts, formatRupiah } from '@/lib/mock-data'

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

export default function GlobalRfqPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const isId = locale === 'id'
  const { toast } = useToast()

  // ─── QUERY PARAMS & BATCH REFERENCE ──────────────────────────────────
  const batchIdParam = searchParams.get('batch_id') || searchParams.get('product_id')
  const [referencedBatch, setReferencedBatch] = useState<any>(null)

  const isCoaGcmsDisabled = referencedBatch && (referencedBatch.status === 'VERIFIED' || referencedBatch.status === 'APPROVED')

  // ─── STEPPER STATE ──────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [submittedRfq, setSubmittedRfq] = useState<{ rfq_number: string; created_at: string } | null>(null)

  // ─── SINGLE FORM STATE OBJECT ──────────────────────────────────────
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

  // Pre-fill fields if product_id / batch_id is present in query parameters
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
  }, [batchIdParam, isId])

  // Check if any form fields have been modified to trigger warning modal on exit
  const isDirty = () => {
    return (
      formData.nama_perusahaan !== '' || 
      formData.negara_asal_buyer !== '' || 
      formData.catatan_khusus !== '' ||
      formData.timeline_pengiriman !== '' ||
      formData.dokumen_diminta.length > 0
    )
  }

  const handleBack = () => {
    if (isDirty()) {
      setShowExitConfirm(true)
    } else {
      router.back()
    }
  }

  const toggleDocument = (docName: string) => {
    if (docName === 'CoA GC-MS' && isCoaGcmsDisabled) return

    setFormData(prev => {
      const docs = prev.dokumen_diminta.includes(docName)
        ? prev.dokumen_diminta.filter(d => d !== docName)
        : [...prev.dokumen_diminta, docName]
      return { ...prev, dokumen_diminta: docs }
    })
  }

  // ─── STEP VALIDATION ───────────────────────────────────────────────
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
        description: isId ? 'Volume minimal pengiriman RFQ Global adalah 100 kg.' : 'Minimum cargo volume for Global RFQ is 100 kg.',
        variant: 'destructive'
      })
      return false
    }
    if (!formData.timeline_pengiriman) {
      toast({
        title: isId ? 'Informasi Kurang' : 'Missing Info',
        description: isId ? 'Mohon tentukan perkiraan timeline pengiriman.' : 'Please specify a shipping timeline date.',
        variant: 'destructive'
      })
      return false
    }
    if (Number(formData.budget_min) >= Number(formData.budget_max)) {
      toast({
        title: isId ? 'Rentang Harga Salah' : 'Invalid Price Range',
        description: isId ? 'Anggaran minimum harus lebih rendah dari anggaran maksimum.' : 'Minimum budget must be lower than maximum budget.',
        variant: 'destructive'
      })
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (formData.dokumen_diminta.length === 0) {
      toast({
        title: isId ? 'Dokumen Belum Dipilih' : 'No Documents Selected',
        description: isId 
          ? 'Mohon pilih minimal satu dokumen ekspor yang dibutuhkan.' 
          : 'Please select at least one required export document.',
        variant: 'destructive'
      })
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2)
    } else if (step === 2) {
      if (validateStep2()) setStep(3)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  // ─── SUBMIT RFQ ────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  
  const handleFormSubmit = async () => {
    if (!confirmChecked) {
      toast({
        title: isId ? 'Konfirmasi Diperlukan' : 'Confirmation Required',
        description: isId ? 'Mohon centang persetujuan sebelum mengirim RFQ.' : 'Please check the agreement before submitting.',
        variant: 'destructive'
      })
      return
    }
    setSubmitting(true)
    try {
      const email = localStorage.getItem('valam_email') || 'buyer@valam.id'
      const rfqNumber = 'RFQ-GLB-' + Math.floor(1000 + Math.random() * 9000)
      const createdAt = new Date().toISOString()
      const newRfq = {
        id: 'rfq_' + Math.random().toString(36).substring(2, 9),
        rfq_number: rfqNumber,
        created_at: createdAt,
        status: 'PENDING',
        type: 'GLOBAL_EXPORT',
        buyer_email: email,
        referenced_batch: referencedBatch ? referencedBatch.batch_code : null,
        data: formData
      }

      const existingRfqs = JSON.parse(localStorage.getItem('valam_rfqs') || '[]')
      existingRfqs.unshift(newRfq)
      localStorage.setItem('valam_rfqs', JSON.stringify(existingRfqs))

      // ─── SEND ADMIN NOTIFICATION (via existing notification system) ──
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
        const token = localStorage.getItem('valam_token')
        await fetch(`${API_URL}/notifications/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            type: 'NEW_GLOBAL_RFQ',
            rfq_number: rfqNumber,
            buyer_email: email,
            summary: {
              company: formData.nama_perusahaan,
              destination: formData.negara_asal_buyer,
              volume_kg: formData.volume_kg,
              pa_minimum: formData.pa_minimum,
              documents: formData.dokumen_diminta,
              referenced_batch: referencedBatch?.batch_code || null
            }
          })
        })
      } catch {
        // Admin notification is best-effort; don't block UX if backend is offline
        console.warn('[RFQ] Admin notification failed (backend may be offline)')
      }

      setSubmittedRfq({ rfq_number: rfqNumber, created_at: createdAt })
    } catch (err) {
      toast({
        title: 'Error',
        description: isId ? 'Gagal memproses RFQ.' : 'Failed to submit RFQ.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── TRUST INFO CONFIG (rendered in all steps, config-driven) ──────
  const RFQ_TRUST_INFO = [
    {
      title: isId ? 'Admin VALAM memfasilitasi negosiasi terstruktur' : 'VALAM admin facilitates structured negotiation',
      icon: <Handshake className="w-4 h-4 text-[#1A4D2E]" />
    },
    {
      title: isId ? 'Dokumen ekspor diverifikasi sebelum pengiriman' : 'Export documents verified before shipment',
      icon: <FileSearch className="w-4 h-4 text-[#1A4D2E]" />
    },
    {
      title: isId ? 'Data dijamin aman' : 'Your data is guaranteed secure',
      icon: <Lock className="w-4 h-4 text-[#1A4D2E]" />
    }
  ]

  const TRUST_CARDS = [
    {
      title: isId ? 'Jaminan Escrow Aman' : 'Escrow Secure Guarantee',
      desc: isId 
        ? 'Dana pembayaran ditahan di rekening bersama VALAM hingga dokumen & batch ekspor lolos verifikasi pabean.' 
        : 'Payment funds are held securely in VALAM escrow until documentation and cargo clear customs.',
      icon: <Lock className="w-5 h-5 text-emerald-700 shrink-0" />
    },
    {
      title: isId ? 'Audit Mutu Lab KAN' : 'KAN Lab Quality Audit',
      desc: isId 
        ? 'Setiap batch diuji ulang menggunakan kromatografi GC-MS di laboratorium terakreditasi untuk menjamin kemurnian PA.' 
        : 'Every batch is re-tested using GC-MS in accredited labs to guarantee authentic PA composition.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
    },
    {
      title: isId ? 'Fasilitasi Ekspor Terpadu' : 'Integrated Export Handling',
      desc: isId 
        ? 'Admin VALAM mengurus penuh perizinan pabean, sertifikat fitosanitasi, MSDS, dan verifikasi regulasi EUDR.' 
        : 'VALAM administrators handle custom declarations, phytosanitary certificates, MSDS, and EUDR compliance audits.',
      icon: <FileCheck className="w-5 h-5 text-emerald-700 shrink-0" />
    }
  ]

  const stepsInfo = [
    { num: 1, label: isId ? 'Spesifikasi' : 'Specifications', desc: isId ? 'Parameter teknis minyak' : 'Chemical target values' },
    { num: 2, label: isId ? 'Dokumen' : 'Documents', desc: isId ? 'Persyaratan berkas ekspor' : 'Required export documents' },
    { num: 3, label: isId ? 'Konfirmasi' : 'Confirmation', desc: isId ? 'Tinjau & ajukan RFQ' : 'Review and submit' }
  ]

  // ─── SUCCESS CONFIRMATION STATE ────────────────────────────────────
  if (submittedRfq) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E] px-4">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-md p-8 lg:p-12 max-w-lg w-full text-center space-y-6 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#1A4D2E] flex items-center justify-center mx-auto">
            <PartyPopper className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
              {isId ? 'RFQ Global Berhasil Diajukan!' : 'Global RFQ Successfully Submitted!'}
            </h1>
            <p className="text-zinc-500 text-xs leading-relaxed">
              {isId 
                ? 'Spesifikasi ekspor Anda telah diteruskan ke admin VALAM untuk pencocokan dengan koperasi produsen terpercaya.'
                : 'Your export specifications have been forwarded to VALAM admin for matching with verified cooperatives.'}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{isId ? 'Nomor Referensi' : 'Reference Number'}</span>
              <span className="font-mono font-black text-sm text-[#1A4D2E]">{submittedRfq.rfq_number}</span>
            </div>
            <div className="border-t border-zinc-200" />
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{isId ? 'Tanggal Pengajuan' : 'Submitted'}</span>
              <span className="font-bold text-zinc-800 text-xs">{new Date(submittedRfq.created_at).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="border-t border-zinc-200" />
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{isId ? 'Perusahaan' : 'Company'}</span>
              <span className="font-bold text-zinc-800 text-xs">{formData.nama_perusahaan}</span>
            </div>
            <div className="border-t border-zinc-200" />
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{isId ? 'Volume Target' : 'Volume'}</span>
              <span className="font-bold text-zinc-800 text-xs">{formData.volume_kg.toLocaleString()} kg</span>
            </div>
            <div className="border-t border-zinc-200" />
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Status</span>
              <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {isId ? 'Menunggu Review Admin' : 'Pending Admin Review'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/dashboard/buyer/rfq"
              className="w-full bg-[#1A4D2E] hover:bg-[#123320] text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider no-underline"
            >
              <ClipboardCheck className="w-4 h-4" />
              {isId ? 'Lihat Status RFQ Saya' : 'View My RFQ Status'}
            </Link>
            <Link
              href="/"
              className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold py-3 rounded-xl border border-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-xs no-underline"
            >
              {isId ? 'Kembali ke Beranda' : 'Return to Home'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E]">
      
      {/* ─── DESKTOP HEADER & BREADCRUMB ───────────────────────────────── */}
      <div className="hidden lg:block bg-white border-b border-zinc-200 py-5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold mb-2">
              <Link href="/" className="hover:text-[#1A4D2E] transition-colors">{isId ? 'Beranda' : 'Home'}</Link>
              <span>&gt;</span>
              <Link href="/dashboard/buyer/rfq" className="hover:text-[#1A4D2E] transition-colors">{isId ? 'RFQ Saya' : 'My RFQs'}</Link>
              <span>&gt;</span>
              <span className="text-zinc-800 font-bold">{isId ? 'Ajukan RFQ Global' : 'Submit Global RFQ'}</span>
            </div>
            <h1 className="text-2xl font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
              {isId ? 'Formulir RFQ Global & Ekspor' : 'Global RFQ & Export Form'}
            </h1>
            <p className="text-zinc-550 text-xs">
              {isId 
                ? 'Atur spesifikasi teknis dan kebutuhan dokumen ekspor untuk dicocokkan dengan produsen atsiri terpercaya.' 
                : 'Set chemical criteria and documentation requirements to match with certified essential oil cooperatives.'}
            </p>
          </div>
          
          <button 
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-zinc-650 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all shadow-3xs"
          >
            <HelpCircle className="w-4 h-4 text-valam-gold" />
            <span>{isId ? 'Panduan Proses B2B' : 'B2B Process Guide'}</span>
          </button>
        </div>
      </div>

      {/* ─── MOBILE FIXED HEADER ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A4D2E] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <button 
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20 transition-all border-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-serif font-black text-sm uppercase tracking-wider text-valam-gold-300">
          {isId ? 'Ajukan RFQ Global' : 'Submit Global RFQ'}
        </span>
        <button 
          onClick={() => setShowHelpModal(true)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20 transition-all border-none"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 pt-2 pb-32 lg:pt-4 lg:pb-16 mt-14 lg:mt-6">
        
        {/* Stepper Bar Container */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 border border-zinc-200 shadow-sm mb-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            
            {/* Background line for connector */}
            <div className="absolute top-4 lg:top-5 left-8 right-8 h-0.5 bg-zinc-200 -z-0" />
            
            {stepsInfo.map((s, idx) => {
              const isCompleted = step > s.num
              const isActive = step === s.num
              const isPending = step < s.num

              return (
                <div key={s.num} className="flex flex-col items-center text-center z-10 relative flex-1">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold text-xs lg:text-sm border-2 transition-all ${
                    isActive 
                      ? 'bg-white border-[#B69A1D] text-[#B69A1D] shadow-md shadow-valam-gold/25 scale-105' 
                      : isCompleted
                      ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                      : 'bg-zinc-50 border-zinc-250 text-zinc-400'
                  }`}>
                    {isCompleted ? <Check className="w-4.5 h-4.5 stroke-[3px]" /> : s.num}
                  </div>
                  
                  {/* Step labels */}
                  <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider mt-2 block ${
                    isActive ? 'text-[#B69A1D]' : isCompleted ? 'text-[#1A4D2E]' : 'text-zinc-450'
                  }`}>
                    {s.label}
                  </span>
                  
                  {/* Web detailed description */}
                  <span className="hidden lg:block text-[9px] text-zinc-400 mt-0.5 max-w-[120px] font-medium leading-tight">
                    {s.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── WEB TWO-COLUMN LAYOUT ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Form steps */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Pre-fill Context Alert Badge */}
            {referencedBatch && (
              <div className="bg-[#FAF6F0] border border-[#F5E6C4] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-3xs relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-valam-gold" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-valam-gold/15 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-valam-gold-700" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-valam-gold-800 uppercase tracking-widest block">
                      {isId ? 'Konteks Batch Rujukan' : 'Referenced Batch Context'}
                    </span>
                    <span className="font-mono font-black text-sm text-[#1A4D2E] block mt-0.5">
                      {referencedBatch.batch_code}
                    </span>
                    <span className="text-zinc-500 text-[10px] block leading-tight">
                      {isId 
                        ? `Spesifikasi awal terisi berdasarkan data dari ${referencedBatch.supplier_name}.` 
                        : `Default specs pre-filled from ${referencedBatch.supplier_name}'s metrics.`
                      }
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setReferencedBatch(null)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-200/50 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Accordion / Stacked Steps Container */}
            <div className="space-y-4">

              {/* ─── CARD STEP 1: SPESIFIKASI ──────────────────────────────────── */}
              <div className={`bg-white rounded-3xl border transition-all duration-300 ${
                step === 1 ? 'p-6 lg:p-8 border-[#1A4D2E] shadow-sm space-y-6' : 'p-5 border-zinc-200 bg-zinc-50/50'
              }`}>
                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-150 pb-3">
                      <h3 className="text-base font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
                        {isId ? '1. Spesifikasi Teknis & Kebutuhan Kargo' : '1. Cargo Technical Specifications'}
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Nama Perusahaan */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                          {isId ? 'Nama Perusahaan / Institution' : 'Company Name / Institution'}
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-pulse" />
                          <input
                            type="text"
                            required
                            value={formData.nama_perusahaan}
                            onChange={e => setFormData({ ...formData, nama_perusahaan: e.target.value })}
                            placeholder={isId ? 'cth. Givaudan SA' : 'e.g. Givaudan SA'}
                            className="w-full h-11 pl-10 pr-4 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all placeholder-zinc-500"
                          />
                        </div>
                      </div>

                      {/* Negara Asal Buyer */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                          {isId ? 'Negara Asal Buyer' : 'Buyer Origin Country'}
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
                          <select
                            required
                            value={formData.negara_asal_buyer}
                            onChange={e => setFormData({ ...formData, negara_asal_buyer: e.target.value })}
                            className="w-full h-11 pl-10 pr-10 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] appearance-none transition-all cursor-pointer"
                          >
                            <option value="" disabled className="text-zinc-500 bg-zinc-900">
                              {isId ? 'Pilih negara asal' : 'Select origin country'}
                            </option>
                            {COUNTRIES.map(c => (
                              <option key={c.code} value={c.name} className="text-white bg-zinc-900">
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-450 text-[10px]">
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sliders Kualitas (PA% & Moisture) */}
                    <div className="grid sm:grid-cols-2 gap-6 border-t border-zinc-100 pt-4">
                      {/* PA% Minimum */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                            {isId ? 'PA% Minimum yang Dibutuhkan' : 'Minimum PA% Required'}
                          </label>
                          <span className="text-2xl font-black text-[#1A4D2E]">{formData.pa_minimum}%</span>
                        </div>
                        <input 
                          type="range"
                          min="28"
                          max="40"
                          step="0.5"
                          value={formData.pa_minimum}
                          onChange={e => setFormData({ ...formData, pa_minimum: Number(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#1A4D2E]"
                        />
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase mt-1">
                          <span>28%</span>
                          <span>40%</span>
                        </div>
                      </div>

                      {/* Moisture Maksimum */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                            {isId ? 'Moisture Maksimum' : 'Maximum Moisture'}
                          </label>
                          <span className="text-2xl font-black text-[#1A4D2E]">{formData.moisture_maksimum}%</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={formData.moisture_maksimum}
                          onChange={e => setFormData({ ...formData, moisture_maksimum: Number(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#1A4D2E]"
                        />
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase mt-1">
                          <span>1%</span>
                          <span>5%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                      {/* Target Volume */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                          {isId ? 'Volume (kg)' : 'Volume (kg)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="100"
                            value={formData.volume_kg}
                            onChange={e => setFormData({ ...formData, volume_kg: Number(e.target.value) })}
                            placeholder={isId ? 'cth. 500' : 'e.g. 500'}
                            className="w-full h-11 pl-4 pr-12 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all placeholder-zinc-550"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 uppercase">Kg</span>
                        </div>
                        <span className="text-[10px] text-zinc-450 font-semibold block px-1">
                          {isId ? 'Min. 100kg' : 'Min. 100kg'}
                        </span>
                      </div>

                      {/* Timeline Pengiriman */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                          {isId ? 'Timeline Pengiriman' : 'Shipping Timeline'}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            value={formData.timeline_pengiriman}
                            onChange={e => setFormData({ ...formData, timeline_pengiriman: e.target.value })}
                            className="w-full h-11 px-4 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all cursor-pointer"
                          />
                          <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Rentang Anggaran (Budget Range) */}
                    <div className="space-y-3 border-t border-zinc-100 pt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                          {isId ? 'Budget Range' : 'Budget Range'}
                        </label>
                        <div className="flex gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                          {['Rp', 'USD'].map(curr => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => setFormData({ 
                                ...formData, 
                                budget_currency: (curr === 'Rp' ? 'IDR' : 'USD') as 'IDR' | 'USD',
                                budget_min: curr === 'USD' ? 50 : 750000,
                                budget_max: curr === 'USD' ? 65 : 950000
                              })}
                              className={`px-3 py-1 rounded-md text-[9px] font-black tracking-wider transition-all ${
                                (formData.budget_currency === 'IDR' ? 'Rp' : 'USD') === curr 
                                  ? 'bg-white text-[#1A4D2E] shadow-3xs' 
                                  : 'text-zinc-400'
                              }`}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Budget Min */}
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">MIN</span>
                          <input
                            type="number"
                            required
                            value={formData.budget_min}
                            onChange={e => setFormData({ ...formData, budget_min: Number(e.target.value) })}
                            className="w-full h-11 pl-12 pr-4 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all"
                          />
                        </div>
                        
                        {/* Budget Max */}
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">MAX</span>
                          <input
                            type="number"
                            required
                            value={formData.budget_max}
                            onChange={e => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                            className="w-full h-11 pl-12 pr-4 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Catatan Khusus */}
                    <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block">
                        {isId ? 'Catatan Khusus (opsional)' : 'Special Notes (optional)'}
                      </label>
                      <textarea
                        rows={3}
                        value={formData.catatan_khusus}
                        onChange={e => setFormData({ ...formData, catatan_khusus: e.target.value })}
                        placeholder={isId ? 'cth. Membutuhkan kemasan drum baja 200L' : 'e.g. Requires 200L steel drums packaging'}
                        className="w-full p-3.5 text-xs text-white bg-zinc-900 border border-zinc-800 rounded-xl focus:border-[#B69A1D] focus:ring-1 focus:ring-[#B69A1D] transition-all resize-none placeholder-zinc-550"
                      />
                    </div>

                    {/* Full-width Solid Green Button */}
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full bg-[#1A4D2E] hover:bg-[#123320] text-white font-black py-3.5 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 border-none mt-4 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <span>{isId ? 'Lanjut: Dokumen Ekspor →' : 'Continue: Export Documents →'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A4D2E] text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-sm">1. {isId ? 'Spesifikasi Kargo' : 'Cargo Specifications'}</h4>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {formData.nama_perusahaan || '-'} · {formData.negara_asal_buyer || '-'} · {formData.volume_kg} Kg · PA Min {formData.pa_minimum}%
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#1A4D2E] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      {isId ? 'Ubah' : 'Edit'}
                    </button>
                  </div>
                )}
              </div>

              {/* ─── CARD STEP 2: DOKUMEN EKSPOR ────────────────────────────────── */}
              <div className={`bg-white rounded-3xl border transition-all duration-300 ${
                step === 2 ? 'p-6 lg:p-8 border-[#1A4D2E] shadow-sm space-y-6' : 'p-5 border-zinc-200'
              } ${step < 2 ? 'bg-zinc-55/30 select-none opacity-60' : ''}`}>
                {step === 2 ? (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-150 pb-3">
                      <h3 className="text-base font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
                        {isId ? '2. Persyaratan Sertifikat & Dokumen Ekspor' : '2. Quality & Export Documentation Requirements'}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed -mt-2">
                      {isId 
                        ? 'Pilih berkas sertifikasi kepatuhan ekspor yang harus disediakan koperasi pengekspor. VALAM akan memoderasi kelayakan berkas:' 
                        : 'Choose standard certification compliance paperwork needed from suppliers. VALAM monitors file veritability:'
                      }
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { 
                          name: 'CoA GC-MS', 
                          label: isId ? 'Hasil Analisis GC-MS' : 'GC-MS Certificate of Analysis', 
                          desc: isId 
                            ? 'Breakdown kadar kimia aktif (Patchouli Alcohol, Azulene, dll.)' 
                            : 'Chemical composition audit (Patchouli Alcohol, Azulene, etc.)',
                          detailText: isId
                            ? 'Laporan kromatografi gas spektrometri massa terperinci yang mencatat secara akurat persentase zat aktif seperti Patchouli Alcohol (PA), Azulene, dan Seychellene.'
                            : 'GC-MS chromatography report recording active organic compounds.'
                        },
                        { 
                          name: 'MSDS', 
                          label: 'MSDS (Safety Data Sheet)', 
                          desc: isId ? 'Dokumen penanganan logistik aman' : 'Material handling safety sheet',
                          detailText: isId
                            ? 'Dokumen keselamatan yang merinci sifat fisik, kimia, bahaya, penanganan aman, dan prosedur darurat untuk kargo minyak nilam ekspor.'
                            : 'Safety data detailing physical/chemical properties, handling, emergency protocols for patchouli oil shipment.'
                        },
                        { 
                          name: 'Certificate of Origin', 
                          label: 'Certificate of Origin (CoO)', 
                          desc: isId ? 'Bukti autentisitas terroir Aceh' : 'Terroir geographic origin certification',
                          detailText: isId
                            ? 'Sertifikat Keterangan Asal (SKA) yang membuktikan bahwa minyak nilam diproduksi asli dari wilayah geografis Aceh, Indonesia untuk keringanan tarif masuk pabean.'
                            : 'COO proving patchouli oil origin in Aceh, Indonesia for customs preference.'
                        },
                        { 
                          name: 'Phytosanitary', 
                          label: isId ? 'Sertifikat Fitosanitasi' : 'Phytosanitary Certificate', 
                          desc: isId ? 'Izin ekspor karantina tumbuhan' : 'Agriculture custom clearance cert',
                          detailText: isId
                            ? 'Sertifikat kesehatan tumbuhan yang diterbitkan oleh Badan Karantina Pertanian Indonesia untuk menjamin kargo bebas dari hama dan patogen berbahaya.'
                            : 'Phytosanitary certificate issued by agricultural quarantine agency assuring cargo is pest-free.'
                        }
                      ].map(doc => {
                        const isMandatory = doc.name === 'CoA GC-MS' && isCoaGcmsDisabled
                        const isSelected = formData.dokumen_diminta.includes(doc.name) || isMandatory
                        
                        return (
                          <div key={doc.name} className="space-y-2">
                            <div 
                              onClick={() => toggleDocument(doc.name)}
                              className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative flex items-start gap-3 select-none ${
                                isMandatory 
                                  ? 'border-emerald-700/60 bg-emerald-50/10 cursor-not-allowed opacity-80'
                                  : isSelected 
                                  ? 'border-[#1A4D2E] bg-emerald-50/20 cursor-pointer shadow-3xs' 
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isSelected ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white' : 'border-zinc-300 bg-zinc-50'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-900 text-xs block">{doc.label}</span>
                                  {isMandatory && (
                                    <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {isId ? 'Terverifikasi' : 'Verified'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 block mt-0.5">{doc.desc}</span>
                              </div>
                            </div>
                            
                            {/* Collapsible detail text container */}
                            <div className={`overflow-hidden transition-all duration-300 ${
                              isSelected ? 'max-h-24 opacity-100 mt-1' : 'max-h-0 opacity-0'
                            }`}>
                              <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl text-[10px] text-zinc-500 leading-relaxed italic">
                                {doc.detailText}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Stepper Navigation buttons footer for Step 2 */}
                    <div className="pt-4 border-t border-zinc-150 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-5 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 text-xs font-bold rounded-xl border border-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{isId ? 'Kembali' : 'Back'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-6 py-2.5 bg-[#1A4D2E] hover:bg-[#123320] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1 border-none cursor-pointer"
                      >
                        <span>{isId ? 'Lanjut: Konfirmasi →' : 'Continue: Confirm →'}</span>
                      </button>
                    </div>

                  </div>
                ) : step > 2 ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A4D2E] text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-sm">2. {isId ? 'Dokumen Ekspor' : 'Export Documents'}</h4>
                        <p className="text-zinc-550 text-xs mt-0.5">
                          {formData.dokumen_diminta.join(', ')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(2)}
                      className="text-xs font-bold text-[#1A4D2E] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      {isId ? 'Ubah' : 'Edit'}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center select-none opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-400 text-sm">2. {isId ? 'Dokumen Ekspor (Terkunci)' : 'Export Documents (Locked)'}</h4>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {isId ? 'Selesaikan spesifikasi teknis kargo terlebih dahulu.' : 'Complete technical specifications first.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {isId ? 'Belum Aktif' : 'Locked'}
                    </span>
                  </div>
                )}
              </div>

              {/* ─── CARD STEP 3: KONFIRMASI ───────────────────────────────────── */}
              <div className={`bg-white rounded-3xl border transition-all duration-300 ${
                step === 3 ? 'p-6 lg:p-8 border-[#1A4D2E] shadow-sm space-y-6' : 'p-5 border-zinc-200'
              } ${step < 3 ? 'bg-zinc-55/30 select-none opacity-60' : ''}`}>
                {step === 3 ? (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-150 pb-3">
                      <h3 className="text-base font-serif font-black text-[#1A4D2E] uppercase tracking-wide">
                        {isId ? '3. Tinjau & Konfirmasi Permintaan RFQ' : '3. Review & Submit Global Request'}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed -mt-2">
                      {isId 
                        ? 'Harap tinjau kembali data spesifikasi ekspor Anda sebelum mengajukan RFQ ke admin VALAM:' 
                        : 'Please verify all specifications target requirements before finalizing RFQ:'
                      }
                    </p>

                    {/* ─── REVIEW GROUP: Spesifikasi Teknis ──────────────── */}
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#1A4D2E] uppercase tracking-widest flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {isId ? 'Spesifikasi Teknis' : 'Technical Specifications'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-[10px] font-bold text-[#1A4D2E] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Pen className="w-3 h-3" />
                          {isId ? 'Edit' : 'Edit'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Nama Perusahaan' : 'Company Name'}</span>
                          <span className="font-bold text-zinc-800 block mt-0.5">{formData.nama_perusahaan}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Tujuan Ekspor' : 'Destination'}</span>
                          <span className="font-bold text-zinc-800 block mt-0.5">{formData.negara_asal_buyer}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Target Volume' : 'Volume'}</span>
                          <span className="font-bold text-zinc-800 block mt-0.5">{formData.volume_kg.toLocaleString()} Kg</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Timeline Pengiriman' : 'Shipping Timeline'}</span>
                          <span className="font-bold text-zinc-800 block mt-0.5">{formData.timeline_pengiriman || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">PA% Minimum</span>
                          <span className="font-bold text-[#1A4D2E] block mt-0.5">{formData.pa_minimum}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Moisture Maksimum' : 'Max Moisture'}</span>
                          <span className="font-bold text-[#1A4D2E] block mt-0.5">{formData.moisture_maksimum}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Batas Anggaran' : 'Budget Range'}</span>
                          <span className="font-bold text-zinc-800 block mt-0.5">
                            {formData.budget_currency === 'USD' 
                              ? `$${formData.budget_min} – $${formData.budget_max}` 
                              : `${formatRupiah(formData.budget_min)} – ${formatRupiah(formData.budget_max)}`
                            } / kg
                          </span>
                        </div>
                        {formData.catatan_khusus && (
                          <div className="col-span-2">
                            <span className="text-[9px] text-zinc-400 font-bold block uppercase">{isId ? 'Catatan Khusus' : 'Notes'}</span>
                            <p className="text-zinc-600 italic mt-0.5 leading-relaxed">"{formData.catatan_khusus}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ─── REVIEW GROUP: Dokumen Diminta ─────────────────── */}
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-[#1A4D2E] uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {isId ? 'Dokumen Diminta' : 'Requested Documents'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-[10px] font-bold text-[#1A4D2E] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Pen className="w-3 h-3" />
                          {isId ? 'Edit' : 'Edit'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.dokumen_diminta.map(doc => (
                          <span key={doc} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A4D2E] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3px]" />
                            {doc}
                          </span>
                        ))}
                        {formData.dokumen_diminta.length === 0 && (
                          <span className="text-xs text-zinc-400 italic">{isId ? 'Belum ada dokumen dipilih' : 'No documents selected'}</span>
                        )}
                      </div>
                    </div>

                    {/* ─── MANDATORY CONFIRMATION CHECKBOX ────────────────── */}
                    <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-zinc-200 hover:border-[#B69A1D]/50 bg-white cursor-pointer transition-all select-none">
                      <input
                        type="checkbox"
                        checked={confirmChecked}
                        onChange={e => setConfirmChecked(e.target.checked)}
                        className="w-5 h-5 rounded border-zinc-300 text-[#1A4D2E] accent-[#1A4D2E] mt-0.5 shrink-0 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-700 leading-relaxed">
                        {isId 
                          ? 'Saya memahami bahwa RFQ ini akan difasilitasi oleh Admin VALAM untuk proses negosiasi terstruktur dengan koperasi produsen nilam.'
                          : 'I understand that this RFQ will be facilitated by VALAM Admin for structured negotiation with patchouli producer cooperatives.'}
                      </span>
                    </label>

                    {/* ─── SUBMIT + BACK BUTTONS ──────────────────────────── */}
                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        onClick={handleFormSubmit}
                        disabled={submitting || !confirmChecked}
                        className={`w-full py-3.5 font-black rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 border-none text-xs uppercase tracking-wider cursor-pointer ${
                          confirmChecked
                            ? 'bg-[#1A4D2E] hover:bg-[#123320] text-white'
                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        {submitting 
                          ? (isId ? 'Mengirim...' : 'Submitting...') 
                          : (isId ? 'Ajukan RFQ Sekarang' : 'Submit RFQ Now')}
                        {!submitting && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl border border-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{isId ? 'Kembali ke Dokumen' : 'Back to Documents'}</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex justify-between items-center select-none opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-400 text-sm">3. {isId ? 'Tinjau & Konfirmasi (Terkunci)' : 'Review & Confirm (Locked)'}</h4>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {isId ? 'Pilih berkas sertifikasi ekspor yang dipersyaratkan.' : 'Select required export certification files first.'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {isId ? 'Belum Aktif' : 'Locked'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── TRUST INFO LIST (visible in all steps) ──────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2.5">
              {RFQ_TRUST_INFO.map((info, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    {info.icon}
                  </div>
                  <span className="text-[11px] text-zinc-600 font-medium leading-snug">{info.title}</span>
                </div>
              ))}
            </div>

          </div>


          {/* Right panel: Summary Progress & Trust Cards (Desktop: sticky, Mobile: bottom stack) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Summary Progress Card */}
            <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm space-y-4">
              <div className="border-b border-zinc-150 pb-2">
                <h4 className="font-serif font-black text-xs text-[#1A4D2E] uppercase tracking-wider">
                  {isId ? 'Ringkasan RFQ Ekspor' : 'Export RFQ Summary'}
                </h4>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isId ? 'Volume Target:' : 'Target Volume:'}</span>
                  <span className="font-bold text-zinc-800">{formData.volume_kg ? `${formData.volume_kg.toLocaleString()} kg` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isId ? 'Timeline Kirim:' : 'Delivery target:'}</span>
                  <span className="font-bold text-zinc-800">{formData.timeline_pengiriman || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">PA% Min:</span>
                  <span className="font-bold text-[#1A4D2E]">{formData.pa_minimum}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Moisture Max:</span>
                  <span className="font-bold text-zinc-800">{formData.moisture_maksimum}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isId ? 'Batas Anggaran:' : 'Max Budget:'}</span>
                  <span className="font-bold text-zinc-800">
                    {formData.budget_currency === 'USD' ? `$${formData.budget_max}` : formatRupiah(formData.budget_max)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-3">
                  <span className="text-zinc-450">{isId ? 'Jumlah Dokumen:' : 'Requested docs:'}</span>
                  <span className="font-black text-[#1A4D2E]">{formData.dokumen_diminta.length} {isId ? 'Dokumen' : 'Files'}</span>
                </div>
              </div>
            </div>

            {/* B2B Trust Cards stack */}
            <div className="space-y-3">
              {TRUST_CARDS.map((tc, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-3xs flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-55 flex items-center justify-center shrink-0">
                    {tc.icon}
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-zinc-900 text-xs block">{tc.title}</span>
                    <span className="text-[10px] text-zinc-500 block leading-relaxed">{tc.desc}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </main>

      {/* ─── EXIT CONFIRMATION MODAL ────────────────────────────────────── */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-zinc-200 shadow-xl space-y-5 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-serif font-black text-emerald-950 text-base">
                {isId ? 'Ada Perubahan Belum Disimpan' : 'Unsaved Changes Present'}
              </h3>
              <p className="text-zinc-550 text-xs leading-relaxed">
                {isId 
                  ? 'Apakah Anda yakin ingin keluar dari pengisian RFQ? Data yang sudah dimasukkan akan hilang.' 
                  : 'Are you sure you want to exit the RFQ form? Any inputted information will be discarded.'
                }
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl border border-zinc-200 transition-colors border-none"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false)
                  router.back()
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors border-none"
              >
                {isId ? 'Tetap Keluar' : 'Exit Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HELP PROCESS MODAL ─────────────────────────────────────────── */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-zinc-200 shadow-xl space-y-5 relative animate-scale-in">
            <button 
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[#1A4D2E]">
                <HelpCircle className="w-5 h-5 text-valam-gold" />
                <h3 className="font-serif font-black text-base uppercase tracking-wide">
                  {isId ? 'Proses Pengajuan RFQ' : 'B2B RFQ Processing'}
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {isId ? 'Bagaimana alur kerja ekspor VALAM?' : 'Understanding VALAM logistics pipeline'}
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-650 leading-relaxed text-left max-h-96 overflow-y-auto pr-1">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                <span className="font-bold text-zinc-900 block mb-0.5">1. {isId ? 'Input Target Kargo' : 'Specify Cargo Target'}</span>
                <span>{isId ? 'Buyer menentukan minimum kadar PA%, target berat volume kargo, rentang penawaran harga, dan dokumen ekspor yang dibutuhkan.' : 'Specify chemical parameters, minimum PA percentages, delivery deadlines, and desired export certificates.'}</span>
              </div>
              
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                <span className="font-bold text-zinc-900 block mb-0.5">2. {isId ? 'Verifikasi Admin & Pencocokan' : 'Admin Audits & Supplier Match'}</span>
                <span>{isId ? 'Admin VALAM memverifikasi permintaan ekspor Anda lalu mencocokkannya ke koperasi petani tersertifikasi yang paling sesuai.' : 'VALAM managers audit your request and matches with verified farmers cooperatives holding corresponding digital CoA batches.'}</span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-150">
                <span className="font-bold text-zinc-900 block mb-0.5">3. {isId ? 'Negosiasi Kontrak & Escrow' : 'Contract Negotiation & Escrow'}</span>
                <span>{isId ? 'Setelah penawaran disepakati, kontrak jual-beli digital diterbitkan. Pembayaran disalurkan aman lewat escrow VALAM.' : 'Once cooperative accepts matching spec proposals, contracts are countersigned and B2B escrow secures the payment.'}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#1A4D2E] text-white font-bold py-3 rounded-xl hover:bg-[#123320] transition-colors border-none"
            >
              {isId ? 'Mengerti' : 'Understood'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
