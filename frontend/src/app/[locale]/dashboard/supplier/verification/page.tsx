'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, UploadCloud, CheckCircle2, ArrowLeft, 
  Trash2, X, Clock, HelpCircle, AlertCircle, RefreshCw, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/routing'

const contentMap = {
  id: {
    title: "Verifikasi Dokumen Koperasi",
    subtitle: "Langkah 2: Lengkapi dokumen legalitas dan kepatuhan mutu.",
    back: "Kembali ke Dashboard",
    btnSubmit: "Kirim Berkas untuk Ulasan Admin",
    btnSubmitting: "Mengajukan...",
  },
  en: {
    title: "Cooperative Document Verification",
    subtitle: "Step 2: Complete legal compliance and quality documents.",
    back: "Back to Dashboard",
    btnSubmit: "Submit Files for Admin Review",
    btnSubmitting: "Submitting...",
  }
}

export default function SupplierVerificationPage() {
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadType, setUploadType] = useState<string>('AKTA_KOPERASI')
  const [tanggalCoa, setTanggalCoa] = useState<string>('')
  
  // Selected Draft File State (for PDF single files)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Selected 3 Facility Files State (for facility photos)
  const [facilityFiles, setFacilityFiles] = useState<(File | null)[]>([null, null, null])

  // Custom UI Visibility States
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [submittingVerification, setSubmittingVerification] = useState(false)

  // Ref to scroll to upload area
  const uploadFormRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
    }
  }

  const fetchProfile = async () => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me`, {
        headers: getAuthHeaders(),
      })

      if (res.status === 404) {
        toast({
          title: "Profil Belum Lengkap",
          description: "Selesaikan pengisian data profil koperasi terlebih dahulu.",
          variant: "destructive",
        })
        router.push(`/${locale}/dashboard/supplier`)
      } else if (res.ok) {
        const result = await res.json()
        setProfile(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch supplier profile:', err)
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
    fetchProfile()
  }, [locale, router])

  // Handle local file selection (does not upload immediately)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
  }

  // Handle actual upload action when user clicks "Unggah Sekarang"
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'

    // Scenario A: Foto Fasilitas (Requires 3 files)
    if (uploadType === 'FOTO_FASILITAS') {
      const selectedPhotos = facilityFiles.filter(Boolean)
      if (selectedPhotos.length < 3) {
        toast({
          title: "Foto Fasilitas Belum Lengkap",
          description: "Harap pilih ketiga foto fasilitas penyulingan terlebih dahulu.",
          variant: "destructive"
        })
        return
      }

      setUploadingDoc(true)
      try {
        // Upload each selected photo
        for (let i = 0; i < selectedPhotos.length; i++) {
          const file = selectedPhotos[i]!
          const formData = new FormData()
          formData.append('file', file)
          formData.append('tipeDocument', 'FOTO_FASILITAS')

          const res = await fetch(`${apiUrl}/suppliers/me/documents`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData,
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || `Gagal mengunggah Foto Fasilitas ke-${i + 1}`)
          }
        }

        toast({
          title: "Foto Fasilitas Diunggah",
          description: "Ketiga foto fasilitas berhasil diunggah ke sistem.",
        })

        // Clear files
        setFacilityFiles([null, null, null])
        fetchProfile()
      } catch (err: any) {
        toast({
          title: "Upload Gagal",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setUploadingDoc(false)
      }
      return
    }

    // Scenario B: Single Document Upload
    if (!selectedFile) {
      toast({
        title: "Pilih Berkas",
        description: "Silakan pilih file terlebih dahulu.",
        variant: "destructive"
      })
      return
    }

    if (uploadType === 'COA' && !tanggalCoa) {
      toast({
        title: "Tanggal COA Wajib",
        description: "Harap isi tanggal terbit sertifikat COA.",
        variant: "destructive"
      })
      return
    }

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('tipeDocument', uploadType)
      if (uploadType === 'COA' && tanggalCoa) {
        formData.append('tanggalCoa', tanggalCoa)
      }

      const res = await fetch(`${apiUrl}/suppliers/me/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengupload dokumen.')
      }

      toast({
        title: "Dokumen Berhasil Diunggah",
        description: `Berkas ${formatDocType(uploadType)} berhasil disimpan.`,
      })
      
      // Clear state
      setSelectedFile(null)
      setTanggalCoa('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      fetchProfile()
    } catch (err: any) {
      toast({
        title: "Upload Gagal",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me/documents/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menghapus dokumen.')
      }

      toast({
        title: "Dokumen Dihapus",
        description: "Dokumen berhasil dihapus dari sistem.",
      })
      fetchProfile()
    } catch (err: any) {
      toast({
        title: "Gagal Menghapus",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Handle Edit/Replace File trigger
  const handleReplaceTrigger = (tipeDoc: string) => {
    setShowUploadForm(true)
    setUploadType(tipeDoc)
    setSelectedFile(null)
    setFacilityFiles([null, null, null])
    if (fileInputRef.current) fileInputRef.current.value = ''
    
    // Smooth scroll to the upload form after React state updates render the form card
    setTimeout(() => {
      uploadFormRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    // Focus file selector
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 450)
  }

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me/submit-verification`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      const data = await res.json()
      if (!res.ok) {
        let errDesc = data.message
        if (data.errors && Array.isArray(data.errors)) {
          errDesc = (
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {data.errors.map((e: string, idx: number) => <li key={idx}>{e}</li>)}
            </ul>
          )
        }
        toast({
          title: "Validasi Gagal",
          description: errDesc,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Verifikasi Diajukan",
        description: "Berkas Anda telah dikirim ke Admin Valam untuk direview.",
      })
      router.push(`/${locale}/dashboard/supplier`)
    } catch (err: any) {
      toast({
        title: "Pengajuan Gagal",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSubmittingVerification(false)
    }
  }

  const formatDocType = (type: string) => {
    const map: Record<string, string> = {
      AKTA_KOPERASI: 'Akta Pendirian Koperasi + SK Kemenkop',
      COA: 'Certificate of Analysis (COA)',
      FOTO_FASILITAS: 'Foto Fasilitas Penyulingan',
      SURAT_PERNYATAAN: 'Surat Pernyataan Standar & SLA',
    }
    return map[type] || type
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500 font-semibold">Memuat berkas verifikasi...</p>
      </div>
    )
  }

  const isReadOnly = profile.status === 'DALAM_VERIFIKASI' || profile.status === 'TERVERIFIKASI'

  // Check if a document type is already uploaded
  const hasUploaded = (tipe: string) => {
    return profile.documents?.some((d: any) => d.tipe_document === tipe && d.status_dokumen !== 'REJECTED')
  }

  const isAktaUploaded = profile.documents?.some((d: any) => d.tipe_document === 'AKTA_KOPERASI' && d.status_dokumen !== 'REJECTED')
  const isCoaUploaded = profile.documents?.some((d: any) => d.tipe_document === 'COA' && d.status_dokumen !== 'REJECTED')
  const isStatementUploaded = profile.documents?.some((d: any) => d.tipe_document === 'SURAT_PERNYATAAN' && d.status_dokumen !== 'REJECTED')
  const facilityPhotosCount = profile.documents?.filter((d: any) => d.tipe_document === 'FOTO_FASILITAS' && d.status_dokumen !== 'REJECTED').length || 0
  const isFacilityPhotosUploaded = facilityPhotosCount >= 3

  const allRequirementsMet = isAktaUploaded && isCoaUploaded && isStatementUploaded && isFacilityPhotosUploaded

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Back to dashboard */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/supplier" className="inline-flex items-center gap-2 text-sm text-emerald-850 hover:text-emerald-955 font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          profile.status === 'TERVERIFIKASI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          profile.status === 'DALAM_VERIFIKASI' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          profile.status === 'LEGACY_VERIFIED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          Status Akun: {profile.status}
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-serif">{t.title}</h1>
        <p className="text-zinc-500 mt-1 text-sm">{t.subtitle}</p>
      </div>

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-blue-900 text-sm">Mode Pratinjau / Read-Only</h4>
            <p className="text-blue-700 text-xs leading-relaxed">
              Berkas Anda saat ini sedang ditinjau atau telah disetujui (**{profile.status}**). Berkas terkunci untuk mencegah manipulasi data selama proses kepatuhan.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Upload Documents Form & Uploaded Docs list */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Success Banner if All Requirements Met and upload form is not explicitly expanded */}
          {!isReadOnly && allRequirementsMet && !showUploadForm && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 text-sm">Semua Dokumen Persyaratan Wajib Lengkap!</h4>
                  <p className="text-emerald-800 text-xs leading-relaxed">
                    Anda telah mengunggah seluruh dokumen legalitas wajib (Akta Koperasi, COA, minimal 3 Foto Fasilitas, dan SLA). Silakan kirimkan berkas di panel kanan.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadForm(true)}
                className="border-emerald-600 text-emerald-800 hover:bg-emerald-100/50 rounded-xl text-xs font-semibold shrink-0"
              >
                Unggah Berkas Tambahan
              </Button>
            </div>
          )}

          {/* UPLOAD CONTAINER SECTION (Shown if not complete, or if manually expanded) */}
          {!isReadOnly && (!allRequirementsMet || showUploadForm) && (
            <div ref={uploadFormRef} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-emerald-955 font-serif">Unggah Dokumen Baru</h3>
                  <p className="text-xs text-zinc-500">Pilih jenis dokumen resmi dan berkas PDF/Image untuk dikirim.</p>
                </div>
                {allRequirementsMet && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUploadForm(false)}
                    className="text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 rounded-lg p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-700 font-semibold text-xs">Pilih Jenis Dokumen</Label>
                    <select 
                      value={uploadType} 
                      onChange={e => {
                        setUploadType(e.target.value)
                        setSelectedFile(null)
                        setFacilityFiles([null, null, null])
                      }}
                      className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-zinc-800"
                    >
                      <option value="AKTA_KOPERASI">Akta Koperasi + SK Kemenkop (PDF)</option>
                      <option value="COA">COA (Certificate of Analysis) Lab (PDF)</option>
                      <option value="FOTO_FASILITAS">Foto Fasilitas Penyulingan (JPG/PNG/WEBP)</option>
                      <option value="SURAT_PERNYATAAN">Surat Pernyataan Standar & SLA (PDF)</option>
                    </select>
                  </div>
                  
                  {uploadType === 'COA' && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <Label className="text-zinc-700 font-semibold text-xs">Tanggal COA Terbit</Label>
                      <Input 
                        type="date"
                        value={tanggalCoa}
                        onChange={e => setTanggalCoa(e.target.value)}
                        className="h-12 bg-white border-zinc-200"
                        required={uploadType === 'COA'}
                      />
                    </div>
                  )}
                </div>

                {/* File Input Selection Slots */}
                {uploadType === 'FOTO_FASILITAS' ? (
                  <div className="space-y-3">
                    <Label className="text-zinc-700 font-semibold text-xs block">Pilih 3 Foto Fasilitas Penyulingan (Wajib 3)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[0, 1, 2].map((idx) => (
                        <div 
                          key={idx} 
                          className="border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl p-4 text-center cursor-pointer transition-colors relative flex flex-col items-center justify-center gap-1.5 min-h-[140px]"
                        >
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setFacilityFiles(prev => {
                                const copy = [...prev]
                                copy[idx] = file
                                return copy
                              })
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploadingDoc}
                          />
                          <UploadCloud className="w-7 h-7 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-800 line-clamp-2 px-2">
                            {facilityFiles[idx] ? `Foto ${idx + 1}: ${facilityFiles[idx]!.name}` : `Pilih Foto ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-zinc-400">Klik untuk memilih</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* File Dropzone / Selector for single files */
                  <div className="border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingDoc}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UploadCloud className="w-8 h-8 text-emerald-700" />
                      <span className="text-sm font-semibold text-emerald-800">
                        {selectedFile ? `Berkas terpilih: ${selectedFile.name}` : 'Klik untuk memilih file'}
                      </span>
                      <span className="text-xs text-zinc-400">PDF untuk Akta/COA/Pernyataan. (Maks 5MB)</span>
                    </div>
                  </div>
                )}

                {/* Info replacement note */}
                {hasUploaded(uploadType) && (
                  <div className="bg-amber-50 border border-amber-250 p-3 rounded-xl flex gap-2 text-xs text-amber-800 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Catatan:</strong> Dokumen jenis <strong>{formatDocType(uploadType)}</strong> sudah pernah diunggah sebelumnya. Mengunggah file baru akan <strong>mengganti/menimpa</strong> berkas lama Anda di database secara otomatis.
                    </p>
                  </div>
                )}

                {/* Explicit Upload Action Buttons */}
                {((uploadType === 'FOTO_FASILITAS' && facilityFiles.some(Boolean)) || (uploadType !== 'FOTO_FASILITAS' && selectedFile)) && (
                  <div className="flex gap-2 justify-end pt-2 animate-in slide-in-from-top-4 duration-300">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedFile(null)
                        setFacilityFiles([null, null, null])
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="rounded-xl"
                    >
                      Urungkan
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-xl border-none shadow-sm flex items-center gap-2"
                      disabled={uploadingDoc || (uploadType === 'FOTO_FASILITAS' && facilityFiles.filter(Boolean).length < 3)}
                    >
                      {uploadingDoc ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Mengunggah...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> 
                          {uploadType === 'FOTO_FASILITAS' ? 'Unggah 3 Foto' : 'Unggah Sekarang'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* List of uploaded documents */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-zinc-800 font-serif">Daftar Dokumen Terunggah ({profile.documents?.length || 0})</h3>
            
            {profile.documents?.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-2xl bg-zinc-50/50 text-zinc-400 text-xs">
                Belum ada dokumen yang diunggah.
              </div>
            ) : (
              <div className="grid gap-3">
                {profile.documents?.map((doc: any) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 gap-3 hover:border-zinc-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-zinc-850">{formatDocType(doc.tipe_document)}</p>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-xs">{doc.file_name} ({(doc.file_size / 1024 / 1024).toFixed(2)} MB)</p>
                        {doc.tipe_document === 'COA' && doc.tanggal_coa && (
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Tanggal COA: {new Date(doc.tanggal_coa).toLocaleDateString()}</p>
                        )}
                        {doc.catatan_reviewer && (
                          <p className="text-[10px] text-rose-650 bg-rose-50 border border-rose-100 rounded px-2.5 py-1 mt-1.5 leading-relaxed">
                            💬 Catatan Masukan Admin: {doc.catatan_reviewer}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions on this uploaded document */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                        doc.status_dokumen === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        doc.status_dokumen === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        doc.status_dokumen === 'REVISION_REQUESTED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-zinc-100 text-zinc-650 border-zinc-200'
                      }`}>
                        {doc.status_dokumen}
                      </span>
                      
                      {!isReadOnly && (
                        <>
                          {/* EDIT / REPLACE BUTTON */}
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleReplaceTrigger(doc.tipe_document)}
                            className="border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[10px] py-1 h-7"
                          >
                            Ganti Berkas
                          </Button>
                          
                          <button 
                            onClick={() => setDeleteConfirmId(doc.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar: Rules & Submit */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-md font-bold text-emerald-955 font-serif">Persyaratan Verifikasi</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Sistem memindai kelengkapan berkas Anda secara otomatis:</p>
          </div>

          <div className="space-y-4">
            {[
              {
                name: 'Akta Pendirian + SK Kemenkop',
                done: profile.documents?.some((d: any) => d.tipe_document === 'AKTA_KOPERASI' && d.status_dokumen !== 'REJECTED'),
                desc: '1 file PDF asli'
              },
              {
                name: 'COA Lab Terakreditasi',
                done: profile.documents?.some((d: any) => d.tipe_document === 'COA' && d.status_dokumen !== 'REJECTED'),
                desc: 'Berusia kurang dari 180 hari (6 bulan)'
              },
              {
                name: 'Foto Fasilitas Penyulingan',
                done: (profile.documents?.filter((d: any) => d.tipe_document === 'FOTO_FASILITAS' && d.status_dokumen !== 'REJECTED').length || 0) >= 3,
                desc: `Minimal 3 foto (saat ini: ${profile.documents?.filter((d: any) => d.tipe_document === 'FOTO_FASILITAS' && d.status_dokumen !== 'REJECTED').length || 0} foto)`
              },
              {
                name: 'Surat Pernyataan Standar & SLA',
                done: profile.documents?.some((d: any) => d.tipe_document === 'SURAT_PERNYATAAN' && d.status_dokumen !== 'REJECTED'),
                desc: 'Ditandatangani Ketua Koperasi'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-normal">
                <div className="mt-0.5 shrink-0">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-[10px]">!</div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800">{item.name}</h4>
                  <p className="text-zinc-500 text-[10px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {!isReadOnly && (
            <div className="border-t border-zinc-100 pt-6 space-y-4">
              {!allRequirementsMet ? (
                <>
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex gap-2 text-xs text-rose-800 animate-in fade-in duration-300">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Tombol Kirim Terkunci:</strong> Harap unggah seluruh 4 dokumen persyaratan wajib di atas terlebih dahulu untuk mengajukan verifikasi.
                    </p>
                  </div>
                  <Button 
                    disabled
                    className="w-full bg-zinc-200 text-zinc-400 font-bold rounded-2xl py-6 border-none cursor-not-allowed"
                  >
                    Kirim Berkas (Belum Lengkap)
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleSubmitVerification}
                  className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-2xl py-6 border-none shadow-md shadow-emerald-800/20 animate-bounce-short"
                  disabled={submittingVerification}
                >
                  {submittingVerification ? t.btnSubmitting : t.btnSubmit}
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Custom Confirmation Modal for Deleting Documents */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-zinc-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto shrink-0">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-bold text-zinc-900 text-lg font-serif">Hapus Dokumen?</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Apakah Anda yakin ingin menghapus berkas ini? Anda perlu mengunggah ulang dokumen sejenis untuk melengkapi persyaratan verifikasi.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl font-semibold"
                onClick={() => setDeleteConfirmId(null)}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl border-none shadow-sm shadow-rose-500/10"
                onClick={() => {
                  handleDeleteDoc(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
