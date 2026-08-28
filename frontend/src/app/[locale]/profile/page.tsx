'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { 
  User, Building, FileText, Phone, MapPin, Save, Landmark, 
  Layers, Globe, ShieldCheck, Mail, Calendar, Edit3, Settings 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { role, email, isAuthenticated } = useAuthContext()
  const router = useRouter()
  const locale = useLocale() as 'id' | 'en'
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'bank'>('info')

  // Unified Form State for all roles
  const [buyerProfile, setBuyerProfile] = useState({
    company_name: '',
    legal_number: '',
    npwp: '',
    chairman_name: '',
    country: '',
    contact_person: '',
    phone: '',
    address: ''
  })

  const [supplierProfile, setSupplierProfile] = useState({
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
    kapasitasProduksi: 0,
    nomorRekening: '',
    namaBank: '',
    namaRekening: '',
    tahunBerdiri: '2020',
    jumlahAnggota: 15,
    minimumOrder: 10,
    durasiProduksi: '7-14 Hari',
    metodeDistilasi: 'Uap (Steam Distillation)',
    bahanBaku: '100% Daun Nilam Segar',
    website: '',
    gradeNilam: [] as string[]
  })

  const getHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchProfile = async () => {
    setLoading(true)
    const token = localStorage.getItem('valam_token')
    if (!token) {
      router.push('/login')
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      if (role === 'supplier') {
        const res = await fetch(`${apiUrl}/suppliers/me`, {
          headers: getHeaders()
        })
        if (res.ok) {
          const result = await res.json()
          const data = result.data
          if (data) {
            setSupplierProfile({
              namaKoperasi: data.nama_koperasi || '',
              nib: data.nib || '',
              npwp: data.npwp || '',
              namaPic: data.nama_pic || '',
              ktpPic: data.ktp_pic || '',
              whatsapp: data.whatsapp || '',
              alamatLengkap: data.alamat_lengkap || '',
              kabupaten: data.kabupaten || '',
              kecamatan: data.kecamatan || '',
              desa: data.desa || '',
              kapasitasProduksi: Number(data.kapasitas_produksi) || 0,
              nomorRekening: data.nomor_rekening || '',
              namaBank: data.nama_bank || '',
              namaRekening: data.nama_rekening || '',
              tahunBerdiri: data.tahun_berdiri || '2020',
              jumlahAnggota: Number(data.jumlah_anggota) || 15,
              minimumOrder: Number(data.minimum_order) || 10,
              durasiProduksi: data.durasi_produksi || '7-14 Hari',
              metodeDistilasi: data.metode_distilasi || 'Uap (Steam Distillation)',
              bahanBaku: data.bahan_baku || '100% Daun Nilam Segar',
              website: data.website || '',
              gradeNilam: data.grade_nilam || []
            })
          }
        }
      } else {
        const res = await fetch(`${apiUrl}/profiles/me`, {
          headers: getHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          setBuyerProfile({
            company_name: data.company_name || '',
            legal_number: data.legal_number || '',
            npwp: data.npwp || '',
            chairman_name: data.chairman_name || '',
            country: data.country || '',
            contact_person: data.contact_person || '',
            phone: data.phone || '',
            address: data.address || ''
          })
        }
      }
    } catch (err) {
      console.error(err)
      toast({
        title: locale === 'id' ? 'Gagal' : 'Error',
        description: locale === 'id' ? 'Gagal memuat profil' : 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role) {
      fetchProfile()
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      let res
      if (role === 'supplier') {
        res = await fetch(`${apiUrl}/suppliers/me/profile`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(supplierProfile)
        })
      } else {
        res = await fetch(`${apiUrl}/profiles/me`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(buyerProfile)
        })
      }

      if (res.ok) {
        toast({
          title: locale === 'id' ? 'Berhasil' : 'Success',
          description: locale === 'id' ? 'Profil profesional berhasil diperbarui' : 'Professional profile updated successfully'
        })
        fetchProfile()
      } else {
        const error = await res.json()
        toast({
          title: locale === 'id' ? 'Gagal' : 'Error',
          description: error.message || (locale === 'id' ? 'Gagal memperbarui profil' : 'Failed to update profile'),
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: locale === 'id' ? 'Error' : 'Error',
        description: locale === 'id' ? 'Terjadi kesalahan sistem' : 'System error occurred',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSupplierGrade = (grade: string) => {
    const activeGrades = [...supplierProfile.gradeNilam]
    if (activeGrades.includes(grade)) {
      setSupplierProfile({...supplierProfile, gradeNilam: activeGrades.filter(g => g !== grade)})
    } else {
      setSupplierProfile({...supplierProfile, gradeNilam: [...activeGrades, grade]})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-55 font-sans selection:bg-emerald-100 selection:text-emerald-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32 pb-20">
          <span className="text-emerald-850 font-bold text-sm">Loading professional profile...</span>
        </div>
        <Footer />
      </div>
    )
  }

  // Display information details
  const getInitial = () => email ? email.charAt(0).toUpperCase() : 'U'
  const getProfileTitle = () => {
    if (role === 'supplier') return supplierProfile.namaKoperasi || 'Koperasi Pemasok'
    if (role === 'buyer') return buyerProfile.company_name || 'Perusahaan Buyer'
    return 'Administrator Valam'
  }
  const getPICName = () => {
    if (role === 'supplier') return supplierProfile.namaPic || '-'
    if (role === 'buyer') return buyerProfile.contact_person || '-'
    return buyerProfile.contact_person || 'Super Admin'
  }

  return (
    <div className="min-h-screen bg-zinc-55 flex flex-col selection:bg-emerald-100 selection:text-emerald-950 font-sans">
      <Navbar />

      {/* Hero Header Area */}
      <section className="bg-emerald-950 text-white pt-36 pb-24 relative overflow-hidden">
        {/* Blurred background graphic blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Circle */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-gold-500 to-gold-400 border-[3px] border-white/20 flex items-center justify-center text-emerald-950 text-3xl sm:text-4xl font-black shadow-lg shadow-emerald-950/30 select-none shrink-0">
              {getInitial()}
            </div>

            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                  {getProfileTitle()}
                </h1>
                <Badge className="bg-gold-500 text-emerald-950 border-0 font-bold uppercase text-[10px] py-1 px-2.5 mx-auto md:mx-0 shrink-0 self-center">
                  {role}
                </Badge>
              </div>

              <p className="text-emerald-100/70 text-sm mt-2 flex items-center justify-center md:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-emerald-350" /> {email}
              </p>
              
              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start text-xs text-emerald-100/60 font-medium">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> PIC: {getPICName()}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-gold-450" /> Status: Active Account</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Dashboard Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full relative z-20 -mt-10">
        <div className="space-y-6">
          {/* Tab Switcher - Horizontal Bar Style */}
          <div className="flex border-b border-zinc-200 bg-white/95 backdrop-blur-md px-4 pt-2 rounded-xl shadow-xs border">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === 'info'
                  ? 'text-emerald-800 border-emerald-800 font-extrabold'
                  : 'text-zinc-500 hover:text-emerald-800 border-transparent hover:border-zinc-300'
              }`}
            >
              <Building className="w-4 h-4" />
              {locale === 'id' ? 'Detail Informasi Akun' : 'Account Details'}
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === 'address'
                  ? 'text-emerald-800 border-emerald-800 font-extrabold'
                  : 'text-zinc-500 hover:text-emerald-800 border-transparent hover:border-zinc-300'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {locale === 'id' ? 'Alamat & Domisili' : 'Address & Location'}
            </button>

            {role === 'supplier' && (
              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                  activeTab === 'bank'
                    ? 'text-emerald-800 border-emerald-800 font-extrabold'
                    : 'text-zinc-500 hover:text-emerald-800 border-transparent hover:border-zinc-300'
                }`}
              >
                <Landmark className="w-4 h-4" />
                {locale === 'id' ? 'Detail Rekening Bank' : 'Bank Account Details'}
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Main Edit Forms Container */}
            <div className="lg:col-span-12">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-xl shadow-emerald-900/5">
                <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Account Details Tab */}
                {activeTab === 'info' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-lg font-bold text-emerald-950 font-serif">
                        {locale === 'id' ? 'Informasi Pokok Akun' : 'Primary Account Details'}
                      </h3>
                      <Edit3 className="w-4.5 h-4.5 text-zinc-400" />
                    </div>

                    {role === 'supplier' ? (
                      /* Supplier Primary Details */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="namaKoperasi" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Koperasi' : 'Cooperative Name'}</Label>
                          <div className="relative">
                            <Input 
                              id="namaKoperasi"
                              value={supplierProfile.namaKoperasi}
                              onChange={(e) => setSupplierProfile({...supplierProfile, namaKoperasi: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="Koperasi Tani Nilam"
                            />
                            <Building className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nib" className="text-zinc-700 text-xs font-bold">NIB</Label>
                          <div className="relative">
                            <Input 
                              id="nib"
                              value={supplierProfile.nib}
                              onChange={(e) => setSupplierProfile({...supplierProfile, nib: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="9120001234567"
                            />
                            <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="npwp" className="text-zinc-700 text-xs font-bold">NPWP</Label>
                          <div className="relative">
                            <Input 
                              id="npwp"
                              value={supplierProfile.npwp}
                              onChange={(e) => setSupplierProfile({...supplierProfile, npwp: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="01.234.567.8-901.000"
                            />
                            <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="kapasitasProduksi" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Kapasitas Produksi Bulanan (Kg)' : 'Monthly Production (Kg)'}</Label>
                          <div className="relative">
                            <Input 
                              id="kapasitasProduksi"
                              type="number"
                              value={supplierProfile.kapasitasProduksi}
                              onChange={(e) => setSupplierProfile({...supplierProfile, kapasitasProduksi: parseFloat(e.target.value) || 0})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                            />
                            <Layers className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                          <Label className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Penanggung Jawab PIC' : 'PIC in Charge'}</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="namaPic" className="text-zinc-650 text-[10px] font-bold">{locale === 'id' ? 'Nama PIC' : 'PIC Name'}</Label>
                              <Input 
                                id="namaPic"
                                value={supplierProfile.namaPic}
                                onChange={(e) => setSupplierProfile({...supplierProfile, namaPic: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="Budi Santoso"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ktpPic" className="text-zinc-650 text-[10px] font-bold">{locale === 'id' ? 'NIK KTP' : 'Identity Card NIK'}</Label>
                              <Input 
                                id="ktpPic"
                                value={supplierProfile.ktpPic}
                                onChange={(e) => setSupplierProfile({...supplierProfile, ktpPic: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="1101011234567890"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                          <Label htmlFor="whatsapp" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nomor WhatsApp PIC' : 'PIC WhatsApp'}</Label>
                          <div className="relative">
                            <Input 
                              id="whatsapp"
                              value={supplierProfile.whatsapp}
                              onChange={(e) => setSupplierProfile({...supplierProfile, whatsapp: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="081234567890"
                            />
                            <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-3 col-span-1 md:col-span-2 border-t border-zinc-100 pt-4">
                          <Label className="text-zinc-700 text-xs font-bold block">{locale === 'id' ? 'Grade Minyak Nilam yang Diproduksi' : 'Produced Patchouli Oil Grades'}</Label>
                          <div className="flex gap-3">
                            {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((grade) => (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => toggleSupplierGrade(grade)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                  supplierProfile.gradeNilam.includes(grade)
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                                    : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                                }`}
                              >
                                {grade.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Storefront Display Settings */}
                        <div className="space-y-4 col-span-1 md:col-span-2 border-t border-zinc-100 pt-5 mt-2">
                          <Label className="text-zinc-950 text-sm font-bold block font-serif">{locale === 'id' ? 'Pengaturan Toko & Tampilan Marketplace' : 'Storefront & Marketplace Display Settings'}</Label>
                          <p className="text-zinc-500 text-[11px] leading-relaxed">
                            {locale === 'id' 
                              ? 'Lengkapi informasi berikut untuk ditampilkan pada halaman profil publik koperasi Anda di marketplace.'
                              : 'Complete the following information to display on your cooperative\'s public store profile in the marketplace.'}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tahun Berdiri */}
                            <div className="space-y-2">
                              <Label htmlFor="tahunBerdiri" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Tahun Berdiri' : 'Year Founded'}</Label>
                              <Input 
                                id="tahunBerdiri"
                                value={supplierProfile.tahunBerdiri}
                                onChange={(e) => setSupplierProfile({...supplierProfile, tahunBerdiri: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="2020"
                              />
                            </div>

                            {/* Jumlah Anggota / Petani */}
                            <div className="space-y-2">
                              <Label htmlFor="jumlahAnggota" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Jumlah Anggota Petani' : 'Number of Fostered Farmers'}</Label>
                              <Input 
                                id="jumlahAnggota"
                                type="number"
                                value={supplierProfile.jumlahAnggota}
                                onChange={(e) => setSupplierProfile({...supplierProfile, jumlahAnggota: parseInt(e.target.value) || 0})}
                                className="h-11 border-zinc-200 rounded-xl"
                              />
                            </div>

                            {/* Minimum Order */}
                            <div className="space-y-2">
                              <Label htmlFor="minimumOrder" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Minimum Order (Kg)' : 'Minimum Order (Kg)'}</Label>
                              <Input 
                                id="minimumOrder"
                                type="number"
                                value={supplierProfile.minimumOrder}
                                onChange={(e) => setSupplierProfile({...supplierProfile, minimumOrder: parseFloat(e.target.value) || 0})}
                                className="h-11 border-zinc-200 rounded-xl"
                              />
                            </div>

                            {/* Durasi Produksi */}
                            <div className="space-y-2">
                              <Label htmlFor="durasiProduksi" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Estimasi Waktu Produksi' : 'Estimated Lead Time'}</Label>
                              <Input 
                                id="durasiProduksi"
                                value={supplierProfile.durasiProduksi}
                                onChange={(e) => setSupplierProfile({...supplierProfile, durasiProduksi: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="7 - 14 Hari"
                              />
                            </div>

                            {/* Metode Distilasi */}
                            <div className="space-y-2">
                              <Label htmlFor="metodeDistilasi" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Metode Penyulingan' : 'Distillation Method'}</Label>
                              <Input 
                                id="metodeDistilasi"
                                value={supplierProfile.metodeDistilasi}
                                onChange={(e) => setSupplierProfile({...supplierProfile, metodeDistilasi: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="Uap (Steam Distillation)"
                              />
                            </div>

                            {/* Bahan Baku */}
                            <div className="space-y-2">
                              <Label htmlFor="bahanBaku" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Bahan Baku Utama' : 'Primary Raw Material'}</Label>
                              <Input 
                                id="bahanBaku"
                                value={supplierProfile.bahanBaku}
                                onChange={(e) => setSupplierProfile({...supplierProfile, bahanBaku: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="100% Daun Nilam Segar"
                              />
                            </div>

                            {/* Website */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                              <Label htmlFor="website" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Website Koperasi' : 'Cooperative Website'}</Label>
                              <Input 
                                id="website"
                                value={supplierProfile.website}
                                onChange={(e) => setSupplierProfile({...supplierProfile, website: e.target.value})}
                                className="h-11 border-zinc-200 rounded-xl"
                                placeholder="www.koperasiprodusen.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Buyer & Admin Primary Details */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="text-zinc-700 text-xs font-bold">
                            {role === 'admin' ? (locale === 'id' ? 'Nama Organisasi' : 'Organization Name') : (locale === 'id' ? 'Nama Perusahaan / Institusi' : 'Company / Institution Name')}
                          </Label>
                          <div className="relative">
                            <Input 
                              id="company_name"
                              value={buyerProfile.company_name}
                              onChange={(e) => setBuyerProfile({...buyerProfile, company_name: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="PT Industri Kosmetik Nusantara"
                            />
                            <Building className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        {role !== 'admin' && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="legal_number" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nomor Legal / NIB' : 'Legal Registration No (NIB)'}</Label>
                              <div className="relative">
                                <Input 
                                  id="legal_number"
                                  value={buyerProfile.legal_number}
                                  onChange={(e) => setBuyerProfile({...buyerProfile, legal_number: e.target.value})}
                                  className="h-11 pl-10 border-zinc-200 rounded-xl"
                                  placeholder="9120001234567"
                                />
                                <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="npwp" className="text-zinc-700 text-xs font-bold">NPWP Perusahaan</Label>
                              <div className="relative">
                                <Input 
                                  id="npwp"
                                  value={buyerProfile.npwp}
                                  onChange={(e) => setBuyerProfile({...buyerProfile, npwp: e.target.value})}
                                  className="h-11 pl-10 border-zinc-200 rounded-xl"
                                  placeholder="01.234.567.8-901.000"
                                />
                                <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="chairman_name" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Direktur / Pemilik' : 'Owner / Director Name'}</Label>
                              <div className="relative">
                                <Input 
                                  id="chairman_name"
                                  value={buyerProfile.chairman_name}
                                  onChange={(e) => setBuyerProfile({...buyerProfile, chairman_name: e.target.value})}
                                  className="h-11 pl-10 border-zinc-200 rounded-xl"
                                  placeholder="Budi Santoso"
                                />
                                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="contact_person" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Penghubung (PIC)' : 'PIC Contact Person'}</Label>
                          <div className="relative">
                            <Input 
                              id="contact_person"
                              value={buyerProfile.contact_person}
                              onChange={(e) => setBuyerProfile({...buyerProfile, contact_person: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="Aditya Wijaya"
                            />
                            <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'No. Telepon / WhatsApp' : 'Phone / WhatsApp No'}</Label>
                          <div className="relative">
                            <Input 
                              id="phone"
                              value={buyerProfile.phone}
                              onChange={(e) => setBuyerProfile({...buyerProfile, phone: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="081234567890"
                            />
                            <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Negara Asal' : 'Country'}</Label>
                          <div className="relative">
                            <Input 
                              id="country"
                              value={buyerProfile.country}
                              onChange={(e) => setBuyerProfile({...buyerProfile, country: e.target.value})}
                              className="h-11 pl-10 border-zinc-200 rounded-xl"
                              placeholder="Indonesia"
                            />
                            <Globe className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Address Details Tab */}
                {activeTab === 'address' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-lg font-bold text-emerald-950 font-serif">
                        {locale === 'id' ? 'Informasi Alamat & Domisili' : 'Location & Address Details'}
                      </h3>
                      <MapPin className="w-4.5 h-4.5 text-zinc-400" />
                    </div>

                    {role === 'supplier' ? (
                      /* Supplier Address Details */
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kabupaten" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Kabupaten' : 'Regency'}</Label>
                            <Input 
                              id="kabupaten"
                              value={supplierProfile.kabupaten}
                              onChange={(e) => setSupplierProfile({...supplierProfile, kabupaten: e.target.value})}
                              className="h-11 border-zinc-200 rounded-xl"
                              placeholder="Aceh Barat"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="kecamatan" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Kecamatan' : 'District'}</Label>
                            <Input 
                              id="kecamatan"
                              value={supplierProfile.kecamatan}
                              onChange={(e) => setSupplierProfile({...supplierProfile, kecamatan: e.target.value})}
                              className="h-11 border-zinc-200 rounded-xl"
                              placeholder="Meureubo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="desa" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Desa / Kelurahan' : 'Village'}</Label>
                            <Input 
                              id="desa"
                              value={supplierProfile.desa}
                              onChange={(e) => setSupplierProfile({...supplierProfile, desa: e.target.value})}
                              className="h-11 border-zinc-200 rounded-xl"
                              placeholder="Paya Peunaga"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="alamatLengkap" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Alamat Lengkap Koperasi' : 'Complete Address'}</Label>
                          <div className="relative">
                            <Textarea 
                              id="alamatLengkap"
                              value={supplierProfile.alamatLengkap}
                              onChange={(e) => setSupplierProfile({...supplierProfile, alamatLengkap: e.target.value})}
                              className="pl-10 border-zinc-200 rounded-xl min-h-[100px]"
                              placeholder="Jl. Meulaboh-Tapaktuan Km. 8"
                            />
                            <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Buyer & Admin Address Details */
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Alamat Kantor / Pengiriman' : 'Office / Shipping Address'}</Label>
                        <div className="relative">
                          <Textarea 
                            id="address"
                            value={buyerProfile.address}
                            onChange={(e) => setBuyerProfile({...buyerProfile, address: e.target.value})}
                            className="pl-10 border-zinc-200 rounded-xl min-h-[100px]"
                            placeholder="Jl. Jenderal Sudirman No. 23, Jakarta"
                          />
                          <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Bank Account Tab (Suppliers Only) */}
                {activeTab === 'bank' && role === 'supplier' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="text-lg font-bold text-emerald-950 font-serif">
                        {locale === 'id' ? 'Detail Rekening Bank Penerima' : 'Payout Bank Account Details'}
                      </h3>
                      <Landmark className="w-4.5 h-4.5 text-zinc-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="namaBank" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Bank' : 'Bank Name'}</Label>
                        <div className="relative">
                          <Input 
                            id="namaBank"
                            value={supplierProfile.namaBank}
                            onChange={(e) => setSupplierProfile({...supplierProfile, namaBank: e.target.value})}
                            className="h-11 pl-10 border-zinc-200 rounded-xl"
                            placeholder="Bank Syariah Indonesia (BSI)"
                          />
                          <Landmark className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomorRekening" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nomor Rekening' : 'Bank Account Number'}</Label>
                        <Input 
                          id="nomorRekening"
                          value={supplierProfile.nomorRekening}
                          onChange={(e) => setSupplierProfile({...supplierProfile, nomorRekening: e.target.value})}
                          className="h-11 border-zinc-200 rounded-xl"
                          placeholder="7123456789"
                        />
                      </div>

                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="namaRekening" className="text-zinc-700 text-xs font-bold">{locale === 'id' ? 'Nama Pemilik Rekening' : 'Account Holder Name'}</Label>
                        <Input 
                          id="namaRekening"
                          value={supplierProfile.namaRekening}
                          onChange={(e) => setSupplierProfile({...supplierProfile, namaRekening: e.target.value})}
                          className="h-11 border-zinc-200 rounded-xl"
                          placeholder="Koperasi Tani Nilam Mandiri"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Submit Button */}
                <div className="pt-5 border-t border-zinc-150 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-emerald-950 font-bold shadow-md shadow-gold-500/10 h-12 px-8 rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] transition-transform duration-300"
                  >
                    {saving ? (locale === 'id' ? 'Menyimpan...' : 'Saving...') : (locale === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
                    <Save className="w-4 h-4" />
                  </Button>
                </div>

              </form>
            </div>
          </div>

        </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
