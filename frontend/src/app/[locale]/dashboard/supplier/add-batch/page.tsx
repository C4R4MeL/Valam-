'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, UploadCloud, MapPin, PackageOpen, AlertCircle, ShieldAlert, X, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Link } from '@/i18n/routing'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const contentMap = {
  id: {
    header: {
      title: "Tambah Batch Baru",
      desc: "Daftarkan hasil panen atau penyulingan terbaru Anda."
    },
    steps: {
      origin: "Informasi Asal",
      product: "Detail Produk",
      confirm: "Konfirmasi"
    },
    step1: {
      title: "Informasi Lahan & Panen",
      districtLabel: "Kabupaten Asal",
      districtPlaceholder: "Pilih Kabupaten...",
      villageLabel: "Desa / Kecamatan",
      villagePlaceholder: "Contoh: Pasi Mali, Woyla Barat",
      dateLabel: "Tanggal Suling (Estimasi)"
    },
    step2: {
      title: "Volume & Harga",
      volLabel: "Total Volume (Kg)",
      priceLabel: "Harga Jual per Kg (Rp)",
      photoLabel: "Foto Bukti Fisik / Drum",
      photoHint: "Klik untuk unggah foto",
      photoLimit: "PNG, JPG hingga 5MB"
    },
    step3: {
      title: "Tinjau & Kirim",
      summaryTitle: "Ringkasan Data Batch",
      loc: "Lokasi Asal",
      date: "Tanggal Suling",
      vol: "Volume",
      price: "Harga per Kg",
      info: "Setelah di-submit, batch ini akan masuk ke antrian Laboratorium. Anda",
      infoStrong: " wajib mengirimkan sampel 50ml ",
      infoEnd: "ke hub Valam untuk pengujian GC-MS sebelum produk aktif di etalase."
    },
    actions: {
      prev: "Kembali",
      next: "Lanjut",
      submit: "Submit Batch Baru"
    }
  },
  en: {
    header: {
      title: "Add New Batch",
      desc: "Register your latest harvest or distillation batch."
    },
    steps: {
      origin: "Origin Info",
      product: "Product Details",
      confirm: "Confirmation"
    },
    step1: {
      title: "Land & Harvest Info",
      districtLabel: "Origin District",
      districtPlaceholder: "Select District...",
      villageLabel: "Village / Subdistrict",
      villagePlaceholder: "e.g., Pasi Mali, Woyla Barat",
      dateLabel: "Distillation Date (Est.)"
    },
    step2: {
      title: "Volume & Price",
      volLabel: "Total Volume (Kg)",
      priceLabel: "Selling Price per Kg (IDR)",
      photoLabel: "Physical / Drum Photo Proof",
      photoHint: "Click to upload photo",
      photoLimit: "PNG, JPG up to 5MB"
    },
    step3: {
      title: "Review & Submit",
      summaryTitle: "Batch Data Summary",
      loc: "Origin Location",
      date: "Distillation Date",
      vol: "Volume",
      price: "Price per Kg",
      info: "After submission, this batch will enter the Laboratory queue. You",
      infoStrong: " must send a 50ml sample ",
      infoEnd: "to the Valam hub for GC-MS testing before the product becomes active on the storefront."
    },
    actions: {
      prev: "Back",
      next: "Next",
      submit: "Submit New Batch"
    }
  }
}

export default function AddBatchPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()

  const [verificationStatus, setVerificationStatus] = useState<'UNVERIFIED' | 'PENDING' | 'APPROVED'>('UNVERIFIED')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [verifyForm, setVerifyForm] = useState({
    npwp: '',
    nib: '',
    fileName: ''
  })

  // Photo Upload State
  const [photoName, setPhotoName] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: locale === 'id' ? 'Ukuran File Terlalu Besar' : 'File Too Large',
          description: locale === 'id' 
            ? 'Ukuran foto maksimal adalah 5MB.' 
            : 'Maximum photo size is 5MB.',
          variant: 'destructive',
        })
        return
      }
      setPhotoFile(file)
      setPhotoName(file.name)
    }
  }

  // Success Confirmation Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedBatchCode, setSubmittedBatchCode] = useState('')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
    }
  }

  const fetchProfileStatus = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me`, {
        headers: getAuthHeaders(),
      })

      if (res.status === 404) {
        setVerificationStatus('UNVERIFIED')
      } else if (res.ok) {
        const result = await res.json()
        const supplier = result.data
        
        // Map database status to verificationStatus
        if (supplier.status === 'TERVERIFIKASI' || supplier.status === 'LEGACY_VERIFIED') {
          setVerificationStatus('APPROVED')
        } else if (supplier.status === 'DALAM_VERIFIKASI') {
          setVerificationStatus('PENDING')
        } else {
          setVerificationStatus('UNVERIFIED')
        }

        setVerifyForm({
          npwp: supplier.npwp || '',
          nib: supplier.nib || '',
          fileName: ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch supplier profile status:', err)
      setVerificationStatus('UNVERIFIED')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('valam_token')
    if (!token) {
      router.push(`/${locale}/login`)
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'valam_token' && !e.newValue) {
        router.push(`/${locale}/login`)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    fetchProfileStatus()

    return () => window.removeEventListener('storage', handleStorageChange)
  }, [locale, router])
  
  // Form State
  const [formData, setFormData] = useState({
    origin_district: '',
    origin_village: '',
    production_date: '',
    volume: '',
  })

  const isStep1Valid = formData.origin_district.trim() !== '' && 
                       formData.origin_village.trim() !== '' && 
                       formData.production_date.trim() !== ''

  const isVolumeInvalid = formData.volume !== '' && (Number(formData.volume) <= 0 || isNaN(Number(formData.volume)))

  const isStep2Valid = formData.volume.trim() !== '' && 
                       !isVolumeInvalid &&
                       photoName.trim() !== ''

  const steps = [
    { id: 1, name: t.steps.origin, icon: MapPin },
    { id: 2, name: t.steps.product, icon: PackageOpen },
    { id: 3, name: t.steps.confirm, icon: CheckCircle2 },
  ]

  const handleNext = () => {
    if (verificationStatus !== 'APPROVED') return
    if (step === 1 && !isStep1Valid) return
    if (step === 2 && !isStep2Valid) return
    if (step < 3) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationStatus !== 'APPROVED' || !isStep1Valid || !isStep2Valid) return
    
    setSubmitting(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/products/batches`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_district: formData.origin_district,
          origin_village: formData.origin_village,
          total_volume_kg: parseFloat(formData.volume) || 0,
          images: photoName ? [`/uploads/batches/${photoName}`] : undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Gagal mendaftarkan batch baru.')
      }

      const result = await res.json()
      setSubmittedBatchCode(result.batch_code || '')
      setShowSuccessModal(true)

      toast({
        title: locale === 'id' ? 'Batch Berhasil Didaftarkan' : 'Batch Registered Successfully',
        description: locale === 'id' 
          ? 'Batch baru berhasil didaftarkan. Harap ikuti instruksi pengiriman sampel.' 
          : 'New batch successfully registered. Please follow the sample shipment instructions.',
      })
    } catch (err: any) {
      console.error('Failed to submit batch:', err)
      toast({
        title: locale === 'id' ? 'Pendaftaran Gagal' : 'Registration Failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadDocs = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyForm.npwp.trim() || !verifyForm.nib.trim() || !verifyForm.fileName) {
      alert(locale === 'id' ? 'Harap lengkapi semua isian dokumen.' : 'Please complete all document inputs.')
      return
    }

    const email = localStorage.getItem('valam_email') || 'supplier@valam.id'
    const companyName = localStorage.getItem('valam_user_company_' + email) || 'Koperasi Baru'

    // Save details to localStorage
    localStorage.setItem('valam_registered_npwp_' + email, verifyForm.npwp)
    localStorage.setItem('valam_registered_nib_' + email, verifyForm.nib)
    localStorage.setItem('valam_registered_doc_' + email, verifyForm.fileName)
    localStorage.setItem('valam_user_status_' + email, 'PENDING')

    // Append to admin pending supplier verification queue
    const existingPending = JSON.parse(localStorage.getItem('valam_pending_suppliers_list') || '[]')
    if (!existingPending.some((s: any) => s.email === email)) {
      existingPending.push({
        id: 'sup_' + Math.random().toString(36).substring(2, 9),
        name: companyName,
        email: email,
        doc: verifyForm.fileName,
        nib: verifyForm.nib,
        npwp: verifyForm.npwp,
        date: 'Hari ini',
        status: 'PENDING'
      })
      localStorage.setItem('valam_pending_suppliers_list', JSON.stringify(existingPending))
    }

    setVerificationStatus('PENDING')
    setShowModal(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-zinc-500">Memuat status verifikasi...</p>
      </div>
    )
  }

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col pb-20 relative">
      
      <DashboardHeader />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Case 1: UNVERIFIED (No documents uploaded yet) */}
      {verificationStatus === 'UNVERIFIED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-950 block mb-1">Akun Koperasi Belum Terverifikasi</span>
              Lengkapi NPWP & NIB Koperasi Anda sekarang untuk mengaktifkan fitur tambah batch.
            </div>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            size="sm" 
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold border-none rounded-xl shrink-0"
          >
            Lengkapi Dokumen Verifikasi
          </Button>
        </div>
      )}

      {/* Case 2: PENDING (Documents uploaded, awaiting admin review) */}
      {verificationStatus === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block mb-1">Mode Pratinjau Terbatas</span>
            Dokumen verifikasi sedang ditinjau Admin. Pengisian form terkunci sementara.
          </div>
        </div>
      )}

      {/* Progress Wizard Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const isCompleted = step > s.id
            const isCurrent = step === s.id
            
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm border-4 border-white
                  ${isCompleted ? 'bg-emerald-500 text-white' : 
                    isCurrent ? 'bg-emerald-100 text-emerald-700 border-emerald-100' : 
                    'bg-zinc-100 text-zinc-400'}
                `}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-emerald-800 font-bold' : 'text-zinc-500'}`}>
                  {s.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          
          {/* STEP 1: Asal */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">{t.step1.title}</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">{t.step1.districtLabel}</label>
                  <select 
                    disabled={verificationStatus !== 'APPROVED'}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed text-zinc-800 font-medium"
                    value={formData.origin_district}
                    onChange={(e) => setFormData({...formData, origin_district: e.target.value})}
                  >
                    <option value="">{t.step1.districtPlaceholder}</option>
                    <option value="Aceh Barat">Aceh Barat</option>
                    <option value="Aceh Selatan">Aceh Selatan</option>
                    <option value="Gayo Lues">Gayo Lues</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">{t.step1.villageLabel}</label>
                  <input 
                    disabled={verificationStatus !== 'APPROVED'}
                    type="text" 
                    placeholder={t.step1.villagePlaceholder}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    value={formData.origin_village}
                    onChange={(e) => setFormData({...formData, origin_village: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">{t.step1.dateLabel}</label>
                <input 
                  disabled={verificationStatus !== 'APPROVED'}
                  type="date" 
                  className="w-full sm:w-1/2 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  value={formData.production_date}
                  onChange={(e) => setFormData({...formData, production_date: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Detail Produk */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">{t.step2.title}</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">{t.step2.volLabel}</label>
                  <div className="relative">
                    <input 
                      disabled={verificationStatus !== 'APPROVED'}
                      type="number" 
                      placeholder="0"
                      className={`w-full bg-zinc-50 border rounded-lg p-3 pr-12 text-sm outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        isVolumeInvalid 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                          : 'border-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      }`}
                      value={formData.volume}
                      onChange={(e) => setFormData({...formData, volume: e.target.value})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">Kg</span>
                  </div>
                  {isVolumeInvalid && (
                    <p className="text-xs text-red-600 mt-1 font-semibold animate-in fade-in duration-300">
                      {locale === 'id' ? 'Volume harus berupa angka positif lebih besar dari 0 Kg' : 'Volume must be a positive number greater than 0 Kg'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">{t.step2.photoLabel}</label>
                <div className={`border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors group relative ${
                  verificationStatus !== 'APPROVED' ? 'bg-zinc-50 cursor-not-allowed opacity-60' : 'bg-zinc-50 hover:bg-zinc-100 cursor-pointer'
                }`}>
                  {verificationStatus === 'APPROVED' && (
                    <input 
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                  )}
                  
                  {photoName ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-emerald-800">{photoName}</p>
                      <p className="text-xs text-zinc-400 mt-1">Klik atau seret file baru untuk mengganti</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-emerald-700">{t.step2.photoHint}</p>
                      <p className="text-xs text-zinc-400 mt-1">{t.step2.photoLimit}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Konfirmasi */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">{t.step3.title}</h2>
               
               <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                 <h3 className="font-semibold text-emerald-900 mb-4">{t.step3.summaryTitle}</h3>
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                     <span className="text-emerald-700">{t.step3.loc}</span>
                     <span className="font-medium text-emerald-950">{(formData.origin_village || (verificationStatus !== 'APPROVED' ? 'Pasi Mali' : '')) || '-'}, {(formData.origin_district || (verificationStatus !== 'APPROVED' ? 'Aceh Barat' : '')) || '-'}</span>
                   </div>
                   <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                     <span className="text-emerald-700">{t.step3.date}</span>
                     <span className="font-medium text-emerald-950">{formData.production_date || (verificationStatus !== 'APPROVED' ? '2026-06-29' : '') || '-'}</span>
                   </div>
                   <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                     <span className="text-emerald-700">{t.step3.vol}</span>
                     <span className="font-medium text-emerald-950">{formData.volume || (verificationStatus !== 'APPROVED' ? '350' : '0')} Kg</span>
                   </div>
                    {photoName && (
                      <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                        <span className="text-emerald-700">{locale === 'id' ? 'Foto Bukti' : 'Photo Proof'}</span>
                        <span className="font-medium text-emerald-950">{photoName}</span>
                      </div>
                    )}
                 </div>
               </div>

               <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-600 flex gap-3">
                 <div className="mt-0.5 text-amber-500">
                   <CheckCircle2 className="w-5 h-5" />
                 </div>
                 <p>
                   {t.step3.info}<strong>{t.step3.infoStrong}</strong>{t.step3.infoEnd}
                 </p>
               </div>
            </div>
          )}

        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={step === 1}
            className="text-zinc-600 border-zinc-200"
          >
            {t.actions.prev}
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={handleNext} 
              disabled={verificationStatus !== 'APPROVED' || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              className={`text-white transition-all ${
                (verificationStatus !== 'APPROVED' || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid))
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-900 hover:bg-emerald-950'
              }`}
            >
              {t.actions.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              disabled={verificationStatus !== 'APPROVED' || !isStep1Valid || !isStep2Valid || submitting}
              onClick={handleSubmit} 
              className={`text-white shadow-md ${
                (verificationStatus !== 'APPROVED' || !isStep1Valid || !isStep2Valid || submitting)
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {locale === 'id' ? 'Mengirim...' : 'Submitting...'}
                </span>
              ) : t.actions.submit}
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* DOCUMENT UPLOAD MODAL DIALOG */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-serif text-emerald-950">Lengkapi Dokumen Verifikasi</h3>
                <p className="text-xs text-zinc-500 mt-1">Audit Keabsahan Hukum Koperasi Pemasok</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadDocs} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal_npwp" className="text-xs font-bold text-zinc-700">NPWP Koperasi (Nomor Pokok Wajib Pajak)</Label>
                <Input 
                  id="modal_npwp"
                  placeholder="00.000.000.0-000.000"
                  value={verifyForm.npwp}
                  onChange={(e) => setVerifyForm({...verifyForm, npwp: e.target.value})}
                  className="bg-white border-zinc-200 text-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal_nib" className="text-xs font-bold text-zinc-700">NIB Koperasi (Nomor Induk Berusaha)</Label>
                <Input 
                  id="modal_nib"
                  placeholder="Contoh: 1234567890123"
                  value={verifyForm.nib}
                  onChange={(e) => setVerifyForm({...verifyForm, nib: e.target.value})}
                  className="bg-white border-zinc-200 text-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-700">Upload Akta Pendirian / NIB (.pdf/.png/.jpg)</Label>
                <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 rounded-xl p-5 text-center cursor-pointer transition-colors relative">
                  <input 
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setVerifyForm({...verifyForm, fileName: file.name})
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UploadCloud className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-800">
                      {verifyForm.fileName ? `File: ${verifyForm.fileName}` : 'Klik untuk pilih file Akta Pendirian'}
                    </span>
                    <span className="text-[10px] text-zinc-400">Hingga batas maksimum 5MB</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className="w-1/2 border-zinc-250 text-zinc-700 rounded-xl"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="w-1/2 bg-emerald-700 hover:bg-emerald-850 text-white font-bold rounded-xl border-none"
                >
                  Kirim Dokumen
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-zinc-200 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <FlaskConical className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-emerald-950">Batch Berhasil Terdaftar!</h3>
              <p className="text-sm text-zinc-500">Berikut adalah petunjuk penting untuk mengirimkan sampel fisik Anda.</p>
            </div>

            {/* Batch Code Banner */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center">
              <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Kode Batch Anda</span>
              <span className="text-2xl font-mono font-bold text-emerald-900 tracking-wide select-all">{submittedBatchCode}</span>
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
                  <p className="text-zinc-500 text-xs mt-0.5">Tulis atau tempelkan label kode batch <strong className="font-mono text-emerald-950 font-bold">{submittedBatchCode}</strong> secara jelas pada botol menggunakan spidol permanen.</p>
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
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push(`/${locale}/dashboard/supplier`)
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-2xl border-none shadow-md shadow-emerald-100"
              >
                Saya Mengerti, Kembali ke Dashboard
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
